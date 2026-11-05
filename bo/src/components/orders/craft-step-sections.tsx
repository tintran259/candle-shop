import { Checkbox, Flex, Input, InputNumber, Segmented, Tag, Typography } from "antd";
import { StepIconView } from "@/components/craft/step-icon";
import { formatDelta, sizeLabel } from "@/lib/craft/groups";
import { blendRatios, jarFrom, materialLines, optionBlock, pickOption, selectedSize, type CraftSelection, type StepSelection } from "@/lib/craft/selection";
import { intensityLabels, optionPriceText } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, IntensityLevel, StepOption, VesselOption } from "@/lib/craft/types";
import { formatMoney } from "@/lib/format";
import { lidLevel, optionLevel, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";
import { brand } from "@/theme";
import { OptionCard, AmountFields, type BodyProps } from "@/components/orders/craft-step-parts";

import type { SelectionIssue } from "@/lib/craft/validate";

// Các bước Thủ công dạng thẻ chọn: dùng ở popup Tự phối nến và form sản phẩm (chọn nguyên liệu giống nến tự phối)

type SectionsProps = {
  steps: CraftStep[];
  config: CraftConfig;
  selection: CraftSelection;
  map: MaterialMap;
  // Lỗi từng bước (hiện dưới bước đó)
  issues: SelectionIssue[];
  onChange: (stepId: string, next: StepSelection) => void;
};

// Các bước chọn nến (thẻ hũ + cỡ + nắp, sáp, hương kèm lượng cho 1 hũ, bấc, màu, trang trí…) — dùng ở popup Tự phối nến và form Sản phẩm trưng bày
export function CraftStepSections({ steps, config, selection, map, issues, onChange }: SectionsProps) {
  return (
    <Flex vertical gap={20} className="cfg-steps">
      {steps.map((step, i) => (
        <section key={step.id} id={`cfg-step-${step.id}`} aria-label={step.title.vi} className="cfg-step">
          <Flex align="center" gap={8} wrap>
            <span className="cfg-step-index" aria-hidden>
              {i + 1}
            </span>
            <span aria-hidden style={{ color: brand.emberDark }}>
              <StepIconView icon={step.icon} />
            </span>
            <Typography.Text strong style={{ fontSize: 15 }}>
              {step.title.vi}
            </Typography.Text>
            {!step.required && <Tag style={{ marginInlineEnd: 0 }}>Không bắt buộc</Tag>}
          </Flex>
          <div style={{ marginTop: 10 }}>
            <StepBody step={step} config={config} selection={selection} map={map} onChange={(next) => onChange(step.id, next)} />
            <AmountFields step={step} config={config} selection={selection} map={map} onChange={(next) => onChange(step.id, next)} />
          </div>
          {issues
            .filter((x) => x.stepId === step.id)
            .map((x) => (
              <Typography.Text key={x.message} type="danger" role="alert" style={{ display: "block", fontSize: 13, marginTop: 6 }}>
                {x.message}
              </Typography.Text>
            ))}
        </section>
      ))}
    </Flex>
  );
}

function StepBody({ step, config, selection, map, onChange }: BodyProps) {
  const sel = selection[step.id];
  const options = step.kind === "inputs" ? [] : (step.options as StepOption[]).filter((o) => o.available);
  const block = (o: StepOption) => optionBlock(config, selection, step, o, map);

  if (step.kind === "vessel" && sel?.kind === "vessel") {
    const vessel = options.find((o) => o.id === sel.optionId) as VesselOption | undefined;
    const sizes = vessel?.sizes.filter((s) => s.available) ?? [];
    const lidOut = !vessel?.lid || !sel.sizeId || lidLevel(vessel, sel.sizeId, map) === "out";
    return (
      <Flex vertical gap={12}>
        <div className="cfg-grid" role="radiogroup" aria-label="Chọn hũ">
          {options.map((o) => (
            <OptionCard
              key={o.id}
              option={o}
              price={`từ ${formatMoney(jarFrom(o as VesselOption))}`}
              on={o.id === sel.optionId}
              block={block(o)}
              onClick={() => {
                const v = o as VesselOption;
                // Cỡ thuộc từng hũ: đổi hũ thì giữ cỡ cùng dung tích nếu hũ mới có và còn hàng
                const ml = vessel?.sizes.find((s) => s.id === sel.sizeId)?.ml;
                const same = v.sizes.find((s) => s.available && s.ml === ml && vesselSizeLevel(v, s.id, map) !== "out");
                onChange({ ...sel, optionId: o.id, sizeId: same?.id, withLid: !!v.lid && sel.withLid });
              }}
            />
          ))}
        </div>
        {vessel && (
          <Flex gap={8} wrap role="radiogroup" aria-label="Kích thước">
            {sizes.map((s) => {
              const out = vesselSizeLevel(vessel, s.id, map) === "out";
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={s.id === sel.sizeId}
                  className="sf-chip"
                  data-on={s.id === sel.sizeId}
                  disabled={out}
                  onClick={() => onChange({ ...sel, sizeId: s.id })}
                >
                  {sizeLabel(s)} · {out ? "Hết hũ" : formatMoney(vessel.priceDelta + s.priceDelta)}
                </button>
              );
            })}
          </Flex>
        )}
        {vessel?.lid && (
          <Checkbox checked={sel.withLid && !lidOut} disabled={lidOut} onChange={(e) => onChange({ ...sel, withLid: e.target.checked })}>
            Thêm nắp {formatDelta(vessel.lid.priceDelta)}
            {sel.sizeId && lidOut && <Typography.Text type="secondary"> · hết nắp cỡ này</Typography.Text>}
          </Checkbox>
        )}
      </Flex>
    );
  }

  if ((step.kind === "cards" || step.kind === "swatches") && (sel?.kind === "cards" || sel?.kind === "swatches")) {
    const multi = step.multiple;
    const toggle = (o: StepOption) => {
      const has = sel.optionIds.includes(o.id);
      onChange({ ...sel, optionIds: !multi && has && step.required ? sel.optionIds : pickOption(sel.optionIds, o, options, multi, step.maxSelect) });
    };
    return (
      <div className="cfg-grid" role={multi ? "group" : "radiogroup"} aria-label={step.title.vi}>
        {options.map((o) => (
          <OptionCard key={o.id} option={o} price={optionPriceText(step, o)} multi={multi} on={sel.optionIds.includes(o.id)} block={block(o)} onClick={() => toggle(o)} />
        ))}
      </div>
    );
  }

  if (step.kind === "blend" && sel?.kind === "blend") {
    const exclusive = sel.items.some((i) => options.find((o) => o.id === i.optionId)?.exclusive);
    const toggle = (o: StepOption) => {
      const has = sel.items.some((i) => i.optionId === o.id);
      if (has) return onChange({ ...sel, items: sel.items.filter((i) => i.optionId !== o.id) });
      // Mục "không phối thêm" đứng một mình; còn lại tối đa maxBlend mục
      if (o.exclusive || step.maxBlend === 1) return onChange({ ...sel, items: [{ optionId: o.id, weight: 50 }], intensity: o.exclusive ? null : sel.intensity });
      const rest = sel.items.filter((i) => !options.find((x) => x.id === i.optionId)?.exclusive);
      const items = [...(rest.length >= step.maxBlend ? rest.slice(1) : rest), { optionId: o.id, weight: 50 }];
      onChange({ ...sel, items, intensity: sel.intensity ?? (step.intensity ? "medium" : null) });
    };
    const shares = blendRatios(step, sel, selectedSize(config, selection)?.grams ?? 0);
    const hasAmounts = materialLines(config, selection, map).some((l) => l.stepId === step.id);
    return (
      <Flex vertical gap={12}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Phối tối đa {step.maxBlend} mùi.
        </Typography.Text>
        <div className="cfg-grid" role="group" aria-label={step.title.vi}>
          {options.map((o) => (
            <OptionCard key={o.id} option={o} price={optionPriceText(step, o)} multi on={sel.items.some((i) => i.optionId === o.id)} block={block(o)} onClick={() => toggle(o)} />
          ))}
        </div>
        {/* Tỉ lệ chỉnh ở ô "Lượng cho 1 hũ" (ml, kèm %). Ô Tỉ lệ phối chỉ hiện khi tinh dầu không theo dõi kho nên không có ô lượng */}
        {shares.length > 1 && !exclusive && !hasAmounts && (
          <Flex vertical gap={8} className="cfg-box">
            <Typography.Text strong style={{ fontSize: 13 }}>
              Tỉ lệ phối
            </Typography.Text>
            {shares.map((i) => (
              <Flex key={i.optionId} align="center" gap={12}>
                <Typography.Text style={{ flex: 1, fontSize: 13 }}>{options.find((o) => o.id === i.optionId)?.name.vi}</Typography.Text>
                <InputNumber
                  aria-label={`Tỉ lệ ${options.find((o) => o.id === i.optionId)?.name.vi}`}
                  min={10}
                  max={100}
                  step={5}
                  precision={0}
                  value={sel.items.find((x) => x.optionId === i.optionId)?.weight}
                  onChange={(w) => w !== null && onChange({ ...sel, items: sel.items.map((x) => (x.optionId === i.optionId ? { ...x, weight: w } : x)) })}
                  style={{ width: 88 }}
                />
                <Typography.Text type="secondary" className="tabular" style={{ width: 40, textAlign: "right", fontSize: 13 }}>
                  {i.percent}%
                </Typography.Text>
              </Flex>
            ))}
          </Flex>
        )}
        {step.intensity && !exclusive && sel.items.length > 0 && (
          <Flex align="center" gap={12} wrap>
            <Typography.Text style={{ fontSize: 13 }}>Độ đậm</Typography.Text>
            <Segmented<IntensityLevel>
              value={sel.intensity ?? "medium"}
              onChange={(intensity) => onChange({ ...sel, intensity })}
              options={(Object.keys(intensityLabels) as IntensityLevel[]).map((l) => ({
                value: l,
                label: intensityLabels[l],
              }))}
            />
          </Flex>
        )}
      </Flex>
    );
  }

  if (step.kind === "inputs" && sel?.kind === "inputs") {
    const fields = step.fields.filter((f) => f.enabled);
    const addons = step.addons.filter((a) => a.enabled);
    return (
      <Flex vertical gap={12}>
        {fields.map((f) => (
          // Ô nhiều dòng: bộ đếm ký tự nằm dưới ô — chừa chỗ để không đè dòng kế tiếp
          <label key={f.id} style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: f.multiline ? 16 : 0 }}>
            <Typography.Text style={{ fontSize: 13 }}>
              {f.label.vi}
              {f.priceDelta > 0 && <Typography.Text type="secondary"> · {formatDelta(f.priceDelta)} khi có nhập</Typography.Text>}
            </Typography.Text>
            {f.multiline ? (
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                maxLength={f.maxLength}
                showCount
                value={sel.values[f.id] ?? ""}
                placeholder={f.placeholder?.vi}
                onChange={(e) => onChange({ ...sel, values: { ...sel.values, [f.id]: e.target.value } })}
              />
            ) : (
              <Input
                maxLength={f.maxLength}
                showCount
                value={sel.values[f.id] ?? ""}
                placeholder={f.placeholder?.vi}
                onChange={(e) => onChange({ ...sel, values: { ...sel.values, [f.id]: e.target.value } })}
              />
            )}
          </label>
        ))}
        {addons.map((a) => {
          const out = !a.available || optionLevel(a.materialId, map) === "out";
          return (
            <Checkbox
              key={a.id}
              checked={sel.addons.includes(a.id)}
              disabled={out && !sel.addons.includes(a.id)}
              onChange={(e) => onChange({ ...sel, addons: e.target.checked ? [...sel.addons, a.id] : sel.addons.filter((x) => x !== a.id) })}
            >
              {a.name.vi} <Typography.Text type="secondary">{out ? "· Tạm hết" : formatDelta(a.priceDelta)}</Typography.Text>
            </Checkbox>
          );
        })}
      </Flex>
    );
  }
  return null;
}
