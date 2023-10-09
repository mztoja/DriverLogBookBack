import { PlaceTypeEnum } from './PlaceEnums';

export interface PlaceInterface {
  id: number;
  userId: string;
  isFavorite: boolean;
  type: PlaceTypeEnum;
  country: string;
  name: string;
  street: string;
  code: string;
  city: string;
  lat: string;
  lon: string;
  description: string;
}
