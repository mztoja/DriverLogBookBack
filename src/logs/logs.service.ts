import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsEntity } from './logs.entity';
import { LogCreateDto } from './dto/log.create.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LogsEntity)
    private logsRepository: Repository<LogsEntity>,
  ) {}
  async create(data: LogCreateDto): Promise<LogsEntity> {
    return this.logsRepository.save(data);
  }
  async setAction(id: number, action: string) {
    return this.logsRepository.update(id, { action });
  }
  async setTourId(id: number, tourId: number) {
    return this.logsRepository.update(id, { tourId });
  }
}
