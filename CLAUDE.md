# 2510 Candle — hướng dẫn cho Claude Code

Đọc file này trước khi làm việc. Chi tiết nghiệp vụ nằm ở `docs/` (mục lục: [docs/README.md](docs/README.md)).

## Dự án

Shop nến thủ công "2510 Candle", làm theo đơn 2–3 ngày. Monorepo:

| Thư mục | Là gì | Công nghệ |
|---|---|---|
| `bo/` | Back Office cho chủ shop (một người dùng, không phân quyền) | Vite + React 19 + antd 6, pnpm, Playwright e2e (cổng 3011) |
| `be/` | API cho BO | NestJS 12 + Prisma 7 (`@prisma/adapter-pg`) + Postgres trên Neon (Singapore) |
| `fe/` | Web bán hàng cho khách | Next.js 16 + Tailwind 4 + GSAP, pnpm, cổng 3000. Làm lại 11/11/2026 theo bố cục Figma "Ember & Earth", chữ tiếng Việt, thương hiệu 2510 Candle: trang chủ + trang Sản phẩm (đọc `GET /api/shop/products`, biến `API_URL`) — xem [docs/frontend.md](docs/frontend.md) |
| `landing-page/` | Trang giới thiệu | Không đụng tới trừ khi được yêu cầu |
| `docs/` | Tài liệu nghiệp vụ, API, test | Tiếng Việt |

## Cách làm việc với chủ dự án

- **Trả lời bằng tiếng Việt.** Tài liệu, comment code, thông báo lỗi cho người dùng cũng bằng tiếng Việt.
- **Chỉ commit / push khi được yêu cầu.** Thói quen: làm xong → báo kết quả → hỏi "commit và push không?". Push thẳng lên `main`. Cuối commit message thêm dòng `Co-Authored-By` theo hướng dẫn của hệ thống.
- Không commit `be/tsconfig.build.tsbuildinfo` (file build tự sinh).
- Quyết định nghiệp vụ chưa rõ (ảnh hưởng luồng đơn, tiền, kho) thì hỏi bằng lựa chọn có đề xuất trước khi làm.
- Sau mỗi thay đổi: chạy typecheck, lint, test liên quan; cập nhật `docs/` (trang nghiệp vụ + `docs/api.md` nếu đổi API).
- Báo kết quả thật: test trượt thì nói rõ, test chập chờn thì chạy lại và ghi nhận.

### Bảo mật (bắt buộc)

- **Không bao giờ** commit `be/.env`, không dán connection string / mã băm PIN / `JWT_SECRET` vào code, `.env.example`, docs hay câu trả lời. Chủ dự án tự dán bí mật vào `be/.env`.
- Kiểm tra biến môi trường thì chỉ in độ dài (`${#VAR}`), không in giá trị.
- Trước khi commit: quét file staged tìm `postgresql://` thật, `npg_`, `scrypt$…`.
- Không dùng lệnh git phá hủy (`git checkout -- file`, `reset --hard`) — muốn trả file về bản commit thì `git show HEAD:path > path`.

## Quy ước code

- **Mỗi file ≤ 300 dòng**; quá thì tách component / module. Không để code thừa.
- **Prettier `--print-width 200`, chỉ chạy trên file vừa sửa** (chạy cả thư mục sẽ định dạng lại file không liên quan, vd `bo/src/lib/orders/sample.ts` — lỡ thì trả về bằng `git show HEAD:…`).
- FE: `pnpm typecheck`, `pnpm lint`, `pnpm build`. Next 16 khác bản cũ — đọc `fe/node_modules/next/dist/docs/` trước khi dùng API lạ.
- BO: `npx tsc --noEmit -p tsconfig.json`, `npx eslint src`. BE: `npx tsc --noEmit -p tsconfig.json`, `pnpm lint` (oxlint), `pnpm build`.
- Tiền là VNĐ, số nguyên. Định dạng tiền dùng `Intl` (`vi-VN`) — dấu cách trước ₫ là dấu cách không ngắt (test so chuỗi phải đổi NBSP về dấu cách).
- Script sửa file nhiều chỗ: viết file Python bằng công cụ Write rồi chạy (heredoc bash có dấu nháy, backtick hay hỏng). Script tạm để trong thư mục scratchpad, không để trong repo.

## Chạy trên máy mới

