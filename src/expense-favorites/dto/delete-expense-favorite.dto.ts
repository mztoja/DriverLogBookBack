import { IsNumber, Min } from 'class-validator';

export class DeleteExpenseFavoriteDto {
  @IsNumber()
  @Min(1)
  favoriteId: number;
}
