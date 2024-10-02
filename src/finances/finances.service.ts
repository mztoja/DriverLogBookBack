import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceEntity } from './finance.entity';
import { FinanceCreateDto } from './dto/finance-create.dto';
import { LogsService } from '../logs/logs.service';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { ExpenseEnum, FinanceInterface, FinanceRefuelValueRes, logTypeEnum, tourStatusEnum } from '../types';
import { LogEntity } from '../logs/log.entity';
import { FinanceListResponse } from '../types';
import { ToursService } from '../tours/tours.service';
import { FinanceEditDto } from './dto/finance-edit.dto';

@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(FinanceEntity) private financeRepository: Repository<FinanceEntity>,
    @Inject(forwardRef(() => LogsService)) private logsService: LogsService,
    @Inject(forwardRef(() => ToursService)) private toursService: ToursService,
  ) {}

  async create(userId: string, data: FinanceCreateDto, tourId: number): Promise<FinanceEntity> {
    const logData: LogCreateDto = {
      country: data.country,
      odometer: data.odometer,
      placeId: data.placeId,
      notes: data.notes,
      place: data.place,
      date: data.date,
      action: data.action,
    };
    const expenseTypeToLogTypeMap = {
      [ExpenseEnum.standard]: logTypeEnum.generalExpense,
      [ExpenseEnum.fuel]: logTypeEnum.refuelDiesel,
      [ExpenseEnum.def]: logTypeEnum.refuelAdblue,
    };
    const log = await this.logsService.create(logData, userId, tourId, expenseTypeToLogTypeMap[data.expenseType]);
    if (data.expenseType === ExpenseEnum.fuel) {
      await this.toursService.addRefuel(tourId, userId, data.expenseQuantity);
    }
    await this.toursService.addOutgoings(tourId, userId, data.expenseAmount);
    return await this.financeRepository.save({
      userId,
      tourId,
      logId: log.id,
      amount: data.expenseAmount,
      currency: data.expenseCurrency,
      foreignAmount: data.expenseForeignAmount,
      foreignCurrency: data.expenseForeignCurrency,
      itemDescription: data.expenseItemDescription,
      quantity: data.expenseQuantity,
      payment: data.payment,
    });
  }

  async edit(userId: string, data: FinanceEditDto): Promise<FinanceEntity> {
    const oldFinance = await this.financeRepository.findOne({ where: { id: data.id, userId } });
    if (!oldFinance) {
      throw new BadRequestException();
    }
    const tour = await this.toursService.getRouteById(userId, oldFinance.tourId);
    if (!tour || tour.status === tourStatusEnum.settled) {
      throw new BadRequestException('cannotEditSettledTourData');
    }
    const log = await this.logsService.edit(data.logData, userId);
    await this.financeRepository.update(
      { id: oldFinance.id },
      {
        payment: data.payment,
        quantity: data.quantity,
        amount: data.amount,
        itemDescription: data.itemDescription,
        currency: data.currency,
        foreignCurrency: data.foreignCurrency,
        foreignAmount: data.foreignAmount,
      },
    );
    const newFinance = await this.financeRepository.findOne({ where: { id: oldFinance.id } });
    if (log.type === logTypeEnum.refuelDiesel) {
      const diff = Number(newFinance.quantity) - Number(oldFinance.quantity);
      await this.toursService.addRefuel(tour.id, userId, diff);
    }
    const outgoingsDiff = Number(newFinance.amount) - Number(oldFinance.amount);
    await this.toursService.addOutgoings(tour.id, userId, outgoingsDiff);
    return newFinance;
  }

  async getByTourId(userId: string, tourId: number): Promise<FinanceInterface[]> {
    const query = await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.userId = :userId AND finance.tourId = :tourId', {
        userId,
        tourId,
      })
      .leftJoinAndMapOne('finance.logData', LogEntity, 'logId', 'finance.logId = logId.id')
      .orderBy('finance.id', 'DESC');
    return await query.getMany();
  }

  async getRefuelValueByTour(userId: string, tourId: number): Promise<FinanceRefuelValueRes> {
    const finances = await this.getByTourId(userId, tourId);
    const refuels = finances.filter((finance) => finance.logData.type === logTypeEnum.refuelDiesel);
    if (!refuels || refuels.length === 0) {
      return { refuelValue: 0 };
    }
    const refuelValue = refuels.reduce((totalFuel, refuel) => totalFuel + Number(refuel.quantity), 0);
    return { refuelValue };
  }

  async getOutgoingsByTour(userId: string, tourId: number): Promise<number> {
    const finances = await this.getByTourId(userId, tourId);
    return finances.reduce((sum, finance) => sum + Number(finance.amount), 0);
  }

  async get(userId: string, page: string, perPage: string): Promise<FinanceListResponse> {
    const query = await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.userId = :userId', {
        userId,
      })
      .leftJoinAndMapOne('finance.logData', LogEntity, 'logId', 'finance.logId = logId.id')
      .orderBy('logId.date', 'DESC')
      .skip((Number(page) - 1) * Number(perPage))
      .take(Number(perPage));
    const [items, totalItems] = await query.getManyAndCount();
    return { items, totalItems };
  }

  async getByLogId(userId: string, logId: number): Promise<FinanceInterface> {
    return await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.userId = :userId AND finance.logId = :logId', {
        userId,
        logId,
      })
      .leftJoinAndMapOne('finance.logData', LogEntity, 'logId', 'finance.logId = logId.id')
      .getOne();
  }
}
