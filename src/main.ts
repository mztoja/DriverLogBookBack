import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v3');
  //app.enableCors();
  await app.listen(3001);
  console.log(`[bootstrap] server is running on port: http://localhost:3001/v3`);
}
bootstrap();
