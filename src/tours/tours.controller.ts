import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { TourCreateDto } from './dto/tour-create.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TourFinishDto } from './dto/tour-finish.dto';
import { DaysService } from '../days/days.service';
import { TourEntity } from './tour.entity';
import { LoadsService } from '../loads/loads.service';
import { TourGetNumbersDto } from './dto/tour-get-numbers.dto';
import { TourNumbersInterface } from '../types';

@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
    private readonly daysService: DaysService,
    private readonly loadsService: LoadsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() data: TourCreateDto, @UserObj() user: UserEntity) {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (activeRoute) {
      throw new BadRequestException('activeRoute');
    }
    return await this.toursService.create(data, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('finish')
  async finish(
    @Body() data: TourFinishDto,
    @UserObj() user: UserEntity,
  ): Promise<TourEntity> {
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (activeDay) {
      throw new BadRequestException('dayExistRegardRoute');
    }
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    const activeLoads = await this.loadsService.getNotUnloadedLoads(user.id);
    if (activeLoads.length !== 0) {
      throw new BadRequestException('youHaveUnloadedLoads');
    }
    return await this.toursService.finish(data, user, activeRoute);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getActiveRoute')
  async getActiveRoute(@UserObj() user: UserEntity) {
    return await this.toursService.getActiveRoute(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('getRouteNumbers')
  async getRouteNumbers(
    @Body() data: TourGetNumbersDto,
  ): Promise<TourNumbersInterface[]> {
    return await this.toursService.getRouteNumbers(data.tourIds);
  }
}
