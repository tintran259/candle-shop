# Pha màu

Đường dẫn: `/color-mix` (menu Xưởng › Pha màu). Code: `bo/src/pages/color-mix.tsx`, `bo/src/components/color-mix/`, `bo/src/lib/color-mix/`.

Pha màu cho đế, hũ thạch cao: nhập **màu muốn có** và **số gram bột thạch cao**, BO tính số gram từng màu cơ bản cần trộn. Công thức dựa trên **mẫu đổ thử thật** của shop (50 g bột + 0,5 g màu cho ra màu gì…), không dựa trên bảng màu chung.

## Hai loại màu

Nút chọn ở đầu trang (`?mode=oxide` / `?mode=liquid`). Mỗi loại có **dữ liệu riêng**: mẫu trắng, màu cơ bản, mẫu đổ thử, mẫu kiểm chứng.

| | Bột oxit | Màu nước |
|---|---|---|
| Lượng màu | Gram | Gram, kèm số giọt (theo khối lượng 1 giọt) |
| Phần cộng vào tổng bột | Cả gram oxit | Phần khô của màu (gram màu × (1 − % nước)) |
| Nước cần thêm | Thạch cao × tỷ lệ nước | Thạch cao × tỷ lệ nước − nước có sẵn trong màu − nước trong dung dịch pha loãng |
| Lượng quá nhỏ để cân (dưới 20 lần mức cân) | Trộn trước X g oxit + 9X g bột thạch cao, cân hỗn hợp | Pha trước X g màu + 9X g nước, cân dung dịch |
| Ghi chú | | Trộn màu vào nước trước rồi mới đổ bột |

Thông số riêng của màu nước (tab Dữ liệu mẫu): **nước có sẵn trong màu (%)**, mặc định 50; **khối lượng 1 giọt (g)**, mặc định 0,05.

## Pha màu

Tab `?tab=mix`. Nhập:

