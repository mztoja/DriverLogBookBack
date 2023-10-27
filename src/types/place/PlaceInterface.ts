import { placeTypeEnum } from './PlaceEnums';

export interface PlaceInterface {
  id: number;
  userId: string;
  isFavorite: boolean;
  type: placeTypeEnum;
  country: string;
  name: string;
  street: string;
  code: string;
  city: string;
  lat: number;
  lon: number;
  description: string;
}
