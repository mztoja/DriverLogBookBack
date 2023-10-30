import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DaysService } from './days.service';
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { DayCreateDto } from './dto/day.create.dto';
import { DayEntity } from './day.entity';
import { ToursService } from '../tours/tours.service';
import { DayFinishDto } from './dto/day.finish.dto';
import { UpdateResult } from 'typeorm';

@Controller('days')
export class DaysController {
  constructor(
    private readonly daysService: DaysService,
    private readonly toursService: ToursService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(
    @Body() data: DayCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<DayEntity> {
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (activeDay) {
      throw new BadRequestException('activeDay');
    }
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    return await this.daysService.create(data, user.id, activeRoute.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getActiveDay')
  async getActiveDay(@UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.getActiveDay(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getLastDay')
  async getLastDay(@UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.getLastDay(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('finish')
  async finish(
    @Body() data: DayFinishDto,
    @UserObj() user: UserEntity,
  ): Promise<UpdateResult> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (!activeDay) {
      throw new BadRequestException('dayNotExist');
    }
    return await this.daysService.finish(data, user.fuelConType, activeDay);
  }
}
