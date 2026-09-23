import { userLangEnum } from '../../types';

export const friendInviteSentEmailTemplate = (lang: userLangEnum, friendName: string): string => {
  if (lang === userLangEnum.pl) {
    return `
    Wysłałeś zaproszenie do znajomych dla <b>${friendName}</b> w aplikacji "Dziennik Kierowcy".<br/>
    Poinformujemy Cię mailem, gdy zaproszenie zostanie zaakceptowane albo odrzucone.<br/>
    Życzymy miłego dnia :)
    `;
  }
  return `
  You sent a friend invitation to <b>${friendName}</b> in the "Driver's Log Book" app.<br/>
  We'll e-mail you as soon as the invitation is accepted or declined.<br/>
  Enjoy :)
  `;
};
