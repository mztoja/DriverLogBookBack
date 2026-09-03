import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseFavoriteEntity } from './expense-favorite.entity';
import { ExpenseFavoritesService } from './expense-favorites.service';
import { ExpenseFavoritesController } from './expense-favorites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseFavoriteEntity])],
  providers: [ExpenseFavoritesService],
  exports: [ExpenseFavoritesService],
  controllers: [ExpenseFavoritesController],
})
export class ExpenseFavoritesModule {}
