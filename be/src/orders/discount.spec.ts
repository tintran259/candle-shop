// Mã giảm giá khi tạo / sửa đơn: trạng thái mã, mã riêng, đơn tối thiểu, lần đầu, lượt mỗi khách, phạm vi, % / số tiền / miễn phí giao
import { evaluateDiscount, type Line } from './discount.js';
import { vnDay } from './money.js';

type Code = NonNullable<Parameters<typeof evaluateDiscount>[0]['d']>;
const today = vnDay();
const shift = (days: number) => vnDay(new Date(Date.now() + days * 86_400_000));

const code = (over: Partial<Code> = {}): Code => ({
  id: 'd1',
  code: 'GIAM10',
  description: null,
  type: 'percent',
  value: 10,
  maxDiscount: null,
  minOrder: null,
  scope: 'all',
  firstOrderOnly: false,
  startsAt: today,
  endsAt: null,
  usageLimit: null,
  perCustomerLimit: null,
  used: 0,
  active: true,
  createdAt: today,
  customers: [],
  ...over,
});

const product = (price: number, quantity = 1): Line => ({ kind: 'product', price, quantity });
const custom = (price: number, quantity = 1): Line => ({ kind: 'custom', price, quantity });
const run = (d: Code | null, lines: Line[], over: Partial<Parameters<typeof evaluateDiscount>[0]> = {}) =>
  evaluateDiscount({ code: d?.code ?? 'KHONGCO', d, lines, shippingFee: 30_000, previous: [], ...over });

describe('Không có mã / mã không dùng được', () => {
  it('không nhập mã: không giảm, không lỗi', () => {
    expect(evaluateDiscount({ code: '  ', d: null, lines: [product(500_000)], shippingFee: 0, previous: [] })).toEqual({ amount: 0 });
  });

  it('mã không có', () => {
    expect(run(null, [product(500_000)])).toEqual({ amount: 0, error: 'Không có mã này.' });
  });

  it('tạm dừng, hết hạn, hết lượt, chưa tới ngày', () => {
    expect(run(code({ active: false }), [product(500_000)]).error).toBe('Mã đang tạm dừng.');
    expect(run(code({ endsAt: shift(-1) }), [product(500_000)]).error).toBe('Mã đã hết hạn.');
    expect(run(code({ usageLimit: 5, used: 5 }), [product(500_000)]).error).toBe('Mã đã hết lượt dùng.');
    expect(run(code({ startsAt: shift(1) }), [product(500_000)]).error).toBe('Mã chưa tới ngày áp dụng.');
    // Hết hạn hôm nay vẫn dùng được
    expect(run(code({ endsAt: today }), [product(500_000)]).amount).toBe(50_000);
  });

  it('mã riêng: chỉ khách được chọn', () => {
    const d = code({ customers: [{ discountId: 'd1', customerId: 'cus-a' }] });
    expect(run(d, [product(500_000)], { customerId: 'cus-a' }).amount).toBe(50_000);
    expect(run(d, [product(500_000)], { customerId: 'cus-b' }).error).toBe('Mã này dành riêng cho khách khác.');
    expect(run(d, [product(500_000)]).error).toMatch(/nhập đúng số điện thoại/);
  });

  it('đơn tối thiểu tính trên tiền hàng (không gồm phí giao)', () => {
    const d = code({ minOrder: 500_000 });
    expect(run(d, [product(499_000)]).error).toMatch(/^Đơn từ 500.000\s₫ mới dùng được mã này\.$/);
    expect(run(d, [product(250_000, 2)]).amount).toBe(50_000);
  });

  it('chỉ đơn đầu: đơn đã hủy không tính', () => {
    const d = code({ firstOrderOnly: true });
    expect(run(d, [product(500_000)], { previous: [{ status: 'completed', discountCode: null }] }).error).toBe('Mã chỉ dành cho khách đặt lần đầu.');
    expect(run(d, [product(500_000)], { previous: [{ status: 'cancelled', discountCode: null }] }).amount).toBe(50_000);
  });

  it('lượt mỗi khách: đếm đơn chưa hủy đã dùng mã', () => {
    const d = code({ perCustomerLimit: 1 });
    expect(run(d, [product(500_000)], { previous: [{ status: 'paid', discountCode: 'GIAM10' }] }).error).toBe('Khách đã dùng hết lượt của mã này.');
    expect(run(d, [product(500_000)], { previous: [{ status: 'cancelled', discountCode: 'GIAM10' }] }).amount).toBe(50_000);
  });
});

describe('Số tiền giảm', () => {
  it('% làm tròn nghìn, có mức tối đa', () => {
    expect(run(code({ value: 15 }), [product(333_000)]).amount).toBe(50_000); // 49.950 → 50.000
    expect(run(code({ value: 50, maxDiscount: 100_000 }), [product(500_000)]).amount).toBe(100_000);
  });

  it('số tiền cố định không quá tiền hàng', () => {
    expect(run(code({ type: 'fixed', value: 100_000 }), [product(300_000)]).amount).toBe(100_000);
    expect(run(code({ type: 'fixed', value: 500_000 }), [product(300_000)]).amount).toBe(300_000);
  });

  it('miễn phí giao = phí giao; đơn đã miễn phí giao thì báo không có tác dụng', () => {
    expect(run(code({ type: 'freeship' }), [product(300_000)]).amount).toBe(30_000);
    expect(run(code({ type: 'freeship' }), [product(300_000)], { shippingFee: 0 }).error).toBe('Đơn đang miễn phí giao — mã không có tác dụng.');
  });

  it('phạm vi: chỉ tính trên dòng phù hợp', () => {
    const lines = [product(400_000), custom(600_000)];
    expect(run(code({ scope: 'products' }), lines).amount).toBe(40_000);
    expect(run(code({ scope: 'custom' }), lines).amount).toBe(60_000);
    expect(run(code({ scope: 'all' }), lines).amount).toBe(100_000);
    expect(run(code({ scope: 'custom' }), [product(400_000)]).error).toBe('Mã chỉ áp dụng cho nến tự phối.');
    expect(run(code({ scope: 'products' }), [custom(400_000)]).error).toBe('Mã chỉ áp dụng cho nến có sẵn.');
  });

  it('giá / số lượng lẻ được làm tròn, âm tính 0', () => {
    expect(run(code({ type: 'fixed', value: 1_000_000 }), [product(100_000.4, 2.4), product(-50_000)]).amount).toBe(200_000);
  });
});

describe('Sửa đơn giữ mã cũ (relaxed)', () => {
  it('bỏ qua hạn dùng, hết lượt, lần đầu, mã riêng; vẫn kiểm tra đơn tối thiểu và phạm vi', () => {
    const d = code({ active: false, endsAt: shift(-10), usageLimit: 1, used: 1, firstOrderOnly: true, customers: [{ discountId: 'd1', customerId: 'cus-x' }], minOrder: 300_000 });
    const previous = [{ status: 'completed', discountCode: 'GIAM10' }];
    expect(run(d, [product(500_000)], { previous, relaxed: true }).amount).toBe(50_000);
    expect(run(d, [product(200_000)], { previous, relaxed: true }).error).toMatch(/^Đơn từ 300.000/);
    expect(run({ ...d, scope: 'custom' }, [product(500_000)], { relaxed: true }).error).toBe('Mã chỉ áp dụng cho nến tự phối.');
  });
});
