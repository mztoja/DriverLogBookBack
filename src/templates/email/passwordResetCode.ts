import { userLangEnum } from '../../types';

export const passwordResetCodeEmailTemplate = (lang: userLangEnum, code: string): string => {
  if (lang === userLangEnum.pl) {
    return `
    Otrzymałeś ten e-mail, ponieważ poproszono o zresetowanie hasła do Twojego konta
    w aplikacji "Dziennik Kierowcy".<br/><br/>
    Twój kod do zresetowania hasła: <b style="font-size: 1.4em; letter-spacing: 0.2em;">${code}</b><br/><br/>
    Jeśli to nie Ty prosiłeś(aś) o reset hasła, zignoruj tę wiadomość — hasło pozostanie bez zmian,
    dopóki ktoś nie wpisze powyższego kodu.<br/>
    Życzymy miłego dnia :)
    `;
  }
  return `
  You received this e-mail because a password reset was requested for your account
  in the "Driver's Log Book" app.<br/><br/>
  Your password reset code: <b style="font-size: 1.4em; letter-spacing: 0.2em;">${code}</b><br/><br/>
  If you didn't request a password reset, you can ignore this message — your password will stay
  unchanged unless someone enters the code above.<br/>
  Enjoy :)
  `;
};
