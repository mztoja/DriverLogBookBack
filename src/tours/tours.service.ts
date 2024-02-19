import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { TourEntity } from './tour.entity';
import { logTypeEnum, TourNumbersInterface, tourStatusEnum } from '../types';
import { TourCreateDto } from './dto/tour-create.dto';
import { LogsService } from '../logs/logs.service';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { TourFinishDto } from './dto/tour-finish.dto';
import { DaysService } from '../days/days.service';
import { subtractDatesToTime } from '../utlis/subtractDatesToTime';
import { calculateDaysFromTime } from '../utlis/calculateDaysFromTime';
import { FinancesService } from '../finances/finances.service';
import { UserEntity } from '../users/user.entity';
import { LoadsService } from '../loads/loads.service';
import { calculateSalary } from '../utlis/calculateSalary';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(TourEntity)
    private tourRepository: Repository<TourEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
    @Inject(DaysService)
    private daysService: DaysService,
    @Inject(FinancesService)
    private financesService: FinancesService,
    @Inject(LoadsService)
    private loadsService: LoadsService,
  ) {}
  async getActiveRoute(userId: string): Promise<TourEntity> {
    return await this.tourRepository.findOne({
      where: { userId, status: tourStatusEnum.started },
    });
  }
  async getPreviousRoute(userId: string): Promise<TourEntity> {
    return await this.tourRepository.findOne({
      where: { userId, status: Not(tourStatusEnum.started) },
      order: { id: 'DESC' },
    });
  }
  async getRouteNumbers(tourIds: number[]): Promise<TourNumbersInterface[]> {
    const result: TourNumbersInterface[] = [];
    await Promise.all(
      tourIds.map(async (number) => {
        const route = await this.tourRepository.findOne({
          where: { id: number },
        });

        if (route) {
          result.push({
            tourId: number,
            tourNr: route.tourNr,
          });
        }
      }),
    );
    return result;
  }
  async create(data: TourCreateDto, userId: string): Promise<TourEntity> {
    try {
      const logData: LogCreateDto = {
        country: data.country,
        odometer: data.odometer,
        placeId: data.placeId,
        notes: data.notes,
        place: data.place,
        date: data.date,
        action: data.action,
      };
      const log = await this.logsService.create(
        logData,
        userId,
        0,
        logTypeEnum.tours,
      );

      const previousRoute = await this.getPreviousRoute(userId);

      const tour = await this.tourRepository.save({
        userId,
        tourNr: previousRoute ? previousRoute.tourNr + 1 : 1,
        truck: data.truck,
        startLogId: log.id,
        fuelStateBefore: data.fuelStateBefore,
        status: tourStatusEnum.started,
      });

      const newAction = log.action.replace(/\./, `. ${tour.tourNr} `);
      await this.logsService.setAction(log.id, newAction);
      await this.logsService.setTourId(log.id, tour.id);

      return tour;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async changeTrailer(id: number, trailer: string): Promise<void> {
    await this.tourRepository.update({ id }, { trailer });
  }

  async finish(
    data: TourFinishDto,
    user: UserEntity,
    activeRoute: TourEntity,
  ): Promise<TourEntity> {
    const startLog = await this.logsService.find(activeRoute.startLogId);
    const newLogData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action.replace(/\./, `. ${activeRoute.tourNr} `),
    };
    const stopLog = await this.logsService.create(
      newLogData,
      user.id,
      activeRoute.id,
      logTypeEnum.tours,
    );
    const driveTime = await this.daysService.getTotalDriveTimeByRoute(
      user.id,
      activeRoute.id,
    );
    const workTime = await this.daysService.getTotalWorkTimeByRoute(
      user.id,
      activeRoute.id,
    );
    const distance = await this.daysService.getDistanceByTour(
      user.id,
      activeRoute.id,
    );
    const allDaysTime = subtractDatesToTime(stopLog.date, startLog.date);
    const allDays = calculateDaysFromTime(allDaysTime);
    const daysOnDuty = calculateDaysFromTime(workTime);
    const daysOffDuty = allDays - daysOnDuty;
    const burnedFuelComp = (
      await this.daysService.getBurnedFuelByTour(user.id, activeRoute.id)
    ).burnedFuel;
    const totalRefuel = (
      await this.financesService.getRefuelValueByTour(user.id, activeRoute.id)
    ).refuelValue;
    const loads = await this.loadsService.getLoadsByTour(
      user.id,
      activeRoute.id,
    );
    const loadsWeight = loads.reduce((sum, load) => sum + load.weight, 0);
    const expectedSalary = calculateSalary(
      user.bid,
      user.bidType,
      distance,
      allDays,
    );
    const outgoings = await this.financesService.getOutgoingsByTour(
      user.id,
      activeRoute.id,
    );
    await this.tourRepository.update(
      { id: activeRoute.id },
      {
        status: tourStatusEnum.finished,
        stopLogId: stopLog.id,
        driveTime,
        workTime,
        distance,
        daysOnDuty,
        daysOffDuty,
        totalRefuel,
        fuelStateAfter: data.fuelStateAfter,
        burnedFuelComp,
        burnedFuelReal:
          Number(activeRoute.fuelStateBefore) +
          totalRefuel -
          data.fuelStateAfter,
        numberOfLoads: loads.length,
        avgWeight: isNaN(Math.round(loadsWeight / loads.length))
          ? 0
          : Math.round(loadsWeight / loads.length),
        expectedSalary,
        outgoings,
        currency: user.currency,
      },
    );
    return await this.tourRepository.findOne({ where: { id: activeRoute.id } });
  }
}
