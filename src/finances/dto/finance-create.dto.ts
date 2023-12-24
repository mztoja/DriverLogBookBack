import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ExpenseEnum } from '../../types';

export class FinanceCreateDto extends LogCreateDto {
  @IsNumber()
  expenseAmount: number;
  @IsString()
  expenseCurrency: string;
  @IsNumber()
  expenseForeignAmount: number;
  @IsString()
  expenseForeignCurrency: string;
  @IsString()
  @IsNotEmpty({ message: 'expenseDescriptionEmpty' })
  expenseItemDescription: string;
  @IsNumber()
  expenseQuantity: number;
  @IsNumber()
  expenseUnitPrice: number;
  @IsString()
  payment: string;
  @IsEnum(ExpenseEnum, { message: 'InvalidExpenseType' })
  expenseType: ExpenseEnum;
}
