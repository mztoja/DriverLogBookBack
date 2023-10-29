import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
  async create(@Body() body: TourCreateDto, @UserObj() user: UserEntity) {
    return await this.toursService.create(body, user.id);
  }
}
