import { logTypeEnum } from './LogEnums';
import { PlaceInterface } from '../place';

export interface LogInterface {
  id: number;
  userId: string;
  tourId: number;
  date: string;
  action: string;
  country: string;
  place: string;
  placeId: number;
  placeData?: PlaceInterface | null;
  odometer: number;
  notes: string | null;
  type: logTypeEnum;
}
