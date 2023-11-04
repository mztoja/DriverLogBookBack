import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LoadsService } from './loads.service';
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { LoadEntity } from './load.entity';
import { LoadCreateDto } from './dto/load.create.dto';
import { ToursService } from '../tours/tours.service';

@Controller('loads')
export class LoadsController {
  constructor(
    private readonly loadsService: LoadsService,
    private readonly toursService: ToursService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(
    @Body() data: LoadCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<LoadEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    return this.loadsService.create(user.id, data, activeRoute.id);
  }
}
