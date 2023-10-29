import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ToursEntity } from './tours.entity';
import { logTypeEnum, tourStatusEnum } from '../types';
import { TourCreateDto } from './dto/tour.create.dto';
import { LogsService } from '../logs/logs.service';
import { LogCreateDto } from '../logs/dto/log.create.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(ToursEntity)
    private toursRepository: Repository<ToursEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}
  async getActiveRoute(userId: string): Promise<ToursEntity> {
    return await this.toursRepository.findOne({
      where: { userId, status: tourStatusEnum.started },
    });
  }
  async getPreviousRoute(userId: string): Promise<ToursEntity> {
    return await this.toursRepository.findOne({
      where: { userId, status: Not(tourStatusEnum.started) },
      order: { id: 'DESC' },
    });
  }
  async create(data: TourCreateDto, userId: string): Promise<ToursEntity> {
    try {
      const activeRoute = await this.getActiveRoute(userId);
      if (activeRoute) {
        throw new BadRequestException('activeRoute');
      }

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

      const tour = await this.toursRepository.save({
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
}
