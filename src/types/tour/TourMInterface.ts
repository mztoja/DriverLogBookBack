export interface TourMInterface {
  id: number;
  toursId: number[];
  userId: string;
  month: string;
  driveTime: string;
  workTime: string;
  distance: number;
  daysOnDuty: number;
  daysOffDuty: number;
  totalRefuel: number;
  burnedFuelReal: number;
  burnedFuelComp: number;
  numberOfLoads: number;
  avgWeight: number;
  expectedSalary: number;
  salary: number;
  outgoings: number;
  currency: string;
}
