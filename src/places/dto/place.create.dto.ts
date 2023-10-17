export interface PlaceCreateDto {
  userId: string;
  isFavorite: boolean;
  type: number;
  name: string;
  street: string;
  code: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  description: string;
}
