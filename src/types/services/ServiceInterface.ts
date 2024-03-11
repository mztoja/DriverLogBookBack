import { LogInterface } from '../log';

export enum serviceTypeEnum {
  maintenance = 0,
  service = 1,
}

export interface ServiceInterface {
  id: number;
  userId: string;
  logId: number;
  logData?: LogInterface;
  type: serviceTypeEnum;
  vehicleId: number;
  entry: string;
}
