# Concept

**Đường dẫn:** `/concepts` (menu Sản phẩm › Concept)

**Mục đích:** cách phân loại thứ hai bên cạnh [Danh mục](./categories.md), theo **dịp lễ / bộ sưu tập** (Noel, Tết, Valentine…). Admin tự thêm. Trên web, hàng lọc Concept nằm **phía trên** hàng Danh mục; hai bộ lọc dùng cùng lúc được (vd Noel + Trái cây).

| | Danh mục | Concept |
|---|---|---|
| Ý nghĩa | Loại hương (Thiên nhiên, Trái cây…) | Dịp lễ / bộ sưu tập (Noel, Tết…) |
| Sản phẩm thuộc | Đúng 1, bắt buộc | 0, 1 hoặc nhiều — không bắt buộc |
| Xóa khi còn sản phẩm | Không được | Được — sản phẩm chỉ rời khỏi concept, vẫn giữ nguyên |

## Trang danh sách

Giống trang Danh mục (dùng chung bảng và modal: `components/products/taxonomy-table.tsx`, `taxonomy-modal.tsx`):

| Cột | Nội dung |
|---|---|
| Tay nắm ⠿ | Kéo thả (chuột hoặc bàn phím) để sắp thứ tự — thứ tự hàng lọc Concept trên web |
| Concept | Tag theo màu đã chọn, tên tiếng Anh bên dưới |
| Sản phẩm | Số sản phẩm thuộc concept, bấm để mở Sản phẩm trưng bày đã lọc sẵn (`/products?concept=<mã>`) |
| Hiện trên web | Tắt thì concept không hiện trên web. Sản phẩm vẫn giữ concept |
| Thao tác | Sửa, xóa. Xóa concept đang có sản phẩm thì hỏi lại kèm "N sản phẩm sẽ rời khỏi concept này" |

## Thêm, sửa

| Trường | Quy tắc |
|---|---|
| Tên tiếng Việt | Bắt buộc, không trùng tên concept khác (so không dấu) |
| Tên tiếng Anh | Để trống thì dùng tên tiếng Việt |
| Màu tag | Chọn trong 12 màu có sẵn (như danh mục) |

Mã concept tạo từ tên lúc thêm (`Giáng sinh` → `giang-sinh`) và **không đổi** khi sửa tên.

## Tạo nhanh concept lễ

Nút **Tạo nhanh concept lễ** (cạnh "Thêm concept", chỉ hiện khi còn thiếu) thêm Noel, Tết, Valentine kèm thời gian bán gợi ý của mùa sắp tới — bấm hiện danh sách sẽ thêm để xác nhận, sửa ngày lại được như concept thường (`bo/src/lib/products/concept-presets.ts`):

| Concept | Thời gian bán gợi ý |
|---|---|
| Noel | 01/12 → 26/12 |
| Tết | 30 ngày trước mùng 1 → mùng 7 (âm lịch, bảng ngày mùng 1 tới 2035) |
| Valentine | 01/02 → 14/02 |

