import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
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

    let breakTime = '00:00';
    if (data.cardInserted) {
      const lastDayWithCard = await this.dayRepository.findOne({
        where: {
          userId,
          status: dayStatusEnum.finished,
          cardState: In([dayCardStateEnum.inserted, dayCardStateEnum.takenOut]),
        },
        order: { id: 'DESC' },
      });
      if (lastDayWithCard) {
        const lastLog = await this.logsService.find(lastDayWithCard.stopLogId);
        breakTime = subtractDatesToTime(log.date, lastLog.date);
        await this.dayRepository.update({ id: lastDayWithCard.id }, { breakTime });
      }
    }

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
    const startLog = await this.logsService.find(activeDay.startLogId);
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
    const workTime = subtractDatesToTime(stopLog.date, startLog.date);
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
        workTime,
      },
    );
    const newDay = await this.dayRepository.findOne({ where: { id: activeDay.id } });
    await this.toursService.addTimesAndFuel(
      activeDay.tourId,
      activeDay.userId,
      calcSecondsFromTime(addTimes(newDay.driveTime, calcSecondsFromTime(newDay.driveTime2))),
      calcSecondsFromTime(newDay.workTime),
      newDay.fuelBurned,
    );
    return newDay;
  }

  async simpleEdit(data: DaySimpleEditDto, userId: string): Promise<DayEntity> {
    const oldDay = await this.dayRepository.findOne({ where: { id: data.id, userId } });
    if (!oldDay) {
      throw new BadRequestException();
    }
    const startLog = await this.logsService.edit(data.startData, userId);
    await this.dayRepository.update(
      { id: oldDay.id },
      {
        cardState: data.cardState,
        doubleCrew: data.doubleCrew,
        distance: data.distance,
      },
    );
    const newDay = await this.dayRepository.findOne({ where: { id: oldDay.id } });
    const olderDay = await this.dayRepository.findOne({
      where: {
        userId,
        id: LessThan(newDay.id),
        cardState: Not(dayCardStateEnum.notUsed),
      },
      order: { id: 'DESC' },
    });
    if (olderDay && newDay.cardState !== dayCardStateEnum.notUsed) {
      const log = await this.logsService.find(olderDay.stopLogId);
      const breakTime = subtractDatesToTime(startLog.date, log.date);
      await this.dayRepository.update({ id: olderDay.id }, { breakTime });
    } else if (olderDay && newDay.cardState === dayCardStateEnum.notUsed) {
      await this.dayRepository.update({ id: olderDay.id }, { breakTime: '00:00:00' });
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
    const startLog = await this.logsService.edit(data.startData, user.id);
    await this.logsService.edit(data.stopData, user.id);
    await this.dayRepository.update(
      { id: oldDay.id },
      {
        breakTime: data.breakTime,
        distance: data.distance,
        workTime: data.workTime,
        fuelBurned: data.fuelBurned,
        driveTime: data.driveTime,
        driveTime2: data.driveTime2,
        doubleCrew: data.doubleCrew,
      },
    );
    const newDay = await this.dayRepository.findOne({ where: { id: oldDay.id } });
    if (newDay.cardState !== dayCardStateEnum.notUsed) {
      const olderDay = await this.dayRepository.findOne({
        where: {
          userId: user.id,
          id: LessThan(newDay.id),
          cardState: Not(dayCardStateEnum.notUsed),
        },
        order: { id: 'DESC' },
      });
      if (olderDay) {
        const log = await this.logsService.find(olderDay.stopLogId);
        const breakTime = subtractDatesToTime(startLog.date, log.date);
        await this.dayRepository.update({ id: olderDay.id }, { breakTime });
      }
    }
    // const distance: number = Number(newDay.distance) - Number(oldDay.distance);
    // await this.toursService.addDistance(tour.id, user.id, distance);
    const fuel: number = Number(newDay.fuelBurned) - Number(oldDay.fuelBurned);
    const driveTime: number = calcSecondsFromTime(newDay.driveTime) - calcSecondsFromTime(oldDay.driveTime);
    const driveTime2: number = calcSecondsFromTime(newDay.driveTime2) - calcSecondsFromTime(oldDay.driveTime2);
    const workTime: number = calcSecondsFromTime(newDay.workTime) - calcSecondsFromTime(oldDay.workTime);
    await this.toursService.addTimesAndFuel(tour.id, user.id, driveTime + driveTime2, workTime, fuel);
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

  async getTotalWorkTimeByRoute(userId: string, tourId: number): Promise<string> {
    const days = await this.getByTourId(userId, tourId);
    let workTime = '00:00:00';
    days.map((day) => {
      workTime = addTimes(workTime, calcSecondsFromTime(day.workTime));
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
