// Obsługuje też ujemne wartości MySQL TIME ("-01:30:00") — wcześniej dawały -3600 + 1800.
export const calcSecondsFromTime = (time: string): number => {
  if (!time) return 0;
  const negative = time.trim().startsWith('-');
  const [hours, minutes] = time.trim().replace('-', '').split(':').map(Number);
  const seconds = (hours || 0) * 3600 + (minutes || 0) * 60;
  return negative ? -seconds : seconds;
};
