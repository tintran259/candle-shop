import { CheckOutlined, LockOutlined } from "@ant-design/icons";
import { Flex, InputNumber, Typography } from "antd";
import { unitLabel } from "@/lib/craft/groups";
import { blendShares, isMixStep, isWaxStep, materialLines, selectedSize, type CraftSelection, type StepSelection } from "@/lib/craft/selection";
import { amountBasis } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, StepOption } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import { formatNumber } from "@/lib/format";

const striped = "repeating-linear-gradient(45deg,#fff 0 4px,#eee8de 4px 8px)";

export type BodyProps = { step: CraftStep; config: CraftConfig; selection: CraftSelection; map: MaterialMap; onChange: (next: StepSelection) => void };

// Thẻ chọn: ảnh/màu, tên, phụ thu; khóa kèm lý do (hết nguyên liệu, không hợp…)
export function OptionCard({ option, price, on, block, multi, onClick }: { option: StepOption; price: string; on: boolean; block: string | null; multi?: boolean; onClick: () => void }) {
  const media = option.images?.[0];
  return (
    <button
      type="button"
      className="cfg-option"
      role={multi ? "checkbox" : "radio"}
      aria-checked={on}
      disabled={!!block && !on}
      onClick={onClick}
      title={block ? `${option.name.vi} — ${block}` : option.name.vi}
    >
      <span className="cfg-dot" aria-hidden style={{ background: media ? `center / cover no-repeat url("${media}")` : (option.swatch ?? striped) }}>
        {on && <CheckOutlined style={{ fontSize: 10, color: "#fff" }} />}
      </span>
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, textAlign: "left" }}>
        <span className="cfg-option-name">{option.name.vi}</span>
        <span className="cfg-option-meta">
          {block ? (
            <>
              <LockOutlined aria-hidden /> {block}
            </>
          ) : (
            price
          )}
        </span>
      </span>
    </button>
  );
}

// Lượng từng nguyên liệu cho 1 hũ: để trống thì theo mặc định
export function AmountFields({ step, config, selection, map, onChange }: BodyProps) {
  const sel = selection[step.id];
  const lines = materialLines(config, selection, map).filter((l) => l.stepId === step.id);
  if (!lines.length || !sel || sel.kind === "vessel") return null;
  const setAmount = (optionId: string, value: number | null) => {
    const rest = { ...sel.amounts };
    delete rest[optionId];
    onChange({ ...sel, amounts: value ? { ...rest, [optionId]: value } : rest });
  };
  const grams = selectedSize(config, selection)?.grams;
  const amountOf = (l: (typeof lines)[number]) => l.amount ?? l.fallback;
  const total = lines.reduce((s, l) => s + amountOf(l), 0);
  // Tỉ lệ từng loại khi phối nhiều sáp hoặc nhiều mùi
  const ratios = (isMixStep(step) || step.kind === "blend") && lines.length > 1 && total ? blendShares(lines.map((l) => ({ optionId: l.optionId, weight: amountOf(l) }))) : [];
  const unitOf = unitLabel[map.get(lines[0].materialId)!.unit];
  return (
    <Flex vertical gap={8} className="cfg-box" style={{ marginTop: 12 }}>
      <Typography.Text strong style={{ fontSize: 13 }}>
        Lượng cho 1 hũ
      </Typography.Text>
      {lines.map((l) => {
        const unit = unitLabel[map.get(l.materialId)!.unit];
        return (
          <Flex key={l.optionId} align="center" gap={12}>
            <Typography.Text style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{l.name}</Typography.Text>
            <InputNumber
              aria-label={`Lượng ${l.name}`}
              min={1}
              precision={0}
              suffix={unit}
              value={l.amount ?? null}
              placeholder={l.fallback ? String(l.fallback) : "Mặc định"}
              onChange={(v) => setAmount(l.optionId, v)}
              style={{ width: 128 }}
            />
            {ratios.length > 0 && (
              <Typography.Text type="secondary" className="tabular" style={{ width: 40, textAlign: "right", fontSize: 13 }}>
                {ratios.find((r) => r.optionId === l.optionId)?.percent}%
              </Typography.Text>
            )}
          </Flex>
        );
      })}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Để trống thì theo số mặc định.
        {isWaxStep(step) && grams ? ` Tổng ${formatNumber(total)}g, hũ này mặc định ${formatNumber(grams)}g.` : ""}
        {ratios.length > 0 && !isWaxStep(step) ? ` Tổng ${formatNumber(total)} ${unitOf}.` : ""}
        {amountBasis(step) ? " Giá tính theo lượng này." : ratios.length > 0 ? " Phụ thu tính theo tỉ lệ này." : ""}
      </Typography.Text>
    </Flex>
  );
}
