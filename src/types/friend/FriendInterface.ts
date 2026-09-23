import { friendStatusEnum } from './FriendEnums';

export interface FriendInterface {
  id: number;
  requesterId: string;
  addresseeId: string;
  status: friendStatusEnum;
  createdAt: string;
  respondedAt: string | null;
}
