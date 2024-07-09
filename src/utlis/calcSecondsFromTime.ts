export const calcSecondsFromTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60;
};
