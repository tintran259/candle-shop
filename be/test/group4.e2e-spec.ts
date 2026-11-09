// API nhóm 4: đơn hàng — tạo, sửa, các bước, giao hàng lỗi, hủy, hoàn tiền, khiếu nại; đơn nháp, thông báo đã đọc. DB thật, schema bo_test
import { createTestApp, resetDb } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;

beforeAll(async () => {
  t = await createTestApp();
});
afterAll(async () => {
  await t.app.close();
});

const settings = {
  depositPercent: 50,
  maxDeliveryAttempts: 2,
  resendFee: 25000,
  dailyCapacity: 20,
  leadDays: 2,
  minMargin: 50,
  priceMarkup: 2.5,
  sender: { name: '2510 Candle', phone: '', address: '' },
  shippingOptions: [{ id: 'standard', name: 'Tiêu chuẩn', fee: 30000, days: 3, enabled: true }],
  carriers: [
    { id: 'ghn', name: 'Giao Hàng Nhanh', trackingUrl: 'https://donhang.ghn.vn/?order_code={code}', requireCode: true, enabled: true },
    { id: 'self', name: 'Shop tự giao', requireCode: false, enabled: true },
  ],
};

beforeEach(async () => {
  await resetDb(t.prisma);
  await t.put('/api/admin/settings', settings).expect(200);
  await t.post('/api/admin/materials', { id: 'soy', name: 'Sáp đậu nành', category: 'wax', unit: 'g', tracked: true, stock: 5000, openingTotal: 300000 }).expect(201); // 60 ₫/g
  await t.post('/api/admin/materials', { id: 'jar', name: 'Hũ gốm', category: 'vessel', unit: 'pcs', tracked: true, stock: 10, openingTotal: 200000 }).expect(201); // 20.000 ₫/cái
  await t.post('/api/admin/categories', { id: 'fruit', name: { vi: 'Trái cây', en: '' } }).expect(201);
  await t
    .post('/api/admin/products', {
      name: 'Nến cam',
      price: 250000,
      images: ['cam.jpg'],
      categoryId: 'fruit',
      aromaLevel: 'soft',
      size: 'small',
      status: 'active',
      isNew: false,
      isFeatured: false,
      recipe: [
        { materialId: 'soy', quantity: 120 },
        { materialId: 'jar', quantity: 1 },
      ],
    })
    .expect(201);
  await t.post('/api/admin/discounts', { id: 'giam10', code: 'GIAM10', type: 'percent', value: 10, scope: 'all', firstOrderOnly: false, startsAt: '2020-01-01', active: true }).expect(201);
});

const product = (quantity = 2) => ({ kind: 'product', productId: 'nen-cam', price: 250000, quantity });
const custom = (quantity = 1) => ({
  kind: 'custom',
  custom: 'Hũ gốm · Sáp đậu nành',
  craft: { personal: { kind: 'inputs', values: { name: '' } } },
  recipe: [
    { materialId: 'soy', quantity: 150 },
    { materialId: 'jar', quantity: 1 },
  ],
  price: 320000,
  quantity,
});
const order = (over: object = {}) => ({
  customer: { name: 'Ngô Thanh Vy', phone: '0944 889 900' },
  shippingAddress: '25 Hàng Bạc, Hà Nội',
  shippingMethod: 'standard',
  carrierId: 'ghn',
  lines: [product(), custom()],
  discountCode: 'giam10',
  paymentPlan: 'deposit',
  paymentMethod: 'cod',
  received: true,
  readyDate: '2026-11-20',
  channel: 'zalo',
  ...over,
});
// Định dạng tiền (Intl, giống BO) dùng dấu cách không ngắt trước ₫
const sp = (v: unknown) => JSON.parse(JSON.stringify(v).replace(/ /g, ' '));
const stock = async (id: string) => (await t.get(`/api/admin/materials/${id}`).expect(200)).body.stock as number;

