# Web bán hàng `fe`

Trang chủ dựng theo Figma **"Ember & Earth — Luxury candle atelier"** ([file](https://www.figma.com/design/lIIOeOxyYe1yCN25kWrXSU/Untitled?node-id=0-1), khung `2:2`, rộng 1440). Next.js 16 + Tailwind 4 + GSAP 3.15 (ScrollTrigger, SplitText). Hiện mới có **trang chủ tĩnh**: bố cục theo design, **chữ tiếng Việt, thương hiệu 2510 Candle** (logo, ảnh hero do chủ shop gửi); sản phẩm / giá / nốt hương là dữ liệu mẫu (VNĐ), chưa nối BE.

```bash
cd fe && pnpm install
pnpm dev            # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm build
```

## Bóc tách design

| Figma | Khối | Thành phần | File |
|---|---|---|---|
| `2:3` + `2:4` | Thông báo + điều hướng | Dải tối 28px "Complimentary shipping…"; tên thương hiệu trái, Shop all / Our story / The journal giữa, Search / Account / Bag (0) phải, đường kẻ mờ dưới. Trên hero trong suốt chữ sáng → qua hero nền kem chữ tối; cuộn xuống ẩn, cuộn lên hiện. Điện thoại: nút Menu mở lớp phủ | `components/site-header.tsx` |
| `2:5` | Hero | Ảnh chiến dịch toàn khung + lớp tối 17%; nhãn, tiêu đề 2 dòng "A little light. / A lot of feeling.", đoạn văn, nút viền 242×44 "Find your everyday glow ↗", ghi chú nguyên liệu; "EMBER & EARTH" 148px ở đáy | `sections/hero.tsx` |
| `2:6` | Cam kết | 4 nhãn in hoa canh giữa, vạch dọc giữa các nhãn (điện thoại: lưới 2×2) | `sections/promises.tsx` |
| `2:7` | Bộ sưu tập | "ATELIER" 90px, câu dẫn + ghi chú canh phải, nhãn bộ sưu tập, 3 thẻ nến (ảnh 416×420, nhóm hương, tên + giá, nốt hương, dung tích), "Explore all candles ↗" | `sections/collection.tsx` |
| `2:8` | Câu chuyện | Nhãn + "CRAFTING ATMOSPHERE" + ảnh 760×510 (trái); "OUR ESSENCE" 82px, tiêu đề phụ, 2 đoạn văn, liên kết (phải); đường kẻ khép | `sections/story.tsx` |
| `2:9` | Cách đốt nến | "The art of a good burn" 76px, liên kết nhỏ, 3 bước đánh số 01–03 ngăn bằng đường kẻ; ảnh hốc đá 512×506 | `sections/care.tsx` |
| `2:10` | Lời nhắn | Nhãn, trích dẫn 49px màu rượu vang canh giữa, chữ ký | `sections/reminder.tsx` |
| `2:11` | Nhận tin | Ảnh 590×600 (trái); "STAY A LITTLE" 86px, tiêu đề phụ, mô tả, ô email gạch chân + "Join us ↗", dòng đồng ý | `sections/newsletter.tsx`, `newsletter-form.tsx` |
| `2:12` | Chân trang | Tên thương hiệu 48px, khẩu hiệu, 3 cột liên kết (Explore / Here to help / Stay a little), ảnh 512×338, đường kẻ, bản quyền + Privacy / Terms / USD | `components/site-footer.tsx` |

Thêm ngoài Figma: **nút về đầu trang** (`components/back-to-top.tsx`) — hiện khi cuộn qua một màn hình, vòng tròn chạy theo tiến độ cuộn, bấm thì cuộn mượt lên đầu và đưa focus về logo; liên kết **"Bỏ qua tới nội dung chính"** (Tab đầu tiên); menu điện thoại đóng bằng Esc, mở thì focus vào menu.

**Focus:** vòng focus chung (`:focus-visible`) nằm trong `@layer base` — viết ngoài layer thì đè mất class Tailwind (vd ô email `focus-visible:outline-none`, ô này báo focus bằng gạch chân đỏ). Ô email bị Chrome tự điền vẫn giữ nền kem. Liên kết nhỏ có vùng bấm nới bằng đệm dọc + lề âm (bố cục không đổi).

Dùng chung (`components/ui/primitives.tsx`): `Container` (rộng 1440, lề 64px / 40px máy tính bảng / 20px điện thoại), `ArrowLink` (chữ nhỏ + ↗), `Photo` (ảnh có hiệu ứng mở khung + trôi chậm).

**Khác Figma:** chữ tiếng Việt và thương hiệu 2510 Candle thay Ember & Earth (thanh thông báo dùng thông tin thật "đổ tay theo đơn, 2–3 ngày" thay câu miễn phí giao hàng $75; bỏ chọn tiền tệ USD); logo ở thanh điều hướng (trắng trên hero, màu đồng khi thanh nền kem) và chân trang (màu đồng); chữ lớn đáy hero là "2510 CANDLE". Chữ "Tìm kiếm / Tài khoản / Giỏ hàng" trong Figma màu tối gần như chìm vào ảnh hero — code dùng màu sáng như menu giữa. Bố cục trên điện thoại / máy tính bảng do code tự xếp (Figma chỉ có bản 1440).

### Màu và chữ (`app/globals.css`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `cream` | `#f5f2e9` | Nền trang |
| `wine` | `#650f21` | Tiêu đề lớn, tên nến, liên kết |
| `ink` | `#312d28` | Tiêu đề phụ |
| `muted` | `#615e54` | Chữ thường, nhãn |
| `night` | `#282720` | Dải thông báo |
| `rule` / `divider` / `field` | `#bbb4a4` / `#c9c3b4` / `#9d9585` | Đường kẻ, vạch dọc, gạch chân ô email |
| `linen` / `sand` / `mist` | `#f5f2e9` / `#e2d7bd` / `#eee9de` | Chữ sáng trên hero |

Logo: `public/brand/logo-2510.png` (tách từ file gốc, nền trong suốt, 1600×374) dùng làm mặt nạ CSS — component `Logo`, màu theo class chữ (`text-linen`, `text-copper` `#876042` = màu gốc logo).

Font: **Cormorant Garamond** (tiêu đề, class `display`) và **Inter** (chữ thường), tải qua `next/font` (tự host, có bộ chữ tiếng Việt).

## Hiệu ứng (GSAP)

`components/motion-root.tsx` bọc cả trang; section là server component, chỉ gắn thuộc tính:

| Thuộc tính | Hiệu ứng | Dùng ở |
|---|---|---|
| `data-reveal="lines"` | Từng dòng trồi lên khỏi mặt nạ (SplitText) | OUR ESSENCE, The art of a good burn, STAY A LITTLE, tiêu đề phụ |
| `data-reveal="chars"` | Từng chữ cái trồi lên so le | ATELIER, tên thương hiệu ở chân trang |
| `data-reveal="words"` | Trích dẫn sáng dần từng chữ theo vị trí cuộn (scrub) | Lời nhắn |
| `data-reveal="fade"` | Trồi 28px + hiện dần, so le theo nhóm (`ScrollTrigger.batch`) | Nhãn, đoạn văn, thẻ, cột liên kết |
| `data-reveal="clip"` | Khung ảnh mở từ dưới lên, ảnh thu từ 1.25 về 1 | Mọi ảnh |
| `data-reveal="line"` / `"vline"` | Đường kẻ chạy ngang / vạch dọc mọc lên | Đường kẻ section, bước, cam kết |
| `data-parallax="6"` | Ảnh trôi chậm khi cuộn (ảnh lớn hơn khung 16%) | Mọi ảnh |

Riêng: hero mở đầu (ảnh thu nhỏ + sáng dần, "EMBER & EARTH" trồi từng chữ cái, tiêu đề trồi từng dòng, đoạn văn / nút / ghi chú hiện so le; cuộn thì ảnh trôi chậm, chữ lớn trôi ngược và mờ), thanh điều hướng (hiện so le, đường kẻ chạy, đổi nền / ẩn hiện theo hướng cuộn), menu điện thoại. Rê chuột (CSS): ảnh sản phẩm phóng nhẹ, tên nến có gạch chân chạy ra, nút hero tô nền từ dưới lên, mũi tên ↗ nhích.

- **Giảm chuyển động** (cài đặt hệ điều hành): không hiệu ứng, hiện hết ngay (`gsap.matchMedia`).
- **Không nháy:** script trong `<head>` gắn class `js`, CSS ẩn sẵn phần tử có hiệu ứng tới khi GSAP chạy; tự hiện sau 3 giây nếu script lỗi; không có JS thì hiện bình thường.

## Ảnh

Ảnh ở `fe/public/images/` (JPEG): `hero-2510-v2` (ảnh hero có logo 2510 do chủ shop gửi, ~270 KB), 7 ảnh tải từ Figma (75–170 KB): `sunday-morning`, `golden-hour`, `into-the-woods`, `story`, `care`, `newsletter`, `footer`. Thay ảnh: **đặt tên file mới** rồi sửa đường dẫn trong `src/content/home.ts` — chép đè cùng tên thì trình duyệt vẫn hiện ảnh cũ tới 4 giờ (Next lưu đệm ảnh theo đường dẫn), giữ gần đúng tỉ lệ (ảnh cắt `object-cover`); chữ mô tả (`alt`) sửa trong `src/content/home.ts`. `next/image` tự đổi cỡ và định dạng khi chạy.

## Nội dung và chỗ chưa nối

Mọi chữ, giá, liên kết ở `src/content/home.ts`.

- **Nhận tin:** chưa có API — email hợp lệ thì hiện "Thank you — sign-ups open very soon." (`newsletter.pending`).
- **Search / Account / Bag, Shipping & returns, Contact us, Instagram, Pinterest, Privacy / Terms / USD:** đang trỏ `#` (chưa có trang).
- Menu Shop all / Our story / The journal và các liên kết trong trang cuộn tới khối tương ứng.

## Việc còn lại

1. Ảnh 3 sản phẩm, câu chuyện, nhận tin, chân trang vẫn là ảnh Figma (hũ in chữ EMBER & EARTH) — thay bằng ảnh hũ 2510; rà lại câu chữ, tên / giá / nốt hương mẫu.
2. Đọc sản phẩm và Cài đặt từ BE (cần API công khai); trang sản phẩm, giỏ hàng, đặt hàng, nến tự phối — BE phải tự tính giá.
3. API nhận tin / liên hệ.
4. Đưa lên Render (thêm service vào `render.yaml`), thêm job `fe` vào CI.
