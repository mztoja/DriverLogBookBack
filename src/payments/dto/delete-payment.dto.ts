import { IsNumber, Min } from 'class-validator';

export class DeletePaymentDto {
  @IsNumber()
  @Min(1)
  paymentId: number;
}
