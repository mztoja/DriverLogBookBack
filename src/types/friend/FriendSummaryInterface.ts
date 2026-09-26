import { FriendPositionInterface } from './FriendPositionInterface';
import { FriendCargoInterface } from './FriendCargoInterface';

export interface FriendSummaryInterface {
  friendshipId: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  position: FriendPositionInterface | null;
  // data i godzina ostatniego wpisu – także gdy pozycji nie da się ustalić
  lastActivity: string | null;
  cargo: FriendCargoInterface | null;
}
