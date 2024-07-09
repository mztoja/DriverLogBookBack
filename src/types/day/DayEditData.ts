import { LogEditData } from '../log';
import { dayCardStateEnum } from './DayEnums';

export interface DayEditData {
  id: number;
  startData: LogEditData;
  stopData: LogEditData;
  cardState: dayCardStateEnum;
  distance: string;
  driveTime: string;
  driveTime2: string;
  workTime: string;
  breakTime: string;
  fuelBurned: string;
  doubleCrew: 'true' | 'false';
}
