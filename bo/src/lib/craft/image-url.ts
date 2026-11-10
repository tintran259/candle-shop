// Ảnh trên Cloudinary: chèn tham số biến đổi vào URL để Cloudinary trả đúng cỡ, định dạng tốt nhất cho trình duyệt (WebP / AVIF),
// chất lượng tự chọn — ảnh nhỏ trong bảng không phải tải ảnh gốc. size: cạnh hiển thị (px), gấp đôi cho màn hình nét.
// fill = cắt vuông vừa ô; không thì giữ tỉ lệ. Ảnh khác (data URL, link ngoài) giữ nguyên
export function imageUrl(src: string | undefined, size: number, fill = true) {
  if (!src || !src.startsWith("https://res.cloudinary.com/") || !src.includes("/image/upload/")) return src;
  const w = Math.round(size * 2);
  const t = fill ? `f_auto,q_auto,c_fill,g_auto,w_${w},h_${w}` : `f_auto,q_auto,c_limit,w_${w}`;
  return src.replace("/image/upload/", `/image/upload/${t}/`);
}
