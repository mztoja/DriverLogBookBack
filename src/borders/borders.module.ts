import { Module } from '@nestjs/common';
import { BordersService } from './borders.service';
import { BordersController } from './borders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorderEntity } from './border.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BorderEntity])],
  providers: [BordersService],
  controllers: [BordersController],
  exports: [BordersService],
})
export class BordersModule {}
