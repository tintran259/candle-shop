// Định dạng thống nhất cho toàn bộ back office (tiền đang là USD giống fe)
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const currencyExact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const number = new Intl.NumberFormat("vi-VN");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const formatMoney = (n: number) => currency.format(n);
export const formatMoneyExact = (n: number) => currencyExact.format(n);
export const formatMoneyCompact = (n: number) => `$${compact.format(n)}`;
export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (n: number) => `${n > 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
