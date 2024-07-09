import { tourStatusEnum } from './TourEnums';
import { LogInterface } from '../log';

export interface TourInterface {
  id: number;
  tourNr: number;
  userId: string;
  status: tourStatusEnum;
  truck: string;
  trailer: string | null;
  startLogId: number;
  startLogData?: LogInterface;
  stopLogId: number;
  stopLogData?: LogInterface;
  driveTime: string;
  workTime: string;
  distance: number;
  daysOnDuty: number;
  daysOffDuty: number;
  totalRefuel: number;
  fuelStateBefore: number;
  fuelStateAfter: number;
  burnedFuelReal: number;
  burnedFuelComp: number;
  numberOfLoads: number;
  avgWeight: number;
  expectedSalary: number;
  salary: number;
  outgoings: number;
  currency: string;
}