describe('Tạo đơn', () => {
  it('tính tiền, cọc trên tiền hàng, mã đơn, giữ nguyên liệu, tạo hồ sơ khách, đếm lượt mã', async () => {
    const r = await t.post('/api/admin/orders', order()).expect(201);
    const o = r.body.order;
    // 2 × 250.000 + 320.000 = 820.000; giảm 10% = 82.000; ship 30.000 → 768.000; cọc 50% của 738.000 = 369.000
    expect(o).toMatchObject({
      status: 'paid',
      subtotal: 820000,
      discount: 82000,
      discountCode: 'GIAM10',
      shippingFee: 30000,
      total: 768000,
      depositPercent: 50,
      carrier: { id: 'ghn' },
      shippingName: 'Tiêu chuẩn (3 ngày)',
    });
    expect(o.code).toMatch(/^SC\d{6}001$/);
    expect(o.payments).toEqual([expect.objectContaining({ amount: 369000, status: 'success' })]);
    expect(sp(o.history.map((e: { status: string; note: string }) => [e.status, e.note]))).toEqual([
      ['pending', 'Tạo đơn tại BO · Zalo'],
      ['paid', 'Nhận cọc 369.000 ₫'],
    ]);
    expect(o.items[0]).toMatchObject({ productId: 'nen-cam', name: 'Nến cam', image: 'cam.jpg', quantity: 2 });
    expect(o.items[1]).toMatchObject({ name: 'Nến tự phối', custom: 'Hũ gốm · Sáp đậu nành', recipe: custom().recipe });
    expect(r.body.createdCustomer).toBe(true);
    expect((await t.get('/api/admin/discounts').expect(200)).body[0].used).toBe(1);
    expect((await t.get('/api/admin/stock-holds').expect(200)).body).toEqual({ soy: 390, jar: 3 });
    expect(await stock('soy')).toBe(5000); // giữ, chưa trừ
    // Đơn sau: mã đơn tăng, cùng số điện thoại không tạo hồ sơ mới
    const r2 = await t.post('/api/admin/orders', order({ lines: [product(1)], discountCode: '', received: false })).expect(201);
    expect(r2.body.order.code).toMatch(/002$/);
    expect(r2.body.order.status).toBe('pending');
    expect(r2.body.createdCustomer).toBe(false);
    // BO gửi id tạo sẵn
    expect((await t.post('/api/admin/orders', order({ id: 'ord-tu-bo', lines: [product(1)], discountCode: '' })).expect(201)).body.order.id).toBe('ord-tu-bo');
    await t.post('/api/admin/orders', order({ id: 'ord-tu-bo', lines: [product(1)], discountCode: '' })).expect(409);
  });

  it('cọc theo % từng đơn; trả sau: không có khoản thu, xác nhận đơn rồi làm, khách nhận thì thu đủ; hủy không cần lỗi do ai', async () => {
    // Cọc 30% của 820.000 − 82.000 = 738.000 → 221.000 (làm tròn nghìn)
    const dep = (await t.post('/api/admin/orders', order({ depositPercent: 30 })).expect(201)).body.order;
    expect(dep).toMatchObject({ depositPercent: 30, payments: [expect.objectContaining({ amount: 221000, status: 'success' })] });
    await t.post('/api/admin/orders', order({ depositPercent: 100, discountCode: '' })).expect(400);

    const later = (await t.post('/api/admin/orders', order({ paymentPlan: 'later', received: false, discountCode: '', lines: [product(1)] })).expect(201)).body.order;
    expect(later).toMatchObject({ status: 'pending', paymentPlan: 'later', total: 280000, payments: [] });
    expect((await t.get('/api/admin/stock-holds').expect(200)).body.jar).toBe(3); // chỉ đơn cọc đang giữ
    // Xác nhận đơn (không thu tiền) → giữ nguyên liệu
    expect((await t.post(`/api/admin/orders/${later.id}/advance`).expect(200)).body).toMatchObject({ status: 'paid', payments: [] });
    expect((await t.get('/api/admin/stock-holds').expect(200)).body.jar).toBe(4);
    for (let i = 0; i < 2; i++) await t.post(`/api/admin/orders/${later.id}/advance`).expect(200);
    await t.post(`/api/admin/orders/${later.id}/ship`, { trackingCode: 'GHNLATER' }).expect(200);
    const done = (await t.post(`/api/admin/orders/${later.id}/advance`).expect(200)).body;
    expect(done).toMatchObject({ status: 'completed', payments: [expect.objectContaining({ amount: 280000, provider: 'cod', status: 'success' })] });

    // Trả sau, xác nhận luôn lúc tạo; hủy không hỏi lỗi do ai (chưa thu gì)
    const confirmed = (await t.post('/api/admin/orders', order({ paymentPlan: 'later', received: true, discountCode: '', lines: [product(1)] })).expect(201)).body.order;
    expect(confirmed.status).toBe('paid');
    expect(confirmed.history.at(-1).note).toBe('Xác nhận đơn · trả tiền khi nhận hàng');
    const c = await t.post(`/api/admin/orders/${confirmed.id}/cancel`, { reason: 'Khách đổi ý' }).expect(200);
    expect(c.body.order.refundDue).toBeUndefined();
  });

  it('chặn: kho không đủ trên phần còn dùng được, mã sai, khách bị chặn (trừ khi xác nhận), dòng tự phối thiếu công thức', async () => {
    await t.post('/api/admin/orders', order()).expect(201); // giữ 3 hũ
    const short = await t.post('/api/admin/orders', order({ lines: [product(8)], discountCode: '' })).expect(409);
    expect(short.body.shortages).toEqual([{ materialId: 'jar', name: 'Hũ gốm', need: 8, available: 7 }]);
    expect((await t.post('/api/admin/orders', order({ lines: [product(1)], discountCode: 'KHONGCO' })).expect(400)).body.message).toContain('Không có mã này');
    await t.post('/api/admin/orders', order({ lines: [{ ...custom(), recipe: undefined }], discountCode: '' })).expect(400);
    const cus = (await t.get('/api/admin/customers').expect(200)).body[0];
    await t.patch(`/api/admin/customers/${cus.id}`, { blocked: true, blockReason: 'Bom hàng' }).expect(200);
    const b = await t.post('/api/admin/orders', order({ lines: [product(1)], discountCode: '' })).expect(409);
    expect(b.body).toMatchObject({ blocked: true, customerId: cus.id });
    await t.post('/api/admin/orders', order({ lines: [product(1)], discountCode: '', allowBlocked: true })).expect(201);
  });
});

