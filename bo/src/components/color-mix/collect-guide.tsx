import { Card, Typography } from "antd";
import type { ReactNode } from "react";
import { LADDER, LADDER_PLASTER } from "@/lib/color-mix/ladder";
import { DEFAULT_WATER, type MixMode } from "@/lib/color-mix/types";

// Khung "Cách thu dữ liệu để kết quả sát nhất" (tab Dữ liệu mẫu, docs/pages/color-mix.md#dữ-liệu-mẫu):
// các bước đánh số; lọ pha loãng A / B mỗi lọ một ô, công thức từng dòng; bảng thang mẫu 50 g tính sẵn lượng cần lấy.
// Cân 0,1 g: mỗi lần cân ≥ 2 g (sai ≤ 2,5%) nên màu không cân thẳng mà lấy từ lọ A (10%) / lọ B (1%)
const STOCKS = { A: 0.1, B: 0.01 };
const num = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
const g1 = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

// Một mẫu c% trên 50 g: lấy lọ nào, bao nhiêu g; thêm bao nhiêu bột (tổng 50 g gồm cả lọ) và nước (màu nước: trừ nước trong lọ)
function ladderRow(c: number, liquid: boolean) {
  const dose = (LADDER_PLASTER * c) / 100;
  const stock = c <= 0.25 ? "B" : "A";
  const take = dose / STOCKS[stock];
  const water = (LADDER_PLASTER * DEFAULT_WATER) / 100;
  return {
    c,
    dose,
    stock,
    take,
    plaster: liquid ? LADDER_PLASTER : LADDER_PLASTER - take,
    water: liquid ? water - (take - dose) : water,
  };
}

export function CollectGuide({ mode }: { mode: MixMode }) {
  const liquid = mode === "liquid";
  const unit = liquid ? "ml" : "g";
  const base = liquid ? "nước" : "bột thạch cao";
  const water = (LADDER_PLASTER * DEFAULT_WATER) / 100;
  const rows = [0.05, ...LADDER].map((c) => ladderRow(c, liquid));
  // Điện thoại: bảng thành thẻ, mỗi ô ghi nhãn cột (data-label, styles/color-mix-guide.css)
  const cols = ["Nồng độ", "Lấy", liquid ? "Bột" : "Thêm bột", liquid ? "Thêm nước" : "Nước", "Nhập vào trang"];

  return (
    <Card title="Cách thu dữ liệu để kết quả sát nhất">
      <ol className="collect-steps">
        <Step title="Giữ mọi mẫu giống nhau">
          Cùng loại bột, cùng tỷ lệ nước ({DEFAULT_WATER} ml / 100 g bột — mẫu {LADDER_PLASTER} g là {g1(water)} ml nước), cùng thời gian khuấy. Đổ thêm một <b>mẫu trắng</b> ({LADDER_PLASTER} g bột +{" "}
          {g1(water)} ml nước, không màu) ngay trong buổi đó.
        </Step>

        <Step title="Pha sẵn hai lọ loãng (cân 0,1 g)">
          Lượng màu nhỏ như 0,05 {unit} không cân thẳng được — pha loãng trước, mỗi lần {liquid ? "lấy từ 2 ml" : "cân từ 2 g"} trở lên.
          <div className="collect-stocks">
            <Stock name="Lọ A" rate="10% màu" lines={[`2 ${unit} màu`, `+ 18 ${unit} ${base}`]} total={`= 20 ${unit}`} />
            <Stock name="Lọ B" rate="1% màu" lines={[`2 ${unit} lọ A`, `+ 18 ${unit} ${base}`]} total={`= 20 ${unit}`} />
          </div>
          <Typography.Text type="secondary" className="collect-note">
            {liquid ? "Khuấy đều trong lọ kín." : "Đậy kín, lắc mạnh 2–3 phút, rây 1–2 lần cho màu thật đều."} Dán nhãn, cất dùng nhiều lần.
          </Typography.Text>
        </Step>

        <Step title={`Đổ mẫu ${LADDER_PLASTER} g cho từng màu`}>
          Mỗi nồng độ một mẫu. Bấm <b>Thêm thang chuẩn</b> bên dưới để tạo sẵn các dòng.
          <div className="collect-table-wrap">
            <table className="collect-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.c} className={r.c < LADDER[0] ? "is-optional" : undefined}>
                    <td data-label={cols[0]}>
                      <b>{num(r.c)}%</b>
                      {r.c < LADDER[0] && <span className="collect-tag">màu mạnh</span>}
                    </td>
                    <td data-label={cols[1]}>
                      {g1(r.take)} {unit} lọ {r.stock}
                    </td>
                    <td data-label={cols[2]}>{g1(r.plaster)} g</td>
                    <td data-label={cols[3]}>{g1(r.water)} ml</td>
                    <td data-label={cols[4]}>
                      {LADDER_PLASTER} / {num(r.dose)} {unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Typography.Text type="secondary" className="collect-note">
            {liquid ? `Nước trong lọ đã trừ vào ${g1(water)} ml nước của mẫu.` : `Bột trong lọ tính luôn vào ${LADDER_PLASTER} g.`} “Nhập vào trang” = ô thạch cao / ô màu. Dòng 0,05% chỉ cần cho màu
            mạnh (đen, xanh coban).
          </Typography.Text>
        </Step>

        <Step title="Để khô hẳn">24–48 giờ. Lúc còn ướt màu đậm hơn nhiều.</Step>

        <Step title="Chụp và lấy màu">
          Chụp mọi mẫu (kèm mẫu trắng) trong <b>cùng một ảnh</b>, ánh sáng ban ngày gián tiếp, không flash. Bấm nút máy ảnh ở ô màu, chọn “Mẫu trắng (hiệu chỉnh)” bấm vào mẫu trắng trước, rồi bấm vào
          giữa từng mẫu. Có máy đo màu thì nhập mã hex trực tiếp.
        </Step>
      </ol>
    </Card>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="collect-step">
      <div className="collect-step-title">{title}</div>
      <div className="collect-step-body">{children}</div>
    </li>
  );
}

function Stock({ name, rate, lines, total }: { name: string; rate: string; lines: string[]; total: string }) {
  return (
    <div className="collect-stock">
      <div className="collect-stock-head">
        <b>{name}</b>
        <span className="collect-tag">{rate}</span>
      </div>
      {lines.map((l) => (
        <div key={l} className="collect-stock-line">
          {l}
        </div>
      ))}
      <div className="collect-stock-total">{total}</div>
    </div>
  );
}
