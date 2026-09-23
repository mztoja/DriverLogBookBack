import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

import { config } from './config/config';

export = {
  // Forma obiektowa zamiast URL-a smtp://user:pass@host:port — login jest adresem e-mail
  // (zawiera "@"), więc wklejony wprost w URL łamałby jego parsowanie (nodemailer rozdzieliłby
  // user:pass po NIEwłaściwym "@"). `secure` bierzemy wprost z configu (Gmail na porcie 465
  // wymaga TLS-u od razu przy połączeniu, nie STARTTLS).
  transport: {
    host: config.mailerHost,
    port: config.mailerSmtpPort,
    secure: config.mailerSecure,
    auth: {
      user: config.mailerAuthUser,
      pass: config.mailerAuthPassword,
    },
  },
  defaults: {
    from: config.mailerFrom,
  },
  template: {
    dir: './templates/email',
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
};
