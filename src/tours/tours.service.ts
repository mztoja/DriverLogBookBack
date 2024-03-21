import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Not, Repository } from 'typeorm';
import { TourEntity } from './tour.entity';
import { logTypeEnum, TourInterface, TourNumbersInterface, tourStatusEnum, userBidTypeEnum } from '../types';
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
import { LogEntity } from '../logs/log.entity';
import { PlaceEntity } from '../places/place.entity';
import { TourMEntity } from './tourM.entity';
import { TourCreateSettlementDto } from './dto/tour-create-settlement.dto';
import { addTimes } from '../utlis/addTimes';
import { calcSecondsFromTime } from '../utlis/calcSecondsFromTime';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(TourEntity) private tourRepository: Repository<TourEntity>,
    @InjectRepository(TourMEntity) private tourMRepository: Repository<TourMEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
    @Inject(forwardRef(() => DaysService)) private daysService: DaysService,
    @Inject(forwardRef(() => FinancesService)) private financesService: FinancesService,
    @Inject(forwardRef(() => LoadsService)) private loadsService: LoadsService,
  ) {}

  async create(data: TourCreateDto, userId: string): Promise<TourEntity> {
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    const log = await this.logsService.create(logData, userId, 0, logTypeEnum.tours);

    const previousRoute = await this.getPreviousRoute(userId);

    const tour = await this.tourRepository.save({
      userId,
      tourNr: previousRoute ? previousRoute.tourNr + 1 : 1,
      truck: data.truck,
      startLogId: log.id,
      fuelStateBefore: data.fuelStateBefore,
      status: tourStatusEnum.started,
    });

    // const newAction = log.action.replace(/\./, `. ${tour.tourNr} `);
    // await this.logsService.setAction(log.id, newAction);
    await this.logsService.setTourId(log.id, tour.id);

    return tour;
  }

  async finish(data: TourFinishDto, user: UserEntity, activeRoute: TourEntity): Promise<TourEntity> {
    const startLog = await this.logsService.find(activeRoute.startLogId);
    const newLogData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    const stopLog = await this.logsService.create(newLogData, user.id, activeRoute.id, logTypeEnum.tours);
    //const driveTime = await this.daysService.getTotalDriveTimeByRoute(user.id, activeRoute.id);
    //const workTime = await this.daysService.getTotalWorkTimeByRoute(user.id, activeRoute.id);
    //const distance = await this.daysService.getDistanceByTour(user.id, activeRoute.id);
    const { workTime, distance, totalRefuel } = activeRoute;
    const allDaysTime = subtractDatesToTime(stopLog.date, startLog.date);
    const allDays = calculateDaysFromTime(allDaysTime);
    const daysOnDuty = calculateDaysFromTime(workTime);
    const daysOffDuty = allDays - daysOnDuty;
    // const burnedFuelComp = (await this.daysService.getBurnedFuelByTour(user.id, activeRoute.id)).burnedFuel;
    //const totalRefuel = (await this.financesService.getRefuelValueByTour(user.id, activeRoute.id)).refuelValue;
    // const loads = await this.loadsService.getLoadsByTour(user.id, activeRoute.id);
    // const loadsWeight = loads.reduce((sum, load) => sum + load.weight, 0);
    const expectedSalary = calculateSalary(user.bid, user.bidType, distance, allDays);
    const outgoings = await this.financesService.getOutgoingsByTour(user.id, activeRoute.id);
    await this.tourRepository.update(
      { id: activeRoute.id },
      {
        status: tourStatusEnum.finished,
        stopLogId: stopLog.id,
        // distance,
        // driveTime,
        // workTime,
        // distance,
        daysOnDuty: daysOnDuty === 0 ? 1 : daysOnDuty,
        daysOffDuty,
        // totalRefuel,
        fuelStateAfter: data.fuelStateAfter,
        //burnedFuelComp,
        burnedFuelReal: Number(activeRoute.fuelStateBefore) + totalRefuel - data.fuelStateAfter,
        // numberOfLoads: loads.length,
        // avgWeight: isNaN(Math.round(loadsWeight / loads.length)) ? 0 : Math.round(loadsWeight / loads.length),
        expectedSalary,
        outgoings,
        currency: user.currency,
      },
    );
    return await this.tourRepository.findOne({ where: { id: activeRoute.id } });
  }

  async getActiveRoute(userId: string): Promise<TourInterface> {
    return await this.tourRepository
      .createQueryBuilder('tour')
      .where('(tour.userId = :userId) AND (tour.status = :status)', {
        userId,
        status: tourStatusEnum.started,
      })
      .leftJoinAndMapOne('tour.startLogData', LogEntity, 'startLogData', 'tour.startLogId = startLogData.id')
      .leftJoinAndMapOne(
        'startLogData.placeData',
        PlaceEntity,
        'startPlaceData',
        'startLogData.placeId = startPlaceData.id',
      )
      .orderBy('tour.id', 'DESC')
      .getOne();
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

  async changeTrailer(id: number, trailer: string): Promise<void> {
    await this.tourRepository.update({ id }, { trailer });
  }

  async getUnaccountedRoutes(userId: string): Promise<TourInterface[]> {
    return await this.tourRepository
      .createQueryBuilder('tour')
      .where('(tour.userId = :userId) AND (tour.status != :status)', {
        userId,
        status: tourStatusEnum.settled,
      })
      .leftJoinAndMapOne('tour.startLogData', LogEntity, 'startLogData', 'tour.startLogId = startLogData.id')
      .leftJoinAndMapOne(
        'startLogData.placeData',
        PlaceEntity,
        'startPlaceData',
        'startLogData.placeId = startPlaceData.id',
      )
      .leftJoinAndMapOne('tour.stopLogData', LogEntity, 'stopLogData', 'tour.stopLogId = stopLogData.id')
      .leftJoinAndMapOne(
        'stopLogData.placeData',
        PlaceEntity,
        'stopPlaceData',
        'stopLogData.placeId = stopPlaceData.id',
      )
      .orderBy('tour.id', 'DESC')
      .getMany();
  }

  async getSettledRoutes(userId: string, settledId: number): Promise<TourInterface[]> {
    const settlement = await this.tourMRepository.findOne({
      where: { id: settledId },
    });
    return await this.tourRepository
      .createQueryBuilder('tour')
      .where('(tour.userId = :userId) AND (tour.status = :status)', {
        userId,
        status: tourStatusEnum.settled,
      })
      .andWhereInIds(settlement.toursId)
      .leftJoinAndMapOne('tour.startLogData', LogEntity, 'startLogData', 'tour.startLogId = startLogData.id')
      .leftJoinAndMapOne(
        'startLogData.placeData',
        PlaceEntity,
        'startPlaceData',
        'startLogData.placeId = startPlaceData.id',
      )
      .leftJoinAndMapOne('tour.stopLogData', LogEntity, 'stopLogData', 'tour.stopLogId = stopLogData.id')
      .leftJoinAndMapOne(
        'stopLogData.placeData',
        PlaceEntity,
        'stopPlaceData',
        'stopLogData.placeId = stopPlaceData.id',
      )
      .orderBy('tour.id', 'DESC')
      .getMany();
  }

  async getToursByManyIds(ids: number[]): Promise<TourEntity[]> {
    return await this.tourRepository.find({
      where: { id: In(ids) },
    });
  }

  async createSettlement(userId: string, data: TourCreateSettlementDto, toursData: TourEntity[]): Promise<TourMEntity> {
    let driveTime = '00:00:00';
    let workTime = '00:00:00';
    let distance = 0;
    let daysOnDuty = 0;
    let daysOffDuty = 0;
    let totalRefuel = 0;
    let burnedFuelComp = 0;
    let burnedFuelReal = 0;
    let avgWeight = 0;
    let numberOfLoads = 0;
    let expectedSalary = 0;
    let outgoings = 0;
    let maxDays = 0;
    let maxDaysTourId = 0;
    for (const tour of toursData) {
      driveTime = addTimes(driveTime, calcSecondsFromTime(tour.driveTime));
      workTime = addTimes(workTime, calcSecondsFromTime(tour.workTime));
      distance = distance + Number(tour.distance);
      daysOnDuty = daysOnDuty + Number(tour.daysOnDuty);
      daysOffDuty = daysOffDuty + Number(tour.daysOffDuty);
      totalRefuel = totalRefuel + Number(tour.totalRefuel);
      burnedFuelComp = burnedFuelComp + Number(tour.burnedFuelComp);
      burnedFuelReal = burnedFuelReal + Number(tour.burnedFuelReal);
      avgWeight = avgWeight + Number(tour.avgWeight);
      numberOfLoads = numberOfLoads + Number(tour.numberOfLoads);
      expectedSalary = expectedSalary + Number(tour.expectedSalary);
      outgoings = outgoings + Number(tour.outgoings);
      const totalDays = Number(tour.daysOnDuty) + Number(tour.daysOffDuty);
      if (totalDays > maxDays) {
        maxDays = totalDays;
        maxDaysTourId = tour.id;
      }
    }
    avgWeight = avgWeight / Number(toursData.length);
    const rest = data.amount - expectedSalary;
    const allDays = daysOnDuty + daysOffDuty;
    const restPerDay = rest / allDays;
    let controlSalaryValue = 0;

    for (const tour of toursData) {
      const tourSalary =
        Number(tour.expectedSalary) + (Number(tour.daysOnDuty) + Number(tour.daysOffDuty)) * restPerDay;
      await this.tourRepository.update({ id: tour.id }, { salary: tourSalary, status: tourStatusEnum.settled });
      controlSalaryValue = controlSalaryValue + tourSalary;
      tour.salary = tourSalary;
    }

    if (controlSalaryValue !== data.amount) {
      const foundTour = toursData.find((tour) => tour.id === maxDaysTourId);
      if (foundTour) {
        let tourSalary = Number(foundTour.salary);
        if (data.amount > controlSalaryValue) {
          tourSalary = tourSalary + (data.amount - controlSalaryValue);
        } else {
          tourSalary = tourSalary - (controlSalaryValue - data.amount);
        }
        await this.tourRepository.update({ id: maxDaysTourId }, { salary: tourSalary });
      }
    }

    return await this.tourMRepository.save({
      userId,
      toursId: data.toursId.sort((a, b) => a - b),
      month: data.month + '-01',
      driveTime,
      workTime,
      distance,
      daysOnDuty,
      daysOffDuty,
      totalRefuel,
      burnedFuelReal,
      burnedFuelComp,
      avgWeight,
      numberOfLoads,
      expectedSalary,
      salary: data.amount,
      outgoings,
      currency: data.currency,
    });
  }

  async getSettlements(userId: string, year: string): Promise<TourMEntity[]> {
    return await this.tourMRepository.find({
      where: { userId, month: Like(`${year}%`) },
    });
  }

  async getRouteById(userId: string, id: number): Promise<TourInterface> {
    const tour = await this.tourRepository
      .createQueryBuilder('tour')
      .where('(tour.userId = :userId) AND (tour.id = :id)', {
        userId,
        id,
      })
      .leftJoinAndMapOne('tour.startLogData', LogEntity, 'startLogData', 'tour.startLogId = startLogData.id')
      .leftJoinAndMapOne(
        'startLogData.placeData',
        PlaceEntity,
        'startPlaceData',
        'startLogData.placeId = startPlaceData.id',
      )
      .leftJoinAndMapOne('tour.stopLogData', LogEntity, 'stopLogData', 'tour.stopLogId = stopLogData.id')
      .leftJoinAndMapOne(
        'stopLogData.placeData',
        PlaceEntity,
        'stopPlaceData',
        'stopLogData.placeId = stopPlaceData.id',
      )
      .getOne();
    if (!tour) {
      throw new NotFoundException('');
    }
    return tour;
  }

  async addDistance(id: number, userId: string, value: number): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    if (tour) {
      await this.tourRepository.update({ id: tour.id }, { distance: Number(tour.distance) + Number(value) });
    }
  }

  async addTimesAndFuel(id: number, userId: string, driveTime: number, workTime: number, fuel: number): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const newDriveTime = addTimes(tour.driveTime, driveTime);
    const newWorkTime = addTimes(tour.workTime, workTime);
    const newFuel = Number(fuel) + Number(tour.burnedFuelComp);
    await this.tourRepository.update(
      { id: tour.id },
      { driveTime: newDriveTime, workTime: newWorkTime, burnedFuelComp: newFuel },
    );
  }

  async addRefuel(id: number, userId: string, value: number): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const totalRefuel = Number(tour.totalRefuel) + Number(value);
    await this.tourRepository.update({ id: tour.id }, { totalRefuel });
  }

  async addLoading(id: number, userId: string, weight: number): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const numberOfLoads = Number(tour.numberOfLoads) + 1;
    const avgWeight = Math.round((Number(tour.avgWeight) + Number(weight)) / 2);
    await this.tourRepository.update({ id: tour.id }, { numberOfLoads, avgWeight });
  }

  async calcDaysOnDuty(id: number, userId: string): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const daysOnDuty = calculateDaysFromTime(tour.workTime);
    await this.tourRepository.update({ id, userId }, { daysOnDuty });
  }

  async calcExpectedSalary(id: number, userId: string, userBid: number, userBidType: userBidTypeEnum): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const expectedSalary = calculateSalary(userBid, userBidType, tour.distance, tour.daysOnDuty + tour.daysOffDuty);
    await this.tourRepository.update({ id: tour.id }, { expectedSalary });
  }
}
