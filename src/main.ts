import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v3');
  app.use(cookieParser());
  app.enableCors({
    origin: config.crossOrigin,
    credentials: true,
  });
  await app.listen(3001);
  console.log(`[bootstrap] server is running on port: `, config.origin);
}
bootstrap();
