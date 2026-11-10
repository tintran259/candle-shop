// Hàm chuyển giá trị trong file sao lưu BO (JSON tự do) sang kiểu cột Prisma — dùng chung cho map-backup.ts, map-orders.ts
// oxlint-disable-next-line no-explicit-any
export type J = any;

export const int = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : undefined);
export const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : undefined);
export const date = (s: unknown) => (typeof s === "string" && s ? new Date(s) : undefined);
export const str = (s: unknown) => (typeof s === "string" && s !== "" ? s : undefined);
