import { loadStatusEnum } from './LoadEnums';
import { PlaceInterface } from '../place';
import { LogInterface } from '../log';

export interface LoadInterface {
  id: number;
  loadNr: number;
  userId: string;
  status: loadStatusEnum;
  tourId: number;
  vehicle: string;
  loadingLogId: number;
  loadingLogData?: LogInterface;
  unloadingLogId: number;
  unloadingLogData?: LogInterface;
  senderId: number;
  senderData?: PlaceInterface;
  receiverId: number;
  receiverData?: PlaceInterface;
  description: string;
  quantity: string;
  weight: number;
  reference: string;
  distance: number;
}
