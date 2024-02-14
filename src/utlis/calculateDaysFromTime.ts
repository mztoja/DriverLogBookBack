export const calculateDaysFromTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  const days = Math.floor(hours / 24);
  const remainderMinutes = (hours % 24) * 60 + minutes;
  return remainderMinutes > 0 ? days + 1 : days;
};
