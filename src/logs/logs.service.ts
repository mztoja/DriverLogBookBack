import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsEntity } from './logs.entity';
import { LogCreateDto } from './dto/log.create.dto';
import { logTypeEnum } from '../types';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LogsEntity)
    private logsRepository: Repository<LogsEntity>,
  ) {}
  async create(
    data: LogCreateDto,
    userId: string,
    tourId: number,
    type: logTypeEnum,
  ): Promise<LogsEntity> {
    try {
      const log = await this.logsRepository.save({
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
      return log;
    } catch {
      throw new InternalServerErrorException();
    }
  }
  async setAction(id: number, action: string) {
    try {
      return await this.logsRepository.update(id, { action });
    } catch {
      throw new InternalServerErrorException();
    }
  }
  async setTourId(id: number, tourId: number) {
    try {
      return await this.logsRepository.update(id, { tourId });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
