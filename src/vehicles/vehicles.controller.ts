import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { VehicleEntity } from './vehicle.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { VehicleAddDto } from './dto/vehicle-add.dto';
import { VehicleTrailerEditDto } from './dto/vehicle-trailer-edit.dto';
import { UpdateResult } from 'typeorm';
import { VehicleTruckEditDto } from './dto/vehicle-truck-edit.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('findByRegistration/:regNr')
  async findByRegistration(
    @UserObj() user: UserEntity,
    @Param('regNr') regNr: string,
  ): Promise<VehicleEntity> {
    return this.vehiclesService.findByRegistration(
      regNr,
      user.id,
      user.companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @UserObj() user: UserEntity,
    @Body() body: VehicleAddDto,
  ): Promise<VehicleEntity> {
    const vehicle = await this.vehiclesService.findByRegistration(
      body.registrationNr,
      user.id,
      user.companyId,
    );
    if (vehicle) {
      throw new BadRequestException('vehicleRegExist');
    }
    return this.vehiclesService.create(user.id, user.companyId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trucks')
  async getTrucksList(@UserObj() user: UserEntity): Promise<VehicleEntity[]> {
    return this.vehiclesService.getTrucksList(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trailers')
  async getTrailersList(@UserObj() user: UserEntity): Promise<VehicleEntity[]> {
    return this.vehiclesService.getTrailersList(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('trailer/edit/:id')
  async trailerEdit(
    @UserObj() user: UserEntity,
    @Body() body: VehicleTrailerEditDto,
    @Param('id') id: string,
  ): Promise<UpdateResult> {
    const vehicle = await this.vehiclesService.findById(Number(id), user.id);
    if (!vehicle) {
      throw new BadRequestException();
    }
    const findVehicle = await this.vehiclesService.findByRegistration(
      body.registrationNr,
      user.id,
      vehicle.companyId,
      vehicle.id,
    );
    if (findVehicle) {
      throw new BadRequestException('vehicleRegExist');
    }
    return await this.vehiclesService.trailerEdit(vehicle.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('truck/edit/:id')
  async truckEdit(
    @UserObj() user: UserEntity,
    @Body() body: VehicleTruckEditDto,
    @Param('id') id: string,
  ): Promise<UpdateResult> {
    const vehicle = await this.vehiclesService.findById(Number(id), user.id);
    if (!vehicle) {
      throw new BadRequestException();
    }
    const findVehicle = await this.vehiclesService.findByRegistration(
      body.registrationNr,
      user.id,
      vehicle.companyId,
      vehicle.id,
    );
    if (findVehicle) {
      throw new BadRequestException('vehicleRegExist');
    }
    return await this.vehiclesService.truckEdit(vehicle.id, body);
  }
}
