import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TourCreateDto extends LogCreateDto {
  @IsString()
  @IsNotEmpty({ message: 'truck' })
  truck: string;
  @IsNumber()
  fuelStateBefore: number;
}
