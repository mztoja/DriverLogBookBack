export interface FriendCargoInterface {
  // Cel podróży ręcznie oznaczony przez użytkownika (users.markedDepart) — niezależny od tego,
  // czy akurat trwa trasa, więc pokazywany PRZED miejscami docelowymi ładunków.
  targetPlace: string | null;
  // Miejsca docelowe WSZYSTKICH aktualnie nierozładowanych ładunków (może być ich kilka).
  destinations: string[];
}
