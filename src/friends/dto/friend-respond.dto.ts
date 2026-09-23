import { IsNumber } from 'class-validator';

export class FriendRespondDto {
  @IsNumber()
  id: number;
}
