import { AddLogData } from './AddLogData';

export interface StartDayData extends AddLogData {
  doubleCrew: 'false' | 'true';
  cardInserted: 'false' | 'true';
}
