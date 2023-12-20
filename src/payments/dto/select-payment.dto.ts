import { IsNumber } from 'class-validator';

export class SelectPaymentDto {
  @IsNumber()
  paymentId: number;
}
