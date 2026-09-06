export interface TourStatsBucket {
  toursCount: number;
  distance: number;
  driveTime: string; // "H:MM" – godziny nie są ograniczone do 2 cyfr
  workTime: string;
  daysOnDuty: number;
  daysOffDuty: number;
  totalRefuel: number;
  burnedFuelComp: number;
  burnedFuelReal: number;
  numberOfLoads: number;
  avgWeight: number; // średnia ważona liczbą ładunków
  expectedSalary: number;
  salary: number;
  outgoings: number;
}

export interface TourStatsMonth extends TourStatsBucket {
  month: number; // 1..12
}

export interface TourStatsYear extends TourStatsBucket {
  year: number;
  months: TourStatsMonth[]; // zawsze 12 pozycji (1..12), zerowe gdy brak tras
}

export interface TourStatsInterface {
  currency: string;
  total: TourStatsBucket;
  years: TourStatsYear[]; // malejąco po roku
}
