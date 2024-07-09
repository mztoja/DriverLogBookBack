import { LogEditDto } from '../../logs/dto/log-edit.dto';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class FinanceEditDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  logData: LogEditDto;
  @IsString()
  @IsNotEmpty({ message: 'expenseDescriptionEmpty' })
  itemDescription: string;
  @IsNumber()
  quantity: number;
  @IsNumber()
  amount: number;
  @IsString()
  currency: string;
  @IsNumber()
  foreignAmount: number;
  @IsString()
  foreignCurrency: string;
  @IsString()
  payment: string;
}
