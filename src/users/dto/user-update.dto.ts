import { IsNumber, IsString } from 'class-validator';
import {
  userBidTypeEnum,
  userFuelContypeEnum,
  userLangEnum,
} from '../../types';

export class UserUpdateDto {
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsNumber()
  lang: userLangEnum;
  @IsNumber()
  companyId: number;
  @IsString()
  customer: string;
  @IsNumber()
  bidType: userBidTypeEnum;
  @IsNumber()
  bid: number;
  @IsString()
  currency: string;
  @IsNumber()
  fuelConsumptionType: userFuelContypeEnum;
}
