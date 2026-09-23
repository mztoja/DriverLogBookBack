import { FriendPositionInterface } from './FriendPositionInterface';
import { FriendCargoInterface } from './FriendCargoInterface';

export interface FriendSummaryInterface {
  friendshipId: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  position: FriendPositionInterface | null;
  cargo: FriendCargoInterface | null;
}
