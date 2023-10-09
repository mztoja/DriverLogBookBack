import { Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacesEntity } from './places.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlacesEntity])],
  providers: [PlacesService],
  controllers: [PlacesController],
  exports: [PlacesService],
})
export class PlacesModule {}
