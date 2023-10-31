import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity } from './log.entity';
import { LogCreateDto } from './dto/log.create.dto';
import { logTypeEnum } from '../types';
import { UsersService } from '../users/users.service';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LogEntity)
    private logRepository: Repository<LogEntity>,
    @Inject(UsersService)
    private usersService: UsersService,
  ) {}

  async create(
    data: LogCreateDto,
    userId: string,
    tourId: number,
    type: logTypeEnum,
  ): Promise<LogEntity> {
    try {
      await this.usersService.countryEnter(userId, data.country);
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
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async setAction(id: number, action: string) {
    try {
      return await this.logRepository.update(id, { action });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async setTourId(id: number, tourId: number) {
    try {
      return await this.logRepository.update(id, { tourId });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async find(id: number): Promise<LogEntity> {
    try {
      return await this.logRepository.findOne({ where: { id } });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
