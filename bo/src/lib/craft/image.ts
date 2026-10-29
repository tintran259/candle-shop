// Nén ảnh ngay trên trình duyệt trước khi lưu tạm (chưa có API upload).
// Khi có BE: gửi file lên POST /api/uploads và lưu URL trả về thay cho data URL.

export const MAX_IMAGES = 6;
export const MAX_FILE_MB = 10;
const MAX_SIDE = 800;

export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.8);
}
