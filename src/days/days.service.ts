import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { DayEntity } from './day.entity';
import { DayCreateDto } from './dto/day-create.dto';
import {
  DayBurnedFuelRes,
  dayCardStateEnum,
  DayInterface,
  dayStatusEnum,
  logTypeEnum,
  tourStatusEnum,
  userFuelContypeEnum,
} from '../types';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { DayFinishDto } from './dto/day-finish.dto';
import { subtractDatesToTime } from '../utlis/subtractDatesToTime';
import { PlaceEntity } from '../places/place.entity';
import { LogEntity } from '../logs/log.entity';
import { DayListResponse } from '../types';
import { addTimes } from '../utlis/addTimes';
import { ToursService } from '../tours/tours.service';
import { DayEditDto } from './dto/day-edit.dto';
import { calcSecondsFromTime } from '../utlis/calcSecondsFromTime';
import { UserEntity } from '../users/user.entity';
import { DaySimpleEditDto } from './dto/day-simple-edit.dto';
import { DayResumeDto } from './dto/day-resume.dto';

@Injectable()
export class DaysService {
  constructor(
    @InjectRepository(DayEntity) private dayRepository: Repository<DayEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
    @Inject(forwardRef(() => ToursService)) private toursService: ToursService,
  ) {}

  async create(data: DayCreateDto, userId: string, tourId: number): Promise<DayEntity> {
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    const log = await this.logsService.create(logData, userId, tourId, logTypeEnum.days);

    return await this.dayRepository.save({
      userId,
      tourId,
      startLogId: log.id,
      cardState: data.cardInserted ? dayCardStateEnum.inserted : dayCardStateEnum.notUsed,
      doubleCrew: data.doubleCrew,
      status: dayStatusEnum.started,
    });
  }

  async finish(data: DayFinishDto, userFuelConType: number, activeDay: DayEntity): Promise<DayEntity> {
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    const stopLog = await this.logsService.create(logData, activeDay.userId, activeDay.tourId, logTypeEnum.days);
    const distance = (await this.dayRepository.findOne({ where: { id: activeDay.id } })).distance;
    const fuelBurned =
      userFuelConType === userFuelContypeEnum.per100km ? (distance / 100) * data.fuelCombustion : data.fuelCombustion;
    await this.dayRepository.update(
      { id: activeDay.id },
      {
        status: dayStatusEnum.finished,
        cardState:
          activeDay.cardState === dayCardStateEnum.inserted && data.cardTakeOut
            ? dayCardStateEnum.takenOut
            : activeDay.cardState,
        //distance: stopLog.odometer - startLog.odometer,
        driveTime: data.driveTime,
        driveTime2: data.driveTime2,
        stopLogId: stopLog.id,
        fuelBurned,
      },
    );
    const newDay = await this.dayRepository.findOne({ where: { id: activeDay.id } });
    // Dzień mógł być wcześniej wznowiony (resumeDay) — activeDay.driveTime/driveTime2/fuelBurned
    // to wtedy wartości sprzed przerwy, wciąż zapisane na dniu (nie czyścimy ich przy wznowieniu,
    // żeby użytkownik widział je i doliczył nowy odcinek). Do trasy doliczamy tylko DELTĘ, inaczej
    // pierwszy odcinek zostałby policzony podwójnie przy drugim zakończeniu tego samego dnia.
    const driveTimeDelta =
      calcSecondsFromTime(addTimes(newDay.driveTime, calcSecondsFromTime(newDay.driveTime2))) -
      calcSecondsFromTime(addTimes(activeDay.driveTime, calcSecondsFromTime(activeDay.driveTime2)));
    const fuelDelta = Number(newDay.fuelBurned) - Number(activeDay.fuelBurned);
    await this.toursService.addTimesAndFuel(activeDay.tourId, activeDay.userId, driveTimeDelta, fuelDelta);
    // day.workTime nie jest już przechowywany — utrzymujemy tour.workTime "na żywo" przeliczając
    // go świeżo z dat start/stop wszystkich dni trasy (zob. getTotalWorkTimeByRoute niżej).
    await this.toursService.recalcWorkTime(activeDay.tourId, activeDay.userId);
    return newDay;
  }

