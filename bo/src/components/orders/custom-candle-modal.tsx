import { CheckOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Checkbox, Col, Empty, Flex, Grid, Input, InputNumber, Modal, Row, Segmented, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { StepIconView } from "@/components/craft/step-icon";
import { formatDelta, sizeLabel, unitLabel } from "@/lib/craft/groups";
import {
  activeSteps,
  blendShares,
  describeSelection,
  emptySelection,
  materialNeeds,
  maxJars,
  optionBlock,
  priceSelection,
  validateSelection,
  type CraftSelection,
  type StepSelection,
} from "@/lib/craft/selection";
import { intensityLabels } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, IntensityLevel, StepOption, VesselOption } from "@/lib/craft/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { lidLevel, optionLevel, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";
import { brand } from "@/theme";

export type CustomCandle = { selection: CraftSelection; description: string; price: number };

type Props = {
  open: boolean;
  config: CraftConfig;
  map: MaterialMap;
  initial?: CraftSelection;
  onCancel: () => void;
  onApply: (candle: CustomCandle) => void;
};

const striped = "repeating-linear-gradient(45deg,#fff 0 4px,#eee8de 4px 8px)";

// Cấu hình nến tự phối cho đơn tạo tại BO — đi đúng các bước của trang Thủ công (bản đã lưu).
// Mỗi lựa chọn gắn nguyên liệu trong Kho: hết thì khóa; giá, mô tả, số hũ làm được tự tính.
export function CustomCandleModal({ open, config, map, initial, onCancel, onApply }: Props) {
  const screens = Grid.useBreakpoint();
  const [selection, setSelection] = useState<CraftSelection>(() => ({ ...emptySelection(config), ...initial }));
  const [tried, setTried] = useState(false);
  const steps = activeSteps(config);

  const price = useMemo(() => priceSelection(config, selection), [config, selection]);
  const needs = useMemo(() => materialNeeds(config, selection, map), [config, selection, map]);
  const issues = useMemo(() => validateSelection(config, selection, map), [config, selection, map]);
  const description = describeSelection(config, selection);
  const jars = maxJars(needs, map);
  const set = (stepId: string, next: StepSelection) => setSelection((s) => ({ ...s, [stepId]: next }));

  const apply = () => {
    setTried(true);
    if (issues.length) {
      document.getElementById(`cfg-step-${issues[0].stepId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onApply({ selection, description, price: price.unit });
  };

  return (
    <Modal
      open={open}
      title="Nến tự phối"
      width={screens.md ? 980 : "100%"}
      onCancel={onCancel}
      destroyOnHidden
      styles={{ body: { paddingTop: 4 } }}
      footer={
        <Flex justify="space-between" align="center" gap={12} wrap>
          <Typography.Text type={tried && issues.length ? "danger" : "secondary"} style={{ fontSize: 13 }}>
            {tried && issues.length ? `Còn ${issues.length} bước cần chọn lại` : "Giá theo cấu hình đã lưu ở trang Thủ công."}
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" onClick={apply}>
              {initial ? "Cập nhật nến" : "Thêm vào đơn"} · {formatMoney(price.unit)}
            </Button>
          </Flex>
        </Flex>
      }
    >
      {!steps.length ? (
        <Empty description="Trang Thủ công chưa có bước nào đang hiện." />
      ) : (
        <Row gutter={[24, 16]}>
          <Col xs={24} md={15}>
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
                    <StepBody step={step} config={config} selection={selection} map={map} onChange={(next) => set(step.id, next)} />
                  </div>
                  {tried &&
                    issues
                      .filter((x) => x.stepId === step.id)
                      .map((x) => (
                        <Typography.Text key={x.message} type="danger" role="alert" style={{ display: "block", fontSize: 13, marginTop: 6 }}>
                          {x.message}
                        </Typography.Text>
                      ))}
                </section>
              ))}
            </Flex>
          </Col>

          {/* Tóm tắt dính bên phải: mô tả cho xưởng, giá 1 hũ, nguyên liệu trừ kho */}
          <Col xs={24} md={9}>
            <aside className="cfg-summary" aria-label="Tóm tắt nến tự phối">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Mô tả gửi xưởng
              </Typography.Text>
              <Typography.Paragraph style={{ margin: "2px 0 12px", fontSize: 13 }}>{description || "Chưa chọn gì."}</Typography.Paragraph>

              <Flex vertical gap={4}>
                {price.lines.map((l, k) => (
                  <Flex key={k} justify="space-between" gap={8} style={{ fontSize: 13 }}>
                    <Typography.Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                      {l.label}
                    </Typography.Text>
                    <Typography.Text className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                      {l.label.startsWith("Giá gốc") ? formatMoney(l.amount) : formatDelta(l.amount)}
                    </Typography.Text>
                  </Flex>
                ))}
              </Flex>
              <Flex justify="space-between" style={{ borderTop: "1px solid #eee5da", marginTop: 8, paddingTop: 8 }}>
                <Typography.Text strong>Giá 1 hũ</Typography.Text>
                <Typography.Text strong className="tabular">
                  {formatMoney(price.unit)}
                </Typography.Text>
              </Flex>

              <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 16 }}>
                Nguyên liệu cho 1 hũ (trừ Kho)
              </Typography.Text>
              {needs.size ? (
                <Flex vertical gap={4} style={{ marginTop: 4 }} role="list">
                  {[...needs].map(([id, need]) => {
                    const m = map.get(id)!;
                    const short = m.stock < need;
                    return (
                      <Flex key={id} role="listitem" justify="space-between" gap={8} style={{ fontSize: 13 }}>
                        <Typography.Text ellipsis style={{ fontSize: 13 }}>
                          {m.name}
                        </Typography.Text>
                        <Typography.Text type={short ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                          {formatNumber(need)} / {formatNumber(m.stock)} {unitLabel[m.unit]}
                        </Typography.Text>
                      </Flex>
                    );
                  })}
                </Flex>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Chưa có nguyên liệu theo dõi tồn.
                </Typography.Text>
              )}
              <div className="cfg-jars" data-tone={jars === 0 ? "out" : jars <= 5 ? "low" : "ok"} role="status">
                {jars === Infinity ? "Không giới hạn số hũ" : jars === 0 ? "Kho không đủ làm hũ nào" : `Kho đủ làm ${formatNumber(jars)} hũ`}
              </div>
            </aside>
          </Col>
        </Row>
      )}
    </Modal>
  );
}

type BodyProps = { step: CraftStep; config: CraftConfig; selection: CraftSelection; map: MaterialMap; onChange: (next: StepSelection) => void };

// Thẻ chọn: ảnh/màu, tên, phụ thu; khóa kèm lý do (hết nguyên liệu, không hợp…)
function OptionCard({ option, on, block, multi, onClick }: { option: StepOption; on: boolean; block: string | null; multi?: boolean; onClick: () => void }) {
  const media = option.images?.[0];
  return (
    <button type="button" className="cfg-option" role={multi ? "checkbox" : "radio"} aria-checked={on} disabled={!!block && !on} onClick={onClick} title={block ? `${option.name.vi} — ${block}` : option.name.vi}>
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
            formatDelta(option.priceDelta)
          )}
        </span>
      </span>
    </button>
  );
}

function StepBody({ step, config, selection, map, onChange }: BodyProps) {
  const sel = selection[step.id];
  const options = step.kind === "inputs" ? [] : (step.options as StepOption[]).filter((o) => o.available);
  const block = (o: StepOption) => optionBlock(config, selection, step, o, map);

  if (step.kind === "vessel" && sel?.kind === "vessel") {
    const vessel = options.find((o) => o.id === sel.optionId) as VesselOption | undefined;
    const sizes = step.sizes.filter((s) => s.available && (!vessel || vessel.supportedSizeIds.includes(s.id)));
    const lidOut = !vessel?.lid || !sel.sizeId || lidLevel(vessel, sel.sizeId, map) === "out";
    return (
      <Flex vertical gap={12}>
        <div className="cfg-grid" role="radiogroup" aria-label="Chọn hũ">
          {options.map((o) => (
            <OptionCard
              key={o.id}
              option={o}
              on={o.id === sel.optionId}
              block={block(o)}
              onClick={() => {
                const v = o as VesselOption;
                // Giữ cỡ đang chọn nếu hũ mới đổ được và còn hàng, không thì để admin chọn lại
                const keep = sel.sizeId && v.supportedSizeIds.includes(sel.sizeId) && vesselSizeLevel(v, sel.sizeId, map) !== "out";
                onChange({ ...sel, optionId: o.id, sizeId: keep ? sel.sizeId : undefined, withLid: !!v.lid && sel.withLid });
              }}
            />
          ))}
        </div>
        {vessel && (
          <Flex gap={8} wrap role="radiogroup" aria-label="Kích thước">
            {sizes.map((s) => {
              const out = vesselSizeLevel(vessel, s.id, map) === "out";
              return (
                <button key={s.id} type="button" role="radio" aria-checked={s.id === sel.sizeId} className="sf-chip" data-on={s.id === sel.sizeId} disabled={out} onClick={() => onChange({ ...sel, sizeId: s.id })}>
                  {sizeLabel(s)} · {out ? "Hết hũ" : formatMoney(s.basePrice)}
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
    const multi = step.kind === "cards" && step.multiple;
    const max = step.kind === "cards" ? step.maxSelect : undefined;
    const toggle = (id: string) => {
      const has = sel.optionIds.includes(id);
      const next = has ? sel.optionIds.filter((x) => x !== id) : multi ? [...(max && sel.optionIds.length >= max ? sel.optionIds.slice(1) : sel.optionIds), id] : [id];
      onChange({ ...sel, optionIds: !multi && has && step.required ? sel.optionIds : next });
    };
    return (
      <div className="cfg-grid" role={multi ? "group" : "radiogroup"} aria-label={step.title.vi}>
        {options.map((o) => (
          <OptionCard key={o.id} option={o} multi={multi} on={sel.optionIds.includes(o.id)} block={block(o)} onClick={() => toggle(o.id)} />
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
    const shares = blendShares(sel.items);
    return (
      <Flex vertical gap={12}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Phối tối đa {step.maxBlend} mùi.
        </Typography.Text>
        <div className="cfg-grid" role="group" aria-label={step.title.vi}>
          {options.map((o) => (
            <OptionCard key={o.id} option={o} multi on={sel.items.some((i) => i.optionId === o.id)} block={block(o)} onClick={() => toggle(o)} />
          ))}
        </div>
        {shares.length > 1 && !exclusive && (
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
                label: `${intensityLabels[l]}${step.intensity!.priceDelta[l] ? ` ${formatDelta(step.intensity!.priceDelta[l])}` : ""}`,
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
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={f.maxLength} showCount value={sel.values[f.id] ?? ""} placeholder={f.placeholder?.vi} onChange={(e) => onChange({ ...sel, values: { ...sel.values, [f.id]: e.target.value } })} />
            ) : (
              <Input maxLength={f.maxLength} showCount value={sel.values[f.id] ?? ""} placeholder={f.placeholder?.vi} onChange={(e) => onChange({ ...sel, values: { ...sel.values, [f.id]: e.target.value } })} />
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
