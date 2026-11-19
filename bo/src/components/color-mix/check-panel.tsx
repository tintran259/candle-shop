import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Flex, Input, InputNumber, Table, Tag, Typography } from "antd";
import { useMemo } from "react";
import { deltaELabel } from "@/lib/color-mix/color";
import { buildCurves, checkResult, modelAccuracy, pigmentSwatch } from "@/lib/color-mix/model";
import { unitOf } from "@/lib/color-mix/plan";
import type { MixCheck, MixSet, MixView, Pigment } from "@/lib/color-mix/types";
import { ColorField } from "./color-field";

// Tab Kiểm chứng: pha theo công thức rồi nhập màu thật → biết mô hình lệch bao nhiêu (docs/pages/color-mix.md#kiểm-chứng)
// Màu nước nhập ml (Kết hợp: theo loại của từng màu)
export function CheckPanel({ mode, set, update }: { mode: MixView; set: MixSet; update: (fn: (s: MixSet) => MixSet) => void }) {
  const unit = (kind: Pigment["kind"]) => unitOf(kind ?? (mode === "liquid" ? "liquid" : "oxide"));
  const curves = useMemo(() => buildCurves(set), [set]);
  const accuracy = useMemo(() => modelAccuracy(set), [set]);
  const patch = (id: string, p: Partial<MixCheck>) => update((s) => ({ ...s, checks: s.checks.map((c) => (c.id === id ? { ...c, ...p } : c)) }));

  return (
    <Card
      title="Mẫu kiểm chứng"
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={() => update((s) => ({ ...s, checks: [...s.checks, { id: `chk-${Date.now().toString(36)}`, name: `Mẫu ${s.checks.length + 1}`, plaster: 50, grams: {}, hex: "" }] }))}
        >
          Thêm mẫu
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">
        Pha theo công thức ở tab Pha màu (nút “Lưu làm mẫu kiểm chứng”), để khô rồi nhập màu thật. Mẫu nào lệch nhiều thì đổ thêm mẫu đơn màu ở nồng độ gần đó.
      </Typography.Paragraph>
      {accuracy && (
        <Alert
          style={{ marginBottom: 12 }}
          type={accuracy.mean < 2.5 ? "success" : accuracy.mean < 5 ? "warning" : "error"}
          showIcon
          title={`Sai số trung bình ΔE ${accuracy.mean.toFixed(2)}, lớn nhất ${accuracy.max.toFixed(2)}, trên ${accuracy.count} mẫu.`}
        />
      )}
      <Table<MixCheck>
        size="small"
        rowKey="id"
        pagination={false}
        scroll={{ x: "max-content" }}
        dataSource={set.checks}
        locale={{ emptyText: "Chưa có mẫu kiểm chứng" }}
        columns={[
          {
            title: "Tên",
            render: (_, c) => (
              <Input aria-label="Tên mẫu" defaultValue={c.name} key={c.name} onBlur={(e) => e.target.value !== c.name && patch(c.id, { name: e.target.value })} style={{ width: 140 }} />
            ),
          },
          { title: "Thạch cao (g)", render: (_, c) => <InputNumber aria-label="Thạch cao (g)" min={0} value={c.plaster} onChange={(v) => patch(c.id, { plaster: v ?? 0 })} style={{ width: 90 }} /> },
          ...set.pigments.map((p) => ({
            key: p.id,
            title: (
              <Flex align="center" gap={4}>
                <span className="color-mix-dot" style={{ background: pigmentSwatch(p) }} />
                {p.name} ({unit(p.kind)})
              </Flex>
            ),
            render: (_: unknown, c: MixCheck) => (
              <InputNumber
                aria-label={`${p.name} (${unit(p.kind)})`}
                min={0}
                step={0.01}
                value={c.grams[p.id]}
                onChange={(v) => {
                  const grams = { ...c.grams };
                  if (v && v > 0) grams[p.id] = v;
                  else delete grams[p.id];
                  patch(c.id, { grams });
                }}
                style={{ width: 90 }}
              />
            ),
          })),
          { title: "Màu thật đo được", render: (_, c) => <ColorField label="Màu thật" allowEmpty whiteRef={set.base} value={c.hex} onChange={(hex) => patch(c.id, { hex })} /> },
          {
            title: "Dự đoán",
            render: (_, c) => {
              const r = checkResult(set, c, curves);
              return r ? <span className="color-mix-dot color-mix-dot--lg" style={{ background: r.predicted }} title={r.predicted} /> : "—";
            },
          },
          {
            title: "ΔE",
            align: "right",
            render: (_, c) => {
              const r = checkResult(set, c, curves);
              return r ? <Tag color={deltaELabel(r.deltaE).color}>{r.deltaE.toFixed(1)}</Tag> : "—";
            },
          },
          {
            title: "",
            render: (_, c) => <Button type="text" danger aria-label="Xóa mẫu" icon={<DeleteOutlined />} onClick={() => update((s) => ({ ...s, checks: s.checks.filter((x) => x.id !== c.id) }))} />,
          },
        ]}
      />
    </Card>
  );
}
