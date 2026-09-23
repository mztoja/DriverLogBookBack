import { userLangEnum } from '../../types';

export const friendRequestDeclinedEmailTemplate = (lang: userLangEnum, friendName: string): string => {
  if (lang === userLangEnum.pl) {
    return `
    <b>${friendName}</b> odrzucił(a) Twoje zaproszenie do znajomych w aplikacji "Dziennik Kierowcy".<br/>
    Życzymy miłego dnia :)
    `;
  }
  return `
  <b>${friendName}</b> declined your friend invitation in the "Driver's Log Book" app.<br/>
  Enjoy :)
  `;
};
