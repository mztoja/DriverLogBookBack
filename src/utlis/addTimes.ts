import { calcSecondsFromTime } from './calcSecondsFromTime';

export const addTimes = (time1: string, time2: number): string => {
  // const [hours1, minutes1, seconds1] = time1.split(':').map(Number);
  // const [hours2, minutes2, seconds2] = time2.split(':').map(Number);
  // let totalHours = hours1 + hours2;
  // let totalMinutes = minutes1 + minutes2;
  // const totalSeconds = seconds1 + seconds2;
  // if (totalSeconds >= 60) {
  //   totalMinutes += Math.floor(totalSeconds / 60);
  // }
  // if (totalMinutes >= 60) {
  //   totalHours += Math.floor(totalMinutes / 60);
  //   totalMinutes %= 60;
  // }
  // const formattedHours = totalHours.toString().padStart(2, '0');
  // const formattedMinutes = totalMinutes.toString().padStart(2, '0');
  // return `${formattedHours}:${formattedMinutes}`;
  // let timeSeconds = calcSecondsFromTime(time1);
  // let time2Seconds = time2;
  // if (timeSeconds !== 0) {
  //   timeSeconds = timeSeconds * 1000;
  // }
  // if (time2Seconds !== 0) {
  //   time2Seconds = time2Seconds * 1000;
  // }
  // const time = new Date(timeSeconds + time2Seconds);
  // const hours = time.getHours().toString().padStart(2, '0');
  // const minutes = time.getMinutes().toString().padStart(2, '0');
  // return `${hours}:${minutes}`;
  const timeInSeconds = calcSecondsFromTime(time1) + time2;
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
