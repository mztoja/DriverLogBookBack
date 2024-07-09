import { vehicleTypeEnum } from '../../types';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class VehicleAddDto {
  @IsEnum(vehicleTypeEnum)
  type: number;
  @IsString()
  @IsNotEmpty({ message: 'addVehicleRegEmpty' })
  @Transform(({ value }) => value.replace(/\s/g, '').toUpperCase())
  registrationNr: string;
  @IsString()
  model: string;
  @Transform(({ obj }) => obj.isLoadable === 'true')
  @IsBoolean()
  isLoadable: boolean;
  @IsNumber()
  @Min(50, { message: 'addVehicleWeightEmpty' })
  weight: number;
  @IsNumber()
  year: number;
  @IsNumber()
  fuel: number;
  @IsString()
  techRev: string;
  @IsString()
  insurance: string;
  @IsString()
  tacho: string;
  @IsNumber()
  service: number;
  @IsString()
  notes: string;
}
