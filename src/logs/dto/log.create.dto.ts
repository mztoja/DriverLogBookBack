import { IsUUID } from 'class-validator';

export class LogCreateDto {
  @IsUUID()
  userId: string;
  date: string;
  action: string;
  country: string;
  place: string;
  placeId: number;
  odometer: number;
  notes: string;
  type: number;
}
