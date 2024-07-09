import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { config } from './config/config';

export = {
    transport: `smtp://${config.mailerAuthUser}:${config.mailerAuthPassword}@${config.mailerHost}:${config.mailerSmtpPort}`,
    defaults: {
        from: 'app@test.com',
    },
    template: {
        dir: './templates/email',
        adapter: new HandlebarsAdapter(),
        options: {
            strict: true,
        },
    },
};