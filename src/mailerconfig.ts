import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

import { config } from './config/config';

export = {
    transport: `smtp://${config.mailerAuthUser}:${config.mailerAuthPassword}@${config.mailerHost}:${config.mailerSmtpPort}`,
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