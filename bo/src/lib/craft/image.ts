// Ảnh: nén trên trình duyệt (cạnh dài ≤ 800px, WebP) rồi lưu.
// - Chế độ BE có cấu hình Cloudinary: xin chữ ký ở BE (POST /api/admin/uploads/sign), tải thẳng lên Cloudinary, lưu URL ảnh.
// - Chưa cấu hình kho ảnh (BE trả 503) hoặc chế độ dữ liệu trên trình duyệt: lưu data URL như trước.
import { api, ApiError } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { notifyError } from "@/lib/notify";

export const MAX_IMAGES = 6;
export const MAX_FILE_MB = 10;
const MAX_SIDE = 800;

// Thư mục trên Cloudinary theo nơi dùng ảnh (BE chỉ nhận các giá trị này)
export type ImageFolder = "products" | "craft" | "orders" | "misc";

async function draw(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("Không nén được ảnh."))), "image/webp", 0.8));

type Signed = { uploadUrl: string; apiKey: string; timestamp: number; folder: string; signature: string };

// Kho ảnh chưa cấu hình: chỉ báo một lần mỗi lần mở BO
let warned = false;

export async function storeImage(file: File, folder: ImageFolder = "misc"): Promise<string> {
  const canvas = await draw(file);
  if (!REMOTE) return canvas.toDataURL("image/webp", 0.8);
  let signed: Signed;
  try {
    signed = await api<Signed>("POST", "/admin/uploads/sign", { folder });
  } catch (e) {
    if (e instanceof ApiError && e.status === 503) {
      if (!warned) notifyError("Chưa cấu hình kho ảnh (Cloudinary) — ảnh tạm lưu trong DB. Xem docs/backend.md#kho-ảnh-cloudinary.");
      warned = true;
      return canvas.toDataURL("image/webp", 0.8);
    }
    throw e;
  }
  const form = new FormData();
  form.append("file", await toBlob(canvas), file.name.replace(/\.\w+$/, "") + ".webp");
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("folder", signed.folder);
  form.append("signature", signed.signature);
  const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) throw new Error(`Không tải được ảnh lên kho ảnh${data.error?.message ? `: ${data.error.message}` : ""}.`);
  return data.secure_url;
}

// Link ảnh tối ưu theo cỡ hiển thị — tách riêng để dùng được cả ở test logic (không kéo theo lớp gọi API)
export { imageUrl } from "@/lib/craft/image-url";
