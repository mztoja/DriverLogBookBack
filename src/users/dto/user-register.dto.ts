import {
  userBidTypeEnum,
  userFuelContypeEnum,
  userLangEnum,
} from '../../types';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserRegisterDto {
  @IsNumber()
  lang: userLangEnum;
  @IsEmail({}, { message: 'email' })
  email: string;
  @IsString()
  @IsNotEmpty({ message: 'password' })
  password: string;
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsString()
  defaultCustomer: string;
  @IsNumber()
  bidType: userBidTypeEnum;
  @IsNumber()
  bid: number;
  @IsString()
  currency: string;
  @IsNumber()
  fuelConsumptionType: userFuelContypeEnum;
  @IsString({ message: 'country' })
  @IsNotEmpty({ message: 'country' })
  country: string;
  @IsString()
  @IsNotEmpty({ message: 'companyName' })
  companyName: string;
  @IsString()
  companyStreet: string;
  @IsString()
  companyPostCode: string;
  @IsString()
  @IsNotEmpty({ message: 'companyCity' })
  companyCity: string;
}
