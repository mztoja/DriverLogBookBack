import { placeTypeEnum } from '../../types';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class PlaceCreateDto {
  @Transform(({ obj }) => obj.isFavorite === 'true')
  @IsBoolean()
  isFavorite: boolean;
  @IsNumber()
  type: placeTypeEnum;
  @IsString()
  @IsNotEmpty({ message: 'name' })
  @MaxLength(30, { message: 'placeNameTooLong' })
  name: string;
  @IsString()
  @MaxLength(50, { message: 'placeStreetTooLong' })
  street: string;
  @IsString()
  @MaxLength(10, { message: 'placeCodeTooLong' })
  code: string;
  @IsString()
  @IsNotEmpty({ message: 'city' })
  @MaxLength(30, { message: 'placeCityTooLong' })
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
  @Transform(({ obj }) => obj.isMarked === 'true')
  @IsBoolean()
  isMarked: boolean;
}
