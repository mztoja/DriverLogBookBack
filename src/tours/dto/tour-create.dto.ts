import { LogCreateDto } from '../../logs/dto/log-create.dto';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class TourCreateDto extends LogCreateDto {
  @IsString()
  @IsNotEmpty({ message: 'truck' })
  @Transform(({ value }) => value.replace(/\s/g, '').toUpperCase())
  truck: string;
  @IsNumber()
  fuelStateBefore: number;
}
