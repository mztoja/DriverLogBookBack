import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlacesEntity } from './places.entity';
import { CreatePlaceDto } from './dto/CreatePlaceDto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlacesEntity)
    private placesRepository: Repository<PlacesEntity>,
  ) {}
  async create(data: CreatePlaceDto): Promise<PlacesEntity> {
    return this.placesRepository.save(data);
  }
  async setUserId(id: number, userId: string) {
    return this.placesRepository.update(id, { userId });
  }
}
