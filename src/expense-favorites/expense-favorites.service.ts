import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseFavoriteEntity } from './expense-favorite.entity';
import { AddExpenseFavoriteDto } from './dto/add-expense-favorite.dto';

@Injectable()
export class ExpenseFavoritesService {
  constructor(
    @InjectRepository(ExpenseFavoriteEntity)
    private expenseFavoriteRepository: Repository<ExpenseFavoriteEntity>,
  ) {}

  async getList(userId: string): Promise<ExpenseFavoriteEntity[]> {
    return await this.expenseFavoriteRepository.find({
      where: { userId },
      order: { itemDescription: 'ASC' },
    });
  }

  async findByUserAndId(
    userId: string,
    id: number,
  ): Promise<ExpenseFavoriteEntity> {
    return await this.expenseFavoriteRepository.findOne({
      where: { userId, id },
    });
  }

  async add(
    userId: string,
    data: AddExpenseFavoriteDto,
  ): Promise<ExpenseFavoriteEntity[]> {
    const existing = await this.expenseFavoriteRepository.findOne({
      where: {
        userId,
        placeId: data.placeId,
        itemDescription: data.itemDescription,
        payment: data.payment,
        unitPrice: data.unitPrice,
      },
    });
    if (!existing) {
      await this.expenseFavoriteRepository.save({ userId, ...data });
    }
    return await this.getList(userId);
  }

  async delete(userId: string, id: number): Promise<ExpenseFavoriteEntity[]> {
    const found = await this.findByUserAndId(userId, id);
    if (!found) {
      throw new BadRequestException('favoriteNotFound');
    }
    await this.expenseFavoriteRepository.delete({ id: found.id });
    return await this.getList(userId);
  }
}
