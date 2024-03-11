import { AddLogData } from './AddLogData';

export interface StopTourData extends AddLogData {
  fuelStateAfter: string;
  unloadNote: string;
  unloadAction: string;
}
