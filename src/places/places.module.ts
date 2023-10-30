import { forwardRef, Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceEntity } from './place.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlaceEntity]),
    forwardRef(() => UsersModule),
  ],
  providers: [PlacesService],
  controllers: [PlacesController],
  exports: [PlacesService],
})
export class PlacesModule {}
