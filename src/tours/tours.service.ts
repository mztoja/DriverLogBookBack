import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Not, Repository } from 'typeorm';
import { TourEntity } from './tour.entity';
import {
  logTypeEnum,
  TourInterface,
  TourNumbersInterface,
  TourSettleGeneratorInterface,
  tourStatusEnum,
  userBidTypeEnum,
  userLangEnum,
} from '../types';
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
import { TourEditDto } from './dto/tour-edit.dto';
import { TourSimpleEditDto } from './dto/tour-simple-edit.dto';
import { PlacesService } from '../places/places.service';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(TourEntity) private tourRepository: Repository<TourEntity>,
    @InjectRepository(TourMEntity) private tourMRepository: Repository<TourMEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
    @Inject(forwardRef(() => DaysService)) private daysService: DaysService,
    @Inject(forwardRef(() => FinancesService)) private financesService: FinancesService,
    @Inject(forwardRef(() => LoadsService)) private loadsService: LoadsService,
    @Inject(forwardRef(() => PlacesService)) private placesService: PlacesService,
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

  async getAllDaysTime(id: number): Promise<string> {
    const tour = await this.tourRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException();
    }
    const startLog = await this.logsService.find(tour.startLogId);
    const stopLog = await this.logsService.find(tour.stopLogId);
    if (!startLog || !stopLog) {
      throw new NotFoundException();
    }
    return subtractDatesToTime(stopLog.date, startLog.date);
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

  async addOutgoings(id: number, userId: string, value: number): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const outgoings = Number(tour.outgoings) + Number(value);
    await this.tourRepository.update({ id: tour.id }, { outgoings });
  }

  async addLoading(id: number, userId: string, weight: number): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const numberOfLoads = Number(tour.numberOfLoads) + 1;
    const avgWeight = Math.round((Number(tour.avgWeight) + Number(weight)) / 2);
    await this.tourRepository.update({ id: tour.id }, { numberOfLoads, avgWeight });
  }

  async editAvgWeight(id: number, value: number): Promise<void> {
    await this.tourRepository.update({ id }, { avgWeight: value });
  }

  async calcDaysOnDuty(id: number, userId: string): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    let daysOffDuty = 0;
    const daysOnDuty = calculateDaysFromTime(tour.workTime);
    if (tour.status !== tourStatusEnum.started) {
      const allDaysTime = await this.getAllDaysTime(tour.id);
      const allDays = calculateDaysFromTime(allDaysTime);
      daysOffDuty = allDays - daysOnDuty;
    }
    await this.tourRepository.update({ id, userId }, { daysOnDuty, daysOffDuty });
  }

  async calcExpectedSalary(id: number, userId: string, userBid: number, userBidType: userBidTypeEnum): Promise<void> {
    const tour = await this.tourRepository.findOne({ where: { id, userId } });
    const expectedSalary = calculateSalary(userBid, userBidType, tour.distance, tour.daysOnDuty + tour.daysOffDuty);
    await this.tourRepository.update({ id: tour.id }, { expectedSalary });
  }

  async edit(data: TourEditDto, user: UserEntity): Promise<TourEntity> {
    const oldTour = await this.tourRepository.findOne({ where: { id: data.id, userId: user.id } });
    if (!oldTour) {
      throw new BadRequestException();
    }
    if (oldTour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }

    const oldStartLog = await this.logsService.find(data.startData.id);
    const oldStopLog = data.stopData.id === 0 ? null : await this.logsService.find(data.stopData.id);
    const startLog = await this.logsService.edit(data.startData, user.id);
    const stopLog = data.stopData.id === 0 ? null : await this.logsService.edit(data.stopData, user.id);
    let distance: number = Number(oldTour.distance);
    if (oldStartLog) {
      const diff = Number(oldStartLog.odometer - startLog.odometer);
      distance = distance + diff;
    }
    if (oldStopLog) {
      const diff = Number(oldStopLog.odometer - stopLog.odometer);
      distance = distance - diff;
    }

    const allDaysTime = subtractDatesToTime(stopLog.date, startLog.date);
    const allDays = calculateDaysFromTime(allDaysTime);
    const daysOnDuty = calculateDaysFromTime(oldTour.workTime);
    const daysOffDuty = allDays - daysOnDuty;

    const fuelStartDiff = oldTour.fuelStateAfter - Number(data.fuelStateAfter);
    const fuelStopDiff = oldTour.fuelStateBefore - Number(data.fuelStateBefore);
    const fuel = oldTour.burnedFuelReal - fuelStartDiff + fuelStopDiff;
    await this.tourRepository.update(
      { id: oldTour.id },
      {
        burnedFuelReal: fuel,
        daysOffDuty,
        distance,
        fuelStateBefore: data.fuelStateBefore,
        fuelStateAfter: data.fuelStateAfter,
        expectedSalary: data.expectedSalary,
        currency: data.currency,
        tourNr: data.tourNr,
      },
    );
    return await this.tourRepository.findOne({ where: { id: oldTour.id } });
  }

  async simpleEdit(data: TourSimpleEditDto, user: UserEntity): Promise<TourEntity> {
    const oldTour = await this.tourRepository.findOne({ where: { id: data.id, userId: user.id } });
    if (!oldTour) {
      throw new BadRequestException();
    }
    if (oldTour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }

    const oldStartLog = await this.logsService.find(data.startData.id);
    const startLog = await this.logsService.edit(data.startData, user.id);
    let distance: number = Number(oldTour.distance);
    if (oldStartLog) {
      const diff = Number(oldStartLog.odometer - startLog.odometer);
      distance = distance + diff;
    }

    const fuelStartDiff = oldTour.fuelStateAfter - Number(data.fuelStateAfter);
    const fuel = oldTour.burnedFuelReal - fuelStartDiff;
    await this.tourRepository.update(
      { id: oldTour.id },
      {
        burnedFuelReal: fuel,
        distance,
        fuelStateBefore: data.fuelStateBefore,
        fuelStateAfter: data.fuelStateAfter,
        expectedSalary: data.expectedSalary,
        currency: data.currency,
        tourNr: data.tourNr,
      },
    );
    return await this.tourRepository.findOne({ where: { id: oldTour.id } });
  }

  async getRouteByLogId(userId: string, logId: number): Promise<TourInterface> {
    const tour = await this.tourRepository
      .createQueryBuilder('tour')
      .where('(tour.userId = :userId) AND (tour.startLogId = :logId OR tour.stopLogId = :logId)', {
        userId,
        logId,
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

  async generateTourSettlement(user: UserEntity, id: number): Promise<TourSettleGeneratorInterface> {
    const tour = await this.tourRepository.findOne({ where: { id } });
    const startLog = await this.logsService.find(tour.startLogId);
    const stopLog = await this.logsService.find(tour.stopLogId);
    const emptyTxt = user.lang === userLangEnum.pl ? 'na pusto' : 'empty';

    const formatDate = (dateString: string): string => {
      if (dateString.length < 1) return '';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    const formatTime = (dateString: string): string => {
      if (dateString.length < 1) return '';
      const date = new Date(dateString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    const separator = (number: number): string => {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    if (!tour || !startLog || !stopLog) {
      throw new NotFoundException('');
    }

    const trailers = await this.logsService.getTrailersListByTourId(user.id, tour.id);
    const loads = await this.loadsService.getLoadsByTour(user.id, tour.id);
    const destinationCitySet = new Set<string>();
    const base = await this.placesService.getOne(user.id, user.companyId);
    loads.map((load) => {
      if (load.unloadingLogData.placeData) {
        const entry =
          load.unloadingLogData.placeData.country === base.country
            ? load.unloadingLogData.placeData.city
            : `${load.unloadingLogData.placeData.city}(${load.unloadingLogData.placeData.country})`;
        if (!destinationCitySet.has(entry)) {
          destinationCitySet.add(entry);
        }
      }
    });

    for (const item of destinationCitySet) {
      if (item.includes(base.city)) {
        destinationCitySet.delete(item);
      }
    }

    const refNumbersSet = new Set<string>();
    loads.map((load) => {
      if (load.reference.length > 1) {
        refNumbersSet.add(load.reference);
      }
    });
    const refNumbers = Array.from(refNumbersSet).reverse();

    const outgoings = await this.financesService.getByTourId(user.id, tour.id);
    const expencesSet = new Set<string>();
    const refuelSet = new Set<string[]>();
    outgoings.map((v) => {
      if (v.quantity <= 1) {
        if (v.foreignAmount > 0) {
          expencesSet.add(
            `${v.itemDescription} - ${v.foreignAmount + v.foreignCurrency} / ${v.amount + v.currency} (${v.payment})`,
          );
        } else {
          expencesSet.add(`${v.itemDescription} - ${v.amount + v.currency} (${v.payment})`);
        }
      }
      if ((v.logData) && (v.logData.type === logTypeEnum.refuelDiesel)) {
        refuelSet.add([
          v.logData.date,
          v.logData.placeData
            ? v.logData.placeData.city
            : v.logData.place === null ? '' : v.logData.place,
          v.logData.odometer.toString(),
          v.quantity.toString(),
        ]);
      }
    });
    const expences = Array.from(expencesSet).reverse();
    const refuels = Array.from(refuelSet).reverse();

    const logs = await this.logsService.getByTourId(user.id, id);
    interface Route {
      startCity: string;
      startDate: string;
      startOdometer: number;
      borderDate: string;
      borderPlace: string;
      stopCity: string;
      stopDate: string;
      stopOdometer: number;
      customer: string;
    }
    const routesSet = new Set<Route>();
    let nextRoute: Route | null = null;
    const startData = logs.find((v) => v.id === startLog.id);
    nextRoute = {
      startCity: startData.placeData ? `${startData.placeData.city} (${startData.placeData.name})` : startData.place,
      startDate: startData.date,
      startOdometer: startData.odometer,
      borderDate: '',
      borderPlace: '',
      stopCity: '',
      stopDate: '',
      stopOdometer: 0,
      customer: emptyTxt,
    };
    const routeLogs = logs.filter((v) => v.type === logTypeEnum.finishLoading || v.type === logTypeEnum.finishUnloading).reverse();
    routeLogs.map((log, index) => {
      nextRoute.stopCity = log.placeData ? `${log.placeData.city} (${log.placeData.name})` : log.place;
      nextRoute.stopDate = log.date;
      nextRoute.stopOdometer = log.odometer;
      //const arriveEnum = log.type === logTypeEnum.finishLoading ? logTypeEnum.arrivedToLoading : logTypeEnum.arrivedToUnloading;
      if (routeLogs[index - 1]) {
        nextRoute.customer = routeLogs[index - 1].type === logTypeEnum.finishLoading ? user.customer : emptyTxt;
        const borders = logs.filter((v) => v.type === logTypeEnum.crossBorder && v.id > routeLogs[index - 1].id && v.id < log.id);
        if (borders.length > 0) {
          const borderEntry = borders.find((v) => v.action.includes(user.country));
          nextRoute.borderDate = borderEntry.date ? borderEntry.date : '';
          nextRoute.borderPlace = borderEntry.place ? borderEntry.place : '';
        }
        const arrive = logs.find((v) => ((v.type === logTypeEnum.arrivedToLoading || v.type === logTypeEnum.arrivedToUnloading) && v.id > routeLogs[index - 1].id && v.id < log.id));
        if (arrive) {
          nextRoute.stopCity = arrive.placeData ? `${arrive.placeData.city} (${arrive.placeData.name})` : arrive.place;
          nextRoute.stopDate = arrive.date;
          nextRoute.stopOdometer = arrive.odometer;
        }
      } else {
        const borders = logs.filter((v) => v.type === logTypeEnum.crossBorder && v.id > startData.id && v.id < log.id);
        if (borders.length > 0) {
          const borderEntry = borders.find((v) => v.action.includes(user.country));
          nextRoute.borderDate = borderEntry.date ? borderEntry.date : '';
          nextRoute.borderPlace = borderEntry.place ? borderEntry.place : '';
        }
        const arrive = logs.find((v) => ((v.type === logTypeEnum.arrivedToLoading || v.type === logTypeEnum.arrivedToUnloading) && v.id > startData.id && v.id < log.id));
        if (arrive) {
          nextRoute.stopCity = arrive.placeData ? `${arrive.placeData.city} (${arrive.placeData.name})` : arrive.place;
          nextRoute.stopDate = arrive.date;
          nextRoute.stopOdometer = arrive.odometer;
        }
      }
      routesSet.add(nextRoute);
      nextRoute = {
        startCity: log.placeData ? `${log.placeData.city} (${log.placeData.name})` : log.place,
        startDate: log.date,
        startOdometer: log.odometer,
        borderDate: '',
        borderPlace: '',
        stopCity: '',
        stopDate: '',
        stopOdometer: 0,
        customer: '',
      };
    });
    const stopData = logs.find((v) => v.id === stopLog.id);
    nextRoute.stopCity = stopData.placeData ? `${stopData.placeData.city} (${stopData.placeData.name})` : stopData.place;
    nextRoute.stopDate = stopData.date;
    nextRoute.stopOdometer = stopData.odometer;
    if (routeLogs[routeLogs.length - 1]) {
      nextRoute.customer = routeLogs[routeLogs.length - 1].type === logTypeEnum.finishLoading ? user.customer : emptyTxt;
    }
    routesSet.add(nextRoute);
    const routes = Array.from(routesSet);


    return {
      name1: `${user.firstName} ${user.lastName}`,
      name2: '',
      destonationCity: `${Array.from(destinationCitySet).reverse().join(', ')}`,
      truck: `${tour.truck}`,
      trailer: `${trailers.reverse().join(', ')}`,
      departureDate: `${formatDate(startLog.date)}`,
      returnDate: `${formatDate(stopLog.date)}`,
      departureTime: `${formatTime(startLog.date)}`,
      returnTime: `${formatTime(stopLog.date)}`,
      departureOdometer: `${separator(startLog.odometer)}`,
      returnOdometer: `${separator(stopLog.odometer)}`,
      distance: `${separator(tour.distance)} km`,
      sci1: `${refNumbers[0] ?? ''}`,
      sci2: `${refNumbers[1] ?? ''}`,
      sci3: `${refNumbers[2] ?? ''}`,
      sci4: `${refNumbers[3] ?? ''}`,
      sci5: `${refNumbers[4] ?? ''}`,
      sci6: `${refNumbers[5] ?? ''}`,
      fuelConsumption: `${((Number(tour.burnedFuelReal) / Number(tour.distance)) * 100).toFixed(1)}`,
      fuelBefore: `${separator(tour.fuelStateBefore)}`,
      fuelAfter: `${separator(tour.fuelStateAfter)}`,
      routeNr: `${tour.tourNr}`,
      fuel1Date: `${refuels[0] ? formatDate(refuels[0][0]) : ''}`,
      fuel1City: `${refuels[0] ? refuels[0][1] : ''}`,
      fuel1Odometer: `${refuels[0] ? separator(Number(refuels[0][2])) + ' km' : ''}`,
      fuel1Value: `${refuels[0] ? Number(refuels[0][3]).toFixed(2) + ' l' : ''}`,
      fuel2Date: `${refuels[1] ? formatDate(refuels[1][0]) : ''}`,
      fuel2City: `${refuels[1] ? refuels[1][1] : ''}`,
      fuel2Odometer: `${refuels[1] ? separator(Number(refuels[1][2])) + ' km' : ''}`,
      fuel2Value: `${refuels[1] ? Number(refuels[1][3]).toFixed(2) + ' l' : ''}`,
      fuel3Date: `${refuels[2] ? formatDate(refuels[2][0]) : ''}`,
      fuel3City: `${refuels[2] ? refuels[2][1] : ''}`,
      fuel3Odometer: `${refuels[2] ? separator(Number(refuels[2][2])) + ' km' : ''}`,
      fuel3Value: `${refuels[2] ? Number(refuels[2][3]).toFixed(2) + ' l' : ''}`,
      expence1: `${expences[0] ?? ''}`,
      expence2: `${expences[1] ?? ''}`,
      expence3: `${expences[2] ?? ''}`,
      expence4: `${expences[3] ?? ''}`,
      expence5: `${expences[4] ?? ''}`,
      expence6: `${expences[5] ?? ''}`,
      expence7: `${expences[6] ?? ''}`,
      expence8: `${expences[7] ?? ''}`,
      expence9: `${expences[8] ?? ''}`,
      expence10: `${expences[9] ?? ''}`,
      expence11: `${expences[10] ?? ''}`,
      expence12: `${expences[11] ?? ''}`,
      startCity1: `${routes[0] ? routes[0].startCity : ''}`,
      startCity2: `${routes[1] ? routes[1].startCity : ''}`,
      startCity3: `${routes[2] ? routes[2].startCity : ''}`,
      startCity4: `${routes[3] ? routes[3].startCity : ''}`,
      startCity5: `${routes[4] ? routes[4].startCity : ''}`,
      startCity6: `${routes[5] ? routes[5].startCity : ''}`,
      startCity7: `${routes[6] ? routes[6].startCity : ''}`,
      startCity8: `${routes[7] ? routes[7].startCity : ''}`,
      startCity9: `${routes[8] ? routes[8].startCity : ''}`,
      startCity10: `${routes[9] ? routes[9].startCity : ''}`,
      stopCity1: `${routes[0] ? routes[0].stopCity : ''}`,
      stopCity2: `${routes[1] ? routes[1].stopCity : ''}`,
      stopCity3: `${routes[2] ? routes[2].stopCity : ''}`,
      stopCity4: `${routes[3] ? routes[3].stopCity : ''}`,
      stopCity5: `${routes[4] ? routes[4].stopCity : ''}`,
      stopCity6: `${routes[5] ? routes[5].stopCity : ''}`,
      stopCity7: `${routes[6] ? routes[6].stopCity : ''}`,
      stopCity8: `${routes[7] ? routes[7].stopCity : ''}`,
      stopCity9: `${routes[8] ? routes[8].stopCity : ''}`,
      stopCity10: `${routes[9] ? routes[9].stopCity : ''}`,
      distance1: `${routes[0] ? separator(routes[0].stopOdometer - routes[0].startOdometer) : ''}`,
      distance2: `${routes[1] ? separator(routes[1].stopOdometer - routes[1].startOdometer) : ''}`,
      distance3: `${routes[2] ? separator(routes[2].stopOdometer - routes[2].startOdometer) : ''}`,
      distance4: `${routes[3] ? separator(routes[3].stopOdometer - routes[3].startOdometer) : ''}`,
      distance5: `${routes[4] ? separator(routes[4].stopOdometer - routes[4].startOdometer) : ''}`,
      distance6: `${routes[5] ? separator(routes[5].stopOdometer - routes[5].startOdometer) : ''}`,
      distance7: `${routes[6] ? separator(routes[6].stopOdometer - routes[6].startOdometer) : ''}`,
      distance8: `${routes[7] ? separator(routes[7].stopOdometer - routes[7].startOdometer) : ''}`,
      distance9: `${routes[8] ? separator(routes[8].stopOdometer - routes[8].startOdometer) : ''}`,
      distance10: `${routes[9] ? separator(routes[9].stopOdometer - routes[9].startOdometer) : ''}`,
      customer1: `${routes[0] ? routes[0].customer : ''}`,
      customer2: `${routes[1] ? routes[1].customer : ''}`,
      customer3: `${routes[2] ? routes[2].customer : ''}`,
      customer4: `${routes[3] ? routes[3].customer : ''}`,
      customer5: `${routes[4] ? routes[4].customer : ''}`,
      customer6: `${routes[5] ? routes[5].customer : ''}`,
      customer7: `${routes[6] ? routes[6].customer : ''}`,
      customer8: `${routes[7] ? routes[7].customer : ''}`,
      customer9: `${routes[8] ? routes[8].customer : ''}`,
      customer10: `${routes[9] ? routes[9].customer : ''}`,
      startData1: `${routes[0] ? formatDate(routes[0].startDate) + ' ' + formatTime(routes[0].startDate) : ''}`,
      startOdometer1: `${routes[0] ? separator(routes[0].startOdometer) + ' km' : ''}`,
      borderDate1: `${routes[0] ? formatDate(routes[0].borderDate) + ' ' + formatTime(routes[0].borderDate) : ''}`,
      borderPlace1: `${routes[0] ? routes[0].borderPlace : ''}`,
      stopData1: `${routes[0] ? formatDate(routes[0].stopDate) + ' ' + formatTime(routes[0].stopDate) : ''}`,
      stopOdometer1: `${routes[0] ? separator(routes[0].stopOdometer) + ' km' : ''}`,
      startData2: `${routes[1] ? formatDate(routes[1].startDate) + ' ' + formatTime(routes[1].startDate) : ''}`,
      startOdometer2: `${routes[1] ? separator(routes[1].startOdometer) + ' km' : ''}`,
      borderDate2: `${routes[1] ? formatDate(routes[1].borderDate) + ' ' + formatTime(routes[1].borderDate) : ''}`,
      borderPlace2: `${routes[1] ? routes[1].borderPlace : ''}`,
      stopData2: `${routes[1] ? formatDate(routes[1].stopDate) + ' ' + formatTime(routes[1].stopDate) : ''}`,
      stopOdometer2: `${routes[1] ? separator(routes[1].stopOdometer) + ' km' : ''}`,
      startData3: `${routes[2] ? formatDate(routes[2].startDate) + ' ' + formatTime(routes[2].startDate) : ''}`,
      startOdometer3: `${routes[2] ? separator(routes[2].startOdometer) + ' km' : ''}`,
      borderDate3: `${routes[2] ? formatDate(routes[2].borderDate) + ' ' + formatTime(routes[2].borderDate) : ''}`,
      borderPlace3: `${routes[2] ? routes[2].borderPlace : ''}`,
      stopData3: `${routes[2] ? formatDate(routes[2].stopDate) + ' ' + formatTime(routes[2].stopDate) : ''}`,
      stopOdometer3: `${routes[2] ? separator(routes[2].stopOdometer) + ' km' : ''}`,
      startData4: `${routes[3] ? formatDate(routes[3].startDate) + ' ' + formatTime(routes[3].startDate) : ''}`,
      startOdometer4: `${routes[3] ? separator(routes[3].startOdometer) + ' km' : ''}`,
      borderDate4: `${routes[3] ? formatDate(routes[3].borderDate) + ' ' + formatTime(routes[3].borderDate) : ''}`,
      borderPlace4: `${routes[3] ? routes[3].borderPlace : ''}`,
      stopData4: `${routes[3] ? formatDate(routes[3].stopDate) + ' ' + formatTime(routes[3].stopDate) : ''}`,
      stopOdometer4: `${routes[3] ? separator(routes[3].stopOdometer) + ' km' : ''}`,
      startData5: `${routes[4] ? formatDate(routes[4].startDate) + ' ' + formatTime(routes[4].startDate) : ''}`,
      startOdometer5: `${routes[4] ? separator(routes[4].startOdometer) + ' km' : ''}`,
      borderDate5: `${routes[4] ? formatDate(routes[4].borderDate) + ' ' + formatTime(routes[4].borderDate) : ''}`,
      borderPlace5: `${routes[4] ? routes[4].borderPlace : ''}`,
      stopData5: `${routes[4] ? formatDate(routes[4].stopDate) + ' ' + formatTime(routes[4].stopDate) : ''}`,
      stopOdometer5: `${routes[4] ? separator(routes[4].stopOdometer) + ' km' : ''}`,
      startData6: `${routes[5] ? formatDate(routes[5].startDate) + ' ' + formatTime(routes[5].startDate) : ''}`,
      startOdometer6: `${routes[5] ? separator(routes[5].startOdometer) + ' km' : ''}`,
      borderDate6: `${routes[5] ? formatDate(routes[5].borderDate) + ' ' + formatTime(routes[5].borderDate) : ''}`,
      borderPlace6: `${routes[5] ? routes[5].borderPlace : ''}`,
      stopData6: `${routes[5] ? formatDate(routes[5].stopDate) + ' ' + formatTime(routes[5].stopDate) : ''}`,
      stopOdometer6: `${routes[5] ? separator(routes[5].stopOdometer) + ' km' : ''}`,
      startData7: `${routes[6] ? formatDate(routes[6].startDate) + ' ' + formatTime(routes[6].startDate) : ''}`,
      startOdometer7: `${routes[6] ? separator(routes[6].startOdometer) + ' km' : ''}`,
      borderDate7: `${routes[6] ? formatDate(routes[6].borderDate) + ' ' + formatTime(routes[6].borderDate) : ''}`,
      borderPlace7: `${routes[6] ? routes[6].borderPlace : ''}`,
      stopData7: `${routes[6] ? formatDate(routes[6].stopDate) + ' ' + formatTime(routes[6].stopDate) : ''}`,
      stopOdometer7: `${routes[6] ? separator(routes[6].stopOdometer) + ' km' : ''}`,
      startData8: `${routes[7] ? formatDate(routes[7].startDate) + ' ' + formatTime(routes[7].startDate) : ''}`,
      startOdometer8: `${routes[7] ? separator(routes[7].startOdometer) + ' km' : ''}`,
      borderDate8: `${routes[7] ? formatDate(routes[7].borderDate) + ' ' + formatTime(routes[7].borderDate) : ''}`,
      borderPlace8: `${routes[7] ? routes[7].borderPlace : ''}`,
      stopData8: `${routes[7] ? formatDate(routes[7].stopDate) + ' ' + formatTime(routes[7].stopDate) : ''}`,
      stopOdometer8: `${routes[7] ? separator(routes[7].stopOdometer) + ' km' : ''}`,
      startData9: `${routes[8] ? formatDate(routes[8].startDate) + ' ' + formatTime(routes[8].startDate) : ''}`,
      startOdometer9: `${routes[8] ? separator(routes[8].startOdometer) + ' km' : ''}`,
      borderDate9: `${routes[8] ? formatDate(routes[8].borderDate) + ' ' + formatTime(routes[8].borderDate) : ''}`,
      borderPlace9: `${routes[8] ? routes[8].borderPlace : ''}`,
      stopData9: `${routes[8] ? formatDate(routes[8].stopDate) + ' ' + formatTime(routes[8].stopDate) : ''}`,
      stopOdometer9: `${routes[8] ? separator(routes[8].stopOdometer) + ' km' : ''}`,
      startData10: `${routes[9] ? formatDate(routes[9].startDate) + ' ' + formatTime(routes[9].startDate) : ''}`,
      startOdometer10: `${routes[9] ? separator(routes[9].startOdometer) + ' km' : ''}`,
      borderDate10: `${routes[9] ? formatDate(routes[9].borderDate) + ' ' + formatTime(routes[9].borderDate) : ''}`,
      borderPlace10: `${routes[9] ? routes[9].borderPlace : ''}`,
      stopData10: `${routes[9] ? formatDate(routes[9].stopDate) + ' ' + formatTime(routes[9].stopDate) : ''}`,
      stopOdometer10: `${routes[9] ? separator(routes[9].stopOdometer) + ' km' : ''}`,
      refueled: `${separator(tour.totalRefuel)}`,
      stops: '',
      other: '',
    };
  }
}
