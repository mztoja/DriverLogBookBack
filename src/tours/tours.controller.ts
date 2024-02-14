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

@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
    private readonly daysService: DaysService,
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
    return await this.toursService.finish(data, user, activeRoute);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getActiveRoute')
  async getActiveRoute(@UserObj() user: UserEntity) {
    return await this.toursService.getActiveRoute(user.id);
  }
}
