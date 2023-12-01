import { loadStatusEnum } from './LoadEnums';
import { PlaceInterface } from '../place';

export interface LoadInterface {
  id: number;
  loadNr: number;
  userId: string;
  status: loadStatusEnum;
  tourId: number;
  vehicle: string;
  loadingLogId: number;
  unloadingLogId: number;
  senderId: number;
  receiverId: number;
  receiverData?: PlaceInterface;
  description: string;
  quantity: string;
  weight: number;
  reference: string;
  distance: number;
}
