import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExpenseFavoritesService } from './expense-favorites.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { ExpenseFavoriteEntity } from './expense-favorite.entity';
import { AddExpenseFavoriteDto } from './dto/add-expense-favorite.dto';
import { DeleteExpenseFavoriteDto } from './dto/delete-expense-favorite.dto';

@Controller('expense-favorites')
export class ExpenseFavoritesController {
  constructor(
    private readonly expenseFavoritesService: ExpenseFavoritesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getList(@UserObj() user: UserEntity): Promise<ExpenseFavoriteEntity[]> {
    return await this.expenseFavoritesService.getList(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async add(
    @UserObj() user: UserEntity,
    @Body() data: AddExpenseFavoriteDto,
  ): Promise<ExpenseFavoriteEntity[]> {
    return await this.expenseFavoritesService.add(user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async delete(
    @UserObj() user: UserEntity,
    @Body() data: DeleteExpenseFavoriteDto,
  ): Promise<ExpenseFavoriteEntity[]> {
    return await this.expenseFavoritesService.delete(user.id, data.favoriteId);
  }
}
