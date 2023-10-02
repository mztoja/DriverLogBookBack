enum UserStatusEnum {
  new = 0,
  blocked = 1,
  active = 2,
  admin = 3,
}
enum UserBidTypeEnum {
  perDay = 1,
  perKm = 2,
  fixedSalary = 3,
}

enum UserFuelContypeEnum {
  liters = 1,
  per100km = 2,
}

enum UserFuelConDispEnum {
  litersPer100km = 1,
  kmsPerliter = 2,
}

export interface UserInterface {
  id: number;
  status: UserStatusEnum;
  lang: 'pl' | 'en';
  registerDate: string;
  email: string;
  password: string;
  code: string;
  name: string;
  company: number;
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
