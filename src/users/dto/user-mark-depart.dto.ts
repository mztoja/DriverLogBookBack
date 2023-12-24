import { IsNumber } from 'class-validator';

export class UserMarkDepartDto {
  @IsNumber()
  placeId: number;
}
