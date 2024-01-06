import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { TourEntity } from './tour.entity';
import { logTypeEnum, tourStatusEnum } from '../types';
import { TourCreateDto } from './dto/tour-create.dto';
import { LogsService } from '../logs/logs.service';
import { LogCreateDto } from '../logs/dto/log-create.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(TourEntity)
    private tourRepository: Repository<TourEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}
  async getActiveRoute(userId: string): Promise<TourEntity> {
    return await this.tourRepository.findOne({
      where: { userId, status: tourStatusEnum.started },
    });
  }
  async getPreviousRoute(userId: string): Promise<TourEntity> {
    return await this.tourRepository.findOne({
      where: { userId, status: Not(tourStatusEnum.started) },
      order: { id: 'DESC' },
    });
  }
  async create(data: TourCreateDto, userId: string): Promise<TourEntity> {
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
        0,
        logTypeEnum.tours,
      );

      const previousRoute = await this.getPreviousRoute(userId);

      const tour = await this.tourRepository.save({
        userId,
        tourNr: previousRoute ? previousRoute.tourNr + 1 : 1,
        truck: data.truck,
        startLogId: log.id,
        fuelStateBefore: data.fuelStateBefore,
        status: tourStatusEnum.started,
      });

      const newAction = log.action.replace(/\./, `. ${tour.tourNr} `);
      await this.logsService.setAction(log.id, newAction);
      await this.logsService.setTourId(log.id, tour.id);

      return tour;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async changeTrailer(id: number, trailer: string): Promise<void> {
    await this.tourRepository.update({ id }, { trailer });
  }
}
