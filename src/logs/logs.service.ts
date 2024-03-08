import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { LogEntity } from './log.entity';
import { LogCreateDto } from './dto/log-create.dto';
import { LogInterface, LogListResponse, logTypeEnum } from '../types';
import { UsersService } from '../users/users.service';
import { PlaceEntity } from '../places/place.entity';
import { ToursService } from '../tours/tours.service';
import { DaysService } from '../days/days.service';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LogEntity) private logRepository: Repository<LogEntity>,
    @Inject(UsersService) private usersService: UsersService,
    @Inject(forwardRef(() => ToursService)) private toursService: ToursService,
    @Inject(forwardRef(() => DaysService)) private daysService: DaysService,
  ) {}

  async create(data: LogCreateDto, userId: string, tourId: number, type: logTypeEnum): Promise<LogEntity> {
    await this.usersService.countryEnter(userId, data.country);

    if (data.odometer > 0) {
      const lastLog = await this.logRepository.findOne({
        where: { userId, tourId },
        order: { id: 'DESC' },
      });
      if (lastLog) {
        const addDistance = Number(data.odometer) - Number(lastLog.odometer);
        await this.toursService.addDistance(tourId, userId, addDistance);
        const activeDay = await this.daysService.getActiveDay(userId);
        if (activeDay) {
          await this.daysService.addDistance(activeDay.id, userId, addDistance);
        }
      }
    }

    return await this.logRepository.save({
      userId,
      placeId: data.placeId,
      place: data.placeId !== 0 ? null : data.place,
      action: data.action,
      country: data.country,
      date: data.date,
      odometer: data.odometer,
      notes: data.notes === '' ? null : data.notes,
      tourId,
      type,
    });
  }

  async setTourId(id: number, tourId: number) {
    try {
      return await this.logRepository.update(id, { tourId });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async find(id: number): Promise<LogEntity> {
    return await this.logRepository.findOne({ where: { id } });
  }

  async get(userId: string, page: string, perPage: string, search: string | null): Promise<LogListResponse> {
    const query = await this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .leftJoinAndMapOne('log.placeData', PlaceEntity, 'place', 'log.placeId = place.id')
      .orderBy('log.id', 'DESC')
      .skip((Number(page) - 1) * Number(perPage))
      .take(Number(perPage));
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('log.action LIKE :search', {
            search: `%${search}%`,
          }).orWhere('log.date LIKE :search', { search: `%${search}%` });
        }),
      );
    }
    //const totalPages = Math.ceil(totalItems / Number(perPage));
    const [items, totalItems] = await query.getManyAndCount();
    return { items, totalItems };
  }

  async getByTourId(userId: string, tourId: number): Promise<LogInterface[]> {
    return await this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId AND log.tourId = :tourId', {
        userId,
        tourId,
      })
      .leftJoinAndMapOne('log.placeData', PlaceEntity, 'place', 'log.placeId = place.id')
      .orderBy('log.id', 'DESC')
      .getMany();
  }

  async getLastLog(userId: string): Promise<LogInterface> {
    return await this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .leftJoinAndMapOne('log.placeData', PlaceEntity, 'place', 'log.placeId = place.id')
      .orderBy('log.id', 'DESC')
      .getOne();
  }
}
