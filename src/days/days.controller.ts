import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
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
import { DayBurnedFuelRes } from '../types';
import { DayInterface } from '../types';
import { DayEditDto } from './dto/day-edit.dto';
import { DaySimpleEditDto } from './dto/day-simple-edit.dto';

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
  async getActiveDay(@UserObj() user: UserEntity): Promise<DayInterface> {
    return await this.daysService.getActiveDay(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getLastDay')
  async getLastDay(@UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.getLastDay(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getYourLastDay')
  async getYourLastDay(@UserObj() user: UserEntity): Promise<DayInterface> {
    return await this.daysService.getYourLastDay(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('burnedFuelByTour/:tourId')
  async getBurnedFuelByTour(
    @Param('tourId', new ParseIntPipe(), new ValidationPipe({ transform: true }))
    tourId: number,
    @UserObj() user: UserEntity,
  ): Promise<DayBurnedFuelRes> {
    return await this.daysService.getBurnedFuelByTour(user.id, tourId);
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('finish')
  async finish(@Body() data: DayFinishDto, @UserObj() user: UserEntity): Promise<DayEntity> {
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (!activeDay) {
      throw new BadRequestException('dayNotExist');
    }
    return await this.daysService.finish(data, user.fuelConType, activeDay);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:page/:perPage/:search?')
  async get(
    @Param('page') page: string,
    @Param('perPage') perPage: string,
    @UserObj() user: UserEntity,
  ): Promise<DayListResponse> {
    return await this.daysService.get(user.id, page, perPage);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getDayByLogId/:logId')
  async getDayByLogId(@Param('logId') logId: string, @UserObj() user: UserEntity): Promise<DayInterface> {
    return await this.daysService.getByLogId(user.id, Number(logId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('getByTourId/:tourId')
  async getByTourId(@Param('tourId') tourId: string, @UserObj() user: UserEntity): Promise<DayInterface[]> {
    return await this.daysService.getByTourId(user.id, Number(tourId));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('edit')
  async edit(@Body() data: DayEditDto, @UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.edit(data, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('simpleEdit')
  async simpleEdit(@Body() data: DaySimpleEditDto, @UserObj() user: UserEntity): Promise<DayEntity> {
    return await this.daysService.simpleEdit(data, user.id);
  }
}
