import { NestFactory, Reflector } from '@nestjs/core';
import 'dotenv/config';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/transform.interseptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()))
  app.useGlobalFilters(new HttpExceptionFilter())


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
