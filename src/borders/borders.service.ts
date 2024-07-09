import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BorderEntity } from './border.entity';

@Injectable()
export class BordersService {
  constructor(
    @InjectRepository(BorderEntity)
    private borderRepository: Repository<BorderEntity>,
  ) {}

  async getByCountry(country: string): Promise<BorderEntity[]> {
    try {
      return await this.borderRepository.find({
        where: [{ country1: country }, { country2: country }],
        order: { place: 'ASC' },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async create(
    place: string,
    country1: string,
    country2: string,
  ): Promise<BorderEntity> {
    try {
      return await this.borderRepository.save({
        place,
        country1,
        country2,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