  // Wznowienie zakończonego dnia po krótkiej przerwie (zob. DayStart.tsx) — zamiast tworzyć nowy
  // rekord dnia, dopisujemy nowy log i przestawiamy ten sam dzień z powrotem na aktywny.
  // driveTime/driveTime2/fuelBurned NIE są czyszczone — mają zostać widoczne przy ponownym
  // zakończeniu dnia (DayStop.tsx), żeby użytkownik doliczył do nich nowy odcinek.
  async resumeDay(id: number, userId: string, tourId: number, data: DayResumeDto): Promise<DayEntity> {
    const day = await this.dayRepository.findOne({ where: { id, userId } });
    if (!day) {
      throw new BadRequestException();
    }
    if (day.tourId !== tourId || day.status !== dayStatusEnum.finished) {
      throw new BadRequestException();
    }
    // Stare "zakończenie dnia" okazuje się z perspektywy czasu tylko przerwą.
    await this.logsService.setType(day.stopLogId, userId, logTypeEnum.tourBrake);
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    await this.logsService.create(logData, userId, day.tourId, logTypeEnum.tourResume);
    await this.dayRepository.update(
      { id: day.id },
      {
        status: dayStatusEnum.started,
        stopLogId: 0,
        // Karta zdążyła zostać "wyjęta" przy poprzednim zakończeniu dnia — skoro dzień jest
        // wznawiany, karta musi być z powrotem włożona.
        cardState:
          day.cardState === dayCardStateEnum.takenOut ? dayCardStateEnum.inserted : day.cardState,
      },
    );
    // Dzień bez stopData jest pomijany przy liczeniu tour.workTime (zob. getTotalWorkTimeByRoute) —
    // odświeżamy skumulowaną wartość trasy, żeby nie liczyła już tego dnia jako zakończonego.
    await this.toursService.recalcWorkTime(day.tourId, userId);
    return await this.dayRepository.findOne({ where: { id: day.id } });
  }

  async simpleEdit(data: DaySimpleEditDto, userId: string): Promise<DayEntity> {
    const oldDay = await this.dayRepository.findOne({ where: { id: data.id, userId } });
    if (!oldDay) {
      throw new BadRequestException();
    }
    const tour = await this.toursService.getRouteById(userId, oldDay.tourId);
    await this.logsService.edit(data.startData, userId);
    await this.dayRepository.update(
      { id: oldDay.id },
      {
        cardState: data.cardState,
        doubleCrew: data.doubleCrew,
        distance: data.distance,
      },
    );
    const newDay = await this.dayRepository.findOne({ where: { id: oldDay.id } });
    // Zob. komentarz w edit() — pomijamy propagację, gdy startowa czynność dnia jest jednocześnie
    // graniczną czynnością trasy (już obsłużona przez logsService.edit() powyżej).
    if (tour && data.startData.id !== tour.startLogId) {
      const distanceDelta: number = Number(newDay.distance) - Number(oldDay.distance);
      if (distanceDelta !== 0) {
        await this.toursService.addDistance(tour.id, userId, distanceDelta);
      }
    }
    return newDay;
  }

