export enum serviceTypeEnum {
  maintenance = 0,
  service = 1,
}

export interface ServiceInterface {
  id: number;
  userId: string;
  logId: number;
  type: serviceTypeEnum;
  vehicleId: number;
  entry: string;
}
