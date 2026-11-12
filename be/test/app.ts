// Dựng app Nest cho test e2e trên schema bo_test, kèm token đăng nhập sẵn
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { signToken } from '../src/auth/token.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TEST_SCHEMA } from './setup-db.js';

const SECRET = 'bi-mat-ky-token-cho-test-dai-hon-32-ky-tu';

export async function createTestApp() {
  process.env.DB_SCHEMA = TEST_SCHEMA;
  process.env.JWT_SECRET = SECRET;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useBodyParser('json', { limit: '10mb' });
  app.setGlobalPrefix('api');
  // Như main.ts: tin 1 proxy (Render) — req.ip lấy từ X-Forwarded-For (test chống spam theo IP)
  app.set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  const prisma = app.get(PrismaService);
  const token = signToken({ sub: 'admin', name: 'Admin 2510', exp: Date.now() + 3_600_000 }, SECRET);
  const auth = { Authorization: `Bearer ${token}` };
  const http = () => request(app.getHttpServer());
  return {
    app,
    prisma,
    get: (url: string) => http().get(url).set(auth),
    post: (url: string, body?: object) => http().post(url).set(auth).send(body),
    put: (url: string, body?: object) => http().put(url).set(auth).send(body),
    patch: (url: string, body?: object) => http().patch(url).set(auth).send(body),
    del: (url: string) => http().delete(url).set(auth),
    anon: http,
  };
}

// Xóa trắng mọi bảng của schema test
export async function resetDb(prisma: PrismaService) {
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(`SELECT tablename FROM pg_tables WHERE schemaname = '${TEST_SCHEMA}' AND tablename <> '_prisma_migrations'`);
  if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${TEST_SCHEMA}"."${t.tablename}"`).join(', ')} CASCADE`);
}
