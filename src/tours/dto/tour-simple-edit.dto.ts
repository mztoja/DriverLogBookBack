import { IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { LogEditDto } from '../../logs/dto/log-edit.dto';

export class TourSimpleEditDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  startData: LogEditDto;
  @IsObject()
  stopData: LogEditDto;
  @IsNumber()
  tourNr: number;
  @IsNumber()
  fuelStateBefore: number;
  @IsNumber()
  fuelStateAfter: number;
  @IsNumber()
  expectedSalary: number;
  @IsString()
  currency: string;
}
