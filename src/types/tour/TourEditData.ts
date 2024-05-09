import { LogEditData } from '../log';

export interface TourEditData {
  id: number;
  tourNr: string;
  startData: LogEditData;
  stopData: LogEditData;
  fuelStateBefore: string;
  fuelStateAfter: string;
  expectedSalary: string;
  currency: string;
}
