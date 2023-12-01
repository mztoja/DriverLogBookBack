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
import { AuthGuard } from '@nestjs/passport';
import { UserObj } from '../decorators/user-obj.decorator';
import { UserEntity } from '../users/user.entity';
import { LogCreateDto } from './dto/log.create.dto';
import { ToursService } from '../tours/tours.service';
import { LogEntity } from './log.entity';
import { LogListResponse, logTypeEnum } from '../types';
import { LogBorderDto } from './dto/log.border.dto';
import { BordersService } from '../borders/borders.service';
import { UsersService } from '../users/users.service';

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly toursService: ToursService,
    private readonly bordersService: BordersService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<LogEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.generalLogAdded,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('createBorderCross')
  async createBorderCross(
    @Body() data: LogBorderDto,
    @UserObj() user: UserEntity,
  ): Promise<LogEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Post('attachTrailer')
  async attachTrailer(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<LogEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    if (activeRoute.trailer) {
      throw new BadRequestException('trailerExist');
    }
    const trailer = data.action.split(': ')[1];
    await this.toursService.changeTrailer(activeRoute.id, trailer);
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.attachTrailer,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('detachTrailer')
  async detachTrailer(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<LogEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    if (!activeRoute.trailer) {
      throw new BadRequestException('noTrailer');
    }
    data.action = data.action + ': ' + activeRoute.trailer;
    await this.toursService.changeTrailer(activeRoute.id, null);
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.detachTrailer,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loadingArrival')
  async loadingArrival(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<LogEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
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

  @UseGuards(AuthGuard('jwt'))
  @Post('unloadingArrival')
  async unloadingArrival(
    @Body() data: LogCreateDto,
    @UserObj() user: UserEntity,
  ): Promise<LogEntity> {
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    return await this.logsService.create(
      data,
      user.id,
      activeRoute.id,
      logTypeEnum.arrivedToLoading,
    );
  }
}
