import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  // Web (FRONTEND_URL) và Back Office (BO_URL) — mỗi biến có thể ghi nhiều địa chỉ, cách nhau dấu phẩy
  const origins = [process.env.FRONTEND_URL ?? 'http://localhost:3000', process.env.BO_URL ?? 'http://localhost:5173,http://localhost:3011']
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Candle Shop API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
