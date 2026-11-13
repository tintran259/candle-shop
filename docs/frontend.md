# Web bán hàng `fe`

Trang chủ dựng theo Figma **"Ember & Earth — Luxury candle atelier"** ([file](https://www.figma.com/design/lIIOeOxyYe1yCN25kWrXSU/Untitled?node-id=0-1), khung `2:2`, rộng 1440). Next.js 16 + Tailwind 4 + GSAP 3.15 (ScrollTrigger, SplitText). Có **trang chủ** và **trang Sản phẩm** (`/products`, dữ liệu thật từ BE). Trang chủ: bố cục theo design, **chữ tiếng Việt, thương hiệu 2510 Candle**; thanh thông báo, logo, hero và khối "Xưởng nến" (chữ + 3 mẫu chọn ở BO) đọc từ BE ([Giao diện web](#giao-diện-web-từ-bo)), phần còn lại là nội dung tĩnh.

```bash
cd fe && pnpm install
pnpm dev            # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm build
```

Biến môi trường (`fe/.env.local`, mẫu ở `fe/.env.example`): `API_URL` — địa chỉ API của BE mà máy chủ Next gọi, mặc định `http://localhost:4000/api`; trên Render đặt `https://candle2510-be.onrender.com/api`.

**Dữ liệu giả để thử giao diện:** đặt `SHOP_MOCK=1` trong `fe/.env.local` → trang Sản phẩm dùng 20 mẫu nến giả (`src/lib/shop-mock.ts`: 4 danh mục, 3 concept Noel (đang trong mùa) / Tết / Valentine (sắp tới — mẫu chỉ thuộc 2 dịp này bị ẩn như BE, còn 15 mẫu; chọn vào thấy đếm ngược), Quà tặng (không đặt ngày, chưa có mẫu), có mẫu thuộc 2 concept, có giá giảm, nhãn Mới, nổi bật, ảnh thứ hai khi rê chuột; ảnh lấy từ `public/images`), không gọi BE, không đụng DB. Bỏ dòng đó (rồi chạy lại `pnpm dev`) để đọc BE thật. Không bật biến này trên Render.

## Giao diện web từ BO

Chủ shop sửa ở BO › Cài đặt › Giao diện web ([pages/site-theme.md](./pages/site-theme.md)); web đọc `GET /api/shop/home` ([api.md](./api.md#get-shophome)) qua `src/lib/home.ts`:

- `getHome()` — gọi BE một lần mỗi lượt dựng (`react` `cache`), lưu đệm 60 giây; trang chủ `export const revalidate = 60` (ISR). BE lỗi → `null`.
- **Giao diện web làm mới ngay:** `fetch` `/shop/home` gắn tag riêng `site-theme` (`SITE_THEME_TAG` trong `lib/home.ts`). Đăng / gỡ / xóa giao diện ở BO thì BE gọi `POST /api/revalidate?tag=site-theme` (`src/app/api/revalidate/route.ts`: chỉ nhận tag trong danh sách, header `x-revalidate-secret` = `REVALIDATE_SECRET`; chưa đặt mã thì chỉ nhận khi không phải production) → `revalidateTag('site-theme', { expire: 0 })`, lượt xem kế tiếp lấy bản mới — không cần xóa cache. 60 giây vẫn giữ cho việc tự đổi giao diện theo mùa lúc nửa đêm. Trang chủ build lúc BE không chạy thì chưa gắn tag — có tác dụng từ lần làm mới 60 giây đầu tiên.
- `getChrome()` — thanh thông báo (tắt ở BO thì ẩn) + logo sáng / tối cho **mọi trang** (`SiteShell` là server component async, truyền xuống `SiteHeader`, `SiteFooter`). Logo tải lên hiện bằng `BrandLogo` (`components/ui/primitives.tsx`); không có thì logo mặt nạ cũ tô theo màu chữ.
- `heroContent()` — trường trống lấy `hero` trong `content/home.ts`. Ảnh tải lên: Cloudinary `c_limit,w_2400` (không cắt), `object-position` theo điểm lấy nét (trái 30% / giữa 50% / phải 70%); ảnh có sẵn giữ 62%.
- `lib/blocks.ts` — `storyContent()`, `careContent()`, `contactContent()`, `footerContent()`: chữ / ảnh các khối từ `theme.story / care / contact / footer`, trống thì `content/home.ts`; `hidden` thì trang chủ không render khối đó. Chân trang nhận qua `getChrome().footer`.
- `collectionText()` — chữ khối "Xưởng nến" (tên khối, câu dẫn, ghi chú, nhãn) từ `theme.collection`, trống thì `content/home.ts`.
- `featuredCards()` — BE trả từ 3 mẫu (mẫu chọn ở BO trước, BE đã xếp sẵn, tối đa 12) thì "Xưởng nến" hiện mẫu thật: 3 thẻ là lưới, **hơn 3 là băng chuyền tự cuộn vô hạn** (`sections/collection.tsx`: danh sách nhân đôi, `animate-marquee` trong `globals.css` trượt nửa chiều dài, 7 giây mỗi thẻ; nằm ngoài `Container` nên tràn hết bề ngang màn hình, kể cả màn rộng hơn 1440px; rê chuột / focus thì dừng; bản sao `inert` + `aria-hidden`; giảm chuyển động thì hàng vuốt ngang, bỏ bản sao). Thẻ: `sections/collection-card.tsx` (tên, danh mục, giá, mùi hương, cỡ · giờ cháy; bấm mở trang chi tiết; ảnh data URL bỏ → khung logo), thiếu thì 3 thẻ có sẵn.

`SHOP_MOCK=1`: `mockHome` trong `lib/shop-mock.ts` (thanh thông báo "Dữ liệu giả…", 3 mẫu giả đầu tiên).

## Trang Sản phẩm (`/products`)

Menu **Sản phẩm**, "Xem tất cả nến" và "Tất cả nến" ở chân trang dẫn tới đây. Dữ liệu: `GET /api/shop/products` ([api.md](./api.md#web-bán-hàng)) — sản phẩm trưng bày **Đang bán** ở BO, thuộc danh mục không ẩn.

- **Bộ lọc trên URL** (`components/products/use-list-params.ts`): `?q=` (tìm kiếm), `?concept=`, `?category=`, `?sort=gia-tang|gia-giam`, `?page=` — chỉ ghi giá trị khác mặc định, giá trị lạ (concept / danh mục không còn, trang âm…) về mặc định. Đổi bộ lọc dùng `history.replaceState` (Next đồng bộ với `useSearchParams`, không tải lại trang, không thêm mục lịch sử): tải lại / gửi link / mở chi tiết rồi Quay lại vẫn đúng bộ lọc và trang. Đổi dịp → danh mục về Tất cả; đổi bộ lọc / sắp xếp → về trang 1.
- Dựng ở máy chủ Next mỗi lượt xem (`await connection()` trong `src/app/products/page.tsx`) nên HTML có sẵn đúng thẻ của bộ lọc trên URL; dữ liệu BE lưu đệm 60 giây (`lib/shop.ts`): sửa sản phẩm ở BO thì web đổi sau tối đa 1 phút (chỉ giao diện web có lệnh làm mới ngay). BE lỗi / đang khởi động thì hiện thông báo + nút Tải lại, lần sau tự thử lại.
- **Hàng lọc Concept** (dịp lễ: Mọi dịp · Noel · Tết…, nút viền; nút đang chọn nền rượu vang) phía trên — chỉ hiện khi BE có concept đang trong mùa (BO › [Concept](./pages/concepts.md); mẫu ngoài mùa BE không trả nên tự ẩn khỏi web — xem [thời gian](./pages/concepts.md#thời-gian)); `?concept=<id>` mở sẵn. Đổi concept thì danh mục về Tất cả, số đếm danh mục tính trong concept đang chọn. Concept chưa có mẫu (`components/products/concept-empty.tsx`): chưa tới ngày bắt đầu → nút ghi "· Sắp mở", chọn vào hiện **đếm ngược** tới 00:00 giờ VN ngày mở bán + nút Liên hệ đặt trước (hết giờ tự tải lại); đang trong mùa nhưng chưa gắn mẫu → "Dịp … chưa có mẫu nến nào" + nút Liên hệ. Hàng danh mục / sắp xếp ẩn trong hai trường hợp này. Dưới là thanh danh mục (Tất cả + từng danh mục, kèm số mẫu; điện thoại vuốt ngang), sắp xếp Nổi bật (thứ tự BE trả) / giá thấp → cao / cao → thấp — ô chọn tự dựng (`components/products/sort-select.tsx`, thay `<select>` vì danh sách của `<select>` do trình duyệt vẽ không đổi kiểu được), dùng được bằng bàn phím theo mẫu combobox (↑ ↓, Enter, Esc) — giá giảm tính theo `salePrice`. Đổi lựa chọn thì thẻ hiện lại so le (GSAP).
- **Phân trang** (`components/products/pagination.tsx`): tối đa **12 mẫu / trang** (`productsPage.pageSize` trong `content/home.ts`; 12 chia hết cho 3 cột máy tính và 2 cột điện thoại nên hàng cuối không lẻ), ← Trước · số trang · Sau →; nhiều trang thì rút gọn bằng "…" (giữ trang đầu, trang cuối, hai trang quanh trang đang xem). Chuyển trang thì cuộn lên đầu danh sách; đổi danh mục / sắp xếp thì về trang 1. Dòng đếm hiện "13–23 / 23 mẫu nến". Trang đang xem chưa ghi lên URL (tải lại trang về trang 1).
- Thẻ (`components/products/product-card.tsx`): ảnh vuông (Cloudinary tự cắt vuông + đổi định dạng; rê chuột phóng nhẹ, có ảnh thứ hai thì chuyển sang), nhãn **Mới** / **−x%**, danh mục, tên, giá (giá giảm màu rượu vang + giá gốc gạch), nốt hương, mức hương · cỡ · giờ cháy, nút **Liên hệ đặt nến** mở chat Zalo của shop (tab mới). Ảnh lỗi / chưa có ảnh thì hiện logo nhạt. Thẻ là cột co giãn cao bằng thẻ cao nhất cùng hàng, nút luôn ở đáy (cách chữ tối thiểu 20px) → mô tả dài / ngắn thì nút các thẻ vẫn thẳng hàng. **Số Zalo:** lấy SĐT người gửi ở **BO › Cài đặt › Người gửi** qua `GET /api/shop/contact` (làm mới mỗi 60 giây); chuẩn hóa `0901 234 567` / `+84 901…` → `zalo.me/0901234567` (`zaloUrl` trong `lib/shop.ts`). Chưa có SĐT hoặc không gọi được BE thì ẩn nút. Chế độ dữ liệu giả dùng số giả `0901 234 567`.
- **Ảnh data URL** (BO chưa cấu hình Cloudinary — ảnh lưu thẳng trong DB, mỗi ảnh có thể vài trăm KB – vài MB): bỏ khỏi dữ liệu danh sách, `/api/products` (hộp tìm kiếm) và gợi ý (`listable` / `withoutDataImages` trong `lib/shop.ts`) — thẻ hiện logo nhạt; trang chi tiết vẫn hiện. Cách triệt để: điền `CLOUDINARY_*` ở BE.
- Bấm ảnh / tên thẻ mở trang chi tiết (liên kết ở tên phủ cả thẻ; nút Liên hệ nằm trên lớp đó nên vẫn bấm riêng). `?category=<id>` mở sẵn một danh mục (breadcrumb, "Xem tất cả nến" ở trang chi tiết).

## Trang chi tiết (`/products/<slug>`)

`src/app/products/[slug]/page.tsx` — tìm theo `slug` trong `GET /api/shop/products` (cùng lưu đệm 60 giây, BE không cần API riêng). Mẫu không còn bán / sai slug → trang 404 (`src/app/not-found.tsx`, cùng khung trang).

- Breadcrumb: Trang chủ / Sản phẩm / <danh mục> / <tên>. Dưới giá: nhãn các concept của mẫu (bấm → trang Sản phẩm lọc theo concept). Mọi concept của mẫu đều có ngày kết thúc thì trên nút Liên hệ ghi "Bán theo dịp Noel đến hết 26/12/2026" (`saleEndsOn` trong `lib/shop.ts`).
- Bộ ảnh (`components/products/product-gallery.tsx`): ảnh lớn vuông + hàng ảnh nhỏ (từ 2 ảnh, tối đa 8); bấm hoặc ← → đổi ảnh, ảnh lớn mờ dần sang ảnh mới. Nhãn Mới / −x%.
- Cột thông tin (máy tính: đứng yên khi cuộn cạnh ảnh): danh mục, tên, giá (giá giảm + giá gốc gạch), mô tả (xuống dòng đôi = đoạn mới), bảng thông số (mùi hương, mức hương, kích cỡ, loại sáp, thời gian cháy — trường trống thì ẩn dòng), "Đổ tay theo đơn · 2–3 ngày", nút **Liên hệ đặt nến** nền rượu vang (`components/products/contact-button.tsx`, dùng chung với thẻ; chưa có SĐT ở Cài đặt thì hiện "Liên hệ shop để đặt mẫu này."), mẹo đốt nến (3 bước như trang chủ).
- **Gợi ý cho bạn** (`suggestProducts` trong `lib/shop.ts`): 4 mẫu, điểm = 2 × số concept chung + 1 nếu cùng danh mục; cùng điểm giữ thứ tự BE (nổi bật trước). Lưới 2 cột (điện thoại) / 4 cột, dùng lại thẻ sản phẩm.
- Tiêu đề / mô tả trang, ảnh chia sẻ (Open Graph) và dữ liệu có cấu trúc schema.org `Product` (giá VND, `MadeToOrder`) cho máy tìm kiếm.
- Hộp tìm kiếm: chọn một mẫu → trang chi tiết của mẫu đó.

## Tìm kiếm

- Thanh điều hướng: Sản phẩm · Câu chuyện · Cẩm nang, bên phải nút **Tìm kiếm** (kính lúp; điện thoại: nút kính lúp cạnh Menu, và mục "Tìm kiếm" trong menu). Phím tắt **Ctrl / ⌘ + K** ở mọi trang. Đã bỏ Tài khoản, Giỏ hàng.
- Hộp tìm kiếm (`components/search/search-dialog.tsx`, gắn vào `<body>` bằng portal — thanh điều hướng bị dịch khi ẩn / hiện): nền tối mờ, khung nền kem trượt xuống, ô nhập chữ lớn. Chưa gõ: gợi ý 4 mẫu đầu (nổi bật trước). Gõ: tối đa 6 kết quả ngay (ảnh, tên, danh mục · nốt hương, giá) + "Xem tất cả N kết quả".
- Khớp (`lib/search.ts`): không phân biệt hoa / thường và dấu, mọi từ gõ phải khớp **đầu một từ** trong tên / nốt hương / mô tả / loại sáp / danh mục / concept ("noel" ra các mẫu Noel) ("hong" khớp "Hồng", không khớp "phong"); khớp tên xếp trước.
- Bàn phím: ↑ ↓ chọn, Enter mở kết quả đang chọn (chưa chọn thì xem tất cả), Esc đóng và trả focus về nút đã mở, Tab không thoát khỏi hộp.
- Dữ liệu: `/api/products` của chính web (`src/app/api/products/route.ts`) — máy chủ Next lấy từ BE, cùng lưu đệm 60 giây với trang Sản phẩm; tải một lần khi mở hộp lần đầu.
- Kết quả đầy đủ: `/products?q=<từ khóa>` — trang Sản phẩm lọc theo từ khóa, hiện "Kết quả cho “…”" + "Xóa tìm kiếm"; số đếm danh mục theo kết quả, ẩn danh mục không có kết quả. Chọn một mẫu trong hộp → `/products?q=<tên mẫu>` (chưa có trang chi tiết).
- Hiệu ứng lặp lại theo thao tác (dòng kết quả, lưới sản phẩm, menu điện thoại) dùng `gsap.fromTo` có đích cố định: `gsap.from` chạy chồng khi gõ / bấm nhanh sẽ lấy trạng thái đang mờ dở làm đích, phần tử bị kẹt mờ.

Khung chung mọi trang: `components/site-shell.tsx` (bỏ qua tới nội dung, thanh điều hướng, chân trang, nút về đầu trang, hiệu ứng cuộn). `overHero` (trang chủ): thanh điều hướng trong suốt trên hero; trang khác luôn nền kem. Mục đang xem có gạch chân. Liên kết sang mục trang chủ dùng `/#story`, `/#care` để bấm được từ trang khác.

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
| `2:11` | Gửi lời nhắn (thay khối Nhận tin của Figma) | Ảnh 590×600 (trái); "Gửi lời nhắn" 86px, câu dẫn, mô tả, form liên hệ ô gạch chân (họ tên, SĐT, email, nội dung) + nút "Gửi lời nhắn ↗" | `sections/contact.tsx`, `contact-form.tsx` |
| `2:12` | Chân trang | Tên thương hiệu 48px, khẩu hiệu, 3 cột liên kết (Explore / Here to help / Stay a little), ảnh 512×338, đường kẻ, bản quyền + Privacy / Terms / USD. Cột "Theo dõi" lấy mạng xã hội đang bật ở BO › Cài đặt (`GET /shop/contact`, `SiteShell` truyền vào), mở tab mới; chưa có thì ẩn cột | `components/site-footer.tsx` |

Thêm ngoài Figma: **nút về đầu trang** (`components/back-to-top.tsx`) — hiện khi cuộn qua một màn hình, vòng tròn chạy theo tiến độ cuộn, bấm thì cuộn mượt lên đầu và đưa focus về logo; liên kết **"Bỏ qua tới nội dung chính"** (Tab đầu tiên); menu điện thoại đóng bằng Esc, mở thì focus vào menu. **Hiệu ứng menu điện thoại** (`site-header.tsx`): mở — nền kem buông từ mép trên xuống như tấm rèm (`clip-path`, 0,75 giây), đường kẻ đồng chạy ngang, các mục trồi lên so le; đóng — các mục trôi lên mờ đi, rèm kéo ngược lên rồi mới gỡ lớp menu (`shown` giữ lớp menu tới khi hiệu ứng xong, khóa cuộn tới lúc đó); giảm chuyển động thì hiện / ẩn ngay. Hiệu ứng trượt khi cuộn đặt trên lớp trong header (không phải `<header>`), để lớp menu `fixed` luôn phủ kín màn hình.

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

Chữ, liên kết còn lại ở `src/content/home.ts` (cũng là giá trị dự phòng khi BO để trống / BE lỗi).

- **SEO / chia sẻ link:** `app/robots.ts` (`/robots.txt`, chặn `/api/`), `app/sitemap.ts` (`/sitemap.xml`: trang chủ, Sản phẩm, từng mẫu đang bán, làm mới mỗi giờ), `metadataBase` + ảnh chia sẻ mặc định (ảnh hero) ở `app/layout.tsx`, `canonical` + Open Graph cho trang Sản phẩm và từng mẫu. Địa chỉ gốc lấy từ biến **`SITE_URL`** (`lib/site.ts`, bắt buộc đặt khi deploy, trống = `http://localhost:3000`).
- **Ảnh ưu tiên tải:** Next 16 bỏ `priority` → dùng `loading="eager"` + `fetchPriority="high"` (ảnh hero, ảnh chính trang chi tiết, ảnh 3 thẻ đầu trang Sản phẩm). Ảnh chính trang chi tiết không gắn `data-reveal` và không mờ dần ở lần mở đầu (chỉ khi đổi ảnh) — là phần tử LCP. Hero giữ hiệu ứng GSAP (thử chuyển chữ hero sang CSS để LCP nhanh hơn thì bị giật khi tải lại — đã bỏ).
- **Truy cập:** SplitText chỉ gắn `aria-label` cho tiêu đề `h1–h6` (`ariaFor` trong `motion-root.tsx`); câu lớn hero có bản `sr-only`, bản tách chữ `aria-hidden`. Nút Zalo đọc "Liên hệ đặt nến <tên> qua Zalo" (khớp chữ trên nút).
- **Gửi lời nhắn** (`#contact`, chân trang Hỗ trợ › Liên hệ dẫn tới): trình duyệt gửi thẳng `POST {API_URL}/shop/messages` (địa chỉ truyền từ máy chủ vào form; BE cho phép qua CORS `FRONTEND_URL`), có ô bẫy bot, lỗi từng ô, đang gửi / thành công / lỗi — xem [pages/messages.md](./pages/messages.md).
- **Hiệu ứng cuộn khi mở trang ở giữa** (`/#story`, `/#care`, `/#contact` từ chân trang): `motion-root.tsx` không dùng `once: true` (ScrollTrigger tự hủy giữa lúc tạo → lỗi "reading 'end'"), dùng `toggleActions: "play none none none"`; chữ "fade" hiện cả khi cuộn ngược lên, và sau cú nhảy tới `#…` (nghe sự kiện cuộn gốc, dừng 150 ms) thì hiện nốt phần đã qua mốc — phần phía trên màn hình hiện ngay, phần trong màn trồi lên so le.
- **Search / Account / Bag, Shipping & returns, Contact us, Instagram, Pinterest, Privacy / Terms / USD:** đang trỏ `#` (chưa có trang).
- Menu Shop all / Our story / The journal và các liên kết trong trang cuộn tới khối tương ứng.

## Đưa lên Vercel

Web chạy trên **Vercel** (nền tảng của Next.js: không ngủ, CDN, tối ưu ảnh sẵn). BE vẫn ở Render. `fe/vercel.json`: chạy hàm máy chủ ở **Singapore** (`sin1`, gần BE + Neon), chỉ build lại khi thư mục `fe/` đổi (`ignoreCommand`). CI có job **Web (fe)** (typecheck, lint, build bằng dữ liệu giả) — Vercel tự deploy khi push, không chờ CI.

**Lần đầu (chủ dự án làm trên vercel.com):**

1. **Add New › Project** → chọn repo GitHub này → **Root Directory: `fe`** (Framework tự nhận Next.js, pnpm theo `packageManager`).
2. **Environment Variables** (Production):

   | Biến | Giá trị |
   |---|---|
   | `API_URL` | `https://candle2510-be.onrender.com/api` |
   | `SITE_URL` | Địa chỉ Vercel cấp, vd `https://candle2510.vercel.app` (biết sau lần deploy đầu — điền rồi **Redeploy**) |
   | `REVALIDATE_SECRET` | Chuỗi ngẫu nhiên (vd `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`), **cùng giá trị** đặt ở BE |
   | `SHOP_MOCK` | Không đặt |

3. **Deploy**. Xong thì copy địa chỉ `https://….vercel.app`, điền `SITE_URL` (bước 2) và Redeploy.
4. **BE trên Render** (service `candle2510-be` › Environment): `FRONTEND_URL` = địa chỉ web (có thể thêm `,http://localhost:3000` để dev vẫn chạy), `REVALIDATE_SECRET` = cùng giá trị bước 2 → Save (BE tự khởi động lại).

**Kiểm tra sau deploy:** trang chủ hiện nội dung từ BO (không có chữ "Dữ liệu giả"); `/products` có mẫu thật; đăng giao diện ở BO → web đổi ngay; gửi thử form "Gửi lời nhắn" → hiện ở BO › Liên hệ (lỗi CORS = `FRONTEND_URL` chưa đúng); `/robots.txt`, `/sitemap.xml` trỏ đúng địa chỉ web.

**Lưu ý:** BE gói Free ngủ sau 15 phút — giữ UptimeRobot gọi `/api/health` để web không chờ BE thức. Bản xem trước (preview) của Vercel có địa chỉ khác nên form lời nhắn bị CORS chặn — chỉ bản Production gửi được. Đổi sang tên miền riêng sau này: thêm ở Vercel › Domains, rồi đổi `SITE_URL` (Vercel) và `FRONTEND_URL` (Render). Gói Hobby (miễn phí) của Vercel chỉ cho mục đích phi thương mại theo điều khoản của Vercel — bán hàng thật nên cân nhắc gói Pro.

## Việc còn lại

1. Ảnh 3 sản phẩm, câu chuyện, nhận tin, chân trang vẫn là ảnh Figma (hũ in chữ EMBER & EARTH) — thay bằng ảnh hũ 2510; rà lại câu chữ, tên / giá / nốt hương mẫu.
2. Trang chi tiết sản phẩm, giỏ hàng, đặt hàng, nến tự phối (BE phải tự tính giá).
3. API nhận tin / liên hệ.
4. Đưa lên Render (thêm service Node vào `render.yaml`, đặt `API_URL`), thêm job `fe` vào CI.
