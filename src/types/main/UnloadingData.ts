import { AddLogData } from './AddLogData';

export interface UnloadingData extends AddLogData {
  loadId: string;
  isPlaceAsReceiver: 'false' | 'true';
}
