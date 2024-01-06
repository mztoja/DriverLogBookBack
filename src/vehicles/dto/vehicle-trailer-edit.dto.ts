import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class VehicleTrailerEditDto {
  @IsString()
  @IsNotEmpty({ message: 'addVehicleRegEmpty' })
  @Transform(({ value }) => value.replace(/\s/g, '').toUpperCase())
  registrationNr: string;
  @IsString()
  model: string;
  @IsNumber()
  @Min(50, { message: 'addVehicleWeightEmpty' })
  weight: number;
  @IsNumber()
  year: number;
  @IsString()
  techRev: string;
  @IsString()
  insurance: string;
  @IsString()
  notes: string;
}
