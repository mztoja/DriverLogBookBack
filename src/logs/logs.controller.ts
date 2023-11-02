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

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly toursService: ToursService,
    private readonly bordersService: BordersService,
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
}
