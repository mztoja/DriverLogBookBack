import { forwardRef, Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacesEntity } from './places.entity';
import { UsersModule } from '../users/users.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlacesEntity]),
    forwardRef(() => UsersModule),
  ],
  providers: [PlacesService, JwtService],
  controllers: [PlacesController],
  exports: [PlacesService],
})
export class PlacesModule {}