Đang trong mùa thì lấy mùa này, hết mùa thì năm sau. Bỏ qua concept đã có (trùng id hoặc trùng tên, không phân biệt hoa thường). Hiệu ứng tuyết / hoa / tim trên web chọn ở giao diện gắn concept — [site-theme.md#hiệu-ứng-dịp-lễ](site-theme.md#hiệu-ứng-dịp-lễ). Test: `bo/e2e/concepts.spec.ts`, `bo/e2e/logic/concept-presets.spec.ts`.

## Thời gian

Mỗi concept có **Thời gian bán** (từ ngày – đến ngày, chọn trong modal thêm / sửa), mỗi đầu để trống được; trống cả hai = mọi ngày. Ngày tính theo **giờ Việt Nam**, tính cả ngày bắt đầu và ngày kết thúc.

| Sản phẩm (Đang bán) | Trên web |
|---|---|
| Không thuộc concept nào, hoặc chỉ thuộc concept đang **ẩn** | Luôn hiện |
| Có ít nhất một concept (không ẩn) **đang trong mùa** | Hiện; chỉ mang nhãn các concept đang trong mùa |
| Mọi concept (không ẩn) đều **chưa tới / đã qua** | **Ẩn** khỏi trang Sản phẩm, tìm kiếm, gợi ý; trang chi tiết 404 |

- Tự mở bán khi tới ngày bắt đầu, tự đóng sau ngày kết thúc — **không đổi** trạng thái Đang bán / Tạm ẩn của sản phẩm (tính mỗi lần web đọc, web lưu đệm tối đa 60 giây). Muốn bán tiếp sau mùa: sửa ngày của concept, hoặc gỡ concept khỏi sản phẩm.
- Concept tắt "Hiện trên web" thì bỏ qua cả thời gian của nó.
- Bảng Concept: cột **Thời gian bán** với nhãn Mọi ngày / Đang mở bán / Sắp mở bán / Đã kết thúc và khoảng ngày.
- Bảng sản phẩm, khối xem trước: sản phẩm Đang bán mà mọi concept đều ngoài mùa có nhãn cam **"Ngoài mùa · web đang ẩn"**.
- Hàng lọc "Theo dịp" trên web có **mọi concept hiện chưa kết thúc**, kể cả chưa có mẫu. Chọn concept chưa có mẫu nào bán:
  - **chưa tới ngày bắt đầu** (nút ghi "· Sắp mở"): đồng hồ **đếm ngược** ngày / giờ / phút / giây tới 00:00 (giờ VN) ngày mở bán, dòng "Mở bán từ … đến hết …", nút Liên hệ để đặt trước; hết giờ thì trang tự tải lại để hiện mẫu;
  - **đang trong mùa / không đặt ngày** nhưng chưa gắn mẫu: báo "Dịp … chưa có mẫu nến nào" + nút Liên hệ để hỏi đổ nến riêng.
  Concept đã kết thúc không hiện.
- Trang chi tiết trên web: nếu mọi concept của mẫu đều có ngày kết thúc thì ghi "Bán theo dịp Noel đến hết 26/12/2026" (ngày muộn nhất).
- Quy tắc ở BE: `be/src/concepts/season.ts` (unit test `season.spec.ts`); BO dùng cùng quy tắc ở `bo/src/lib/products/concepts.ts`.

## Gắn concept vào sản phẩm

- Drawer thêm / sửa sản phẩm, khối "Phân loại & đặc tính": trường **Concept** ngay dưới Danh mục — chọn nhiều, để trống được, tag đúng màu. Concept đang ẩn hiện kèm "(đang ẩn trên web)".
- Bảng sản phẩm và khối xem trước hiện tag concept dưới tag danh mục.
- Bộ lọc **Concept** trên thanh lọc trang Sản phẩm trưng bày (cạnh Danh mục); `?concept=<mã>` mở sẵn bộ lọc.
- Sản phẩm đang gắn concept đã bị xóa: mở sửa thì concept đó tự bỏ khỏi lựa chọn (BE từ chối concept không còn).

## Dữ liệu

- BE: bảng `Concept` (`id`, `nameVi`, `nameEn`, `color`, `hidden`, `sortOrder`, `startsOn`, `endsOn` kiểu ngày), nhiều–nhiều với `Product` (bảng nối `_ConceptToProduct`, xóa concept / sản phẩm thì liên kết tự xóa). API: [api.md#concept](../api.md#concept). Sản phẩm có thêm `conceptIds`.
- Chế độ lưu trên trình duyệt: khóa `bo-concepts-v1`, mẫu có Noel, Tết. Sao lưu BO tự gồm khóa này; `pnpm db:import` nhập cả concept và liên kết (bản sao lưu cũ chưa có concept thì bỏ qua).
- Xóa toàn bộ dữ liệu (Cài đặt) xóa cả concept.

## Kiểm thử

- BO `e2e/concepts.spec.ts`: concept mẫu, thêm, chặn tên trùng, ẩn trên web; đặt thời gian đã qua → Đã kết thúc + sản phẩm báo Ngoài mùa, bỏ ngày → Mọi ngày; gắn nhiều concept vào sản phẩm, lọc theo concept, đếm + liên kết sang Sản phẩm, xóa concept đang có sản phẩm thì sản phẩm chỉ rời khỏi concept.
- BE `test/concepts.e2e-spec.ts`: thêm / sửa / ẩn / sắp xếp, chặn tên trùng, 401 khi chưa đăng nhập; sản phẩm nhiều concept (bỏ trùng, theo thứ tự trang Concept), concept không có → 400, sửa toàn bộ không gửi thì rời mọi concept, xóa concept gỡ khỏi sản phẩm; web không thấy concept ẩn; thời gian (lưu / bỏ ngày, chặn kết thúc trước bắt đầu, ngày không có thật), web ẩn sản phẩm ngoài mùa, bán khi bất kỳ concept nào trong mùa, bỏ qua concept ẩn. `map-backup.spec.ts`: nhập concept từ file sao lưu.
- Trang Danh mục dùng chung bảng / modal — test `categories`, `misc-extra` vẫn chạy như cũ.
