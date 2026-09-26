export interface FriendCargoInterface {
  // Cel podróży ręcznie oznaczony przez użytkownika (users.markedDepart) — niezależny od tego,
  // czy akurat trwa trasa, więc pokazywany PRZED miejscami docelowymi ładunków.
  targetPlace: string | null;
  // Miejsca docelowe WSZYSTKICH aktualnie nierozładowanych ładunków (może być ich kilka).
  destinations: string[];
  // Czy trwa trasa – ładunek bez odbiorcy albo jazda bez ładunku to nadal aktywna trasa,
  // więc nie wolno wtedy pokazywać „brak celu i aktywnej trasy".
  activeTour: boolean;
  // Nierozładowane ładunki bez podanego odbiorcy (nie da się podać ich miejsca docelowego).
  loadsWithoutReceiver: number;
}
