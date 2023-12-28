import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { LogCreateDto } from './dto/log-create.dto';
import { ToursService } from '../tours/tours.service';
import { LogEntity } from './log.entity';
import { LogListResponse, logTypeEnum } from '../types';
import { LogBorderDto } from './dto/log-border.dto';
import { BordersService } from '../borders/borders.service';
import { UsersService } from '../users/users.service';
import { LoadsService } from '../loads/loads.service';
import { LogDetachTrailerDto } from './dto/log-detach-trailer.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActiveRouteGuard } from '../guards/active-route.guard';
import { TourEntity } from '../tours/tour.entity';
import { ActiveRouteObj } from '../decorators/active-route-obj.decorator';

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly toursService: ToursService,
    private readonly bordersService: BordersService,
    private readonly usersService: UsersService,
    private readonly loadsService: LoadsService,
  ) {}

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('create')
  async create(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LogEntity> {
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.generalLogAdded,
    );
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('createBorderCross')
  async createBorderCross(
    @Body() data: LogBorderDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LogEntity> {
    if (user.country === data.country) {
      throw new BadRequestException('countryConflict');
    }
    if (data.addNewBorder) {
      await this.bordersService.create(data.place, user.country, data.country);
    }
    delete data.addNewBorder;
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.crossBorder,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:page/:perPage/:search?')
  async get(
    @Param('page') page: string,
    @Param('perPage') perPage: string,
    @Param('search') searchParam: string,
    @UserObj() user: UserEntity,
  ): Promise<LogListResponse> {
    let search = searchParam || '';
    if (search.length < 2) {
      search = null;
    }
    return await this.logsService.get(user.id, page, perPage, search);
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('attachTrailer')
  async attachTrailer(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LogEntity> {
    if (activeRoute.trailer) {
      throw new BadRequestException('trailerExist');
    }
    const trailer = data.action.split(': ')[1];
    await this.toursService.changeTrailer(
      activeRoute.id,
      trailer.replace(/\s/g, ''),
    );
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.attachTrailer,
    );
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('detachTrailer')
  async detachTrailer(
    @Body() data: LogDetachTrailerDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LogEntity> {
    if (!activeRoute.trailer) {
      throw new BadRequestException('noTrailer');
    }
    const unloadedLoads = await this.loadsService.getNotUnloadedLoads(user.id);
    const trailerLoads = unloadedLoads.filter(
      (load) => load.vehicle === activeRoute.trailer,
    );
    data.action = data.action + ': ' + activeRoute.trailer;
    if (trailerLoads.length > 0) {
      trailerLoads.map(async (load) => {
        await this.loadsService.unload(
          {
            loadId: load.id,
            isPlaceAsReceiver: false,
            notes: data.action,
            country: data.country,
            odometer: data.odometer,
            placeId: data.placeId,
            place: data.place,
            date: data.date,
            action: data.unloadAction,
          },
          load,
          activeRoute.id,
          user.id,
        );
      });
    }
    await this.toursService.changeTrailer(activeRoute.id, null);
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.detachTrailer,
    );
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('loadingArrival')
  async loadingArrival(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LogEntity> {
    await this.usersService.markDepart(user.id, 0);
    if (data.placeId !== 0) {
      await this.usersService.markArrival(user.id, data.placeId);
    }
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.arrivedToLoading,
    );
  }

  @UseGuards(JwtAuthGuard, ActiveRouteGuard)
  @Post('unloadingArrival')
  async unloadingArrival(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
    @ActiveRouteObj() activeRoute: TourEntity,
  ): Promise<LogEntity> {
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.arrivedToUnloading,
    );
  }
}
