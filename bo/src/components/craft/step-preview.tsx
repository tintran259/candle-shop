import { CheckOutlined } from "@ant-design/icons";
import { Checkbox, Flex, Input, Slider, Tag, Typography } from "antd";
import { useState } from "react";
import { intensityLabels } from "@/lib/craft/steps";
import { sizeLabel } from "@/lib/craft/groups";
import type { CraftStep, IntensityLevel, StepOption, VesselOption, VesselStep } from "@/lib/craft/types";
import { formatMoney } from "@/lib/format";
import { lidLevel, optionLevel, sellable as canSell, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";
import { brand } from "@/theme";

const price = (n: number) => (n ? `+${formatMoney(n)}` : "Đã gồm");
const striped = "repeating-linear-gradient(45deg,#fff 0 4px,#eee8de 4px 8px)";

// Mô phỏng gần đúng cách web hiển thị bước (bố cục, chữ, trạng thái hết hàng) — bấm thử được, không lưu
export function StepPreview({ step, index, map }: { step: CraftStep; index: number; map: MaterialMap }) {
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
        <Body step={step} map={map} />
      </div>
    </div>
  );
}

function Body({ step, map }: { step: CraftStep; map: MaterialMap }) {
  const sellable = (o: StepOption) => canSell(o, map);
  const options = step.kind === "inputs" ? [] : (step.options as StepOption[]).filter((o) => o.available);
  const [picked, setPicked] = useState<string[]>(() => {
    const first = options.find(sellable)?.id;
    return first ? [first] : [];
  });
  const toggle = (id: string, multi: boolean, max?: number) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : multi ? (max && p.length >= max ? [...p.slice(1), id] : [...p, id]) : [id]));

  if (step.kind === "inputs") return <InputsBody step={step} map={map} />;
  if (!options.length) return <Typography.Text type="secondary">Chưa có lựa chọn nào đang bán — khách sẽ không thấy bước này.</Typography.Text>;

  if (step.kind === "swatches")
    return (
      <Flex wrap gap={8} role="radiogroup">
        {options.map((o) => {
          const on = picked.includes(o.id);
          const out = !sellable(o);
          return (
            <button key={o.id} type="button" disabled={out} className="sf-swatch" aria-checked={on} role="radio" onClick={() => toggle(o.id, false)}>
              {/* Có ảnh thì ưu tiên ảnh, không thì màu, không màu thì ô sọc */}
              <span className="sf-dot" style={{ background: o.images?.[0] ? `center / cover no-repeat url("${o.images[0]}")` : (o.swatch ?? striped) }}>
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

      {step.kind === "vessel" && (() => {
        const vessel = options.find((o) => o.id === picked[0]) as VesselOption | undefined;
        return vessel && <VesselSizes key={vessel.id} step={step} vessel={vessel} map={map} />;
      })()}

      {step.kind === "blend" && <BlendBody step={step} picked={picked.filter((id) => options.some((o) => o.id === id))} options={options} />}
    </Flex>
  );
}

// Cỡ của hũ đang chọn: cỡ hết mã hũ trong Kho thì khóa riêng cỡ đó; nắp cũng tính theo cỡ
function VesselSizes({ step, vessel, map }: { step: VesselStep; vessel: VesselOption; map: MaterialMap }) {
  const sizes = step.sizes.filter((s) => s.available && vessel.supportedSizeIds.includes(s.id));
  const open = (id: string) => vesselSizeLevel(vessel, id, map) !== "out";
  const [size, setSize] = useState(() => sizes.find((s) => open(s.id))?.id);
  const [lid, setLid] = useState(false);
  const lidOut = !size || lidLevel(vessel, size, map) === "out";
  return (
    <Flex vertical gap={12}>
      <div>
        <Typography.Text strong style={{ color: "#3b2a1a" }}>
          Kích thước
        </Typography.Text>
        <Flex gap={8} wrap style={{ marginTop: 8 }} role="radiogroup">
          {sizes.map((s) => {
            const out = !open(s.id);
            return (
              <button key={s.id} type="button" role="radio" aria-checked={s.id === size} disabled={out} className="sf-chip" data-on={s.id === size} onClick={() => setSize(s.id)}>
                {sizeLabel(s)}
                {out ? " · Hết hàng" : `${s.burnHours ? ` · ~${s.burnHours} giờ` : ""} · ${formatMoney(s.basePrice)}`}
              </button>
            );
          })}
        </Flex>
      </div>
      {vessel.lid && (
        <label className="sf-box" style={{ display: "flex", gap: 10, alignItems: "center", cursor: lidOut ? "not-allowed" : "pointer", maxWidth: 380 }}>
          <Checkbox checked={lid && !lidOut} disabled={lidOut} onChange={(e) => setLid(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Thêm nắp</span>
          <span style={{ fontSize: 12, color: brand.emberDark, marginLeft: "auto" }}>{lidOut ? "Hết nắp cỡ này" : price(vessel.lid.priceDelta)}</span>
        </label>
      )}
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

function InputsBody({ step, map }: { step: Extract<CraftStep, { kind: "inputs" }>; map: MaterialMap }) {
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
          <Checkbox disabled={!a.available || optionLevel(a.materialId, map) === "out"} />
          <Flex vertical>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{a.name.vi}</span>
            {a.description?.vi && <span style={{ fontSize: 12, color: "#7a6a5c" }}>{a.description.vi}</span>}
            <span style={{ fontSize: 12, color: brand.emberDark }}>{!a.available || optionLevel(a.materialId, map) === "out" ? "Tạm hết" : price(a.priceDelta)}</span>
          </Flex>
        </label>
      ))}
    </Flex>
  );
}
