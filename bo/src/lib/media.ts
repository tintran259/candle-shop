// Kho ảnh (Cài đặt › Kho ảnh, docs/pages/media.md): ảnh trên Cloudinary do BE đọc qua Admin API, kèm nơi đang dùng
export type MediaFolder = "products" | "craft" | "orders" | "site" | "misc";

export type MediaImage = {
  publicId: string;
  // Tên ảnh (phần cuối public_id), vd "sap-dau-nanh-20261118-151230"
  name: string;
  folder: MediaFolder;
  url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  // Nơi đang dùng ("Sản phẩm: Nến Vanilla", "Đơn DH0123 · khiếu nại"…). Trống = ảnh thừa, xóa được
  usedIn: string[];
};

export const folderLabels: Record<MediaFolder, string> = { products: "Sản phẩm", craft: "Thủ công & Kho", orders: "Đơn hàng", site: "Giao diện web", misc: "Khác" };

// 1.536 byte → "1,5 KB"; 2.300.000 → "2,2 MB"
export function formatBytes(n: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("vi-VN", { maximumFractionDigits: i ? 1 : 0 })} ${units[i]}`;
}
