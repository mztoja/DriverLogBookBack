import { IsBoolean, IsEnum, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { LogEditDto } from '../../logs/dto/log-edit.dto';
import { dayCardStateEnum } from '../../types';
import { Transform } from 'class-transformer';

export class DaySimpleEditDto {
  @IsNumber()
  id: number;
  @ValidateNested({ each: true })
  startData: LogEditDto;
  @IsObject()
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