  async edit(data: DayEditDto, user: UserEntity): Promise<DayEntity> {
    const oldDay = await this.dayRepository.findOne({ where: { id: data.id, userId: user.id } });
    if (!oldDay) {
      throw new BadRequestException();
    }
    const tour = await this.toursService.getRouteById(user.id, oldDay.tourId);
    if (!tour || tour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }
    await this.logsService.edit(data.startData, user.id);
    await this.logsService.edit(data.stopData, user.id);
    await this.dayRepository.update(
      { id: oldDay.id },
      {
        cardState: data.cardState,
        distance: data.distance,
        fuelBurned: data.fuelBurned,
        driveTime: data.driveTime,
        driveTime2: data.driveTime2,
        doubleCrew: data.doubleCrew,
      },
    );
    const newDay = await this.dayRepository.findOne({ where: { id: oldDay.id } });
    // Propagacja zmiany przebiegu dnia do trasy — pomijamy, gdy graniczna czynność dnia jest
    // jednocześnie graniczną czynnością trasy (wtedy korektę już wykonała gałąź graniczna
    // w logsService.edit(), wywołana zagnieżdżenie powyżej — uniknięcie podwójnego liczenia).
    const dayAffectsTourBoundary =
      data.startData.id === tour.startLogId ||
      data.startData.id === tour.stopLogId ||
      data.stopData.id === tour.startLogId ||
      data.stopData.id === tour.stopLogId;
    if (!dayAffectsTourBoundary) {
      const distanceDelta: number = Number(newDay.distance) - Number(oldDay.distance);
      if (distanceDelta !== 0) {
        await this.toursService.addDistance(tour.id, user.id, distanceDelta);
      }
    }
    const fuel: number = Number(newDay.fuelBurned) - Number(oldDay.fuelBurned);
    const driveTime: number = calcSecondsFromTime(newDay.driveTime) - calcSecondsFromTime(oldDay.driveTime);
    const driveTime2: number = calcSecondsFromTime(newDay.driveTime2) - calcSecondsFromTime(oldDay.driveTime2);
    await this.toursService.addTimesAndFuel(tour.id, user.id, driveTime + driveTime2, fuel);
    // calcDaysOnDuty() przelicza tour.workTime świeżo z dat wszystkich dni trasy (zob.
    // getTotalWorkTimeByRoute niżej) — nie doliczamy już delty workTime tego dnia osobno.
    await this.toursService.calcDaysOnDuty(tour.id, user.id);
    await this.toursService.calcExpectedSalary(tour.id, user.id, user.bid, user.bidType);
    return newDay;
  }

  async get(userId: string, page: string, perPage: string): Promise<DayListResponse> {
    const query = await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId', { userId })
      .leftJoinAndMapOne('day.startData', LogEntity, 'startLog', 'day.startLogId = startLog.id')
      .leftJoinAndMapOne('day.stopData', LogEntity, 'stopLog', 'day.stopLogId = stopLog.id')
      .leftJoinAndMapOne('startLog.placeData', PlaceEntity, 'startPlace', 'startLog.placeId = startPlace.id')
      .leftJoinAndMapOne('stopLog.placeData', PlaceEntity, 'stopPlace', 'stopLog.placeId = stopPlace.id')
      .orderBy('day.id', 'DESC')
      .skip((Number(page) - 1) * Number(perPage))
      .take(Number(perPage));
    const [items, totalItems] = await query.getManyAndCount();
    return { items, totalItems };
  }

  async getByLogId(userId: string, logId: number): Promise<DayInterface> {
    return await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId AND (day.startLogId = :logId OR day.stopLogId = :logId)', { userId, logId })
      .leftJoinAndMapOne('day.startData', LogEntity, 'startLog', 'day.startLogId = startLog.id')
      .leftJoinAndMapOne('day.stopData', LogEntity, 'stopLog', 'day.stopLogId = stopLog.id')
      .leftJoinAndMapOne('startLog.placeData', PlaceEntity, 'startPlace', 'startLog.placeId = startPlace.id')
      .leftJoinAndMapOne('stopLog.placeData', PlaceEntity, 'stopPlace', 'stopLog.placeId = stopPlace.id')
      .getOne();
  }

