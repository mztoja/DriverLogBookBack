import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LogEditDto {
  @IsNumber()
  id: number;
  @IsString()
  date: string;
  @IsString()
  @IsNotEmpty({ message: 'action' })
  action: string;
  @IsString({ message: 'country' })
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
