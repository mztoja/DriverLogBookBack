export interface GeneralFormData {
  date: string;
  truck: string;
  trailer: string;
  odometer: string;
  action: string;
  fuelQuantity: string;
  fuelCombustion: string;
  place: string;
  placeId: string;
  country: string;
  notes: string;
  doubleCrew: 'false' | 'true';
  cardInserted: 'false' | 'true';
  cardTakeOut: 'false' | 'true';
  driveTime: string;
  driveTime2: string;
}
