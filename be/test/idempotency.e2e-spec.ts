// Khóa nhớ trong bộ nhớ của app (dùng chung các test) nên mỗi test dùng khóa riêng.
// Gửi lại yêu cầu ghi cùng Idempotency-Key (BO tự gửi lại khi mất mạng): BE không ghi lần hai, trả lại kết quả lần đầu
import { createTestApp, resetDb } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(async () => {
  await resetDb(t.prisma);
  await t.post('/api/admin/materials', { id: 'soy', name: 'Sáp đậu nành', category: 'wax', unit: 'g', tracked: true, stock: 1000, openingTotal: 60000, lowStock: 100 }).expect(201);
});
afterAll(async () => {
  await t.app.close();
});

const stockIn = (key?: string) => {
  const r = t.post('/api/admin/materials/soy/movements', { type: 'in', amount: 500, lotTotal: 30000 });
  return key ? r.set('Idempotency-Key', key) : r;
};

describe('Idempotency-Key', () => {
  it('cùng khóa: nhập kho một lần, lần gửi lại trả đúng kết quả lần đầu', async () => {
    const a = await stockIn('k-1').expect(201);
    const b = await stockIn('k-1').expect(201);
    expect(b.body).toEqual(a.body);
    expect((await t.get('/api/admin/materials/soy').expect(200)).body.stock).toBe(1500);
  });

  it('khóa khác hoặc không có khóa: ghi bình thường', async () => {
    await stockIn('k-2a').expect(201);
    await stockIn('k-2b').expect(201);
    await stockIn().expect(201);
    await stockIn().expect(201);
    expect((await t.get('/api/admin/materials/soy').expect(200)).body.stock).toBe(3000);
  });

  it('lần đầu lỗi thì không giữ: sửa xong gửi lại cùng khóa vẫn chạy', async () => {
    await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 5000 }).set('Idempotency-Key', 'k-3').expect(400);
    await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 5000 }).set('Idempotency-Key', 'k-3').expect(400);
    await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 400 }).set('Idempotency-Key', 'k-4').expect(201);
    expect((await t.get('/api/admin/materials/soy').expect(200)).body.stock).toBe(600);
  });
});
