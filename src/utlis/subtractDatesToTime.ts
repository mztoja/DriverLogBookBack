export const subtractDatesToTime = (higherDate: string, lowerDate: string) => {
  const data1 = new Date(higherDate);
  const data2 = new Date(lowerDate);
  const diff = Math.abs(data1.getTime() - data2.getTime());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};
