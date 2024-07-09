import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/global-exeption.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('v3');
  app.useGlobalPipes(
    new ValidationPipe({
      //disableErrorMessages: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: config.crossOrigin,
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(3001);
  console.log(`[bootstrap] server is running on port: `, config.origin);
}
bootstrap().catch((e) => console.log('[bootstrap] server error: ', e));
