import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { VehicleEntity } from './vehicle.entity';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @UseGuards(AuthGuard('jwt'))
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
}
