// Ảnh: chọn ảnh thì chỉ nén trên trình duyệt (cạnh dài ≤ 800px, WebP) thành data URL để xem trước — chưa tải lên đâu.
// Bấm Lưu form thì uploadImages() mới tải các ảnh mới lên Cloudinary và thay bằng URL:
// - Chế độ BE có cấu hình Cloudinary: xin chữ ký ở BE (POST /api/admin/uploads/sign), tải thẳng lên Cloudinary.
// - Chưa cấu hình kho ảnh (BE trả 503) hoặc chế độ dữ liệu trên trình duyệt: giữ data URL như trước.
import { api, ApiError } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { notifyError } from "@/lib/notify";

export const MAX_IMAGES = 6;
export const MAX_FILE_MB = 10;
const MAX_SIDE = 800;

// Thư mục trên Cloudinary theo nơi dùng ảnh (BE chỉ nhận các giá trị này)
export type ImageFolder = "products" | "craft" | "orders" | "site" | "misc";

// Nén ảnh vừa chọn → data URL (ảnh chờ tải lên khi Lưu)
// maxSide: cạnh dài tối đa (ảnh hero cần lớn hơn ảnh sản phẩm). WebP giữ nền trong suốt (logo PNG)
export async function prepareImage(file: File, maxSide = MAX_SIDE): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.8);
}

const isPending = (src: string) => src.startsWith("data:");

type Signed = { uploadUrl: string; apiKey: string; timestamp: number; folder: string; signature: string };

// Kho ảnh chưa cấu hình: chỉ báo một lần mỗi lần mở BO
let warned = false;

async function sendOne(dataUrl: string, signed: Signed, i: number) {
  const form = new FormData();
  form.append("file", await (await fetch(dataUrl)).blob(), `anh-${Date.now()}-${i}.webp`);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("folder", signed.folder);
  form.append("signature", signed.signature);
  const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) throw new Error(`Không tải được ảnh lên kho ảnh${data.error?.message ? `: ${data.error.message}` : ""}.`);
  return data.secure_url;
}

// Gọi khi bấm Lưu: tải các ảnh chưa tải (data URL) lên Cloudinary, giữ nguyên ảnh đã có URL. Lỗi thì ném — form giữ nguyên để lưu lại
export async function uploadImages(images: string[] | undefined, folder: ImageFolder): Promise<string[]> {
  const list = images ?? [];
  if (!REMOTE || !list.some(isPending)) return list;
  let signed: Signed;
  try {
    // Một chữ ký dùng cho cả lượt (cùng thư mục, cùng thời điểm)
    signed = await api<Signed>("POST", "/admin/uploads/sign", { folder });
  } catch (e) {
    if (e instanceof ApiError && e.status === 503) {
      if (!warned) notifyError("Chưa cấu hình kho ảnh (Cloudinary) — ảnh tạm lưu trong DB. Xem docs/backend.md#kho-ảnh-cloudinary.");
      warned = true;
      return list;
    }
    throw e;
  }
  return Promise.all(list.map((src, i) => (isPending(src) ? sendOne(src, signed, i) : src)));
}

// Thông báo lỗi khi Lưu mà tải ảnh không được
export const uploadError = (e: unknown) => (e instanceof Error && e.message ? e.message : "Không tải được ảnh lên, thử lưu lại.");

// Link ảnh tối ưu theo cỡ hiển thị — tách riêng để dùng được cả ở test logic (không kéo theo lớp gọi API)
export { imageUrl } from "@/lib/craft/image-url";
