import { AddLogData } from './AddLogData';

export interface AddLoadingData extends AddLogData {
  vehicle: string;
  senderId: string;
  receiverId: string;
  description: string;
  quantity: string;
  weight: string;
  reference: string;
}
