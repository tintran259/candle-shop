// Lời nhắn liên hệ: web gửi (công khai) → BO xem / đánh dấu đã xử lý / xóa; kiểm tra dữ liệu, ô bẫy bot, 5 lần / 10 phút mỗi IP;
// Xóa toàn bộ dữ liệu cũng xóa lời nhắn
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

const send = (body: object) => t.anon().post('/api/shop/messages').send(body);
const ok = { name: ' Lan ', phone: '0901 234 567', email: ' Lan@Example.com ', message: ' Mình muốn đặt 5 hũ làm quà. ' };

it('gửi: bỏ khoảng trắng, email viết thường / không bắt buộc, bẫy bot bỏ qua, dữ liệu sai 400; BO xem, đánh dấu đã xử lý, xóa; chưa đăng nhập 401', async () => {
  expect((await send(ok).expect(201)).body).toEqual({ ok: true });
  await send({ name: 'Mai', phone: '0912345678', email: '', message: 'Có giao Hà Nội không?' }).expect(201);
  await send({ ...ok, website: 'http://spam' }).expect(201);
  const bad = async (body: object) => JSON.stringify((await send(body).expect(400)).body.message);
  expect(await bad({ ...ok, name: '  ' })).toContain('Vui lòng nhập họ tên.');
  expect(await bad({ ...ok, phone: 'abc' })).toContain('Số điện thoại không đúng.');
  expect(await bad({ ...ok, email: 'khong-phai-email' })).toContain('Email không đúng.');
  expect(await bad({ ...ok, message: 'x'.repeat(1001) })).toContain('Nội dung tối đa 1000 ký tự.');

  await t.anon().get('/api/admin/messages').expect(401);
  const list = (await t.get('/api/admin/messages').expect(200)).body as { id: string; name: string; email: string; message: string; handled: boolean }[];
  expect(list.map(({ name, email, message, handled }) => ({ name, email, message, handled }))).toEqual([
    { name: 'Mai', email: '', message: 'Có giao Hà Nội không?', handled: false },
    { name: 'Lan', email: 'lan@example.com', message: 'Mình muốn đặt 5 hũ làm quà.', handled: false },
  ]);

  const after = (await t.patch(`/api/admin/messages/${list[1].id}`, { handled: true }).expect(200)).body;
  expect(after.find((m: { id: string }) => m.id === list[1].id).handled).toBe(true);
  await t.patch('/api/admin/messages/khong-co', { handled: true }).expect(404);

  expect((await t.del(`/api/admin/messages/${list[0].id}`).expect(200)).body).toHaveLength(1);
  await t.del(`/api/admin/messages/${list[0].id}`).expect(404);

  await t.post('/api/admin/reset', { confirm: 'XÓA HẾT' }).expect(204);
  expect((await t.get('/api/admin/messages').expect(200)).body).toEqual([]);
});

// Chạy sau cùng: bộ đếm theo IP giữ trong bộ nhớ của app (3 lần hợp lệ ở test trên — dữ liệu sai bị chặn trước khi đếm — + 2 lần ở đây)
it('mỗi IP tối đa 5 lời nhắn / 10 phút, quá thì 429 kèm câu tiếng Việt', async () => {
  for (let i = 0; i < 2; i++) await send({ ...ok, name: `Khách ${i}` }).expect(201);
  expect((await send(ok).expect(429)).body.message).toBe('Bạn gửi quá nhiều lần, thử lại sau ít phút.');
  expect((await t.get('/api/admin/messages').expect(200)).body).toHaveLength(2);
});
