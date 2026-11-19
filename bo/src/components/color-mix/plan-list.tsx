import { Typography } from "antd";
import type { ReactNode } from "react";
import { decimalsOf, formatGrams, formatSmallGrams, formatRate, premixSteps, premixWeigh, unitOf, type MixBatch, type MixPlan } from "@/lib/color-mix/plan";

// Danh sách cần cân (tab Pha màu): mỗi dòng tên + số gram lớn bên phải, hướng dẫn chi tiết nằm dưới, hết bề ngang —
// đọc được trên điện thoại (bảng 4 cột ép cột ghi chú thành một cột chữ hẹp). Thứ tự: màu, thạch cao, nước
export function PlanList({ plan, batch, swatchOf }: { plan: MixPlan; batch: MixBatch; swatchOf: (id: string) => string }) {
  const d = decimalsOf(batch.precision);
  const pd = Math.min(d, 1);

  return (
    <div className="color-mix-plan">
      {plan.lines.length === 0 && <Typography.Text type="secondary">Không cần thêm màu, màu này gần mẫu trắng nhất.</Typography.Text>}
      {plan.lines.map((l) => (
        <Row
          key={l.id}
          dot={swatchOf(l.id)}
          name={l.name}
          meta={`${formatRate(l.percent, l.kind)} thạch cao`}
          amount={l.premix ? formatSmallGrams(l.rounded, d, unitOf(l.kind)) : formatGrams(l.rounded, d, unitOf(l.kind))}
          sub={l.premix ? "lượng màu thật" : l.drops !== undefined ? `≈ ${l.drops.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giọt` : undefined}
        >
          {l.premix && (
            <div className="color-mix-premix">
              <div className="color-mix-premix-weigh">{premixWeigh(l, d)}</div>
              {premixSteps(l, d).map((s) => (
                <div key={s} className="color-mix-premix-step">
                  {s}
                </div>
              ))}
              <Typography.Text type="secondary" className="color-mix-premix-note">
                Trộn thật đều, phần thừa cất dùng lần sau.
              </Typography.Text>
            </div>
          )}
          {l.beyondMeasured !== undefined && (
            <Typography.Text type="warning">
              Vượt mẫu đậm nhất đã đo ({formatRate(l.beyondMeasured, l.kind)}), nên đổ thêm mẫu khoảng {formatRate(Math.ceil(l.percent * 2) / 2, l.kind)}.
            </Typography.Text>
          )}
          {l.premix?.tooSmall && (
            <Typography.Text type="warning">
              Mẻ quá nhỏ cho cân {batch.precision.toLocaleString("vi-VN")} g: {l.kind === "liquid" ? "lấy" : "cân"} {formatGrams(l.premix.weigh, d, unitOf(l.kind))} vẫn có thể sai ±
              {Math.round(l.premix.errorPercent)}%. Tăng lượng bột của mẻ hoặc dùng cân chính xác hơn.
            </Typography.Text>
          )}
          {l.belowScale && <Typography.Text type="warning">Nhỏ hơn mức cân {batch.precision} g.</Typography.Text>}
        </Row>
      ))}
      <Row name="Bột thạch cao" amount={formatGrams(plan.plasterToWeigh, pd)}>
        <Typography.Text type="secondary">
          Tổng vào khuôn {formatGrams(plan.total, pd)} = thạch cao {formatGrams(plan.plaster, pd)} + màu {formatSmallGrams(plan.colorSolids, d)}
          {plan.plaster - plan.plasterToWeigh > 0.0001 && `. Đã trừ ${formatGrams(plan.plaster - plan.plasterToWeigh, pd)} thạch cao nằm sẵn trong lọ pha loãng`}.
        </Typography.Text>
      </Row>
      <Row name="Nước cần thêm" amount={formatGrams(plan.waterToAdd, pd, "ml")}>
        <Typography.Text type="secondary">
          {batch.waterPer100} ml / 100 g tổng bột ({formatGrams(plan.total, pd)}) = {formatGrams(plan.waterTotal, pd, "ml")}
          {plan.waterInColor > 0 && `, đã trừ ${formatGrams(plan.waterInColor, pd, "ml")} nước có sẵn trong màu`}
          {plan.waterInPremix > 0 && ` và ${formatGrams(plan.waterInPremix, pd, "ml")} nước trong lọ pha loãng`}.
        </Typography.Text>
        {plan.waterExcess > 0 && (
          <Typography.Text type="warning">Nước trong màu đã nhiều hơn mức cần {formatGrams(plan.waterExcess, pd, "ml")} — hỗn hợp sẽ loãng hơn mẫu. Bớt màu nước hoặc tăng mẻ.</Typography.Text>
        )}
      </Row>
    </div>
  );
}

function Row({ dot, name, meta, amount, sub, children }: { dot?: string; name: string; meta?: string; amount: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="color-mix-plan-row">
      <div className="color-mix-plan-head">
        <div className="color-mix-plan-name">
          {dot && <span className="color-mix-dot" style={{ background: dot }} />}
          <span>{name}</span>
          {meta && <span className="color-mix-plan-meta">{meta}</span>}
        </div>
        <div className="color-mix-plan-amount">
          <span className="color-mix-grams">{amount}</span>
          {sub && <span className="color-mix-sub">{sub}</span>}
        </div>
      </div>
      {children && <div className="color-mix-plan-note">{children}</div>}
    </div>
  );
}
