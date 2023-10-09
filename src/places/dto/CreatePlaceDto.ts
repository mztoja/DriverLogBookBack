export interface CreatePlaceDto {
  userId: string;
  isFavorite: boolean;
  type: number;
  name: string;
  street: string;
  code: string;
  city: string;
  country: string;
}
