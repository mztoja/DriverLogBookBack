import { AddLogData } from './AddLogData';

export interface StartTourData extends AddLogData {
  truck: string;
  fuelStateBefore: string;
}
