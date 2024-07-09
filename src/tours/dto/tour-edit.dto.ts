import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { LogEditDto } from '../../logs/dto/log-edit.dto';

export class TourEditDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  startData: LogEditDto;
  @ValidateNested({ each: true })
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
