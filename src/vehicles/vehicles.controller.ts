import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { VehicleEntity } from './vehicle.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { VehicleAddDto } from './dto/vehicle-add.dto';

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
      body.registrationNr.replace(/\s/g, ''),
      user.id,
      user.companyId,
    );
    if (vehicle) {
      throw new BadRequestException('vehicleRegExist');
    }
    return this.vehiclesService.create(user.id, user.companyId, body);
  }
}
