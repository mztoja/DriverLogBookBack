export interface UserCreateDto {
  lang: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId: number;
  customer: string;
  bidType: number;
  bid: number;
  currency: string;
  fuelConType: number;
  country: string;
}
