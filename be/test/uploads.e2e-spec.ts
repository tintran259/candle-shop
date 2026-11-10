// Ký phép tải ảnh lên Cloudinary: chưa cấu hình thì 503, có cấu hình thì chữ ký đúng cách Cloudinary (SHA-1 tham số xếp theo tên + secret)
import { createHash } from 'node:crypto';
import { createTestApp } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;
const keys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

beforeAll(async () => {
  t = await createTestApp();
});
afterAll(async () => {
  for (const k of keys) process.env[k] = saved[k];
  await t.app.close();
});

it('chưa đăng nhập 401; chưa cấu hình 503; có cấu hình trả chữ ký đúng, thư mục theo nơi dùng', async () => {
  await t.anon().post('/api/admin/uploads/sign').send({}).expect(401);
  for (const k of keys) delete process.env[k];
  expect((await t.post('/api/admin/uploads/sign', {}).expect(503)).body.message).toContain('Chưa cấu hình kho ảnh');

  Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: 'demo-cloud', CLOUDINARY_API_KEY: '1234567890', CLOUDINARY_API_SECRET: 'bi-mat-thu' });
  const r = await t.post('/api/admin/uploads/sign', { folder: 'products' }).expect(200);
  expect(r.body).toMatchObject({ uploadUrl: 'https://api.cloudinary.com/v1_1/demo-cloud/image/upload', apiKey: '1234567890', folder: 'candle2510/products' });
  expect(r.body).not.toHaveProperty('apiSecret');
  const expected = createHash('sha1').update(`folder=candle2510/products&timestamp=${r.body.timestamp}bi-mat-thu`).digest('hex');
  expect(r.body.signature).toBe(expected);
  expect((await t.post('/api/admin/uploads/sign', {}).expect(200)).body.folder).toBe('candle2510/misc');
  await t.post('/api/admin/uploads/sign', { folder: '../khac' }).expect(400);
});