describe('Luồng đơn', () => {
  it('làm → giao → giao không thành → hoàn về → gửi lại → hoàn tất → khiếu nại', async () => {
    const id = (await t.post('/api/admin/orders', order()).expect(201)).body.order.id;
    const p = await t.post(`/api/admin/orders/${id}/advance`).expect(200);
    // Bắt đầu làm: trừ Kho, chốt giá vốn 390 g × 60 + 3 × 20.000
    expect(p.body).toMatchObject({ status: 'producing', materialCost: 83400 });
    expect(await stock('soy')).toBe(4610);
    expect((await t.get('/api/admin/stock-movements?type=order').expect(200)).body).toHaveLength(2);
    expect((await t.get('/api/admin/stock-holds').expect(200)).body).toEqual({});
    await t.post(`/api/admin/orders/${id}/advance`).expect(200); // Chờ giao
    await t.post(`/api/admin/orders/${id}/advance`).expect(400); // cần ship()
    await t.post(`/api/admin/orders/${id}/ship`, {}).expect(400); // GHN cần mã vận đơn
    const s = await t.post(`/api/admin/orders/${id}/ship`, { trackingCode: ' ghn 123 ', cost: 30000 }).expect(200);
    expect(s.body).toMatchObject({
      status: 'shipping',
      shippingCost: 30000,
      shipment: { carrierId: 'ghn', trackingCode: 'GHN123', trackingUrl: 'https://donhang.ghn.vn/?order_code=GHN123', cost: 30000 },
    });
    const f1 = await t.post(`/api/admin/orders/${id}/delivery-failed`, { reason: 'Không nghe máy' }).expect(200);
    expect(f1.body).toMatchObject({ status: 'delivery_failed', deliveryAttempts: 1 });
    await t.post(`/api/admin/orders/${id}/redeliver`).expect(200);
    const f2 = await t.post(`/api/admin/orders/${id}/delivery-failed`, { reason: 'Đi vắng' }).expect(200);
    expect(f2.body).toMatchObject({ status: 'returning', deliveryAttempts: 2 }); // hết 2 lần
    const back = await t.post(`/api/admin/orders/${id}/receive-return`, { condition: 'good', returnFee: 20000 }).expect(200);
    expect(back.body).toMatchObject({ status: 'returned', returnCondition: 'good', shippingCost: 50000 });
    const re = await t.post(`/api/admin/orders/${id}/resend`, { carrierId: 'self', cost: 15000 }).expect(200);
    expect(re.body).toMatchObject({ status: 'shipping', total: 793000, shippingFee: 55000, resendFee: 25000, shippingCost: 65000, deliveryAttempts: 0, shipment: { carrierId: 'self' } });
    expect(re.body.returnCondition).toBeUndefined();
    const done = await t.post(`/api/admin/orders/${id}/advance`).expect(200);
    expect(done.body.status).toBe('completed');
    expect(done.body.payments.at(-1)).toMatchObject({ amount: 424000, provider: 'cod', status: 'success' }); // thu nốt 793.000 − 369.000
    // Khiếu nại: hoàn một phần, rồi gửi bù 1 cây (đơn 0 ₫ Đã thanh toán, giữ nguyên liệu)
    const c1 = await t.post(`/api/admin/orders/${id}/complaints`, { reason: 'Nắp móp', resolution: 'refund', refundAmount: 50000 }).expect(201);
    expect(c1.body.order.payments.at(-1)).toMatchObject({ amount: -50000, kind: 'refund' });
    await t.post(`/api/admin/orders/${id}/complaints`, { reason: 'X', resolution: 'refund', refundAmount: 9_000_000 }).expect(400);
    const itemId = done.body.items[0].id;
    const c2 = await t.post(`/api/admin/orders/${id}/complaints`, { reason: 'Vỡ 1 cây', resolution: 'resend', picks: [{ itemId, quantity: 1 }], readyDate: '2026-11-25' }).expect(201);
    expect(c2.body.replacement).toMatchObject({ status: 'paid', total: 0, replacementFor: { id }, items: [expect.objectContaining({ productId: 'nen-cam', price: 0, quantity: 1 })] });
    expect(c2.body.order.complaints.map((c: { resolution: string }) => c.resolution)).toEqual(['refund', 'resend']);
    expect((await t.get('/api/admin/stock-holds').expect(200)).body).toEqual({ soy: 120, jar: 1 });
  });

  it('mã vận đơn không trùng đơn khác; sửa lượt giao bù phí; đổi ngày làm xong; ghi chú nội bộ', async () => {
    const a = (await t.post('/api/admin/orders', order({ lines: [product(1)], discountCode: '' })).expect(201)).body.order.id;
    const b = (await t.post('/api/admin/orders', order({ lines: [product(1)], discountCode: '' })).expect(201)).body.order.id;
    const r = await t.patch(`/api/admin/orders/${a}/ready-date`, { readyDate: '2026-11-22' }).expect(200);
    expect(r.body.history.at(-1)).toMatchObject({ kind: 'schedule', note: 'Ngày làm xong mới: 22/11/2026' });
    for (const id of [a, b]) for (let i = 0; i < 2; i++) await t.post(`/api/admin/orders/${id}/advance`).expect(200);
    await t.post(`/api/admin/orders/${a}/ship`, { trackingCode: 'GHN1', cost: 30000 }).expect(200);
    expect((await t.post(`/api/admin/orders/${b}/ship`, { trackingCode: 'ghn1' }).expect(409)).body.message).toContain('GHN1');
    const u = await t.put(`/api/admin/orders/${a}/shipment`, { trackingCode: 'GHN2', cost: 35000 }).expect(200);
    expect(u.body).toMatchObject({ shippingCost: 35000, shipment: { trackingCode: 'GHN2', cost: 35000 } });
    expect((await t.patch(`/api/admin/orders/${a}/internal-note`, { internalNote: '  Gọi trước 30 phút ' }).expect(200)).body.internalNote).toBe('Gọi trước 30 phút');
  });
});

