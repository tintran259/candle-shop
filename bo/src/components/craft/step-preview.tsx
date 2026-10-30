import { CheckOutlined } from "@ant-design/icons";
import { Checkbox, Flex, Input, Slider, Tag, Typography } from "antd";
import { useState } from "react";
import { stockLevel } from "@/lib/craft/groups";
import { intensityLabels } from "@/lib/craft/steps";
import type { CraftStep, IntensityLevel, StepOption } from "@/lib/craft/types";
import { formatMoney } from "@/lib/format";
import { brand } from "@/theme";

const price = (n: number) => (n ? `+${formatMoney(n)}` : "Đã gồm");
const sellable = (o: StepOption) => o.available && stockLevel(o) !== "out";
const striped = "repeating-linear-gradient(45deg,#fff 0 4px,#eee8de 4px 8px)";

// Mô phỏng gần đúng cách web hiển thị bước (bố cục, chữ, trạng thái hết hàng) — bấm thử được, không lưu
export function StepPreview({ step, index }: { step: CraftStep; index: number }) {
  return (
    <div className="sf-preview">
      <Typography.Title level={4} style={{ margin: 0, color: "#3b2a1a" }}>
        {index}. {step.title.vi}
      </Typography.Title>
      {step.hint?.vi && (
        <Typography.Text style={{ color: "#7a6a5c", fontSize: 13 }}>
          {step.hint.vi}
          {!step.required && " · không bắt buộc"}
        </Typography.Text>
      )}
      <div style={{ marginTop: 16 }}>
        <Body step={step} />
      </div>
    </div>
  );
}

function Body({ step }: { step: CraftStep }) {
  const options = step.kind === "inputs" ? [] : (step.options as StepOption[]).filter((o) => o.available);
  const [picked, setPicked] = useState<string[]>(() => {
    const first = options.find(sellable)?.id;
    return first ? [first] : [];
  });
  const toggle = (id: string, multi: boolean, max?: number) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : multi ? (max && p.length >= max ? [...p.slice(1), id] : [...p, id]) : [id]));

  if (step.kind === "inputs") return <InputsBody step={step} />;
  if (!options.length) return <Typography.Text type="secondary">Chưa có lựa chọn nào đang bán — khách sẽ không thấy bước này.</Typography.Text>;

  if (step.kind === "swatches")
    return (
      <Flex wrap gap={8} role="radiogroup">
        {options.map((o) => {
          const on = picked.includes(o.id);
          const out = !sellable(o);
          return (
            <button key={o.id} type="button" disabled={out} className="sf-swatch" aria-checked={on} role="radio" onClick={() => toggle(o.id, false)}>
              <span className="sf-dot" style={{ background: o.swatch ?? striped }}>
                {on && <CheckOutlined style={{ fontSize: 12 }} />}
              </span>
              <span style={{ fontSize: 12 }}>{o.name.vi}</span>
              <span style={{ fontSize: 11, color: "#7a6a5c" }}>{out ? "Tạm hết" : price(o.priceDelta)}</span>
            </button>
          );
        })}
      </Flex>
    );

  const multi = step.kind === "blend" ? step.maxBlend > 1 : step.kind === "cards" && step.multiple;
  const max = step.kind === "blend" ? step.maxBlend : step.kind === "cards" ? step.maxSelect : undefined;
  const vessel = step.kind === "vessel";

  return (
    <Flex vertical gap={16}>
      <div className="sf-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${vessel || step.kind === "cards" ? 150 : 130}px, 1fr))` }}>
        {options.map((o) => {
          const on = picked.includes(o.id);
          const out = !sellable(o);
          return (
            <button
              key={o.id}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={on}
              disabled={out && !on}
              className="sf-card"
              onClick={() => toggle(o.id, !!multi, max)}
            >
              <span className="sf-check">{on && <CheckOutlined style={{ fontSize: 10 }} />}</span>
              {o.images?.[0] ? (
                <img src={o.images[0]} alt="" className="sf-media" />
              ) : (
                <span className="sf-media" style={{ background: o.swatch ?? striped, borderRadius: vessel ? "10px 10px 14px 14px" : "50%" }} />
              )}
              <span style={{ fontWeight: 600, fontSize: 13 }}>{o.name.vi}</span>
              {o.description?.vi && <span style={{ fontSize: 11, color: "#7a6a5c" }}>{o.description.vi}</span>}
              <span style={{ fontSize: 12 }}>{price(o.priceDelta)}</span>
              {out && <Tag style={{ marginInlineEnd: 0, fontSize: 11 }}>Tạm hết</Tag>}
            </button>
          );
        })}
      </div>

      {step.kind === "vessel" && (
        <div>
          <Typography.Text strong style={{ color: "#3b2a1a" }}>
            Kích thước
          </Typography.Text>
          <Flex gap={8} wrap style={{ marginTop: 8 }}>
            {step.sizes
              .filter((s) => s.available)
              .map((s, i) => (
                <span key={s.id} className="sf-chip" data-on={i === 0}>
                  {s.grams}g{s.burnHours ? ` · ~${s.burnHours} giờ` : ""} · {formatMoney(s.basePrice)}
                </span>
              ))}
          </Flex>
        </div>
      )}

      {step.kind === "blend" && <BlendBody step={step} picked={picked.filter((id) => options.some((o) => o.id === id))} options={options} />}
    </Flex>
  );
}

