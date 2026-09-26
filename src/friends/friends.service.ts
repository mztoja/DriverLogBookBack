import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendEntity } from './friend.entity';
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';
import { ToursService } from '../tours/tours.service';
import { LoadsService } from '../loads/loads.service';
import { PlacesService } from '../places/places.service';
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../users/user.entity';
import {
  friendStatusEnum,
  userLangEnum,
  FriendsListInterface,
  FriendSummaryInterface,
  FriendRequestInterface,
  FriendPositionInterface,
  FriendCargoInterface,
  SelfSummaryInterface,
  LogInterface,
} from '../types';
import { countryCenters } from '../data/countryCenters';
import { friendInviteSentEmailTemplate } from '../templates/email/friendInviteSent';
import { friendInviteReceivedEmailTemplate } from '../templates/email/friendInviteReceived';
import { friendRequestAcceptedEmailTemplate } from '../templates/email/friendRequestAccepted';
import { friendRequestDeclinedEmailTemplate } from '../templates/email/friendRequestDeclined';
import { friendRemovedEmailTemplate } from '../templates/email/friendRemoved';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendEntity)
    private friendRepository: Repository<FriendEntity>,
    private usersService: UsersService,
    private logsService: LogsService,
    private toursService: ToursService,
    private loadsService: LoadsService,
    private placesService: PlacesService,
    private mailService: MailService,
  ) {}

  async invite(user: UserEntity, email: string): Promise<FriendEntity> {
    const target = await this.usersService.find(email);
    if (!target) {
      throw new BadRequestException('friendUserNotFound');
    }
    if (target.id === user.id) {
      throw new BadRequestException('friendCannotInviteSelf');
    }
    const existing = await this.friendRepository
      .createQueryBuilder('friend')
      .where(
        '(friend.requesterId = :userId AND friend.addresseeId = :targetId) OR ' +
          '(friend.requesterId = :targetId AND friend.addresseeId = :userId)',
        { userId: user.id, targetId: target.id },
      )
      .getOne();
    if (existing) {
      throw new BadRequestException('friendAlreadyExists');
    }
    const friendship = await this.friendRepository.save({
      requesterId: user.id,
      addresseeId: target.id,
      status: friendStatusEnum.pending,
    });

    const requesterName = `${user.firstName} ${user.lastName}`;
    const targetName = `${target.firstName} ${target.lastName}`;
    await this.trySendMail(
      target.email,
      target.lang === userLangEnum.pl ? 'Zaproszenie do znajomych' : 'Friend invitation',
      friendInviteReceivedEmailTemplate(target.lang, requesterName),
    );
    await this.trySendMail(
      user.email,
      user.lang === userLangEnum.pl ? 'Zaproszenie zostało wysłane' : 'Invitation sent',
      friendInviteSentEmailTemplate(user.lang, targetName),
    );

    return friendship;
  }

  // Akceptacja przychodzącego zaproszenia — tylko adresat może zaakceptować.
  async accept(user: UserEntity, friendshipId: number): Promise<void> {
    const friendship = await this.friendRepository.findOne({ where: { id: friendshipId } });
    if (!friendship || friendship.addresseeId !== user.id) {
      throw new BadRequestException('friendNotFound');
    }
    const respondedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await this.friendRepository.update({ id: friendship.id }, { status: friendStatusEnum.accepted, respondedAt });

    const requester = await this.usersService.findById(friendship.requesterId);
    if (requester) {
      await this.trySendMail(
        requester.email,
        requester.lang === userLangEnum.pl ? 'Zaproszenie zaakceptowane' : 'Invitation accepted',
        friendRequestAcceptedEmailTemplate(requester.lang, `${user.firstName} ${user.lastName}`),
      );
    }
  }

  // Jedna operacja na wszystkie "koniec relacji": odrzucenie przychodzącego zaproszenia,
  // anulowanie własnego wysłanego zaproszenia i usunięcie już zaakceptowanego znajomego —
  // we wszystkich trzech przypadkach użytkownik jest requesterem albo addresatem wiersza.
  // Mail leci do DRUGIEJ strony (nie do tego, kto wywołał usunięcie): przy odrzuceniu
  // oczekującego zaproszenia i przy usunięciu już zaakceptowanego znajomego — nie przy
  // anulowaniu własnej wysłanej prośby (to akcja na samym sobie, nie ma kogo powiadamiać
  // o "odrzuceniu", bo druga strona nic jeszcze nie zdążyła zrobić).
  async remove(user: UserEntity, friendshipId: number): Promise<void> {
    const friendship = await this.friendRepository.findOne({ where: { id: friendshipId } });
    if (!friendship || (friendship.requesterId !== user.id && friendship.addresseeId !== user.id)) {
      throw new BadRequestException('friendNotFound');
    }
    const isDecliningIncomingRequest =
      friendship.status === friendStatusEnum.pending && friendship.addresseeId === user.id;
    const isRemovingAcceptedFriend = friendship.status === friendStatusEnum.accepted;
    const otherUserId = friendship.requesterId === user.id ? friendship.addresseeId : friendship.requesterId;

    await this.friendRepository.delete({ id: friendship.id });

    if (isDecliningIncomingRequest) {
      const requester = await this.usersService.findById(otherUserId);
      if (requester) {
        await this.trySendMail(
          requester.email,
          requester.lang === userLangEnum.pl ? 'Zaproszenie odrzucone' : 'Invitation declined',
          friendRequestDeclinedEmailTemplate(requester.lang, `${user.firstName} ${user.lastName}`),
        );
      }
    } else if (isRemovingAcceptedFriend) {
      const other = await this.usersService.findById(otherUserId);
      if (other) {
        await this.trySendMail(
          other.email,
          other.lang === userLangEnum.pl ? 'Usunięto ze znajomych' : 'Removed from friends',
          friendRemovedEmailTemplate(other.lang, `${user.firstName} ${user.lastName}`),
        );
      }
    }
  }

  // Powiadomienia mailowe są efektem ubocznym, nie warunkiem powodzenia operacji na
  // znajomych — błąd SMTP nie może wywalać zaproszenia/akceptacji/odrzucenia (patrz
  // analogiczne zabezpieczenie przy mailu powitalnym w UsersService.register).
  private async trySendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailService.sendMail(to, subject, html);
    } catch (mailError) {
      console.error('Failed to send friends notification email', mailError);
    }
  }

  async getFriendsData(user: UserEntity): Promise<FriendsListInterface> {
    const acceptedRows = await this.friendRepository
      .createQueryBuilder('friend')
      .where(
        '(friend.requesterId = :userId OR friend.addresseeId = :userId) AND friend.status = :status',
        { userId: user.id, status: friendStatusEnum.accepted },
      )
      .getMany();

    const incomingRows = await this.friendRepository.find({
      where: { addresseeId: user.id, status: friendStatusEnum.pending },
    });
    const outgoingRows = await this.friendRepository.find({
      where: { requesterId: user.id, status: friendStatusEnum.pending },
    });

    const accepted = await Promise.all(
      acceptedRows.map((row) => this.buildFriendSummary(user.id, row)),
    );
    const incoming = await Promise.all(
      incomingRows.map((row) => this.buildFriendRequest(row.id, row.requesterId, row.createdAt)),
    );
    const outgoing = await Promise.all(
      outgoingRows.map((row) => this.buildFriendRequest(row.id, row.addresseeId, row.createdAt)),
    );
    const self = await this.buildSelfSummary(user);

    return { accepted, incoming, outgoing, self };
  }

  private async buildFriendRequest(
    friendshipId: number,
    otherUserId: string,
    createdAt: string,
  ): Promise<FriendRequestInterface> {
    const other = await this.usersService.findById(otherUserId);
    return {
      friendshipId,
      userId: otherUserId,
      email: other?.email ?? '',
      firstName: other?.firstName ?? '',
      lastName: other?.lastName ?? '',
      createdAt,
    };
  }

  private async buildFriendSummary(userId: string, row: FriendEntity): Promise<FriendSummaryInterface> {
    const otherUserId = row.requesterId === userId ? row.addresseeId : row.requesterId;
    const other = await this.usersService.findById(otherUserId);
    const { position, cargo, lastActivity } = await this.resolvePositionAndCargo(otherUserId, other?.markedDepart ?? 0);

    return {
      friendshipId: row.id,
      userId: otherUserId,
      email: other?.email ?? '',
      firstName: other?.firstName ?? '',
      lastName: other?.lastName ?? '',
      position,
      lastActivity,
      cargo,
    };
  }

  // Ta sama pozycja/cel co u znajomych, ale dla samego zalogowanego użytkownika — żeby na mapie
  // obok pinezek znajomych była widoczna też własna pozycja.
  private async buildSelfSummary(user: UserEntity): Promise<SelfSummaryInterface> {
    const { position, cargo, lastActivity } = await this.resolvePositionAndCargo(user.id, user.markedDepart);
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position,
      lastActivity,
      cargo,
    };
  }

  private async resolvePositionAndCargo(
    userId: string,
    markedDepart: number,
  ): Promise<{
    position: FriendPositionInterface | null;
    cargo: FriendCargoInterface | null;
    lastActivity: string | null;
  }> {
    const lastLog = await this.logsService.getLastLog(userId);
    const position = await this.resolvePosition(lastLog);

    // Cel podróży (users.markedDepart) — niezależny od tego, czy akurat trwa trasa, dlatego
    // sprawdzany osobno od ładunków poniżej.
    let targetPlace: string | null = null;
    if (markedDepart) {
      const marked = await this.placesService.getOne(userId, markedDepart);
      if (marked) {
        targetPlace = `${marked.city} (${marked.name})`;
      }
    }

    // Miejsca docelowe WSZYSTKICH nierozładowanych ładunków (może być ich kilka) — tylko
    // w trakcie aktywnej trasy, bo poza nią nie ma "aktualnie przewożonego ładunku".
    let destinations: string[] = [];
    let loadsWithoutReceiver = 0;
    const activeRoute = await this.toursService.getActiveRoute(userId);
    if (activeRoute) {
      const loads = await this.loadsService.getNotUnloadedLoads(userId);
      destinations = loads
        .filter((load) => load.receiverData)
        .map((load) => `${load.receiverData.city} (${load.receiverData.name})`);
      // ładunki bez odbiorcy też są przewożone – wcześniej znikały i przy braku innych danych
      // mapa pokazywała „brak celu i aktywnej trasy" mimo trwającej trasy
      loadsWithoutReceiver = loads.filter((load) => !load.receiverData).length;
    }

    const cargo: FriendCargoInterface | null =
      targetPlace || activeRoute
        ? { targetPlace, destinations, activeTour: !!activeRoute, loadsWithoutReceiver }
        : null;

    return { position, cargo, lastActivity: lastLog?.date ?? null };
  }

  // Pozycja = miejsce z najnowszego wpisu użytkownika. Poziomy dokładności, od najlepszej:
  // 1) wpis wskazuje na zapisane miejsce z listy adresowej z OBIEMA współrzędnymi — użyj ich.
  // 2) miejsce z listy adresowej bez współrzędnych (albo tylko z jedną) — geokodowanie po jego adresie
  //    (ulica, kod, miasto, kraj), a gdy się nie uda, po samym mieście. Wcześniej taka pozycja była
  //    pomijana, więc znajomy znikał z mapy tylko dlatego, że miejsce nie miało wpisanych GPS.
  // 3) wpis ma tylko wolny tekst (place/country, placeId = 0) — geokodowanie po nazwie miejsca.
  // 4) geokodowanie się nie powiodło — wpis i tak zawiera kraj, więc pinezka ląduje w jego środku
  //    (countryCenters) zamiast nie pokazywać pozycji wcale.
  private async resolvePosition(lastLog: LogInterface | null): Promise<FriendPositionInterface | null> {
    if (!lastLog) {
      return null;
    }
    const place = lastLog.placeData;

    if (place && Number(place.lat) > 0.001 && Number(place.lon) > 0.001) {
      return {
        placeName: place.name,
        city: place.city,
        lat: Number(place.lat),
        lon: Number(place.lon),
        date: lastLog.date,
      };
    }

    if (place) {
      const geocoded =
        (await this.cachedGeocode({ street: place.street, code: place.code, city: place.city, country: place.country })) ??
        (await this.cachedGeocode({ city: place.city, country: place.country }));
      const point = geocoded ?? countryCenters[(place.country || lastLog.country || '').toUpperCase()];
      if (point) {
        return { placeName: place.name, city: place.city, lat: point.lat, lon: point.lon, date: lastLog.date };
      }
      return null;
    }

    if (lastLog.place) {
      const geocoded = await this.cachedGeocode({ city: lastLog.place, country: lastLog.country });
      const point = geocoded ?? countryCenters[(lastLog.country ?? '').toUpperCase()];
      if (point) {
        return { placeName: lastLog.place, city: '', lat: point.lat, lon: point.lon, date: lastLog.date };
      }
    }

    return null;
  }

  // Geokodowanie z pamięcią podręczną – lista znajomych jest pobierana przy każdym wejściu na mapę,
  // a Nominatim dopuszcza ~1 zapytanie/s. Trafienia trzymamy 12 h, nieudane próby 1 h.
  private readonly geocodeCache = new Map<string, { value: { lat: number; lon: number } | null; expires: number }>();

  private async cachedGeocode(address: {
    street?: string;
    code?: string;
    city?: string;
    country?: string;
  }): Promise<{ lat: number; lon: number } | null> {
    if (!address.city && !address.street) {
      return null;
    }
    const key = JSON.stringify([address.street ?? '', address.code ?? '', address.city ?? '', address.country ?? '']);
    const hit = this.geocodeCache.get(key);
    if (hit && hit.expires > Date.now()) {
      return hit.value;
    }
    const value = await this.placesService.geocodeAddress(address);
    this.geocodeCache.set(key, { value, expires: Date.now() + (value ? 12 : 1) * 3600 * 1000 });
    return value;
  }
}
