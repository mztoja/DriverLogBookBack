import { IsBoolean, IsNumber, IsString, Min } from 'class-validator';
import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { Transform } from 'class-transformer';

export class DayFinishDto extends LogCreateDto {
  @Transform(({ obj }) => obj.cardTakeOut === 'true')
  @IsBoolean()
  cardTakeOut: boolean;
  @IsString()
  driveTime: string;
  @IsString()
  driveTime2: string;
  @IsNumber()
  @Min(1, { message: 'fuelCombustion' })
  fuelCombustion: number;
}
