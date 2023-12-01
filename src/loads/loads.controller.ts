import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
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
import { LoadInterface } from '../types';
import { PlaceEntity } from '../places/place.entity';
import { PlacesService } from '../places/places.service';
import { UsersService } from '../users/users.service';

@Controller('loads')
export class LoadsController {
  constructor(
    private readonly loadsService: LoadsService,
    private readonly toursService: ToursService,
    private readonly placesService: PlacesService,
    private readonly usersService: UsersService,
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
    await this.usersService.markArrival(user.id, 0);
    return this.loadsService.create(user.id, data, activeRoute.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getNotUnloadedLoads')
  async getNotUnloadedLoads(
    @UserObj() user: UserEntity,
  ): Promise<LoadInterface[]> {
    return this.loadsService.getNotUnloadedLoads(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getUnloadingPlace/:id')
  async getUnloadingPlace(
    @UserObj() user: UserEntity,
    @Param('id') loadId: number,
  ): Promise<PlaceEntity> {
    const load = await this.loadsService.findById(loadId);
    if (!load || load.userId !== user.id) {
      throw new NotFoundException();
    }
    return await this.placesService.findById(load.receiverId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getLoadDetails/:id')
  async getLoadDetails(
    @UserObj() user: UserEntity,
    @Param('id') loadId: number,
  ): Promise<LoadEntity> {
    const load = await this.loadsService.findById(loadId);
    if (!load || load.userId !== user.id) {
      throw new NotFoundException();
    }
    return load;
  }
}
