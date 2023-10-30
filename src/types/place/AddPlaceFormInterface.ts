export interface AddPlaceFormInterface {
  isFavorite: 'false' | 'true';
  type: string;
  name: string;
  street: string;
  code: string;
  city: string;
  country: string;
  lat: string;
  lon: string;
  description: string;
  isMarked: 'false' | 'true';
}
