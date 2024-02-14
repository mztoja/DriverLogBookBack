import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { IsNumber } from 'class-validator';

export class TourFinishDto extends LogCreateDto {
  @IsNumber()
  fuelStateAfter: number;
}
