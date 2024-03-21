import { dayCardStateEnum } from '../../types';
import { LogEditDto } from '../../logs/dto/log-edit.dto';
import { IsBoolean, IsEnum, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Transform } from 'class-transformer';

export class DayEditDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  startData: LogEditDto;
  @ValidateNested({ each: true })
  stopData: LogEditDto;
  @IsEnum(dayCardStateEnum)
  cardState: dayCardStateEnum;
  @IsNumber()
  distance: number;
  @IsString()
  driveTime: string;
  @IsString()
  driveTime2: string;
  @IsString()
  workTime: string;
  @IsString()
  breakTime: string;
  @IsNumber()
  fuelBurned: number;
  @Transform(({ obj }) => obj.doubleCrew === 'true')
  @IsBoolean()
  doubleCrew: boolean;
}
