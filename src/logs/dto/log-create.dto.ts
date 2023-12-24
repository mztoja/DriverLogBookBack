import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LogCreateDto {
  @IsString()
  date: string;
  @IsString()
  @IsNotEmpty({ message: 'action' })
  action: string;
  @IsString()
  @IsNotEmpty({ message: 'country' })
  country: string;
  @IsString()
  place: string;
  @IsNumber()
  placeId: number;
  @IsNumber()
  odometer: number;
  @IsString()
  notes: string;
}