describe('Sửa đơn', () => {
  it('chưa thanh toán: đổi sản phẩm, bỏ mã (trả lượt), khoản chờ thu theo tổng mới, ghi lịch sử; không đổi gì thì không ghi', async () => {
    const o = (await t.post('/api/admin/orders', order({ received: false })).expect(201)).body.order;
    const base = { customer: o.customer, shippingAddress: o.shippingAddress, readyDate: o.readyDate };
    expect((await t.put(`/api/admin/orders/${o.id}`, base).expect(200)).body.changes).toEqual([]);
    const e = await t.put(`/api/admin/orders/${o.id}`, { ...base, lines: [product(1)], discountCode: '' }).expect(200);
    // 250.000 + 30.000 ship; cọc 50% của 250.000 = 125.000
    expect(e.body.order).toMatchObject({ subtotal: 250000, discount: 0, total: 280000, payments: [expect.objectContaining({ amount: 125000, status: 'pending' })] });
    expect(e.body.order.discountCode).toBeUndefined();
    expect(sp(e.body.changes)).toEqual(['Sản phẩm: Nến cam ×1', 'Bỏ mã giảm giá', 'Tổng 768.000 ₫ → 280.000 ₫']);
    expect(sp(e.body.order.history.at(-1))).toMatchObject({ kind: 'edit', note: 'Sửa đơn · Sản phẩm: Nến cam ×1 · Bỏ mã giảm giá · Tổng 768.000 ₫ → 280.000 ₫' });
    expect((await t.get('/api/admin/discounts').expect(200)).body[0].used).toBe(0);
  });

  it('đã thanh toán đủ rồi bớt hàng: thu dư → hoàn phần dư; đã bắt đầu làm thì không sửa sản phẩm', async () => {
    const o = (await t.post('/api/admin/orders', order({ paymentPlan: 'full', discountCode: '' })).expect(201)).body.order; // trả đủ 850.000
    const base = { customer: o.customer, shippingAddress: o.shippingAddress, readyDate: o.readyDate };
    await t.put(`/api/admin/orders/${o.id}`, { ...base, lines: [product(2)] }).expect(200); // còn 530.000 → dư 320.000
    await t.post(`/api/admin/orders/${o.id}/refund-overpaid`, { amount: 400000 }).expect(400);
    const r = await t.post(`/api/admin/orders/${o.id}/refund-overpaid`, { amount: 320000, images: ['ck.jpg'] }).expect(200);
    expect(r.body.payments.at(-1)).toMatchObject({ amount: -320000, kind: 'refund', images: ['ck.jpg'] });
    await t.post(`/api/admin/orders/${o.id}/refund-overpaid`, { amount: 1000 }).expect(400);
    await t.post(`/api/admin/orders/${o.id}/advance`).expect(200);
    await t.put(`/api/admin/orders/${o.id}`, { ...base, lines: [product(1)] }).expect(400);
    expect((await t.put(`/api/admin/orders/${o.id}`, { ...base, shippingAddress: '1 Lý Thái Tổ' }).expect(200)).body.changes).toEqual(['Địa chỉ giao: 1 Lý Thái Tổ']);
  });
});

