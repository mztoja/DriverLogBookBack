import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceEntity } from './service.entity';
import { ActiveRouteGuard } from '../guards/active-route.guard';
import { ActiveRouteObj } from '../decorators/active-route-obj.decorator';
import { TourEntity } from '../tours/tour.entity';
import { ServiceInterface } from '../types';
import { EditServiceDto } from './dto/edit-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('create')
  async create(
    @UserObj() user: UserEntity,
    @Body() data: CreateServiceDto,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<ServiceEntity> {
    return await this.servicesService.create(user.id, data, activeRoute.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getByVehicleId/:id')
  async getByVehicleId(@UserObj() user: UserEntity, @Param('id') id: string): Promise<ServiceInterface[]> {
    return await this.servicesService.getByVehicleId(Number(id), user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('edit')
  async edit(@Body() data: EditServiceDto, @UserObj() user: UserEntity): Promise<ServiceEntity> {
    return await this.servicesService.edit(user.id, data);
  }
}
