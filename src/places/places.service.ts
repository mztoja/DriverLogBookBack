import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceEntity } from './place.entity';
import { PlaceCreateDto } from './dto/place.create.dto';
import { placeTypeEnum } from '../types';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlaceEntity)
    private placeRepository: Repository<PlaceEntity>,
  ) {}

  async create(
    data: PlaceCreateDto,
    userId: string,
    markDepartFn: (userId: string, placeId: number) => Promise<void>,
  ): Promise<PlaceEntity> {
    try {
      const place = await this.placeRepository.save({
        userId,
        isFavorite: data.isFavorite,
        type: data.type,
        name: data.name,
        street: data.street,
        code: data.code,
        city: data.city,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
        description: data.description !== '' ? data.description : null,
      });
      if (data.isMarked === true) {
        await markDepartFn(userId, place.id);
      }
      return place;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getPlacesList(userId: string): Promise<PlaceEntity[]> {
    try {
      return await this.placeRepository.find({
        where: { userId },
        order: { country: 'ASC', code: 'ASC', name: 'ASC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getCompanyList(userId: string): Promise<PlaceEntity[]> {
    try {
      return await this.placeRepository.find({
        where: { userId, type: placeTypeEnum.base },
        order: { country: 'ASC', code: 'ASC', name: 'ASC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async findById(id: number): Promise<PlaceEntity> {
    try {
      return await this.placeRepository.findOne({ where: { id } });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
