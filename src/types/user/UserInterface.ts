import { UserStatusEnum } from './UserEnums';
import { UserLangEnum } from './UserEnums';
import { UserBidTypeEnum } from './UserEnums';
import { UserFuelContypeEnum } from './UserEnums';
import { UserFuelConDispEnum } from './UserEnums';

export interface UserInterface {
  id: string;
  status: UserStatusEnum;
  lang: UserLangEnum;
  registerAt: string;
  email: string;
  password: string;
  name: string;
  companyId: number;
  customer: string;
  bidType: UserBidTypeEnum;
  bid: number;
  cur: string;
  marked: number;
  marked2: number;
  fuelConType: UserFuelContypeEnum;
  fuelConDisp: UserFuelConDispEnum;
  country: string;
  gen: string;
}
