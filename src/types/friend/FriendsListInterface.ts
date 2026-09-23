import { FriendSummaryInterface } from './FriendSummaryInterface';
import { FriendRequestInterface } from './FriendRequestInterface';

export interface FriendsListInterface {
  accepted: FriendSummaryInterface[];
  incoming: FriendRequestInterface[];
  outgoing: FriendRequestInterface[];
}
