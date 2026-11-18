// Kho ảnh: danh sách ảnh Cloudinary kèm nơi dùng, chặn xóa ảnh đang dùng — Cloudinary giả lập bằng cách thay fetch
import { createTestApp, resetDb } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;
const keys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
const realFetch = globalThis.fetch;

const url = (id: string) => `https://res.cloudinary.com/demo-cloud/image/upload/v1/${id}.webp`;
const img = (id: string, folder: string) => ({ public_id: id, asset_folder: folder, format: 'webp', bytes: 1000, width: 800, height: 600, created_at: '2026-11-18T08:00:00Z', secure_url: url(id) });
const calls: { url: string; method: string; body?: string }[] = [];

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(async () => {
  await resetDb(t.prisma);
  calls.length = 0;
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const u = String(input);
    calls.push({ url: u, method: init?.method ?? 'GET', body: init?.body as string | undefined });
    if (u.endsWith('/resources/search'))
      return new Response(
        JSON.stringify({ resources: [img('candle2510/craft/sap-dau-nanh-20261118-151230', 'candle2510/craft'), img('candle2510/products/thua-20261118-151230', 'candle2510/products')] }),
      );
    if (init?.method === 'DELETE') return new Response(JSON.stringify({ deleted: { 'candle2510/products/thua-20261118-151230': 'deleted' } }));
    return realFetch(input, init);
  }) as typeof fetch;
});
afterAll(async () => {
  globalThis.fetch = realFetch;
  for (const k of keys)
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  await t.app.close();
});

test('chưa cấu hình kho ảnh thì 503; danh sách kèm nơi dùng; chặn xóa ảnh đang dùng, xóa được ảnh thừa', async () => {
  for (const k of keys) delete process.env[k];
  await t.get('/api/admin/media').expect(503);
  await t.anon().get('/api/admin/media').expect(401);
  Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: 'demo-cloud', CLOUDINARY_API_KEY: '1234567890', CLOUDINARY_API_SECRET: 'bi-mat-thu' });

  const used = 'candle2510/craft/sap-dau-nanh-20261118-151230';
  await t.post('/api/admin/materials', { name: 'Sáp đậu nành', category: 'wax', unit: 'g', tracked: false, images: [url(used)] }).expect(201);
  const r = await t.get('/api/admin/media').expect(200);
  expect(r.body).toEqual([
    expect.objectContaining({ publicId: used, name: 'sap-dau-nanh-20261118-151230', folder: 'craft', usedIn: ['Nguyên liệu: Sáp đậu nành'] }),
    expect.objectContaining({ publicId: 'candle2510/products/thua-20261118-151230', folder: 'products', usedIn: [] }),
  ]);
  expect(JSON.parse(calls[0].body!).expression).toBe('resource_type:image AND folder:candle2510/*');

  const blocked = await t.post('/api/admin/media/delete', { publicIds: [used, 'candle2510/products/thua-20261118-151230'] }).expect(409);
  expect(blocked.body.message).toContain('Nguyên liệu: Sáp đậu nành');
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);

  const d = await t.post('/api/admin/media/delete', { publicIds: ['candle2510/products/thua-20261118-151230'] }).expect(200);
  expect(d.body.deleted).toEqual(['candle2510/products/thua-20261118-151230']);
  expect(calls.find((c) => c.method === 'DELETE')!.url).toContain('public_ids[]=candle2510%2Fproducts%2Fthua-20261118-151230');
  await t.post('/api/admin/media/delete', { publicIds: [] }).expect(400);
});
