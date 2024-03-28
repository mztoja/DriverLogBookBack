import { LogEditData } from '../log';
import { serviceTypeEnum } from './ServiceInterface';

export interface ServiceEditData {
  id: number;
  logData: LogEditData;
  type: serviceTypeEnum;
  entry: string;
}
