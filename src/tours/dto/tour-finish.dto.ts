import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { IsNumber, IsString } from 'class-validator';

export class TourFinishDto extends LogCreateDto {
  @IsNumber()
  fuelStateAfter: number;
  @IsString()
  unloadNote: string;
  @IsString()
  unloadAction: string;
}