describe('Hủy đơn', () => {
  it('đang làm: bắt chọn đã làm chưa và lỗi do ai; chưa làm thì hoàn đúng lượng đã trừ, trả lượt mã, lỗi do shop hoàn hết; ghi hoàn tiền', async () => {
    const id = (await t.post('/api/admin/orders', order()).expect(201)).body.order.id;
    await t.post(`/api/admin/orders/${id}/advance`).expect(200);
    expect(await stock('jar')).toBe(7);
    await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'Khách đổi ý', fault: 'shop' }).expect(400); // thiếu outcome
    await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'Khách đổi ý', outcome: 'returned' }).expect(400); // thiếu fault
    await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'Khách đổi ý', outcome: 'consumed', fault: 'shop' }).expect(400); // có nến tự phối
    const c = await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'Hết hũ đẹp', outcome: 'returned', fault: 'shop' }).expect(200);
    expect(c.body).toMatchObject({ restored: 2, stocked: 0, order: { status: 'cancelled', cancelOutcome: 'returned', cancelFault: 'shop', refundDue: 369000 } });
    expect(await stock('jar')).toBe(10);
    expect(await stock('soy')).toBe(5000);
    expect((await t.get('/api/admin/discounts').expect(200)).body[0].used).toBe(0);
    await t.post(`/api/admin/orders/${id}/refund`, { amount: 9_000_000 }).expect(400);
    const r = await t.post(`/api/admin/orders/${id}/refund`, { amount: 369000, images: ['ck.jpg'], note: 'Chuyển khoản' }).expect(200);
    expect(r.body.refund).toMatchObject({ amount: 369000, images: ['ck.jpg'], note: 'Chuyển khoản', by: 'Admin 2510' });
    await t.post(`/api/admin/orders/${id}/refund`, { amount: 1000 }).expect(400); // đã ghi
    await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'x', fault: 'shop' }).expect(400); // đã hủy
  });

  it('đã làm xong: nến tự phối tự chuyển sang Sản phẩm hủy đơn; lỗi do khách giữ cọc (không hoàn)', async () => {
    const id = (await t.post('/api/admin/orders', order()).expect(201)).body.order.id;
    await t.post(`/api/admin/orders/${id}/advance`).expect(200);
    await t.post(`/api/admin/orders/${id}/advance`).expect(200); // Chờ giao
    const c = await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'Khách bom', fault: 'customer' }).expect(200);
    expect(c.body).toMatchObject({ stocked: 1, order: { cancelOutcome: 'stocked' } });
    expect(c.body.order.refundDue).toBeUndefined(); // đã trả đúng bằng cọc
    const list = (await t.get('/api/admin/cancelled-products').expect(200)).body;
    expect(list).toEqual([expect.objectContaining({ orderId: id, custom: 'Hũ gốm · Sáp đậu nành', price: 320000, quantity: 1, personalized: false, status: 'pending', cancelReason: 'Khách bom' })]);
    expect(await stock('jar')).toBe(7); // không hoàn
  });

  it('chưa thanh toán: hủy không cần lỗi do ai, nhả phần giữ', async () => {
    const id = (await t.post('/api/admin/orders', order({ received: false })).expect(201)).body.order.id;
    await t.post(`/api/admin/orders/${id}/advance`).expect(200); // Đã thanh toán → giữ
    expect((await t.get('/api/admin/stock-holds').expect(200)).body).toEqual({ soy: 390, jar: 3 });
    await t.post(`/api/admin/orders/${id}/cancel`, { reason: 'Khách hủy' }).expect(400); // đã thu cọc → cần fault
    const id2 = (await t.post('/api/admin/orders', order({ received: false, discountCode: '' })).expect(201)).body.order.id;
    expect((await t.post(`/api/admin/orders/${id2}/cancel`, { reason: 'Khách hủy' }).expect(200)).body.order.status).toBe('cancelled');
  });
});

describe('Đơn nháp, thông báo đã đọc', () => {
  it('lưu / đọc / xóa đơn nháp; đánh dấu đã đọc không trùng', async () => {
    expect((await t.get('/api/admin/order-draft').expect(200)).body).toEqual({});
    const d = await t.put('/api/admin/order-draft', { values: { name: 'Vy', lines: [product(1)] } }).expect(200);
    expect(d.body.values).toEqual({ name: 'Vy', lines: [product(1)] });
    await t.del('/api/admin/order-draft').expect(204);
    await t.post('/api/admin/notifications/read', { ids: ['low-soy', 'order-1'] }).expect(200);
    expect((await t.post('/api/admin/notifications/read', { ids: ['low-soy'] }).expect(200)).body).toEqual(['low-soy', 'order-1']);
  });
});
