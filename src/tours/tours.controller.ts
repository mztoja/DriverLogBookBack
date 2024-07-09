import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
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
import { TourInterface, TourNumbersInterface, TourSettleGeneratorInterface } from '../types';
import { TourCreateSettlementDto } from './dto/tour-create-settlement.dto';
import { TourMEntity } from './tourM.entity';
import { TourEditDto } from './dto/tour-edit.dto';
import { TourSimpleEditDto } from './dto/tour-simple-edit.dto';
import { tourDeleteSettlementDto } from './dto/tour-delete-settlement.dto';

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
  async finish(@Body() data: TourFinishDto, @UserObj() user: UserEntity): Promise<TourEntity> {
    const activeDay = await this.daysService.getActiveDay(user.id);
    if (activeDay) {
      throw new BadRequestException('dayExistRegardRoute');
    }
    const activeRoute = await this.toursService.getActiveRoute(user.id);
    if (!activeRoute) {
      throw new BadRequestException('noActiveRoute');
    }
    const activeLoads = await this.loadsService.getNotUnloadedLoads(user.id);
    if (activeLoads.length > 0) {
      await Promise.all(
        activeLoads.map(async (load) => {
          await this.loadsService.unload(
            {
              loadId: load.id,
              isPlaceAsReceiver: false,
              notes: data.unloadNote,
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
        }),
      );
    }
    return await this.toursService.finish(data, user, activeRoute);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getActiveRoute')
  async getActiveRoute(@UserObj() user: UserEntity): Promise<TourInterface> {
    return await this.toursService.getActiveRoute(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRouteById/:id')
  async getRouteById(@Param('id') id: string, @UserObj() user: UserEntity): Promise<TourInterface> {
    return await this.toursService.getRouteById(user.id, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('getRouteNumbers')
  async getRouteNumbers(@Body() data: TourGetNumbersDto): Promise<TourNumbersInterface[]> {
    return await this.toursService.getRouteNumbers(data.tourIds);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:monthlySettlementId?')
  async get(
    @Param('monthlySettlementId') monthlySettlementId: string,
    @UserObj() user: UserEntity,
  ): Promise<TourInterface[]> {
    if (monthlySettlementId) {
      return await this.toursService.getSettledRoutes(user.id, Number(monthlySettlementId));
    }
    return await this.toursService.getUnaccountedRoutes(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('createSettlement')
  async createSettlement(@Body() data: TourCreateSettlementDto, @UserObj() user: UserEntity): Promise<TourMEntity> {
    const selectedRoutes = await this.toursService.getToursByManyIds(data.toursId);
    const allRoutesBelongToUser = selectedRoutes.every((route) => route.userId === user.id);
    if (!allRoutesBelongToUser) {
      throw new BadRequestException('');
    }
    if (selectedRoutes.length === 0) {
      throw new BadRequestException('youHaveToChooseRoutes');
    }
    return await this.toursService.createSettlement(user.id, data, selectedRoutes);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getSettlements/:year')
  async getSettlements(@Param('year') year: string, @UserObj() user: UserEntity): Promise<TourMEntity[]> {
    return await this.toursService.getSettlements(user.id, year);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('edit')
  async edit(@Body() data: TourEditDto, @UserObj() user: UserEntity): Promise<TourEntity> {
    return await this.toursService.edit(data, user);
  }
  @UseGuards(JwtAuthGuard)
  @Patch('simpleEdit')
  async simpleEdit(@Body() data: TourSimpleEditDto, @UserObj() user: UserEntity): Promise<TourEntity> {
    return await this.toursService.simpleEdit(data, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getRouteByLogId/:id')
  async getRouteByLogId(@Param('id') id: string, @UserObj() user: UserEntity): Promise<TourInterface> {
    return await this.toursService.getRouteByLogId(user.id, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Get('generator/:id')
  async generateTourSettlement(
    @Param('id') id: string,
    @UserObj() user: UserEntity,
  ): Promise<TourSettleGeneratorInterface> {
    return await this.toursService.generateTourSettlement(user, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleteMonthlySettlement')
  async deleteMonthlySettlement(@Body() data: tourDeleteSettlementDto, @UserObj() user: UserEntity): Promise<TourEntity[]> {
    console.log('start');
    return await this.toursService.deleteMonthlySettlement(user.id, data.id);
  }
}
