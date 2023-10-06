import { UserStatusEnum } from './userEnums';
import { UserLangEnum } from './userEnums';
import { UserBidTypeEnum } from './userEnums';
import { UserFuelContypeEnum } from './userEnums';
import { UserFuelConDispEnum } from './userEnums';

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
