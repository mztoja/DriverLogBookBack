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
  firstName: string;
  lastName: string;
  companyId: number;
  customer: string;
  bidType: UserBidTypeEnum;
  bid: number;
  currency: string;
  markedArrive: number;
  markedDepart: number;
  fuelConType: UserFuelContypeEnum;
  fuelConDisp: UserFuelConDispEnum;
  country: string;
  gen: string;
}
