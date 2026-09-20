import { AddLogData } from './AddLogData';

export interface AddLoadingData extends AddLogData {
  loadNr?: string;
  vehicle: string;
  senderId: string;
  receiverId: string;
  description: string;
  quantity: string;
  weight: string;
  reference: string;
}
