import { placeTypeEnum } from '../../types';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PlaceCreateDto {
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
  @IsBoolean()
  isMarked: boolean;
}
