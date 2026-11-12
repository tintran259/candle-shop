// Lời nhắn liên hệ: web gửi (công khai) → BO xem / đánh dấu đã xử lý / xóa; kiểm tra dữ liệu; chống spam (bẫy bot, gửi quá nhanh,
// 5 lần / 10 phút mỗi IP, trùng nội dung trong 24 giờ, 3 lời nhắn / 24 giờ mỗi SĐT); Xóa toàn bộ dữ liệu cũng xóa lời nhắn
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

// Mỗi test dùng IP riêng (X-Forwarded-For, BE tin 1 proxy) để bộ đếm theo IP không lẫn giữa các test
const sender = (ip: string) => (body: object) => t.anon().post('/api/shop/messages').set('X-Forwarded-For', ip).send(body);
const ok = { name: ' Lan ', phone: '0901 234 567', email: ' Lan@Example.com ', message: ' Mình muốn đặt 5 hũ làm quà. ', elapsed: 8000 };
const saved = async () => (await t.get('/api/admin/messages').expect(200)).body as { id: string; name: string; phone: string; email: string; message: string; handled: boolean }[];

it('gửi: bỏ khoảng trắng, email viết thường / không bắt buộc, dữ liệu sai 400; BO xem, đánh dấu đã xử lý, xóa; chưa đăng nhập 401', async () => {
  const send = sender('10.0.0.1');
  expect((await send(ok).expect(201)).body).toEqual({ ok: true });
  await send({ name: 'Mai', phone: '0912345678', email: '', message: 'Có giao Hà Nội không?', elapsed: 5000 }).expect(201);
  const bad = async (body: object) => JSON.stringify((await send(body).expect(400)).body.message);
  expect(await bad({ ...ok, name: '  ' })).toContain('Vui lòng nhập họ tên.');
  expect(await bad({ ...ok, phone: 'abc' })).toContain('Số điện thoại không đúng.');
  expect(await bad({ ...ok, email: 'khong-phai-email' })).toContain('Email không đúng.');
  expect(await bad({ ...ok, message: 'x'.repeat(1001) })).toContain('Nội dung tối đa 1000 ký tự.');

  await t.anon().get('/api/admin/messages').expect(401);
  const list = await saved();
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
  expect(await saved()).toEqual([]);
});

it('bot: điền ô bẫy, gửi dưới 3 giây hoặc không có elapsed (gọi thẳng API) → trả ok nhưng không lưu', async () => {
  const send = sender('10.0.0.2');
  await send({ ...ok, website: 'http://spam' }).expect(201);
  await send({ ...ok, elapsed: 1200 }).expect(201);
  const { elapsed: _drop, ...noElapsed } = ok;
  expect((await send(noElapsed).expect(201)).body).toEqual({ ok: true });
  expect(await saved()).toEqual([]);
  await send({ ...ok, elapsed: 3000 }).expect(201);
  expect(await saved()).toHaveLength(1);
});

it('trùng: cùng SĐT (viết khác: dấu cách, +84) + cùng nội dung (khác hoa thường / khoảng trắng) trong 24 giờ chỉ lưu một lần; khác nội dung thì lưu', async () => {
  const send = sender('10.0.0.3');
  await send(ok).expect(201);
  await send({ ...ok, phone: '+84901234567', message: 'MÌNH muốn đặt   5 hũ làm quà.' }).expect(201);
  expect(await saved()).toHaveLength(1);
  await send({ ...ok, message: 'Cho mình hỏi thêm về giá.' }).expect(201);
  expect(await saved()).toHaveLength(2);
  // Lời nhắn cũ hơn 24 giờ không tính trùng
  await t.prisma.contactMessage.updateMany({ data: { createdAt: new Date(Date.now() - 25 * 3_600_000) } });
  await send(ok).expect(201);
  expect(await saved()).toHaveLength(3);
});

it('mỗi SĐT tối đa 3 lời nhắn / 24 giờ (khác IP vẫn tính), quá thì 429 kèm câu tiếng Việt', async () => {
  for (let i = 0; i < 3; i++) await sender(`10.1.0.${i}`)({ ...ok, message: `Lời nhắn ${i}` }).expect(201);
  const res = await sender('10.1.0.9')({ ...ok, phone: '+84 901 234 567', message: 'Lời nhắn thứ tư' }).expect(429);
  expect(res.body.message).toBe('Số điện thoại này đã gửi nhiều lời nhắn hôm nay — chúng tôi sẽ liên lạc lại với bạn sớm.');
  // Số khác vẫn gửi được
  await sender('10.1.0.9')({ ...ok, phone: '0912 345 678', message: 'Lời nhắn thứ tư' }).expect(201);
  expect(await saved()).toHaveLength(4);
});

it('mỗi IP tối đa 5 lời nhắn / 10 phút, quá thì 429; lượt của bot không tính', async () => {
  const send = sender('10.0.0.5');
  await send({ ...ok, elapsed: 100 }).expect(201);
  for (let i = 0; i < 5; i++) await send({ ...ok, phone: `09000000${10 + i}`, message: `Khách ${i}` }).expect(201);
  expect((await send({ ...ok, phone: '0900000099', message: 'Thứ sáu' }).expect(429)).body.message).toBe('Bạn gửi quá nhiều lần, thử lại sau ít phút.');
  expect(await saved()).toHaveLength(5);
});
