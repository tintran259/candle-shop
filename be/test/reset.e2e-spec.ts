// Xóa toàn bộ dữ liệu BO, chỉ giữ đăng nhập — DB thật, schema bo_test
import { createTestApp, resetDb } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(async () => {
  await resetDb(t.prisma);
});
afterAll(async () => {
  await t.app.close();
});

it('cần đúng câu xác nhận; xóa hết dữ liệu, giữ khóa đăng nhập; cài đặt về mặc định', async () => {
  const settings = (await t.get('/api/admin/settings').expect(200)).body;
  await t.put('/api/admin/settings', { ...settings, depositPercent: 30 }).expect(200);
  await t.post('/api/admin/categories', { id: 'fruit', name: { vi: 'Trái cây', en: '' } }).expect(201);
  await t.post('/api/admin/materials', { id: 'soy', name: 'Sáp', category: 'wax', unit: 'g', tracked: true, stock: 100, openingTotal: 1000 }).expect(201);
  await t.post('/api/admin/customers', { name: 'Vy', phone: '0944889900' }).expect(201);
  await t.prisma.loginGuard.create({ data: { id: 'admin', failed: 2, level: 1 } });

  await t.anon().post('/api/admin/reset').send({ confirm: 'XÓA HẾT' }).expect(401);
  await t.post('/api/admin/reset', {}).expect(400);
  expect((await t.post('/api/admin/reset', { confirm: 'xoa het' }).expect(400)).body.message).toContain('XÓA HẾT');
  await t.post('/api/admin/reset', { confirm: ' xóa hết ' }).expect(204);

  expect((await t.get('/api/admin/categories').expect(200)).body).toEqual([]);
  expect((await t.get('/api/admin/materials').expect(200)).body).toEqual([]);
  expect((await t.get('/api/admin/customers').expect(200)).body).toEqual([]);
  expect((await t.get('/api/admin/stock-movements').expect(200)).body).toEqual([]);
  expect((await t.get('/api/admin/settings').expect(200)).body.depositPercent).toBe(50);
  // Thủ công: giữ các bước, không còn lựa chọn nào; ô nhập chữ vẫn còn
  const craft = (await t.get('/api/admin/craft').expect(200)).body;
  expect(craft).toMatchObject({ isDefault: false, draft: null });
  expect(craft.saved.steps.length).toBeGreaterThan(3);
  for (const s of craft.saved.steps) expect(s.kind === 'inputs' ? s.addons : s.options).toEqual([]);
  expect(craft.saved.steps.find((s: { kind: string }) => s.kind === 'inputs').fields.length).toBeGreaterThan(0);
  expect(await t.prisma.loginGuard.count()).toBe(1);
});
