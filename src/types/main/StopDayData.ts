import { AddLogData } from './AddLogData';

export interface StopDayData extends AddLogData {
  cardTakeOut: 'false' | 'true';
  driveTime: string;
  driveTime2: string;
  fuelCombustion: string;
}
