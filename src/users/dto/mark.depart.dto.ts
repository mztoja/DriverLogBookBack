import { IsNumber } from 'class-validator';

export class MarkDepartDto {
  @IsNumber()
  placeId: number;
}
