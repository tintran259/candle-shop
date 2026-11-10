import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { rateLimit } from './common/rate-limit.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Ảnh sản phẩm, nến hủy đơn đang gửi dạng data URL nên cần giới hạn lớn hơn mặc định 100 KB
  app.useBodyParser('json', { limit: '10mb' });

  // Header bảo mật (chặn nhúng iframe, đoán kiểu file, buộc HTTPS…). API trả JSON nên tắt CSP (Swagger trên máy cần script nội tuyến)
  app.use(helmet({ contentSecurityPolicy: false }));
  // Render đứng sau proxy: lấy IP thật của người gọi từ X-Forwarded-For (để giới hạn request theo IP)
  app.set('trust proxy', 1);
  app.use(rateLimit());
  app.setGlobalPrefix('api');
  // Web (FRONTEND_URL) và Back Office (BO_URL) — mỗi biến có thể ghi nhiều địa chỉ, cách nhau dấu phẩy
  // Để trống cũng dùng giá trị mặc định (BO chạy dev ở cổng 3001, preview test 3011)
  const origins = [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.BO_URL || 'http://localhost:3001,http://localhost:3011']
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Tài liệu API (/api/docs) chỉ bật khi chạy trên máy. Render tự đặt RENDER=true → tắt, trừ khi đặt SWAGGER=true
  if (!process.env.RENDER || process.env.SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder().setTitle('Candle Shop API').setVersion('0.1').addBearerAuth().build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
