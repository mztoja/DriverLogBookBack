import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { VehicleEntity } from './vehicle.entity';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';

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
}
