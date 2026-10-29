// Định dạng thống nhất cho toàn bộ back office. Tiền là VNĐ, lưu số nguyên (đồng).
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("vi-VN");
const short = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export const formatMoney = (n: number) => currency.format(Math.round(n));
// Rút gọn cho số lớn trên thẻ: 643,2 tr ₫ · 1,2 tỷ ₫
export const formatMoneyShort = (n: number) => {
  if (Math.abs(n) >= 1e9) return `${short.format(n / 1e9)} tỷ ₫`;
  if (Math.abs(n) >= 1e6) return `${short.format(n / 1e6)} tr ₫`;
  return formatMoney(n);
};
// Nhãn trục biểu đồ: 25tr, 800k
export const formatMoneyAxis = (n: number) => {
  if (n >= 1e9) return `${short.format(n / 1e9)}tỷ`;
  if (n >= 1e6) return `${short.format(n / 1e6)}tr`;
  if (n >= 1e3) return `${short.format(n / 1e3)}k`;
  return String(n);
};
export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (n: number) => `${n > 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
