import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AddPaymentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  paymentMethod: string;
}
