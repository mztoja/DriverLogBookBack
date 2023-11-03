import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { DayEntity } from './day.entity';
import { DayCreateDto } from './dto/day.create.dto';
import {
  dayCardStateEnum,
  dayStatusEnum,
  logTypeEnum,
  userFuelContypeEnum,
} from '../types';
import { LogCreateDto } from '../logs/dto/log.create.dto';
import { DayFinishDto } from './dto/day.finish.dto';
import { subtractDates } from '../utlis/subtractDates';
import { PlaceEntity } from '../places/place.entity';
import { LogEntity } from '../logs/log.entity';
import { DayListResponse } from '../types/day/DayListResponse';

@Injectable()
export class DaysService {
  constructor(
    @InjectRepository(DayEntity)
    private dayRepository: Repository<DayEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}

  async getActiveDay(userId: string): Promise<DayEntity> {
    try {
      return await this.dayRepository.findOne({
        where: { userId, status: dayStatusEnum.started },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getLastDay(userId: string): Promise<DayEntity> {
    try {
      return await this.dayRepository.findOne({
        where: { userId, status: dayStatusEnum.finished },
        order: { id: 'DESC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async create(
    data: DayCreateDto,
    userId: string,
    tourId: number,
  ): Promise<DayEntity> {
    try {
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

      let brakeTime = '00:00';
      if (data.cardInserted) {
        const lastDayWithCard = await this.dayRepository.findOne({
          where: {
            userId,
            status: dayStatusEnum.finished,
            cardState: In([
              dayCardStateEnum.inserted,
              dayCardStateEnum.takenOut,
            ]),
          },
          order: { id: 'DESC' },
        });
        if (lastDayWithCard) {
          const lastLog = await this.logsService.find(
            lastDayWithCard.stopLogId,
          );
          brakeTime = subtractDates(log.date, lastLog.date);
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
        breakTime: brakeTime,
      });
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async finish(
    data: DayFinishDto,
    userFuelConType: number,
    activeDay: DayEntity,
  ): Promise<DayEntity> {
    try {
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
            activeDay.cardState === dayCardStateEnum.inserted &&
            data.cardTakeOut
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
          workTime: subtractDates(stopLog.date, startLog.date),
        },
      );
      return await this.dayRepository.findOne({ where: { id: activeDay.id } });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async get(
    userId: string,
    page: string,
    perPage: string,
  ): Promise<DayListResponse> {
    try {
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
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
