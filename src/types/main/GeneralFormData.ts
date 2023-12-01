export interface GeneralFormData {
  date: string;
  truck: string;
  trailer: string;
  vehicle: string;
  odometer: string;
  action: string;
  fuelQuantity: string;
  fuelCombustion: string;
  place: string;
  placeId: string;
  country: string;
  senderId: string;
  receiverId: string;
  notes: string;
  doubleCrew: 'false' | 'true';
  cardInserted: 'false' | 'true';
  cardTakeOut: 'false' | 'true';
  driveTime: string;
  driveTime2: string;
  addNewBorder: 'false' | 'true';
  description: string;
  quantity: string;
  weight: string;
  reference: string;
  loadId: string;
}
