import { IsUUID } from 'class-validator';

export class LogCreateDto {
  @IsUUID()
  userId: string;
  tourId: number;
  date: string;
  action: string;
  country: string;
  //@ValidatePlace()
  place: string;
  //@ValidatePlace()
  placeId: number;
  odometer: number;
  notes: string;
  type: number;
}
