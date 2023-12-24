import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceEntity } from './finance.entity';
import { FinanceCreateDto } from './dto/finance-create.dto';
import { LogsService } from '../logs/logs.service';
import { LogCreateDto } from '../logs/dto/log-create.dto';
import { ExpenseEnum, logTypeEnum } from '../types';

@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(FinanceEntity)
    private dayRepository: Repository<FinanceEntity>,
    @Inject(LogsService)
    private logsService: LogsService,
  ) {}

  async create(
    userId: string,
    data: FinanceCreateDto,
    tourId: number,
  ): Promise<FinanceEntity> {
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
    const log = await this.logsService.create(
      logData,
      userId,
      tourId,
      expenseTypeToLogTypeMap[data.expenseType],
    );
    return await this.dayRepository.save({
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
}
