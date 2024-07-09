import { vehicleTypeEnum } from './VehicleEnums';

export interface AddVehicleFormInterface {
  type: vehicleTypeEnum;
  registrationNr: string;
  model: string;
  isLoadable: 'true' | 'false';
  weight: string;
  year: string;
  fuel: string;
  techRev: string;
  insurance: string;
  tacho: string;
  service: string;
  notes: string;
}
