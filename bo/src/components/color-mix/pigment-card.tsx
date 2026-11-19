import { DeleteOutlined, OrderedListOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Grid, Input, InputNumber, Popconfirm, Table, Typography } from "antd";
import { useMemo } from "react";
import { buildCurve, maxMeasured, pigmentSwatch, predictHex } from "@/lib/color-mix/model";
import { missingLadder, withLadder } from "@/lib/color-mix/ladder";
import { formatRate, unitOf } from "@/lib/color-mix/plan";
import type { MixMode, MixSample, MixSet, Pigment } from "@/lib/color-mix/types";
import { ColorField } from "./color-field";

// Một màu cơ bản và các mẫu đổ thử của nó. Dải màu: dự đoán từ 0 tới gấp đôi mẫu đậm nhất (nửa phải là ngoại suy). Màu nước nhập ml
export function PigmentCard({ mode, set, pigment, onChange, onRemove }: { mode: MixMode; set: MixSet; pigment: Pigment; onChange: (p: Pigment, touch?: boolean) => void; onRemove: () => void }) {
  const mobile = Grid.useBreakpoint().md === false;
  const colorLabel = `Màu (${unitOf(mode)})`;
  const strip = useMemo(() => {
    const max = maxMeasured(buildCurve(set, pigment));
    if (!max) return null;
    const curves = { [pigment.id]: buildCurve(set, pigment) };
    return { max, colors: [0, 0.25, 0.5, 0.75, 1, 1.5, 2].map((f) => predictHex(set, { [pigment.id]: f * max }, curves)) };
  }, [set, pigment]);

  const setSample = (i: number, patch: Partial<MixSample>) => onChange({ ...pigment, samples: pigment.samples.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const removeSample = (i: number) => onChange({ ...pigment, samples: pigment.samples.filter((_, j) => j !== i) });
  const concentration = (s: MixSample) => (s.plaster > 0 ? formatRate((s.pigment / s.plaster) * 100, mode) : "—");
  const plasterInput = (s: MixSample, i: number) => <InputNumber aria-label="Thạch cao (g)" min={0} value={s.plaster} onChange={(v) => setSample(i, { plaster: v ?? 0 })} style={{ width: "100%" }} />;
  const pigmentInput = (s: MixSample, i: number) => (
    <InputNumber aria-label={colorLabel} min={0} step={0.1} value={s.pigment} onChange={(v) => setSample(i, { pigment: v ?? 0 })} style={{ width: "100%" }} />
  );
  const colorInput = (s: MixSample, i: number) => <ColorField label="Màu khô đo được" allowEmpty whiteRef={set.base} value={s.hex} onChange={(hex) => setSample(i, { hex })} />;
  const removeButton = (i: number) => <Button type="text" danger aria-label="Xóa mẫu" icon={<DeleteOutlined />} onClick={() => removeSample(i)} />;
  const addSample = () => {
    const last = pigment.samples[pigment.samples.length - 1];
    onChange({ ...pigment, samples: [...pigment.samples, { plaster: last?.plaster ?? 50, pigment: last ? Math.round(last.pigment * 200) / 100 : 0.5, hex: "" }] });
  };

  return (
    <Card size="small" className="color-mix-pigment">
      <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
        <span className="color-mix-dot color-mix-dot--lg" style={{ background: pigmentSwatch(pigment) }} />
        <Input
          aria-label="Tên màu"
          defaultValue={pigment.name}
          key={pigment.name}
          onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== pigment.name && onChange({ ...pigment, name: e.target.value.trim() })}
          style={{ flex: 1, maxWidth: 260, fontWeight: 600 }}
        />
        {!mobile && <span style={{ flex: 1 }} />}
        <Popconfirm title={`Xóa màu "${pigment.name}"?`} description="Mẫu đổ thử của màu này cũng bị xóa." okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={onRemove}>
          <Button danger icon={<DeleteOutlined />} aria-label="Xóa màu">
            {!mobile && "Xóa màu"}
          </Button>
        </Popconfirm>
      </Flex>
      {strip && (
        <>
          <div className="color-mix-strip">
            {strip.colors.map((c, i) => (
              <div key={i} style={{ background: c }} />
            ))}
          </div>
          <Typography.Text type="secondary" className="color-mix-caption" style={{ textAlign: "left", marginBottom: 8 }}>
            Dự đoán từ 0 đến {formatRate(strip.max * 2, mode)}. Nửa phải là ngoại suy, vượt mẫu đậm nhất đã đo.
          </Typography.Text>
        </>
      )}
      {mobile ? (
        // Điện thoại: mỗi mẫu một khối (bảng 5 cột phải cuộn ngang, khó nhập)
        <Flex vertical gap={8}>
          {pigment.samples.length === 0 && <Typography.Text type="secondary">Chưa có mẫu</Typography.Text>}
          {pigment.samples.map((s, i) => (
            <div key={i} className="color-mix-sample">
              <Flex gap={8} align="flex-end">
                <label className="color-mix-sample-field">
                  <span>Thạch cao (g)</span>
                  {plasterInput(s, i)}
                </label>
                <label className="color-mix-sample-field">
                  <span>{colorLabel}</span>
                  {pigmentInput(s, i)}
                </label>
                <div className="color-mix-sample-pct">
                  <span>Nồng độ</span>
                  <b>{concentration(s)}</b>
                </div>
              </Flex>
              <Flex gap={8} align="flex-end" justify="space-between" style={{ marginTop: 8 }}>
                <div className="color-mix-sample-field">
                  <span>Màu khô đo được</span>
                  {colorInput(s, i)}
                </div>
                {removeButton(i)}
              </Flex>
            </div>
          ))}
        </Flex>
      ) : (
        <Table<MixSample & { i: number }>
          size="small"
          rowKey="i"
          pagination={false}
          scroll={{ x: "max-content" }}
          dataSource={pigment.samples.map((s, i) => ({ ...s, i }))}
          locale={{ emptyText: "Chưa có mẫu" }}
          columns={[
            { title: "Thạch cao (g)", width: 110, render: (_, s) => plasterInput(s, s.i) },
            { title: colorLabel, width: 110, render: (_, s) => pigmentInput(s, s.i) },
            { title: "Nồng độ", align: "right", width: 90, render: (_, s) => concentration(s) },
            { title: "Màu khô đo được", render: (_, s) => colorInput(s, s.i) },
            { title: "", align: "right", render: (_, s) => removeButton(s.i) },
          ]}
        />
      )}
      <Flex gap={8} wrap vertical={mobile} style={{ marginTop: 8 }}>
        <Button icon={<PlusOutlined />} onClick={addSample} block={mobile}>
          Thêm mẫu nồng độ khác
        </Button>
        {missingLadder(pigment).length > 0 && (
          <Button icon={<OrderedListOutlined />} onClick={() => onChange(withLadder(pigment), false)} block={mobile}>
            Thêm thang chuẩn ({missingLadder(pigment).length} mẫu)
          </Button>
        )}
      </Flex>
    </Card>
  );
}
