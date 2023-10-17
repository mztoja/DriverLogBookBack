import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { Request } from 'express';
import { AuthenticationService } from '../authentication/authentication.service';
import { LogCreateDto } from '../logs/dto/log.create.dto';
import { validate } from 'class-validator';
import { LogsService } from '../logs/logs.service';
import { LogTypeEnum, TourStatusEnum } from '../types';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Inject(LogsService)
  private logsService: LogsService;
  @Inject(AuthenticationService)
  private authenticationService: AuthenticationService;

  @Get('getActiveRoute')
  async getActiveRoute(@Req() request: Request) {
    const user = await this.authenticationService.findByCookie(
      request.cookies['jwt'],
    );
    if (!user) {
      throw new BadRequestException('user not exist');
    }
    return await this.toursService.getActiveRoute(user.id);
  }

  @Post('createNewRoute')
  async createNewRoute(
    @Body('userId') userId: string,
    @Body('date') date: string,
    @Body('action') action: string,
    @Body('country') country: string,
    @Body('place') place: string,
    @Body('placeId') placeId: string,
    @Body('odometer') odometer: string,
    @Body('notes') notes: string,
    @Body('truck') truck: string,
    @Body('fuelQuantity') fuelQuantity: string,
  ) {
    const errors = await validate(LogCreateDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    if (country === undefined) {
      throw new BadRequestException('country not specified');
    }
    if (truck.length < 3) {
      throw new BadRequestException('no truck number provided');
    }
    if (Number(fuelQuantity) <= 0) {
      throw new BadRequestException('no fuel quantity');
    }
    if (placeId === '0' && place === '') {
      throw new BadRequestException('no place provided');
    }
    const log = await this.logsService.create({
      userId,
      date,
      action,
      country,
      place: place === '' ? null : place,
      placeId: Number(placeId),
      odometer: Number(odometer),
      notes,
      type: LogTypeEnum.tours,
    });
    if (log) {
      let tourNr = 1;
      const previousTour = await this.toursService.getPreviousRoute(userId);
      if (previousTour) tourNr = previousTour.tourNr + 1;
      const tour = await this.toursService.create({
        userId,
        status: TourStatusEnum.started,
        tourNr: tourNr,
        truck,
        startLogId: log.id,
        fuelStateBefore: Number(fuelQuantity),
      });
      if (tour) {
        const newAction = log.action.replace(/\./, `.${tour.tourNr}`);
        await this.logsService.setAction(log.id, newAction);
        return tour;
      }
    }
  }
}
