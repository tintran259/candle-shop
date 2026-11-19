# Pha màu

Đường dẫn: `/color-mix` (menu Xưởng › Pha màu). Code: `bo/src/pages/color-mix.tsx`, `bo/src/components/color-mix/`, `bo/src/lib/color-mix/`.

Pha màu cho đế, hũ thạch cao: nhập **màu muốn có** và **số gram bột thạch cao**, BO tính số gram từng màu cơ bản cần trộn. Công thức dựa trên **mẫu đổ thử thật** của shop (50 g bột + 0,5 g màu cho ra màu gì…), không dựa trên bảng màu chung.

## Ba loại: Bột oxit, Màu nước, Kết hợp

Thanh chọn ở đầu trang chia đều bề ngang (`?mode=oxide` / `?mode=liquid` / `?mode=combo`; máy tính có thêm dòng mô tả ngắn dưới tên, điện thoại chỉ tên, cao 48px). Bên dưới là tab con chia đều bề ngang trên điện thoại (vùng chạm 44px). Bột oxit và Màu nước có **dữ liệu riêng**: mẫu trắng, màu cơ bản, mẫu đổ thử, mẫu kiểm chứng. Kết hợp xem [bên dưới](#kết-hợp).

**Chuyển mượt:** nút loại / tab đổi ngay khi bấm (`useOptimistic`), nội dung vẽ trong transition. Loại đã mở được giữ lại trong `<Activity>` (ẩn, không bỏ — quay lại không dựng lại, giữ cả màu mục tiêu đang nhập); trong mỗi loại, khung tab đã mở cũng nằm trong `<Activity>` riêng (`components/color-mix/mode-tabs.tsx`) nên chỉ khung đang xem chạy lại hiệu ứng / đo kích thước. Kết quả tìm công thức được nhớ theo dữ liệu + thông số (`solveMixCached`), bộ Kết hợp chỉ ghép lại khi hai bộ đổi. Lần đầu mở Dữ liệu mẫu vẫn tốn ~0,2–0,3 giây (nhiều bảng, ô chọn màu).

**Đơn vị màu nước là ml** (mẫu đổ thử, công thức, mẫu kiểm chứng, giới hạn tổng, pha loãng "lấy X ml dung dịch"). Coi 1 ml màu nước ≈ 1 g (như nước) nên số tính như gram, chỉ đổi đơn vị; nồng độ ghi "ml / 100 g thạch cao". **Nước tính bằng ml** (tỷ lệ "ml / 100 g tổng bột", nước cần thêm, nước trong màu / dung dịch). **Bột (thạch cao, oxit) tính bằng g.**

| | Bột oxit | Màu nước |
|---|---|---|
| Lượng màu | Gram | ml, kèm số giọt (theo thể tích 1 giọt) |
| Phần cộng vào tổng bột | Cả gram oxit | Phần khô của màu (gram màu × (1 − % nước)) |
| Nước cần thêm | Thạch cao × tỷ lệ nước | Thạch cao × tỷ lệ nước − nước có sẵn trong màu − nước trong dung dịch pha loãng |
| Lượng quá nhỏ để cân (dưới 20 lần mức cân) | Trộn trước X g oxit + 9X g bột thạch cao, cân hỗn hợp | Pha trước X ml màu + 9X ml nước, lấy dung dịch |
| Ghi chú | | Trộn màu vào nước trước rồi mới đổ bột |

Thông số riêng của màu nước (tab Dữ liệu mẫu): **nước có sẵn trong màu (%)**, mặc định 50; **thể tích 1 giọt (ml)**, mặc định 0,05 (đo: nhỏ 20 giọt vào xi-lanh / ống đong rồi chia 20).

## Pha màu

Tab `?tab=mix`. Nhập:

- **Màu mục tiêu**: bảng chọn màu, mã hex, hoặc lấy từ ảnh (nút máy ảnh).
- **Tổng bột cho khuôn (g)** — gồm cả màu (xem [Lượng cần cân](#lượng-cần-cân)), **nước (ml / 100 g tổng bột)**, **độ chính xác của cân** (0,001 / 0,01 / 0,1 g; số gram làm tròn theo đây).
- **Tổng màu tối đa (% thạch cao)**, mặc định 6. Dưới ô ghi ra gram: tối đa bao nhiêu g màu cho tổng bột khuôn đang nhập (thạch cao = tổng ÷ (1 + % × phần khô), màu = thạch cao × %; vd 220 g, 6% oxit → tối đa 12,5 g oxit).
- **Màu được dùng**: bấm để bật / tắt từng màu cơ bản.

Kết quả: màu muốn có cạnh màu dự đoán sau khi khô, **độ lệch ΔE** (CIEDE2000), danh sách cần cân (`plan-list.tsx`): từng màu, bột thạch cao, nước — tên bên trái, số gram lớn bên phải, hướng dẫn chi tiết bên dưới (dễ đọc trên điện thoại).

| ΔE | Nhãn |
|---|---|
| < 1 | Gần như trùng khớp |
| 1 – 2,5 | Rất gần |
| 2,5 – 5 | Khác nhẹ |
| ≥ 5 | Khác rõ, bộ màu khó đạt |

Cảnh báo:

- Màu mục tiêu **sáng hơn mẫu trắng** (L* cao hơn quá 1): màu chỉ làm đậm lên, cần bột trắng.
- ΔE ≥ 5: bộ màu đang bật chưa tạo được màu này.
- Tổng màu > 5%: nên đổ thử mẫu nhỏ; > 8%: có thể làm thạch cao yếu, ninh kết bất thường.
- Một màu dùng **vượt mẫu đậm nhất đã đo** quá 10%: kết quả là ngoại suy, gợi ý đổ thêm mẫu ở nồng độ đó.
- Có mẫu kiểm chứng: hiện sai số trung bình của dự đoán.

Nút **Sao chép** lấy công thức dạng chữ (đủ các bước pha loãng, thạch cao, nước). Nút **Lưu làm mẫu kiểm chứng** thêm công thức (thạch cao thật + gram màu thật đã làm tròn theo cân) vào tab Kiểm chứng, đổ xong nhập màu thật.

### Lượng cần cân

`bo/src/lib/color-mix/plan.ts`. % màu luôn tính **so với thạch cao** (như mẫu đổ thử: 50 g bột + 0,5 g màu = 1%).

- **Tổng bột vào khuôn giữ đúng như nhập.** Thạch cao = tổng ÷ (1 + Σ % × phần khô của màu). Vd 220 g, 1,02% oxit → thạch cao 217,8 g + oxit 2,2 g = 220 g. Không cộng màu lên trên (220 + 5 = 225 g) — khuôn đầy hơn, tỷ lệ nước lệch.
- **Nước theo tổng bột vào khuôn** (220 × 37% = 81,4 ml — không lấy thạch cao 217,8 g × 37%), cùng chuẩn với lúc đổ mẫu.
- **Pha loãng trước** khi lượng màu dưới 20 lần mức cân (cân thẳng sai quá 2,5%): X = 20 × mức cân, ít nhất 1 g (dưới 1 g + 9 g bột khó trộn đều; cân 0,1 g → 2 g; 0,01 / 0,001 g → 1 g). Dùng **lọ A / lọ B** giống hướng dẫn ở tab Dữ liệu mẫu: lọ A (10%) = X g màu + 9X g bột (oxit) / nước (màu nước), cân lượng lọ A = gram màu cần × 10; vẫn dưới 20 lần mức cân thì lọ B (1%) = X g lọ A + 9X g bột / nước, cân lượng lọ B = gram màu × 100 — mỗi lọ chỉ 10X (vd 20 g), không trộn 2 g màu + 198 g bột. Lọ B mà lượng cân vẫn dưới 20 lần mức cân thì cảnh báo **mẻ quá nhỏ cho cân** kèm sai số ước tính (± nửa mức cân ÷ lượng cân) — tăng mẻ hoặc dùng cân chính xác hơn. Lượng màu nhỏ hiện đủ 2 chữ số có nghĩa (0,0040 g). Phần thạch cao / nước nằm trong hỗn hợp được trừ khỏi thạch cao / nước cần cân. Phần hỗn hợp thừa cất dùng lần sau.
- Màu nước: nước có sẵn trong màu + nước trong dung dịch pha loãng vượt tổng nước cần thì cảnh báo (hỗn hợp loãng hơn mẫu).
- **Hiển thị:** số to bên phải là **lượng màu thật** (vd 0,059 g — tổng các số này mới so với "tổng màu tối đa"), ô bên dưới ghi bước cân "Cân 5,9 g lọ B Đỏ oxit" (đậm) và cách pha từng lọ, mỗi lọ một dòng. (Trước 19/11/2026 số to là lượng hỗn hợp — dễ tưởng nhầm là lượng màu.)
- Ví dụ (cân 0,1 g, 220 g, vàng 0,267% + nâu 0,319%): lọ A vàng = 2 g vàng + 18 g bột, cân 5,8 g; lọ A nâu = 2 g nâu + 18 g bột, cân 7 g; thạch cao 207,2 g (218,7 − 11,5 nằm trong hai hỗn hợp); nước 81,4 ml (220 × 37%).

## Dữ liệu mẫu

Tab `?tab=data`.

- **Mẫu trắng**: bột + nước, không màu, đã khô. Kèm **nước khi đổ mẫu (ml / 100 g tổng bột)** (`waterPer100`, mặc định 37 — 100 g tổng bột (thạch cao + màu) : 37 ml nước; bản cũ chưa có cũng là 37; dữ liệu `version` 1 lưu sẵn 70 — mặc định trước đây — tự đổi thành 37). Ô nước ở tab Pha màu luôn theo số này, chỉ khác khi tự sửa: tỷ lệ nước dùng cho mẫu trắng và mọi mẫu đổ thử. Tab Pha màu lấy số này làm mặc định và cảnh báo khi pha khác (nhiều nước thì khô sáng hơn, ít nước thì đậm hơn), có nút "Dùng X ml".
- **Màu cơ bản**: tên + các mẫu đổ thử (**thạch cao** g — chưa gồm màu, màu g, màu khô đo được). Nồng độ = màu ÷ bột × 100. Thêm / xóa màu, thêm / xóa mẫu. Dải màu dưới tên: dự đoán từ 0% tới gấp đôi mẫu đậm nhất (nửa phải là ngoại suy).
- **Thang nồng độ chuẩn** (`lib/color-mix/ladder.ts`): 0,1 · 0,25 · 0,5 · 1 · 2% trên 50 g thạch cao — màu nhạt (be, kem, pastel) chỉ cần 0,05–0,5% mỗi màu nên đoạn đầu phải có điểm đo (trước đây chỉ có mẫu 1% và 2%, đoạn 0–1% là đường thẳng nội suy). Nút **Thêm thang chuẩn** ở đầu khung "Mẫu từng màu" (mọi màu, có xác nhận) và trong từng màu thêm các dòng còn thiếu (nồng độ đã có, kể cả mẫu 50 g, thì bỏ qua), xếp mẫu theo nồng độ. Dòng mới chưa có màu (mô hình bỏ qua tới khi nhập) và không bỏ nhãn "dữ liệu minh họa". Màu mạnh (đen, xanh coban) nên thêm tay mốc 0,05%.
- **Cân 0,1 g:** pha loãng trước — lọ A = 2 g màu + 18 g bột = 10%; lọ B = 2 g lọ A + 18 g bột = 1% (màu nước: 2 ml màu + 18 ml nước, 2 ml lọ A + 18 ml nước). Mẫu 50 g (tiết kiệm bột): 0,1% = 5 g lọ B, 0,25% = 12,5 g lọ B, 0,5% = 2,5 g lọ A, 1% = 5 g lọ A, 2% = 10 g lọ A; lần cân nhỏ nhất 2,5 g (sai ~±2%, dưới ngưỡng 2,5%). Nhập thạch cao 50 và lượng màu thật. Màu nước: nước trong lọ trừ vào 18,5 ml nước của mẫu.
- Hướng dẫn thu dữ liệu ngay trên trang: cố định bột, tỷ lệ nước, thời gian khuấy; mỗi màu nên 2–3 nồng độ; đo khi khô hẳn; chụp chung một ảnh, ánh sáng ban ngày gián tiếp.

**Lấy màu từ ảnh** (nút máy ảnh cạnh ô màu): bấm hoặc kéo thả ảnh JPG / PNG / WebP vào ô (ảnh không đọc được — vd HEIC của iPhone trên Edge / Chrome Windows — thì báo lỗi, gợi ý chụp màn hình hoặc đặt iPhone chụp JPG) (chỉ đọc trên trình duyệt, không tải lên), bấm vào mẫu → màu trung bình trong vòng tròn bán kính chọn được (1–40 px, trung bình theo RGB tuyến tính); đổi cỡ vùng sau khi bấm thì vòng đánh dấu vẽ lại theo cỡ mới và màu tính lại tại đúng điểm đó (cả mẫu trắng nếu có). Nút máy ảnh chỉ có tooltip khi dùng chuột — trên điện thoại chạm một lần là mở hộp. Đáy hộp hiện ô màu + mã hex (bấm để sao chép); "Đổi ảnh" chọn ảnh khác.

**Hiệu chỉnh theo mẫu trắng** (ô màu mẫu đổ thử, mẫu kiểm chứng, màu mục tiêu — không có ở ô của chính mẫu trắng): chụp kèm mẫu trắng trong cùng ảnh, chọn "Mẫu trắng (hiệu chỉnh)" rồi bấm vào mẫu trắng (viền xanh nét đứt). Mọi màu lấy trong ảnh đó được nhân từng kênh RGB tuyến tính với *mẫu trắng đã lưu ÷ mẫu trắng trong ảnh* (cân bằng trắng von Kries, `whiteBalance` trong `lib/color-mix/color.ts`) — bỏ ánh đèn vàng, ảnh tối / sáng, khác máy chụp. Đáy hộp hiện màu đã hiệu chỉnh + màu gốc trong ảnh. Chỗ bấm tối quá (L* < 40) thì không nhận. Đổi ảnh thì bỏ hiệu chỉnh. Mẫu trắng đã lưu nên đo cẩn thận nhất (ảnh ánh sáng ban ngày gián tiếp), vì mọi ảnh sau đều quy về nó.

Dữ liệu ban đầu là **số minh họa** (`demo: true`), trang hiện cảnh báo kèm nút "Nhập dữ liệu" tới khi sửa mẫu trắng / màu cơ bản / thông số màu nước. (Nút khôi phục dữ liệu minh họa đã bỏ — 19/11/2026.)

## Kết hợp

`?mode=combo` (`lib/color-mix/combo.ts`): bột oxit và màu nước trong **cùng một mẻ**. Không có tab Dữ liệu mẫu (`?tab=data` tự về Pha màu) — ghép hai bộ lúc chạy:

- Mỗi màu giữ đường cong đo ở bộ của nó, so với mẫu trắng của bộ đó; hỗn hợp tính trên mẫu trắng của bộ oxit (K/S cộng dồn như trong một bộ).
- Tỷ lệ nước theo bộ oxit; nước có sẵn trong màu, thể tích giọt theo bộ màu nước.
- Hai giới hạn riêng: **Oxit tối đa (%)** và **Màu nước tối đa (ml / 100 g)**, mỗi ô ghi lượng tối đa cho khuôn (`solveMix(..., limits)`).
- Chip màu chia hai nhóm Bột oxit / Màu nước. Công thức: oxit g (pha loãng với bột), màu nước ml + giọt (pha loãng với nước); thạch cao trừ phần khô của cả hai, nước trừ nước có sẵn trong màu nước.
- Lời nhắc: oxit trộn vào bột khô, màu nước khuấy vào nước trước. Chưa có mẫu kiểm chứng kết hợp thì nhắc dự đoán kém chắc hơn (hai loại đo riêng, chưa có mẫu trộn chung).
- **Mẫu kiểm chứng riêng** (`comboChecks` trong JSON), cột gram / ml theo loại từng màu. Cảnh báo số minh họa nếu một trong hai bộ còn minh họa, có nút tới tab Dữ liệu mẫu của từng bộ.

## Kiểm chứng

Tab `?tab=check`. Mỗi dòng: tên, thạch cao (g), gram từng màu, màu thật đo được → màu dự đoán và ΔE. Đầu bảng: sai số trung bình, lớn nhất. Dòng chưa có màu thật không tính. Sửa mẫu kiểm chứng không bỏ nhãn "dữ liệu minh họa".

## Cách tính

`bo/src/lib/color-mix/model.ts` — mô hình Kubelka–Munk một hằng số, tính riêng từng kênh RGB tuyến tính:

1. K/S(R) = (1 − R)² ÷ 2R. Mẫu trắng cho K/S nền.
2. Mỗi màu cơ bản: mỗi mẫu đổ thử cho một điểm (nồng độ c%, ΔK/S = K/S mẫu − K/S nền). Mẫu trùng nồng độ lấy trung bình. Giữa các điểm nội suy tuyến tính (đi qua 0); vượt điểm cuối thì ngoại suy tỷ lệ theo điểm cuối.
3. Hỗn hợp: K/S = K/S nền + Σ ΔK/S từng màu → đổi lại thành màu.
4. Tìm công thức: tìm theo từng tọa độ (bước 1% giảm dần tới 0,0005%) từ nhiều điểm xuất phát, cực tiểu ΔE + 0,01 × tổng % + 0,12 × số màu dùng (cùng độ giống thì ưu tiên ít màu, ít lượng). Tổng không vượt giới hạn. Màu dưới 0,01% bị bỏ.

Gram, nước, giọt: `bo/src/lib/color-mix/plan.ts`. Test: `bo/e2e/logic/color-mix.spec.ts`.

## Lưu dữ liệu

Một bản JSON cho cả BO (`ColorMixData`: `{ version: 2, sets: { oxide, liquid }, comboChecks }`), kho `bo-color-mix-v1`. Chế độ BE: `GET` / `PUT /api/admin/color-mix`, bảng `ColorMix`. Gửi sau khi ngừng sửa 0,8 giây (gửi ngay khi rời tab / đóng trang), qua **hàng đợi ghi chung** (`lib/write-queue.ts`): mất mạng thì giữ lại và tự gửi lại, chặn đóng trang khi còn thay đổi chưa lưu; BE từ chối thì báo lỗi, tải lại. Mỗi lần gửi cả bản mới nhất — hai máy cùng sửa thì bản gửi sau thắng. **Thông số tab Pha màu được lưu** (`prefs`, riêng từng loại Bột oxit / Màu nước / Kết hợp): nước (ml / 100 g tổng bột — trống = theo tỷ lệ lúc đổ mẫu, nút "Dùng X ml" xóa số đã lưu), độ chính xác của cân, tổng màu tối đa (Kết hợp: oxit tối đa + màu nước tối đa). Chuyển tab / đổi loại / tải lại trang / máy khác vẫn giữ. Màu mục tiêu, tổng bột cho khuôn, màu bật / tắt chỉ nằm trên trang. Có trong file sao lưu và `pnpm db:import`; **Xóa toàn bộ dữ liệu** xóa luôn.

## Chưa làm

- Chưa nối Kho nguyên liệu (trừ kho màu khi pha, giá màu trong giá nến).
- Chưa cân bằng trắng theo mẫu trắng trong ảnh — ảnh chụp lệch ánh sáng thì màu lấy được lệch theo.
- Chưa có bột trắng (titan dioxit) làm màu sáng hơn mẫu trắng: mô hình cho phép thêm như màu cơ bản, nhưng chưa kiểm chứng.
