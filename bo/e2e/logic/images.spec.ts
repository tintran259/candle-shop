// Link ảnh Cloudinary tối ưu theo cỡ hiển thị (docs/backend.md#kho-ảnh-cloudinary)
import { expect, test } from "@playwright/test";
import { imageUrl } from "@/lib/craft/image-url";

const src = "https://res.cloudinary.com/dmuq24ry/image/upload/v1731/candle2510/products/nen-cam.webp";

test("Ảnh Cloudinary: chèn cỡ (gấp đôi cho màn hình nét), định dạng và chất lượng tự chọn; cắt vuông hoặc giữ tỉ lệ", () => {
  expect(imageUrl(src, 48)).toBe("https://res.cloudinary.com/dmuq24ry/image/upload/f_auto,q_auto,c_fill,g_auto,w_96,h_96/v1731/candle2510/products/nen-cam.webp");
  expect(imageUrl(src, 320, false)).toBe("https://res.cloudinary.com/dmuq24ry/image/upload/f_auto,q_auto,c_limit,w_640/v1731/candle2510/products/nen-cam.webp");
});

test("Ảnh khác giữ nguyên: data URL (lưu tạm khi chưa cấu hình kho ảnh), link ngoài, trống", () => {
  expect(imageUrl("data:image/webp;base64,AAAA", 48)).toBe("data:image/webp;base64,AAAA");
  expect(imageUrl("/products/moon.webp", 48)).toBe("/products/moon.webp");
  expect(imageUrl(undefined, 48)).toBeUndefined();
});
