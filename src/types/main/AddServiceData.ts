import { AddLogData } from './AddLogData';

export interface AddServiceData extends AddLogData {
  serviceVehicleId: string;
  serviceType: string;
  serviceEntry: string;
}
