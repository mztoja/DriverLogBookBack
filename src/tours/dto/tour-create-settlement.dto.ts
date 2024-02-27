import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';

const isValidMonthFormat = (value: string) => {
  // check the value to be like "YYYY-MM"
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(value);
};

export class TourCreateSettlementDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'youHaveToChooseRoutes' })
  @Transform(({ value }) => value.map(Number))
  @IsInt({ each: true })
  toursId: number[];
  @IsString()
  @Validate(isValidMonthFormat, {
    message: 'monthIncorrectFormat',
  })
  month: string;
  @IsNumber()
  amount: number;
  @IsString()
  currency: string;
}
