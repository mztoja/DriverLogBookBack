import { logTypeEnum } from './LogEnums';

export interface LogInterface {
  id: number;
  userId: string;
  tourId: number;
  date: string;
  action: string;
  country: string;
  place: string;
  placeId: number;
  odometer: number;
  notes: string;
  type: logTypeEnum;
}
