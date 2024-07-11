import { userStatusEnum } from './UserEnums';
import { userLangEnum } from './UserEnums';
import { userBidTypeEnum } from './UserEnums';
import { userFuelContypeEnum } from './UserEnums';
import { userFuelConDispEnum } from './UserEnums';

export interface UserInterface {
  id: string;
  pwdHash: string;
  currentTokenId: string | null;
  status: userStatusEnum;
  lang: userLangEnum;
  registerAt: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: number;
  customer: string;
  bidType: userBidTypeEnum;
  bid: number;
  currency: string;
  markedArrive: number;
  markedDepart: number;
  fuelConType: userFuelContypeEnum;
  fuelConDisp: userFuelConDispEnum;
  country: string;
  notes: string | null;
  tourGenerator: string;
}