  async getActiveDay(userId: string): Promise<DayInterface> {
    return await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId AND day.status = :status', {
        userId,
        status: dayStatusEnum.started,
      })
      .leftJoinAndMapOne('day.startData', LogEntity, 'startLog', 'day.startLogId = startLog.id')
      .leftJoinAndMapOne('startLog.placeData', PlaceEntity, 'startPlace', 'startLog.placeId = startPlace.id')
      .orderBy('day.id', 'DESC')
      .getOne();
  }

  async getLastDay(userId: string): Promise<DayEntity> {
    return await this.dayRepository.findOne({
      where: { userId, status: dayStatusEnum.finished },
      order: { id: 'DESC' },
    });
  }

  async getYourLastDay(userId: string): Promise<DayInterface> {
    return await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId AND day.cardState != :cardState', {
        userId,
        cardState: dayCardStateEnum.notUsed,
      })
      .leftJoinAndMapOne('day.startData', LogEntity, 'startLog', 'day.startLogId = startLog.id')
      .leftJoinAndMapOne('day.stopData', LogEntity, 'stopLog', 'day.stopLogId = stopLog.id')
      .leftJoinAndMapOne('startLog.placeData', PlaceEntity, 'startPlace', 'startLog.placeId = startPlace.id')
      .leftJoinAndMapOne('stopLog.placeData', PlaceEntity, 'stopPlace', 'stopLog.placeId = stopPlace.id')
      .orderBy('day.id', 'DESC')
      .getOne();
  }

  async getByTourId(userId: string, tourId: number): Promise<DayInterface[]> {
    const query = await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId AND day.tourId = :tourId', {
        userId,
        tourId,
      })
      .leftJoinAndMapOne('day.startData', LogEntity, 'startLog', 'day.startLogId = startLog.id')
      .leftJoinAndMapOne('day.stopData', LogEntity, 'stopLog', 'day.stopLogId = stopLog.id')
      .leftJoinAndMapOne('startLog.placeData', PlaceEntity, 'startPlace', 'startLog.placeId = startPlace.id')
      .leftJoinAndMapOne('stopLog.placeData', PlaceEntity, 'stopPlace', 'stopLog.placeId = stopPlace.id')
      .orderBy('day.id', 'DESC');

    return await query.getMany();
  }

  async getTotalDriveTimeByRoute(userId: string, tourId: number): Promise<string> {
    const days = await this.getByTourId(userId, tourId);
    let driveTime = '00:00:00';
    days.map((day) => {
      const sum = addTimes(day.driveTime, calcSecondsFromTime(day.driveTime2));
      driveTime = addTimes(driveTime, calcSecondsFromTime(sum));
    });
    return driveTime;
  }

  // Kanoniczne źródło prawdy dla czasu pracy trasy — liczone świeżo z dat start/stop
  // wszystkich zakończonych dni trasy (day.workTime nie jest już przechowywany/zapisywany).
  async getTotalWorkTimeByRoute(userId: string, tourId: number): Promise<string> {
    const days = await this.getByTourId(userId, tourId);
    let workTime = '00:00:00';
    days.forEach((day) => {
      if (day.startData && day.stopData) {
        const dayWorkTime = subtractDatesToTime(day.stopData.date, day.startData.date);
        workTime = addTimes(workTime, calcSecondsFromTime(dayWorkTime));
      }
    });
    return workTime;
  }

  async getDistanceByTour(userId: string, tourId: number): Promise<number> {
    const days = await this.getByTourId(userId, tourId);
    return days.reduce((distance, day) => distance + day.distance, 0);
  }

  async getBurnedFuelByTour(userId: string, tourId: number): Promise<DayBurnedFuelRes> {
    const days = await this.getByTourId(userId, tourId);
    if (!days || days.length === 0) {
      return { burnedFuel: 0 };
    }
    const burnedFuel = days.reduce((totalFuel, day) => totalFuel + Number(day.fuelBurned), 0);
    return { burnedFuel };
  }

  async addDistance(id: number, userId: string, value: number): Promise<void> {
    const day = await this.dayRepository.findOne({ where: { id, userId } });
    if (day) {
      await this.dayRepository.update({ id: day.id }, { distance: Number(day.distance) + Number(value) });
    }
  }
}
