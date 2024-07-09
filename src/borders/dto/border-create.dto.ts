import { IsString } from 'class-validator';

export class BorderCreateDto {
  @IsString()
  place: string;
  @IsString()
  country1: string;
  @IsString()
  country2: string;
}
