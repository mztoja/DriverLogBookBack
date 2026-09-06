import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class AddExpenseFavoriteDto {
  @IsString()
  @Length(0, 30)
  place: string;

  @IsNumber()
  @Min(0)
  placeId: number;

  @IsString()
  @Length(0, 3)
  country: string;

  @IsString()
  @IsNotEmpty({ message: 'expenseDescriptionEmpty' })
  @Length(1, 100)
  itemDescription: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  payment: string;
}
