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
        burnedFuelReal: Number(activeRoute.fuelStateBefore) + Number(totalRefuel) - Number(data.fuelStateAfter),
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
    const avgWeight = numberOfLoads === 1
      ? Math.round(Number(weight))
      : Math.round((Number(tour.avgWeight) + Number(weight)) / 2);
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

    const logs = await this.logsService.getByTourId(user.id, id);

    const outgoings = await this.financesService.getByTourId(user.id, tour.id);
    const expences = [];
    const refuelSet = new Set<string[]>();
    outgoings.map((v) => {
      if (v.quantity <= 1) {
        if (v.foreignAmount > 0) {
          expences.push(
            `${v.itemDescription} - ${v.foreignAmount + v.foreignCurrency} / ${v.amount + v.currency} (${v.payment})`,
          );
        } else {
          expences.push(`${v.itemDescription} - ${v.amount + v.currency} (${v.payment})`);
        }
      }
      if ((v.logData) && (v.logData.type === logTypeEnum.refuelDiesel)) {
        // finances.getByTourId nie dołącza logData.placeData – nazwę miejsca bierzemy z `logs`
        // (tam placeData jest zjoinowane). Format: „Miejscowość - Nazwa".
        const refuelLog = logs.find((l) => l.id === v.logData.id);
        const placeData = refuelLog ? refuelLog.placeData : null;
        refuelSet.add([
          v.logData.date,
          placeData
            ? `${placeData.city} (${placeData.name})`
            : v.logData.place === null ? '' : v.logData.place,
          v.logData.odometer.toString(),
          v.quantity.toString(),
        ]);
      }
    });
    const refuels = Array.from(refuelSet).reverse();
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
        if (routeLogs[index - 1].type === logTypeEnum.finishLoading) {
          const loadedHere = loads.filter((l) => l.loadingLogId === routeLogs[index - 1].id);
          nextRoute.customer = loadedHere.length
            ? loadedHere.map((l) => l.description).join(', ')
            : emptyTxt;
        } else {
          nextRoute.customer = emptyTxt;
        }
        const borders = logs.filter((v) => v.type === logTypeEnum.crossBorder && v.id > routeLogs[index - 1].id && v.id < log.id);
        if (borders.length > 0) {
          const borderEntry = borders.find((v) => v.action.includes(user.country));
          if (borderEntry) {
          nextRoute.borderDate = borderEntry.date ? borderEntry.date : '';
          nextRoute.borderPlace = borderEntry.place ? borderEntry.place : '';
          } else {
            nextRoute.borderDate = borders[0].date ? borders[0].date : '';
            nextRoute.borderPlace = borders[0].place ? borders[0].place : '';
          }
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
    // Ostatni odcinek (od ostatniego załadunku/rozładunku – lub od startu trasy, gdy jechano bez ładunku –
    // do końca trasy) też musi mieć wyszukane przejście granicy.
    const finalLowerId = routeLogs.length ? routeLogs[routeLogs.length - 1].id : startData.id;
    const finalBorders = logs.filter(
      (v) => v.type === logTypeEnum.crossBorder && v.id > finalLowerId && v.id < stopLog.id,
    );
    if (finalBorders.length > 0) {
      const borderEntry = finalBorders.find((v) => v.action.includes(user.country));
      const chosen = borderEntry ? borderEntry : finalBorders[0];
      nextRoute.borderDate = chosen.date ? chosen.date : '';
      nextRoute.borderPlace = chosen.place ? chosen.place : '';
    }
    if (routeLogs[routeLogs.length - 1]) {
      const lastRouteLog = routeLogs[routeLogs.length - 1];
      if (lastRouteLog.type === logTypeEnum.finishLoading) {
        const loadedHere = loads.filter((l) => l.loadingLogId === lastRouteLog.id);
        nextRoute.customer = loadedHere.length
          ? loadedHere.map((l) => l.description).join(', ')
          : emptyTxt;
      } else {
        nextRoute.customer = emptyTxt;
      }
    }
    routesSet.add(nextRoute);
    const routes = Array.from(routesSet).filter(route =>
      (route.stopOdometer - route.startOdometer !== 0) && (route.startCity !== route.stopCity)
    );




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
      routes: routes.map((r) => ({
        startCity: r.startCity,
        startData: formatDate(r.startDate) + ' ' + formatTime(r.startDate),
        startOdometer: separator(r.startOdometer) + ' km',
        borderDate: formatDate(r.borderDate) + ' ' + formatTime(r.borderDate),
        borderPlace: r.borderPlace,
        stopCity: r.stopCity,
        stopData: formatDate(r.stopDate) + ' ' + formatTime(r.stopDate),
        stopOdometer: separator(r.stopOdometer) + ' km',
        distance: separator(r.stopOdometer - r.startOdometer),
        customer: r.customer,
      })),
      refueled: `${separator(tour.totalRefuel)}`,
      stops: '',
      other: '',
    };
  }

  async deleteMonthlySettlement(userId: string, id: number): Promise<TourEntity[]> {
    const settlement = await this.tourMRepository.findOne({ where: { id, userId } });
    if (!settlement) {
      throw new NotFoundException();
    }
    const routes: TourEntity[] = [];
    for (const tourId of settlement.toursId) {
      const route = await this.tourRepository.findOne({ where: { id: tourId, userId } });
      if (route) {
        await this.tourRepository.update({ id: route.id }, { salary: 0, status: tourStatusEnum.finished });
        routes.push(route);
      }
    }
    await this.tourMRepository.delete({ id: settlement.id });
    return routes;
  }
}
