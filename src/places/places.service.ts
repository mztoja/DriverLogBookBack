import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlacesEntity } from './places.entity';
import { PlaceCreateDto } from './dto/place.create.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlacesEntity)
    private placesRepository: Repository<PlacesEntity>,
  ) {}

  async create(
    data: PlaceCreateDto,
    userId: string,
    markDepartFn: (userId: string, placeId: number) => Promise<void>,
  ): Promise<PlacesEntity> {
    try {
      const place = await this.placesRepository.save({
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

  async getPlacesList(userId: string) {
    try {
      return this.placesRepository.find({
        where: { userId },
        order: { country: 'ASC', code: 'ASC', name: 'ASC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
