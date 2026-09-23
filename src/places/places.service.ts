import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { PlaceEntity } from './place.entity';
import { PlaceCreateDto } from './dto/place-create.dto';
import { placeTypeEnum, userLangEnum } from '../types';
import { PlaceEditDto } from './dto/place-edit.dto';

// Nominatim (OpenStreetMap) — darmowe geokodowanie bez klucza API, ta sama usługa
// której kafelki już wyświetla mapa miejsc. Polityka użycia: max 1 zapytanie/sek
// i wymagany nagłówek User-Agent identyfikujący aplikację.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT = 'DriverLogBook/3.4 (+https://mzservices.pl/logbook)';
const NOMINATIM_DELAY_MS = 1100;

interface NominatimResult {
  lat: string;
  lon: string;
}

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlaceEntity)
    private placeRepository: Repository<PlaceEntity>,
  ) {}

  async create(
    data: PlaceCreateDto,
    userId: string,
    markDepartFn: (userId: string, placeId: number) => Promise<void>,
  ): Promise<PlaceEntity> {
    try {
      const place = await this.placeRepository.save({
        userId,
        isFavorite: data.isFavorite,
        type: data.type,
        name: data.name,
        street: data.street,
        code: data.code,
        city: data.city,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
        description: data.description !== '' ? data.description : null,
      });
      if (data.isMarked === true) {
        await markDepartFn(userId, place.id);
      }
      return place;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getPlacesList(userId: string): Promise<PlaceEntity[]> {
    return await this.placeRepository.find({
      where: { userId },
      order: { country: 'ASC', code: 'ASC', name: 'ASC' },
    });
  }

  async getOne(userId: string, id: number): Promise<PlaceEntity> {
    return await this.placeRepository.findOne({
      where: { id, userId },
    });
  }

  async getCompanyList(userId: string): Promise<PlaceEntity[]> {
    try {
      return await this.placeRepository.find({
        where: { userId, type: placeTypeEnum.base },
        order: { country: 'ASC', code: 'ASC', name: 'ASC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async findById(id: number): Promise<PlaceEntity> {
    try {
      return await this.placeRepository.findOne({ where: { id } });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async edit(id: number, data: PlaceEditDto): Promise<UpdateResult> {
    return await this.placeRepository.update(
      { id },
      {
        type: data.type,
        name: data.name,
        street: data.street,
        code: data.code,
        city: data.city,
        country: data.country,
        isFavorite: data.isFavorite,
        lat: data.lat,
        lon: data.lon,
        description: data.description !== '' ? data.description : null,
      },
    );
  }

  // Geokoduje JEDNO miejsce (pierwsze pasujące) należące wyłącznie do userId — nigdy nie
  // dotyka adresów innych użytkowników. Wołane w pętli przez front (jedno wywołanie = jeden
  // adres), dzięki czemu front zna postęp "X z Y" na bieżąco zamiast czekać na jedno długie,
  // blokujące zapytanie.
  // `mode: 'full'` — miejsca bez ŻADNEJ współrzędnej (uzupełnia obie).
  // `mode: 'partial'` — miejsca z DOKŁADNIE JEDNĄ wpisaną współrzędną (uzupełnia tylko brakującą,
  // nie rusza tej już podanej).
  // `excludeIds` to id miejsc już przetworzonych (udanych i nieudanych) w tym przebiegu —
  // nieudane geokodowanie nie zmienia lat/lon, więc bez tej listy próba powtarzałaby się
  // w nieskończoność. Stały odstęp na początku każdego wywołania = limit Nominatim (1 req/s).
  async geocodeNext(
    userId: string,
    lang: userLangEnum,
    excludeIds: number[],
    mode: 'full' | 'partial',
  ): Promise<{ finished: boolean; placeId?: number; success?: boolean }> {
    await this.delay(NOMINATIM_DELAY_MS);

    const places = await this.placeRepository.find({ where: { userId } });
    const hasLat = (place: PlaceEntity): boolean => Number(place.lat) > 0.001;
    const hasLon = (place: PlaceEntity): boolean => Number(place.lon) > 0.001;
    const candidates =
      mode === 'full'
        ? places.filter((place) => !hasLat(place) && !hasLon(place))
        : places.filter((place) => hasLat(place) !== hasLon(place));
    const next = candidates.find((place) => !excludeIds.includes(place.id));
    if (!next) {
      return { finished: true };
    }

    const coords = await this.geocodeAddress(next);
    if (coords) {
      const note =
        lang === userLangEnum.pl
          ? 'Współrzędne GPS zostały wpisane automatycznie na podstawie adresu i mogą być niedokładne.'
          : 'GPS coordinates were entered automatically based on the address and may be inaccurate.';
      const description = next.description ? `${next.description}\n\n${note}` : note;
      const coordUpdate =
        mode === 'full'
          ? { lat: coords.lat, lon: coords.lon }
          : hasLat(next)
            ? { lon: coords.lon } // lat już podana — dopisujemy tylko brakującą długość
            : { lat: coords.lat }; // lon już podana — dopisujemy tylko brakującą szerokość
      await this.placeRepository.update({ id: next.id }, { ...coordUpdate, description });
      return { finished: false, placeId: next.id, success: true };
    }

    return { finished: false, placeId: next.id, success: false };
  }

  // Publiczna (nie tylko dla geocodeNext) — używana też przez FriendsService, żeby pozycję
  // znajomego na podstawie miejsca spoza listy adresowej (samo wolne pole `place`/`country`
  // na logu, bez zapisanego PlaceEntity) ustalać dokładnie tą samą metodą co automatyczne
  // uzupełnianie współrzędnych miejsc.
  async geocodeAddress(address: {
    street?: string;
    code?: string;
    city?: string;
    country?: string;
  }): Promise<{ lat: number; lon: number } | null> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        street: address.street ?? '',
        postalcode: address.code ?? '',
        city: address.city ?? '',
        countrycodes: (address.country ?? '').toLowerCase(),
      });
      const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      });
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as NominatimResult[];
      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }
      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);
      if (isNaN(lat) || isNaN(lon)) {
        return null;
      }
      return { lat, lon };
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
