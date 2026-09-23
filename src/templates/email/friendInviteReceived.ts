import { userLangEnum } from '../../types';

export const friendInviteReceivedEmailTemplate = (lang: userLangEnum, senderName: string): string => {
  if (lang === userLangEnum.pl) {
    return `
    <b>${senderName}</b> zaprosił(a) Cię do grona znajomych w aplikacji "Dziennik Kierowcy".<br/>
    Po zaakceptowaniu zaproszenia będziecie nawzajem mieli dostęp do swojej ostatniej pozycji
    oraz informacji o celu podróży i miejscach docelowych aktualnie przewożonego ładunku.<br/>
    Zaloguj się do aplikacji i wejdź na mapę w zakładce "Miejsca", żeby zaakceptować albo odrzucić
    zaproszenie.<br/>
    Życzymy miłego dnia :)
    `;
  }
  return `
  <b>${senderName}</b> invited you to be friends in the "Driver's Log Book" app.<br/>
  After you accept the invitation, you will both be able to see each other's last known position
  and information about the destination of the load currently being transported.<br/>
  Log in to the app and open the map on the "Places" tab to accept or decline the invitation.<br/>
  Enjoy :)
  `;
};