function BlendBody({ step, picked, options }: { step: Extract<CraftStep, { kind: "blend" }>; picked: string[]; options: StepOption[] }) {
  const [level, setLevel] = useState<IntensityLevel>("medium");
  const chosen = picked.map((id) => options.find((o) => o.id === id)!).filter(Boolean);
  const exclusive = chosen.some((o) => o.exclusive);
  return (
    <Flex vertical gap={12}>
      {chosen.length > 1 && !exclusive && (
        <div className="sf-box">
          <Typography.Text strong style={{ fontSize: 13 }}>
            Tỉ lệ phối
          </Typography.Text>
          <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", margin: "10px 0" }}>
            {chosen.map((o) => (
              <span key={o.id} style={{ flex: 1, background: o.swatch ?? "#ddd" }} />
            ))}
          </div>
          {chosen.map((o) => (
            <Flex key={o.id} align="center" gap={12}>
              <span style={{ width: 90, fontSize: 13 }}>{o.name.vi}</span>
              <Slider defaultValue={50} min={10} max={100} step={5} style={{ flex: 1 }} aria-label={`Tỉ lệ ${o.name.vi}`} />
            </Flex>
          ))}
        </div>
      )}
      {step.intensity && !exclusive && (
        <div>
          <Typography.Text strong style={{ color: "#3b2a1a" }}>
            Độ đậm
          </Typography.Text>
          <Flex gap={8} style={{ marginTop: 8 }}>
            {(Object.keys(intensityLabels) as IntensityLevel[]).map((l) => (
              <button key={l} type="button" className="sf-chip" data-on={l === level} onClick={() => setLevel(l)}>
                {intensityLabels[l]}
                {step.intensity!.priceDelta[l] ? ` ${price(step.intensity!.priceDelta[l])}` : ""}
              </button>
            ))}
          </Flex>
        </div>
      )}
    </Flex>
  );
}

function InputsBody({ step }: { step: Extract<CraftStep, { kind: "inputs" }> }) {
  const fields = step.fields.filter((f) => f.enabled);
  const addons = step.addons.filter((a) => a.enabled);
  if (!fields.length && !addons.length) return <Typography.Text type="secondary">Chưa bật ô nhập hay tuỳ chọn nào.</Typography.Text>;
  return (
    <Flex vertical gap={12}>
      <div className="sf-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {fields.map((f) => (
          <label key={f.id} style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: f.multiline ? "1 / -1" : undefined }}>
            <Flex justify="space-between" style={{ fontSize: 13, fontWeight: 500 }}>
              {f.label.vi}
              {f.priceDelta > 0 && <span style={{ fontWeight: 400, color: "#7a6a5c" }}>{price(f.priceDelta)}</span>}
            </Flex>
            {f.multiline ? (
              <Input.TextArea rows={3} maxLength={f.maxLength} showCount placeholder={f.placeholder?.vi} />
            ) : (
              <Input maxLength={f.maxLength} showCount placeholder={f.placeholder?.vi} />
            )}
          </label>
        ))}
      </div>
      {addons.map((a) => (
        <label key={a.id} className="sf-box" style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", maxWidth: 380 }}>
          <Checkbox disabled={!a.available || a.stock <= 0} />
          <Flex vertical>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{a.name.vi}</span>
            {a.description?.vi && <span style={{ fontSize: 12, color: "#7a6a5c" }}>{a.description.vi}</span>}
            <span style={{ fontSize: 12, color: brand.emberDark }}>{!a.available || a.stock <= 0 ? "Tạm hết" : price(a.priceDelta)}</span>
          </Flex>
        </label>
      ))}
    </Flex>
  );
}
