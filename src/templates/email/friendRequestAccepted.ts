import { userLangEnum } from '../../types';

export const friendRequestAcceptedEmailTemplate = (lang: userLangEnum, friendName: string): string => {
  if (lang === userLangEnum.pl) {
    return `
    <b>${friendName}</b> zaakceptował(a) Twoje zaproszenie do znajomych w aplikacji "Dziennik Kierowcy".<br/>
    Od teraz widzicie nawzajem swoją ostatnią pozycję oraz cel podróży i miejsca docelowe
    aktualnie przewożonego ładunku.<br/>
    Życzymy miłego dnia :)
    `;
  }
  return `
  <b>${friendName}</b> accepted your friend invitation in the "Driver's Log Book" app.<br/>
  From now on you can both see each other's last known position and the destination of the
  load currently being transported.<br/>
  Enjoy :)
  `;
};
