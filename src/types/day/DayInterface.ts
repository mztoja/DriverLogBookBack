import { dayCardStateEnum, dayStatusEnum } from './DayEnums';
import { LogInterface } from '../log';

export interface DayInterface {
  id: number;
  userId: string;
  status: dayStatusEnum;
  tourId: number;
  startLogId: number;
  startData?: LogInterface;
  stopLogId: number;
  stopData?: LogInterface | null;
  cardState: dayCardStateEnum;
  distance: number;
  driveTime: string;
  driveTime2: string;
  workTime: string;
  breakTime: string;
  fuelBurned: number;
  doubleCrew: boolean;
}
