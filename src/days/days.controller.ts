import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DaysService } from './days.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { DayCreateDto } from './dto/day-create.dto';
import { DayEntity } from './day.entity';
import { DayFinishDto } from './dto/day-finish.dto';
import { DayListResponse } from '../types/day/DayListResponse';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActiveRouteGuard } from '../guards/active-route.guard';
import { ActiveRouteObj } from '../decorators/active-route-obj.decorator';
import { TourEntity } from '../tours/tour.entity';

@Controller('days')
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('create')
  async create(
    @Body() data: DayCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<DayEntity> {
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (activeDay) {
      throw new BadRequestException('activeDay');
    }
    return await this.daysService.create(data, user.id, activeRoute.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getActiveDay')
  async getActiveDay(@UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.getActiveDay(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getLastDay')
  async getLastDay(@UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.getLastDay(user.id);
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('finish')
  async finish(
    @Body() data: DayFinishDto,
    @UserObj() user: UserEntity,
  ): Promise<DayEntity> {
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (!activeDay) {
      throw new BadRequestException('dayNotExist');
    }
    return await this.daysService.finish(data, user.fuelConType, activeDay);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:page/:perPage/:search?')
  async get(
    @Param('page') page: string,
    @Param('perPage') perPage: string,
    @UserObj() user: UserEntity,
  ): Promise<DayListResponse> {
    return await this.daysService.get(user.id, page, perPage);
  }
}
