import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LoadsService } from './loads.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { LoadEntity } from './load.entity';
import { LoadCreateDto } from './dto/load-create.dto';
import { ToursService } from '../tours/tours.service';
import { LoadInterface, LoadListResponse, loadStatusEnum } from '../types';
import { PlaceEntity } from '../places/place.entity';
import { PlacesService } from '../places/places.service';
import { UsersService } from '../users/users.service';
import { LoadUnloadDto } from './dto/load-unload.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActiveRouteGuard } from '../guards/active-route.guard';
import { ActiveRouteObj } from '../decorators/active-route-obj.decorator';
import { TourEntity } from '../tours/tour.entity';

@Controller('loads')
export class LoadsController {
  constructor(
    private readonly loadsService: LoadsService,
    private readonly toursService: ToursService,
    private readonly placesService: PlacesService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('create')
  async create(
    @Body() data: LoadCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LoadEntity> {
    await this.usersService.markArrival(user.id, 0);
    return this.loadsService.create(user.id, data, activeRoute.id);
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('unload')
  async unload(
    @Body() data: LoadUnloadDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LoadEntity> {
    if (activeRoute.userId !== user.id) {
      throw new UnauthorizedException('Unauthorized');
    }
    const load = await this.loadsService.findById(data.loadId);
    if (!load) {
      throw new BadRequestException('noChosenLoad');
    }
    if (load.userId !== user.id) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (load.status === loadStatusEnum.unloaded) {
      throw new BadRequestException('chosenLoadIsUnloaded');
    }
    if (data.isPlaceAsReceiver && load.receiverId === 0) {
      throw new BadRequestException('noLoadReceiver');
    }
    return await this.loadsService.unload(data, load, activeRoute.id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getNotUnloadedLoads')
  async getNotUnloadedLoads(
    @UserObj() user: UserEntity,
  ): Promise<LoadInterface[]> {
    return this.loadsService.getNotUnloadedLoads(user.id);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('/:page/:perPage/:search?')
  async get(
    @Param('page') page: string,
    @Param('perPage') perPage: string,
    @UserObj() user: UserEntity,
  ): Promise<LoadListResponse> {
    return await this.loadsService.get(user.id, page, perPage);
  }
}
