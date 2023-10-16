import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlacesEntity } from './places.entity';
import { PlaceCreateDto } from './dto/place.create.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlacesEntity)
    private placesRepository: Repository<PlacesEntity>,
  ) {}
  async create(data: PlaceCreateDto): Promise<PlacesEntity> {
    return this.placesRepository.save(data);
  }
  async setUserId(id: number, userId: string) {
    return this.placesRepository.update(id, { userId });
  }
  async findAll(userId: string) {
    return this.placesRepository.find({
      where: { userId },
      order: { country: 'ASC', code: 'ASC', name: 'ASC' },
    });
  }
}
