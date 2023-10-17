export interface TourCreateDto {
  userId: string;
  tourNr: number;
  status: number;
  truck: string;
  startLogId: number;
  fuelStateBefore: number;
}
