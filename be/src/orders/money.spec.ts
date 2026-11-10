// Tiền của đơn: đã trả, còn lại, trả dư, tiền cọc, tiền hoàn khi hủy — các ngưỡng làm tròn, tối thiểu, tối đa
import { depositAmount, formatMoney, overpaid, paidAmount, refundFor, remaining, vnDay, viDate } from './money.js';

const pay = (amount: number, status = 'success') => ({ amount, status });
const order = (over: Partial<Parameters<typeof refundFor>[0]> = {}) => ({ total: 1_030_000, shippingFee: 30_000, depositPercent: 50, status: 'paid', payments: [pay(500_000)], ...over });

describe('Tiền đã trả / còn lại / trả dư', () => {
  it('chỉ cộng khoản thành công', () => {
    expect(paidAmount({ payments: [pay(300_000), pay(200_000, 'pending'), pay(100_000, 'failed'), pay(50_000)] })).toBe(350_000);
    expect(paidAmount({ payments: [] })).toBe(0);
  });

  it('còn lại không âm', () => {
    expect(remaining({ total: 1_000_000, payments: [pay(400_000)] })).toBe(600_000);
    expect(remaining({ total: 1_000_000, payments: [pay(1_200_000)] })).toBe(0);
  });

  it('trả dư sau khi sửa đơn bớt hàng; đơn đã hủy không tính trả dư', () => {
    expect(overpaid({ total: 800_000, status: 'paid', payments: [pay(1_000_000)] })).toBe(200_000);
    expect(overpaid({ total: 800_000, status: 'paid', payments: [pay(500_000)] })).toBe(0);
    expect(overpaid({ total: 800_000, status: 'cancelled', payments: [pay(1_000_000)] })).toBe(0);
  });
});

describe('Tiền cọc', () => {
  it('làm tròn tới nghìn đồng', () => {
    expect(depositAmount(1_000_000, 50)).toBe(500_000);
    expect(depositAmount(850_000, 30)).toBe(255_000);
    // 333.333 → 333.000; 666.666 → 667.000
    expect(depositAmount(1_000_000, 33.3333)).toBe(333_000);
    expect(depositAmount(1_333_330, 50)).toBe(667_000);
  });

  it('ít nhất 1.000 ₫ nhưng không quá tổng', () => {
    expect(depositAmount(1_500, 10)).toBe(1_000);
    expect(depositAmount(800, 50)).toBe(800);
    expect(depositAmount(500_000, 100)).toBe(500_000);
  });

  it('đơn 0 ₫ hoặc 0% thì không cọc', () => {
    expect(depositAmount(0, 50)).toBe(0);
    expect(depositAmount(500_000, 0)).toBe(0);
  });
});

describe('Tiền hoàn khi hủy đơn', () => {
  it('lỗi do shop: hoàn toàn bộ tiền đã trả', () => {
    expect(refundFor(order(), 'shop')).toBe(500_000);
  });

  it('lỗi do khách: giữ phần cọc tính trên tiền hàng (không gồm phí giao)', () => {
    // tiền hàng 1.000.000, cọc 50% = 500.000 → đã trả 500.000 thì không hoàn
    expect(refundFor(order(), 'customer')).toBe(0);
    // đã trả đủ 1.030.000 → hoàn 530.000
    expect(refundFor(order({ payments: [pay(1_030_000)] }), 'customer')).toBe(530_000);
  });

  it('lỗi do khách: % cọc theo đơn; đơn cũ không có % thì dùng 50%', () => {
    expect(refundFor(order({ depositPercent: 30, payments: [pay(1_030_000)] }), 'customer')).toBe(730_000);
    expect(refundFor(order({ depositPercent: null, payments: [pay(1_030_000)] }), 'customer')).toBe(530_000);
  });

  it('lỗi do khách mà chưa trả đủ cọc: không hoàn, không âm', () => {
    expect(refundFor(order({ payments: [pay(200_000)] }), 'customer')).toBe(0);
    expect(refundFor(order({ payments: [] }), 'customer')).toBe(0);
  });
});

describe('Định dạng', () => {
  it('tiền VNĐ, làm tròn', () => {
    expect(formatMoney(1_234_567.6).replace(/\s/g, ' ')).toBe('1.234.568 ₫');
  });

  it('ngày theo giờ Việt Nam (UTC+7)', () => {
    expect(vnDay(new Date('2026-11-10T16:59:59Z'))).toBe('2026-11-10');
    expect(vnDay(new Date('2026-11-10T17:00:00Z'))).toBe('2026-11-11');
    expect(viDate('2026-11-09')).toBe('09/11/2026');
  });
});
