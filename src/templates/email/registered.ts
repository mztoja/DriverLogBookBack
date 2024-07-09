import { userLangEnum } from '../../types';

export const registeredEmailTemplate = (lang: userLangEnum): string => {
    if (lang === userLangEnum.pl) {
        return `
        Otrzymałeś ten e-mail ponieważ zarejestrowałeś się w usłudze "Dziennik Kierowcy".<br/>
        Zanim będziesz mógł z niego korzystać - musisz poczekać na aktywację konta przez administratora.<br/>
        Powiadomi Cię on gdy konto będzie aktywne.<br/>
        Życzymy miłego dnia :)
        `;
    }
    return `
    You received this e-mail because you have registered on the "Driver's Log Book" app.<br/>
    Before you can use it, you must wait for the administrator to activate your account.<br/>
    They will notify you when your account will be active.<br/>
    Enjoy :)
    `;
}