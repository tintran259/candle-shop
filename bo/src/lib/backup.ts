// Sao lưu / khôi phục toàn bộ dữ liệu BO đang lưu trên trình duyệt (docs/pages/settings.md#sao-lưu-dữ-liệu).
// Chỉ lấy các khóa "bo-" (đơn, sản phẩm, kho, khách, mã giảm giá, Thủ công, cài đặt…), không lấy phiên đăng nhập.
// Khi có BE: bỏ chức năng này, dữ liệu nằm trên server.
import dayjs from "dayjs";

const PREFIX = "bo-";
// Thời điểm sao lưu gần nhất — để nhắc, không nằm trong file sao lưu
const LAST_KEY = "bo-backup-last";
const APP = "2510-bo";

export type BackupFile = { app: typeof APP; version: 1; exportedAt: string; data: Record<string, string> };

const ownKeys = () => Object.keys(localStorage).filter((k) => k.startsWith(PREFIX) && k !== LAST_KEY);

export function createBackup(at = new Date()): BackupFile {
  const data: Record<string, string> = {};
  for (const k of ownKeys()) data[k] = localStorage.getItem(k) ?? "";
  return { app: APP, version: 1, exportedAt: at.toISOString(), data };
}

// Tải file về máy và ghi nhớ lần sao lưu
export function downloadBackup() {
  const file = createBackup();
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `2510-bo-sao-luu-${dayjs(file.exportedAt).format("YYYY-MM-DD-HHmm")}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  localStorage.setItem(LAST_KEY, file.exportedAt);
  return file;
}

export const lastBackupAt = () => {
  try {
    return localStorage.getItem(LAST_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

// Đọc file sao lưu: đúng định dạng của BO, mỗi khóa "bo-" là JSON hợp lệ
export function parseBackup(text: string): { file: BackupFile } | { error: string } {
  let file: Partial<BackupFile>;
  try {
    file = JSON.parse(text);
  } catch {
    return { error: "File không phải JSON." };
  }
  if (file?.app !== APP || file.version !== 1 || !file.data || typeof file.data !== "object") return { error: "Không phải file sao lưu của 2510 Back Office." };
  const entries = Object.entries(file.data);
  if (!entries.length) return { error: "File sao lưu không có dữ liệu." };
  for (const [k, v] of entries) {
    if (!k.startsWith(PREFIX) || typeof v !== "string") return { error: `Dữ liệu không hợp lệ ở mục ${k}.` };
    try {
      JSON.parse(v);
    } catch {
      return { error: `Dữ liệu hỏng ở mục ${k}.` };
    }
  }
  return { file: file as BackupFile };
}

const count = (raw: string | undefined, pick: (v: unknown) => unknown = (v) => v) => {
  try {
    const v = pick(raw ? JSON.parse(raw) : undefined);
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
};

// Tóm tắt để admin xem trước khi khôi phục
export function backupSummary(file: BackupFile) {
  const d = file.data;
  return {
    exportedAt: file.exportedAt,
    orders: count(d["bo-orders-v4"]),
    products: count(d["bo-products-v2"]),
    customers: count(d["bo-customers-v1"]),
    materials: count(d["bo-inventory-v2"], (v) => (v as { materials?: unknown })?.materials),
    discounts: count(d["bo-discounts-v1"]),
  };
}

// Thay toàn bộ dữ liệu hiện tại bằng dữ liệu trong file. Gọi xong nên tải lại trang để mọi màn hình đọc lại.
// Trả false khi trình duyệt hết chỗ lưu — khi đó đã khôi phục lại dữ liệu cũ
export function restoreBackup(file: BackupFile) {
  const before = createBackup();
  try {
    for (const k of ownKeys()) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(file.data)) localStorage.setItem(k, v);
    return true;
  } catch {
    for (const k of ownKeys()) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(before.data)) localStorage.setItem(k, v);
    return false;
  }
}