1. `cd be && pnpm install` (postinstall chạy `prisma generate`), `cd ../bo && pnpm install`.
2. Tạo `be/.env` theo `be/.env.example` — **chủ dự án tự điền**: `DATABASE_URL` (Neon, bản `-pooler`), `JWT_SECRET`, `ADMIN_PIN_HASH` (tạo bằng `pnpm auth:pin <6 số>` trong `be/`), `BO_URL`. Xem [docs/backend.md](docs/backend.md#cài-đặt-lần-đầu).
3. `cd be && pnpm db:deploy` (áp migration nếu DB chưa có), rồi `pnpm start:dev` (cổng 4000, Swagger `/api/docs`).
4. `cd bo && pnpm dev` (cổng **3001**) — BO gọi `VITE_API_URL` (mặc định `http://localhost:4000/api`; dùng BE trên Render thì đặt trong `bo/.env.local`). Đăng nhập bằng PIN 6 số.

## Kiến trúc cần nhớ

- **Máy chủ chậm** (BE Render ngủ): request quá 5 giây thì BO hiện "Máy chủ đang khởi động…" (`watchSlow` trong `lib/notify.ts`, dùng ở `lib/api.ts` và đăng nhập). Swagger chỉ bật trên máy (Render có `RENDER=true`).
- **Mất mạng / nhiều thiết bị:** hàng đợi ghi `bo/src/lib/write-queue.ts` giữ thao tác khi mất mạng, tự gửi lại kèm `Idempotency-Key` (BE: `common/idempotency.interceptor.ts`, nhớ 1 giờ) nên không ghi trùng; quay lại tab sau 30 giây thì tải lại các kho (`refreshStores`).
- **BO đọc / ghi qua API** (`bo/src/lib/local-store.ts`): mỗi kho dữ liệu tải bằng `GET` khi có trang cần; thao tác sửa đổi ngay trên giao diện rồi `sync()` gửi BE ở nền (hàng đợi chung, chạy lần lượt); BE từ chối thì báo lỗi (`lib/notify.ts`) và tải lại. `lib/api.ts` gắn token, 401 thì đăng xuất.
- **Chế độ dữ liệu** `bo/src/lib/data-mode.ts`: mặc định BE. `VITE_DATA_SOURCE=local` lưu localStorage như cũ — **chỉ dùng cho bộ e2e của BO** (playwright.config đặt sẵn).
- **Đơn hàng:** BE tự giữ / trừ / hoàn Kho, đếm và trả lượt mã giảm giá, tạo hồ sơ khách, tạo sản phẩm hủy đơn, tất cả trong một giao dịch. Ở chế độ BE, BO **không** làm lại các việc này (các chỗ gọi có `if (!REMOTE)`). Giá từng dòng (nến tự phối) do BO tính theo Thủ công, BE tin giá này — khi nối web cho khách tự đặt thì BE phải tự tính giá.
- **Hình thức thanh toán:** `deposit` (cọc % theo từng đơn, mặc định theo Cài đặt), `full`, `later` (trả khi nhận hàng: Chờ xác nhận → Xác nhận đơn → Đã xác nhận, nhãn qua `statusOf()` trong `bo/src/lib/orders/labels.ts`).
- **Thủ công:** cấu hình JSON, bản đã lưu (web dùng) + bản nháp + nguyên liệu chờ tạo; bấm Lưu gọi `POST /api/admin/craft/publish`. "Dùng trên web" ở Kho tính theo bản đã lưu (bản nháp hiện nhãn "Chưa lưu").
- **Đăng nhập:** PIN 6 số, JWT HS256 (có `iat`), khóa chung toàn hệ thống khi sai 5 lần (15 phút → 1 giờ → 6 giờ → 24 giờ, bảng `LoginGuard`). Đăng xuất mọi thiết bị: `POST /api/auth/logout-all` (`LoginGuard.revokedBefore`). BE có `helmet` và giới hạn 600 request / phút mỗi IP.
- **Xóa toàn bộ dữ liệu** (Cài đặt): `POST /api/admin/reset {confirm: "XÓA HẾT"}`, giữ đăng nhập; Thủ công giữ bước, bỏ lựa chọn.
- **Ảnh trên Cloudinary:** chọn ảnh chỉ nén + xem trước (data URL); bấm Lưu form mới `uploadImages()` → xin chữ ký `POST /api/admin/uploads/sign` → tải thẳng lên Cloudinary → lưu URL. Hiển thị qua `imageUrl()` (`bo/src/lib/craft/image-url.ts`) chèn `f_auto,q_auto` + cỡ. Thiếu biến `CLOUDINARY_*` thì BE trả 503, BO lưu data URL như cũ (body JSON tối đa 10 MB). Xem [docs/backend.md#kho-ảnh-cloudinary](docs/backend.md#kho-ảnh-cloudinary).

## Kiểm thử

| Lệnh | Ghi chú |
|---|---|
| `cd be && pnpm test` | Unit (vitest) |
| `cd be && pnpm test:e2e` | Chạy trên **Neon, schema `bo_test`** (tự migrate, xóa trắng mỗi file test). Cần `be/.env`. ~1–2 phút |
| `cd bo && npx playwright test` | ~310 test, ~30 phút, chế độ dữ liệu local, trình duyệt Edge. Chạy một file: `npx playwright test e2e/<file>` |
| CI (`.github/workflows/ci.yml`) | Mỗi push, 3 job song song: BE typecheck / lint / unit / build / e2e, BO typecheck / lint / build / `e2e/logic`, e2e-be. DB là Postgres 18 dựng trong máy CI (không gọi Neon). Render chỉ deploy khi CI qua (`autoDeployTrigger: checksPass`) |
| `cd bo && pnpm test:e2e:be` | BO + BE thật (`bo/e2e-be/`, schema `bo_e2e`, cổng 4099 / 3013), luồng đơn chính + Thủ công Lưu, ~1,5 phút. Cần `be/.env`. Xem [docs/testing.md](docs/testing.md#e2e-với-be-thật) |

- **Không chạy hai lần Playwright cùng lúc** (ghi đè `test-results`). Cổng 3011 đang bị server cũ chiếm thì tắt trước.
- Test đăng nhập BO giả lập BE (`bo/e2e/support/mock-auth.ts`, PIN `739214`).
- Thử BO + BE thật trên máy: chạy BE với `DB_SCHEMA=bo_test PORT=4099 …` và BO `VITE_API_URL=http://localhost:4099/api npx vite --port 3012`; thao tác bằng script Playwright tạm, đọc lại API để đối chiếu.
- Vài test chập chờn (vd `price-guards` "báo đơn lỗ"): chạy lại trước khi kết luận.

## Triển khai

- **Render** qua Blueprint `render.yaml` (gói Free): **BE** https://candle2510-be.onrender.com (Node, Singapore; build = install + build + `db:deploy`; start `node dist/main.js`; health `/api/health` không chạm DB, `/api/health/db` kiểm DB; UptimeRobot gọi `/api/health` mỗi 10 phút để BE không ngủ, xem [docs/backend.md#giữ-be-không-ngủ-uptimerobot](docs/backend.md#giữ-be-không-ngủ-uptimerobot)) và **BO** `candle2510-bo` (Static Site, `VITE_API_URL=https://candle2510-be.onrender.com/api` gắn lúc build, rewrite mọi đường dẫn về `index.html`). Push `main` thì service có thư mục đổi tự deploy (`buildFilter`). `BO_URL` trên Render phải có địa chỉ BO (CORS). Hướng dẫn: [docs/backend.md#đưa-lên-render](docs/backend.md#đưa-lên-render).
- **Theo dõi lỗi Sentry:** BE `SENTRY_DSN` (`instrument.ts` + `SentryFilter`, chỉ 5xx), BO `VITE_SENTRY_DSN` (`lib/monitoring.ts`, lỗi trang + API 5xx). Không gửi dữ liệu khách. Thiếu DSN thì tắt. Xem [docs/backend.md#theo-dõi-lỗi-sentry](docs/backend.md#theo-dõi-lỗi-sentry).
- **Sao lưu DB:** `.github/workflows/backup.yml` mỗi đêm 02:00 (VN), `pg_dump` schema public, mã hóa bằng secret `BACKUP_PASSPHRASE`, artifact 30 ngày. Khôi phục: [docs/backend.md#sao-lưu-db-tự-động](docs/backend.md#sao-lưu-db-tự-động).
- Migration mới: `pnpm db:migrate` khi dev (hoặc tự viết SQL trong `be/prisma/migrations/<timestamp>_<tên>/`), `pnpm db:deploy` để áp; Render tự áp khi deploy.

## Trạng thái và việc còn lại (cập nhật 09/11/2026)

Đã xong: BE đủ API mọi trang BO (docs/api.md), BO dùng API, đăng nhập PIN, Trả tiền sau / cọc % theo đơn, xóa toàn bộ dữ liệu, cấu hình Render.

Còn lại, theo thứ tự đề xuất:
1. BE đã chạy trên Render (10/11/2026, DB Neon mới, chưa có dữ liệu). BO lên Render Static Site (`candle2510-bo`) — kiểm tra sau khi chủ dự án sync Blueprint và đặt `BO_URL`. Lỗi build / health thì đọc log Render họ gửi.
2. Mang dữ liệu cũ sang DB mới nếu cần: file sao lưu BO + `pnpm db:import`.
3. Kho ảnh Cloudinary đã có code; chủ dự án cần điền `CLOUDINARY_*` ở `be/.env` và Render. Chưa xóa ảnh trên Cloudinary khi gỡ ảnh.
4. E2E với BE thật đã có (`bo/e2e-be/`: luồng đơn, hủy hoàn Kho, Thủ công Lưu) — thêm dần khi đổi API (Kho nhập / sản xuất, sửa đơn, hoàn tiền).
5. Web `fe`: trang chủ đã có (tiếng Việt, giá mẫu). Tiếp: ảnh sản phẩm thật, nối BE (đặt hàng của khách, đọc Cài đặt) — BE phải tự tính giá nến tự phối. Các comment trong BO còn nhắc `fe/…` (dữ liệu mẫu, đồng bộ cấu hình Thủ công sang web khi chạy localhost) là của bản cũ.

Dữ liệu thật đang cần chủ dự án xử lý: hai bấc chưa có giá (`wick-cotton-wick` "Bấc cotton", `wick-wooden-wick` "Bấc gỗ"); trùng tên "Bấc cotton" với `bac-cotton`.
