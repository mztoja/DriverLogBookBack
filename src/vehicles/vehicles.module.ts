import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleEntity } from './vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleEntity])],
  providers: [VehiclesService],
  controllers: [VehiclesController],
})
export class VehiclesModule {}
