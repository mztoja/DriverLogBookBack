import { FriendSummaryInterface } from './FriendSummaryInterface';
import { FriendRequestInterface } from './FriendRequestInterface';
import { SelfSummaryInterface } from './SelfSummaryInterface';

export interface FriendsListInterface {
  accepted: FriendSummaryInterface[];
  incoming: FriendRequestInterface[];
  outgoing: FriendRequestInterface[];
  self: SelfSummaryInterface;
}
