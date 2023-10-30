import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { TourCreateDto } from './dto/tour.create.dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(@Body() data: TourCreateDto, @UserObj() user: UserEntity) {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (activeRoute) {
      throw new BadRequestException('activeRoute');
    }
    return await this.toursService.create(data, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getActiveRoute')
  async getActiveRoute(@UserObj() user: UserEntity) {
    return await this.toursService.getActiveRoute(user.id);
  }
}
