import { FriendPositionInterface } from './FriendPositionInterface';
import { FriendCargoInterface } from './FriendCargoInterface';

// Ten sam kształt co FriendSummaryInterface, ale bez friendshipId — to nie relacja z kimś,
// tylko pozycja/cel własnego użytkownika, pokazywana na mapie obok znajomych.
export interface SelfSummaryInterface {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  position: FriendPositionInterface | null;
  cargo: FriendCargoInterface | null;
}
