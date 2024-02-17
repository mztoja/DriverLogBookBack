import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { placeTypeEnum } from '../../types';

export class PlaceEditDto {
  @Transform(({ obj }) => obj.isFavorite === 'true')
  @IsBoolean()
  isFavorite: boolean;
  @IsNumber()
  type: placeTypeEnum;
  @IsString()
  @IsNotEmpty({ message: 'name' })
  name: string;
  @IsString()
  street: string;
  @IsString()
  code: string;
  @IsString()
  @IsNotEmpty({ message: 'city' })
  city: string;
  @IsString()
  @IsNotEmpty({ message: 'country' })
  country: string;
  @IsNumber()
  lat: number;
  @IsNumber()
  lon: number;
  @IsString()
  description: string;
}
