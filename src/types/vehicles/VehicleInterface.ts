import { vehicleTypeEnum } from './VehicleEnums';

export interface VehicleInterface {
  id: number;
  type: vehicleTypeEnum;
  userId: string;
  registrationNr: string;
  companyId: number;
  model: string;
  isLoadable: boolean;
  weight: number;
  year: number;
  fuel: number | null;
  techRev: string;
  insurance: string;
  tacho: string | null;
  service: number | null;
  notes: string;
}
