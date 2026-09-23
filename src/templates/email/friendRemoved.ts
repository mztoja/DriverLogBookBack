import { userLangEnum } from '../../types';

export const friendRemovedEmailTemplate = (lang: userLangEnum, friendName: string): string => {
  if (lang === userLangEnum.pl) {
    return `
    <b>${friendName}</b> usunął(ęła) Cię ze znajomych w aplikacji "Dziennik Kierowcy".<br/>
    Nie macie już nawzajem dostępu do swojej pozycji ani do celu podróży i miejsc docelowych
    przewożonego ładunku.<br/>
    Życzymy miłego dnia :)
    `;
  }
  return `
  <b>${friendName}</b> removed you from their friends in the "Driver's Log Book" app.<br/>
  You no longer have access to each other's position or to the destination of the load
  currently being transported.<br/>
  Enjoy :)
  `;
};
