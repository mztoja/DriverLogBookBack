import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Not, Repository } from 'typeorm';
import { LogEntity } from './log.entity';
import { LogCreateDto } from './dto/log-create.dto';
import { LogInterface, LogListResponse, logTypeEnum, tourStatusEnum } from '../types';
import { UsersService } from '../users/users.service';
import { PlaceEntity } from '../places/place.entity';
import { ToursService } from '../tours/tours.service';
import { DaysService } from '../days/days.service';
import { LogEditDto } from './dto/log-edit.dto';

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
      const findLastLog = async () => {
        const ignoredIds: number[] = [];
        let foundLog = await this.logRepository.findOne({
          where: { userId, tourId },
          order: { id: 'DESC' },
        });
        while (
          foundLog &&
          foundLog.odometer === 0 &&
          (foundLog.type === logTypeEnum.maintenance || foundLog.type === logTypeEnum.service)
        ) {
          ignoredIds.push(foundLog.id);
          foundLog = await this.logRepository.findOne({
            where: {
              userId,
              tourId,
              id: Not(In(ignoredIds)),
            },
            order: { id: 'DESC' },
          });
        }
        return foundLog ? foundLog : null;
      };
      const lastLog = await findLastLog();
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

  async edit(data: LogEditDto, userId: string): Promise<LogEntity> {
    const old = await this.logRepository.findOne({ where: { id: data.id, userId } });
    if (!old) {
      throw new NotFoundException();
    }
    const tour = await this.toursService.getRouteById(userId, old.tourId);
    if (!tour || tour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }
    const distanceDiff: number = Number(data.odometer) - Number(old.odometer);
    if (distanceDiff !== 0) {
      await this.toursService.addDistance(tour.id, userId, distanceDiff);
    }
    await this.logRepository.update(
      { id: old.id },
      {
        odometer: data.odometer,
        date: data.date,
        action: data.action,
        country: data.country,
        placeId: data.placeId,
        place: data.place,
        notes: data.notes === '' ? null : data.notes,
      },
    );
    return await this.logRepository.findOne({ where: { id: old.id } });
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
      .orderBy('log.date', 'DESC')
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

  async getTrailersListByTourId(userId: string, tourId: number): Promise<string[]> {
    const logList = await this.getByTourId(userId, tourId);
    const trailersSet = new Set<string>();

    logList
      .filter((log) => log.type === logTypeEnum.detachTrailer || log.type === logTypeEnum.attachTrailer)
      .forEach((log) => {
        const trailer = log.action.split(':');
        const trailerNumber = trailer[1].trim();

        if (!trailersSet.has(trailerNumber)) {
          trailersSet.add(trailerNumber);
        }
      });
    return Array.from(trailersSet);
  }
}
