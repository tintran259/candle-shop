// Đăng nhập bằng PIN và chặn API khi chưa đăng nhập. DB thay bằng bản giả — test không chạm Neon.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const PIN = '739214';
type Guard = { id: string; failed: number; level: number; lockedUntil: Date | null };

describe('Đăng nhập bằng PIN (e2e)', () => {
  let app: INestApplication<App>;
  let guard: Guard | undefined;
  const http = () => request(app.getHttpServer());
  const login = (pin: string, remember = false) => http().post('/api/auth/login').send({ pin, remember });

  beforeEach(async () => {
    guard = undefined;
    process.env.JWT_SECRET = 'bi-mat-ky-token-cho-test-dai-hon-32-ky-tu';
    process.env.ADMIN_PIN_HASH = await hashPassword(PIN);
    // Bảng LoginGuard giả trong bộ nhớ
    const loginGuard = {
      upsert: async ({ create }: { create: { id: string } }) => (guard ??= { id: create.id, failed: 0, level: 0, lockedUntil: null }),
      update: async ({ data }: { data: Partial<Guard> }) => (guard = { ...guard!, ...data }),
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ loginGuard, $queryRaw: async () => [{ '?column?': 1 }], $connect: async () => {}, $disconnect: async () => {} })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health không cần đăng nhập', async () => {
    await http().get('/api/health').expect(200, { ok: true });
  });

  it('chưa đăng nhập hoặc token giả thì bị chặn', async () => {
    await http().get('/api/auth/me').expect(401);
    await http().get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi').expect(401);
  });

  it('PIN đúng: nhận token, gọi được API; ghi nhớ 30 ngày, không thì 12 giờ', async () => {
    const res = await login(PIN, true).expect(200);
    expect(res.body.name).toBe('Admin 2510');
    expect(res.body.expiresAt - Date.now()).toBeGreaterThan(29 * 24 * 3600 * 1000);
    await http().get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`).expect(200);
    const short = await login(PIN).expect(200);
    expect(short.body.expiresAt - Date.now()).toBeLessThanOrEqual(12 * 3600 * 1000);
  });

  it('PIN sai định dạng báo 400, không tính vào số lần sai', async () => {
    await login('12345').expect(400);
    await login('abcdef').expect(400);
    expect(guard?.failed ?? 0).toBe(0);
  });

  it('sai 5 lần thì khóa 15 phút, kể cả nhập đúng; lần khóa sau 1 giờ', async () => {
    for (let i = 1; i <= 4; i++) {
      const r = await login('111222').expect(401);
      expect(r.body.remaining).toBe(5 - i);
    }
    const locked = await login('111222').expect(429);
    expect(locked.body.retryIn).toBe(15 * 60);
    await login(PIN).expect(429);
    // Hết khóa (giả lập) rồi sai tiếp 5 lần: khóa 1 giờ
    guard!.lockedUntil = new Date(Date.now() - 1);
    for (let i = 0; i < 4; i++) await login('111222').expect(401);
    expect((await login('111222').expect(429)).body.retryIn).toBe(60 * 60);
  });

  it('đăng nhập đúng thì đếm lại từ đầu', async () => {
    for (let i = 0; i < 3; i++) await login('111222').expect(401);
    await login(PIN).expect(200);
    expect(guard).toMatchObject({ failed: 0, level: 0, lockedUntil: null });
  });
});