- **Màu mục tiêu**: bảng chọn màu, mã hex, hoặc lấy từ ảnh (nút máy ảnh).
- **Tổng bột cho khuôn (g)** — gồm cả màu (xem [Lượng cần cân](#lượng-cần-cân)), **nước (g / 100 g tổng bột)**, **độ chính xác của cân** (0,001 / 0,01 / 0,1 g; số gram làm tròn theo đây).
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
- **Nước theo tổng bột vào khuôn** (220 × 37% = 81,4 g — không lấy thạch cao 217,8 g × 37%), cùng chuẩn với lúc đổ mẫu.
- **Pha loãng trước** khi lượng màu dưới 20 lần mức cân (cân thẳng sai quá 2,5%): X = 20 × mức cân, ít nhất 1 g (dưới 1 g + 9 g bột khó trộn đều; cân 0,1 g → 2 g; 0,01 / 0,001 g → 1 g). Trộn X g màu + 9X g bột (oxit) / nước (màu nước), cân lượng hỗn hợp = gram màu cần × 10. 1:9 vẫn dưới 20 lần mức cân thì 1:99 (X g + 99X g). 1:99 mà lượng cân vẫn dưới 20 lần mức cân thì cảnh báo **mẻ quá nhỏ cho cân** kèm sai số ước tính (± nửa mức cân ÷ lượng cân) — tăng mẻ hoặc dùng cân chính xác hơn. Lượng màu nhỏ hiện đủ 2 chữ số có nghĩa (0,0040 g). Phần thạch cao / nước nằm trong hỗn hợp được trừ khỏi thạch cao / nước cần cân. Phần hỗn hợp thừa cất dùng lần sau.
- Màu nước: nước có sẵn trong màu + nước trong dung dịch pha loãng vượt tổng nước cần thì cảnh báo (hỗn hợp loãng hơn mẫu).
- Ví dụ (cân 0,1 g, 220 g, vàng 0,267% + nâu 0,319%): trộn 2 g vàng + 18 g bột, cân 5,8 g; trộn 2 g nâu + 18 g bột, cân 7 g; thạch cao 207,2 g (218,7 − 11,5 nằm trong hai hỗn hợp); nước 81,4 g (220 × 37%).

## Dữ liệu mẫu

Tab `?tab=data`.

- **Mẫu trắng**: bột + nước, không màu, đã khô. Kèm **nước khi đổ mẫu (g / 100 g tổng bột)** (`waterPer100`, mặc định 37 — 100 g tổng bột (thạch cao + màu) : 37 g nước; bản cũ chưa có cũng là 37; dữ liệu `version` 1 lưu sẵn 70 — mặc định trước đây — tự đổi thành 37). Ô nước ở tab Pha màu luôn theo số này, chỉ khác khi tự sửa: tỷ lệ nước dùng cho mẫu trắng và mọi mẫu đổ thử. Tab Pha màu lấy số này làm mặc định và cảnh báo khi pha khác (nhiều nước thì khô sáng hơn, ít nước thì đậm hơn), có nút "Dùng X g".
- **Màu cơ bản**: tên + các mẫu đổ thử (**thạch cao** g — chưa gồm màu, màu g, màu khô đo được). Nồng độ = màu ÷ bột × 100. Thêm / xóa màu, thêm / xóa mẫu. Dải màu dưới tên: dự đoán từ 0% tới gấp đôi mẫu đậm nhất (nửa phải là ngoại suy).
- Hướng dẫn thu dữ liệu ngay trên trang: cố định bột, tỷ lệ nước, thời gian khuấy; mỗi màu nên 2–3 nồng độ; đo khi khô hẳn; chụp chung một ảnh, ánh sáng ban ngày gián tiếp.

**Lấy màu từ ảnh** (nút máy ảnh cạnh ô màu): bấm hoặc kéo thả ảnh JPG / PNG / WebP vào ô (ảnh không đọc được — vd HEIC của iPhone trên Edge / Chrome Windows — thì báo lỗi, gợi ý chụp màn hình hoặc đặt iPhone chụp JPG) (chỉ đọc trên trình duyệt, không tải lên), bấm vào mẫu → màu trung bình trong vòng tròn bán kính chọn được (1–40 px, trung bình theo RGB tuyến tính). Đáy hộp hiện ô màu + mã hex (bấm để sao chép); "Đổi ảnh" chọn ảnh khác.

**Hiệu chỉnh theo mẫu trắng** (ô màu mẫu đổ thử, mẫu kiểm chứng, màu mục tiêu — không có ở ô của chính mẫu trắng): chụp kèm mẫu trắng trong cùng ảnh, chọn "Mẫu trắng (hiệu chỉnh)" rồi bấm vào mẫu trắng (viền xanh nét đứt). Mọi màu lấy trong ảnh đó được nhân từng kênh RGB tuyến tính với *mẫu trắng đã lưu ÷ mẫu trắng trong ảnh* (cân bằng trắng von Kries, `whiteBalance` trong `lib/color-mix/color.ts`) — bỏ ánh đèn vàng, ảnh tối / sáng, khác máy chụp. Đáy hộp hiện màu đã hiệu chỉnh + màu gốc trong ảnh. Chỗ bấm tối quá (L* < 40) thì không nhận. Đổi ảnh thì bỏ hiệu chỉnh. Mẫu trắng đã lưu nên đo cẩn thận nhất (ảnh ánh sáng ban ngày gián tiếp), vì mọi ảnh sau đều quy về nó.

Dữ liệu ban đầu là **số minh họa** (`demo: true`), trang hiện cảnh báo tới khi sửa mẫu trắng / màu cơ bản / thông số màu nước. Nút **Dữ liệu minh họa** khôi phục loại đang chọn (mất mẫu đổ thử và mẫu kiểm chứng của loại đó).

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

Một bản JSON cho cả BO (`ColorMixData`: `{ version: 1, sets: { oxide, liquid } }`), kho `bo-color-mix-v1`. Chế độ BE: `GET` / `PUT /api/admin/color-mix`, bảng `ColorMix`. Gửi sau khi ngừng sửa 0,8 giây (gửi ngay khi rời tab / đóng trang), qua **hàng đợi ghi chung** (`lib/write-queue.ts`): mất mạng thì giữ lại và tự gửi lại, chặn đóng trang khi còn thay đổi chưa lưu; BE từ chối thì báo lỗi, tải lại. Mỗi lần gửi cả bản mới nhất — hai máy cùng sửa thì bản gửi sau thắng. Thông số mẻ (bột, nước, cân, màu bật) chỉ nằm trên trang, không lưu. Có trong file sao lưu và `pnpm db:import`; **Xóa toàn bộ dữ liệu** xóa luôn.

## Chưa làm

- Chưa nối Kho nguyên liệu (trừ kho màu khi pha, giá màu trong giá nến).
- Chưa cân bằng trắng theo mẫu trắng trong ảnh — ảnh chụp lệch ánh sáng thì màu lấy được lệch theo.
- Chưa có bột trắng (titan dioxit) làm màu sáng hơn mẫu trắng: mô hình cho phép thêm như màu cơ bản, nhưng chưa kiểm chứng.
