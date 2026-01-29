import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express'; // <--- 1. Importar express

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 2. Aumentar el límite a 50MB (o lo que necesites)
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // ... tu configuración de CORS y demás ...
  app.enableCors();

  await app.listen(3000);
}
bootstrap();
