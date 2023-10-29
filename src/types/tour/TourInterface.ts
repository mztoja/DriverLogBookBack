import { tourStatusEnum } from './TourEnums';

export interface TourInterface {
  id: number;
  tourNr: number;
  userId: string;
  status: tourStatusEnum;
  truck: string;
  startLogId: number;
  stopLogId: number;
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
