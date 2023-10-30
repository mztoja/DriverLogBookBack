import { dayCardStateEnum, dayStatusEnum } from './DayEnums';

export interface DayInterface {
  id: number;
  userId: string;
  status: dayStatusEnum;
  tourId: number;
  startLogId: number;
  stopLogId: number;
  cardState: dayCardStateEnum;
  distance: number;
  driveTime: string;
  driveTime2: string;
  workTime: string;
  breakTime: string;
  fuelBurned: number;
  doubleCrew: boolean;
}
