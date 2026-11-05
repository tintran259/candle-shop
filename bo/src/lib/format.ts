// Định dạng thống nhất cho toàn bộ back office. Tiền là VNĐ, lưu số nguyên (đồng).
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("vi-VN");
const short = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export const formatMoney = (n: number) => currency.format(Math.round(n));
// Giá nhập hiện làm tròn tới 100 ₫: 16.064,52 → 16.100 ₫. Dưới 1.000 ₫ (giá mỗi gram, ml) giữ số lẻ: 59,8 ₫ — làm tròn 100 sẽ lệch quá xa.
// Chỉ làm tròn lúc hiện; số lưu vẫn giữ 2 chữ số lẻ để tính bình quân, giá vốn không bị lệch dồn
const unitCurrency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 });
export const formatUnitCost = (n: number) => (Math.abs(n) >= 1000 ? formatMoney(Math.round(n / 100) * 100) : unitCurrency.format(n));
// Giá nhập trước → sau một phiếu: "90 ₫ → 93 ₫"; chưa có giá hoặc không đổi thì chỉ giá sau
export const formatCostChange = (before: number | undefined, after: number) =>
  before === undefined || before === after ? formatUnitCost(after) : `${formatUnitCost(before)} → ${formatUnitCost(after)}`;
// Rút gọn cho số lớn trên thẻ: 643,2 tr ₫ · 1,2 tỷ ₫
export const formatMoneyShort = (n: number) => {
  if (Math.abs(n) >= 1e9) return `${short.format(n / 1e9)} tỷ ₫`;
  if (Math.abs(n) >= 1e6) return `${short.format(n / 1e6)} tr ₫`;
  return formatMoney(n);
};
// Nhãn trục biểu đồ: 25tr, 800k
export const formatMoneyAxis = (n: number): string => {
  if (n < 0) return `-${formatMoneyAxis(-n)}`;
  if (n >= 1e9) return `${short.format(n / 1e9)}tỷ`;
  if (n >= 1e6) return `${short.format(n / 1e6)}tr`;
  if (n >= 1e3) return `${short.format(n / 1e3)}k`;
  return String(n);
};
export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (n: number) => `${n > 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

// Chữ viết tắt cho avatar: 2 chữ cuối của tên Việt ("Trần Bảo Ngọc" → "BN")
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
