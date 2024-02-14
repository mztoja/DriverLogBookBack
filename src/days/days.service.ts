import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { DayEntity } from './day.entity';
import { DayCreateDto } from './dto/day-create.dto';
import {
  dayCardStateEnum,
  DayInterface,
  dayStatusEnum,
  logTypeEnum,
  userFuelContypeEnum,
} from '../types';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { DayFinishDto } from './dto/day-finish.dto';
import { subtractDatesToTime } from '../utlis/subtractDatesToTime';
import { PlaceEntity } from '../places/place.entity';
import { LogEntity } from '../logs/log.entity';
import { DayListResponse } from '../types/day/DayListResponse';
import { DayBurnedFuelRes } from '../types/day/DayBurnedFuelRes';
import { addTimes } from '../utlis/addTimes';

@Injectable()
export class DaysService {
  constructor(
    @InjectRepository(DayEntity)
    private dayRepository: Repository<DayEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}

  async getActiveDay(userId: string): Promise<DayEntity> {
    return await this.dayRepository.findOne({
      where: { userId, status: dayStatusEnum.started },
    });
  }

  async getLastDay(userId: string): Promise<DayEntity> {
    return await this.dayRepository.findOne({
      where: { userId, status: dayStatusEnum.finished },
      order: { id: 'DESC' },
    });
  }

  async getByTourId(userId: string, tourId: number): Promise<DayInterface[]> {
    const query = await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId AND day.tourId = :tourId', {
        userId,
        tourId,
      })
      .leftJoinAndMapOne(
        'day.startData',
        LogEntity,
        'startLog',
        'day.startLogId = startLog.id',
      )
      .leftJoinAndMapOne(
        'day.stopData',
        LogEntity,
        'stopLog',
        'day.stopLogId = stopLog.id',
      )
      .leftJoinAndMapOne(
        'startLog.placeData',
        PlaceEntity,
        'startPlace',
        'startLog.placeId = startPlace.id',
      )
      .leftJoinAndMapOne(
        'stopLog.placeData',
        PlaceEntity,
        'stopPlace',
        'stopLog.placeId = stopPlace.id',
      )
      .orderBy('day.id', 'DESC');

    return await query.getMany();
  }

  async getTotalDriveTimeByRoute(
    userId: string,
    tourId: number,
  ): Promise<string> {
    const days = await this.getByTourId(userId, tourId);
    let driveTime = '00:00:00';
    days.map((day) => {
      const sum = addTimes(day.driveTime, day.driveTime2);
      driveTime = addTimes(driveTime, sum);
    });
    return driveTime;
  }

  async getTotalWorkTimeByRoute(
    userId: string,
    tourId: number,
  ): Promise<string> {
    const days = await this.getByTourId(userId, tourId);
    let workTime = '00:00:00';
    days.map((day) => {
      workTime = addTimes(workTime, day.workTime);
    });
    return workTime;
  }

  async getDistanceByTour(userId: string, tourId: number): Promise<number> {
    const days = await this.getByTourId(userId, tourId);
    return days.reduce((distance, day) => distance + day.distance, 0);
  }

  async getBurnedFuelByTour(
    userId: string,
    tourId: number,
  ): Promise<DayBurnedFuelRes> {
    const days = await this.getByTourId(userId, tourId);
    if (!days || days.length === 0) {
      return { burnedFuel: 0 };
    }
    const burnedFuel = days.reduce(
      (totalFuel, day) => totalFuel + Number(day.fuelBurned),
      0,
    );
    return { burnedFuel };
  }

  async create(
    data: DayCreateDto,
    userId: string,
    tourId: number,
  ): Promise<DayEntity> {
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    const log = await this.logsService.create(
      logData,
      userId,
      tourId,
      logTypeEnum.days,
    );

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
        await this.dayRepository.update(
          { id: lastDayWithCard.id },
          { breakTime },
        );
      }
    }

    return await this.dayRepository.save({
      userId,
      tourId,
      startLogId: log.id,
      cardState: data.cardInserted
        ? dayCardStateEnum.inserted
        : dayCardStateEnum.notUsed,
      doubleCrew: data.doubleCrew,
      status: dayStatusEnum.started,
    });
  }

  async finish(
    data: DayFinishDto,
    userFuelConType: number,
    activeDay: DayEntity,
  ): Promise<DayEntity> {
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
    const stopLog = await this.logsService.create(
      logData,
      activeDay.userId,
      activeDay.tourId,
      logTypeEnum.days,
    );
    await this.dayRepository.update(
      { id: activeDay.id },
      {
        status: dayStatusEnum.finished,
        cardState:
          activeDay.cardState === dayCardStateEnum.inserted && data.cardTakeOut
            ? dayCardStateEnum.takenOut
            : activeDay.cardState,
        distance: stopLog.odometer - startLog.odometer,
        driveTime: data.driveTime,
        driveTime2: data.driveTime2,
        stopLogId: stopLog.id,
        fuelBurned:
          userFuelConType === userFuelContypeEnum.per100km
            ? ((stopLog.odometer - startLog.odometer) / 100) *
              data.fuelCombustion
            : data.fuelCombustion,
        workTime: subtractDatesToTime(stopLog.date, startLog.date),
      },
    );
    return await this.dayRepository.findOne({ where: { id: activeDay.id } });
  }

  async get(
    userId: string,
    page: string,
    perPage: string,
  ): Promise<DayListResponse> {
    const query = await this.dayRepository
      .createQueryBuilder('day')
      .where('day.userId = :userId', { userId })
      .leftJoinAndMapOne(
        'day.startData',
        LogEntity,
        'startLog',
        'day.startLogId = startLog.id',
      )
      .leftJoinAndMapOne(
        'day.stopData',
        LogEntity,
        'stopLog',
        'day.stopLogId = stopLog.id',
      )
      .leftJoinAndMapOne(
        'startLog.placeData',
        PlaceEntity,
        'startPlace',
        'startLog.placeId = startPlace.id',
      )
      .leftJoinAndMapOne(
        'stopLog.placeData',
        PlaceEntity,
        'stopPlace',
        'stopLog.placeId = stopPlace.id',
      )
      .orderBy('day.id', 'DESC')
      .skip((Number(page) - 1) * Number(perPage))
      .take(Number(perPage));
    const [items, totalItems] = await query.getManyAndCount();
    return { items, totalItems };
  }
}
