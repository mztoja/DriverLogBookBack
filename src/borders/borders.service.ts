import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { BorderEntity } from './border.entity';

@Injectable()
export class BordersService {
  constructor(
    @InjectRepository(BorderEntity)
    private borderRepository: Repository<BorderEntity>,
  ) {}

  async getByCountry(country: string, userId: string): Promise<BorderEntity[]> {
      return await this.borderRepository.find({
        where: [{ country1: country, userId }, { country2: country, userId }],
        order: { place: 'ASC' },
      });
  }

  async delete(id: number, userId: string): Promise<DeleteResult> {
    return await this.borderRepository.delete({ id, userId });
  }

  async create(
    place: string,
    country1: string,
    country2: string,
    userId: string,
  ): Promise<BorderEntity> {
      return await this.borderRepository.save({
        place,
        country1,
        country2,
        userId,
      });
  }
}
