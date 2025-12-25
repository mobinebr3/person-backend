import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/transform.interseptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()))


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
