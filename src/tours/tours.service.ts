import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ToursEntity } from './tours.entity';
import { TourStatusEnum } from '../types';
import { TourCreateDto } from './dto/tour.create.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(ToursEntity)
    private toursRepository: Repository<ToursEntity>,
  ) {}
  async getActiveRoute(userId: string): Promise<ToursEntity> {
    return this.toursRepository.findOne({
      where: { userId, status: TourStatusEnum.started },
    });
  }
  async getPreviousRoute(userId: string): Promise<ToursEntity> {
    return this.toursRepository.findOne({
      where: { userId, status: Not(TourStatusEnum.started) },
      order: { id: 'DESC' },
    });
  }
  async create(data: TourCreateDto): Promise<ToursEntity> {
    return this.toursRepository.save(data);
  }
}
