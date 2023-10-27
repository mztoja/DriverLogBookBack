import { placeTypeEnum } from '../../types';

export class PlaceCreateDto {
  isFavorite: boolean;
  type: placeTypeEnum;
  name: string;
  street: string;
  code: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  description: string;
}
