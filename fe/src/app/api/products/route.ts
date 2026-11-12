// Dữ liệu cho hộp tìm kiếm (trình duyệt gọi /api/products của chính web, máy chủ Next lấy từ BE — không cần CORS).
// Cùng nguồn và cùng lưu đệm 60 giây với trang Sản phẩm; bỏ ảnh data URL (nặng); BE lỗi thì 503
import { getShopProducts, listable } from "@/lib/shop";

export async function GET() {
  const data = await getShopProducts();
  if (!data) return Response.json({ message: "Chưa tải được sản phẩm." }, { status: 503 });
  return Response.json(listable(data), { headers: { "Cache-Control": "public, max-age=60" } });
}
