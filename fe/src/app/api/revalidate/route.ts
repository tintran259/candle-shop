// BE gọi khi đăng / gỡ / xóa giao diện web (be/src/common/web-revalidate.ts): POST /api/revalidate?tag=site-theme →
// đánh dấu dữ liệu giao diện (GET /shop/home) là cũ, lượt xem kế tiếp lấy bản mới ngay (không đợi hết 60 giây lưu đệm).
// Chỉ nhận tag có trong danh sách. Bảo vệ bằng REVALIDATE_SECRET (cùng giá trị ở BE); chưa đặt thì chỉ nhận khi chạy trên máy (không phải production)
import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { SITE_THEME_TAG } from "@/lib/home";

const TAGS = [SITE_THEME_TAG];
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const sent = request.headers.get("x-revalidate-secret") ?? "";
  const allowed = secret ? same(sent, secret) : process.env.NODE_ENV !== "production";
  if (!allowed) return Response.json({ revalidated: false }, { status: 401 });
  const tag = new URL(request.url).searchParams.get("tag") ?? "";
  if (!TAGS.includes(tag)) return Response.json({ revalidated: false, message: "Tag không hợp lệ" }, { status: 400 });
  // expire 0: lượt xem kế tiếp chờ bản mới (không trả bản cũ)
  revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tag, now: Date.now() });
}
