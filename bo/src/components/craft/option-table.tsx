import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Switch, Table, Tag, Tooltip, Typography, type TableProps } from "antd";
import { useMemo } from "react";
import { CostCheck } from "@/components/craft/margin";
import { MaterialAvatar, OptionStock, VesselStock } from "@/components/craft/material-view";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { formatDelta, shapeLabels, sizeLabel } from "@/lib/craft/groups";
import { optionCheck } from "@/lib/craft/pricing";
import { amountBasis, basisLabel, previewRoleMeta } from "@/lib/craft/steps";
import type { CraftConfig, OptionStep, StepOption, VesselOption } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { ShopSettings } from "@/lib/settings/types";
import { formatMoney } from "@/lib/format";
import { usePageQuery } from "@/lib/use-page-query";
import { compactColumns, useCompactTable } from "@/components/compact-columns";

type Props = {
  step: OptionStep;
  config: CraftConfig;
  api: CraftConfigApi;
  map: MaterialMap;
  pricing: Pick<ShopSettings, "minMargin">;
  onEdit: (optionId: string) => void;
};

// Bảng lựa chọn của một bước: bật/tắt bán ngay trên bảng, sửa chi tiết trong drawer
export function OptionTable({ step, config, api, map, pricing, onEdit }: Props) {
  const items = step.options as StepOption[];
  // Phụ thu so với giá vốn tối thiểu của từng lựa chọn
  const checks = useMemo(() => new Map(items.map((o) => [o.id, optionCheck(config, step, o, map)])), [items, config, step, map]);
  const pager = usePageQuery(items.length);
  const isVessel = step.kind === "vessel";
  // Sáp, màu, hương: giá bán mỗi 100 g / mỗi ml
  const basis = amountBasis(step);

  const compact = useCompactTable();
  const columns: TableProps<StepOption>["columns"] = [
    {
      title: "Lựa chọn",
      key: "name",
      render: (_, o) => (
        <Flex align="center" gap={12} style={{ minWidth: compact ? 0 : 200 }}>
          <MaterialAvatar item={o} />
          <Flex vertical style={{ minWidth: 0 }}>
            <Typography.Text strong>{o.name.vi}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {o.name.en}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    { title: "Chi tiết", key: "details", responsive: ["xxl"], render: (_, o) => <Details step={step} option={o} config={config} /> },
    {
      title: isVessel ? "Giá theo cỡ" : basis ? `Giá bán / ${basisLabel(basis)}` : "Phụ thu",
      dataIndex: "priceDelta",
      align: "right",
      render: (v: number, o) =>
        isVessel ? (
          // Hũ: giá khách trả từng cỡ = giá hũ + phụ thu cỡ
          <Flex vertical gap={2} className="tabular" style={{ whiteSpace: "nowrap", fontSize: 13 }}>
            {(o as VesselOption).sizes
              .filter((s) => s.available)
              .map((s) => (
                <span key={s.id}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {sizeLabel(s)}
                  </Typography.Text>{" "}
                  {formatMoney(v + s.priceDelta)}
                </span>
              ))}
            {!(o as VesselOption).sizes.some((s) => s.available) && <Typography.Text type="secondary">Chưa có cỡ đang bán</Typography.Text>}
          </Flex>
        ) : (
          <span className="tabular" style={{ whiteSpace: "nowrap" }}>
            {basis ? (o.unitPrice ? formatMoney(o.unitPrice) : "—") : formatDelta(v)}
          </span>
        ),
    },
    {
      title: (
        <Tooltip
          title={
            isVessel
              ? "Giá hũ + phụ thu cỡ nên ≥ giá vốn hũ cỡ đó + sáp mặc định theo số gram + bấc mặc định. Hiện cỡ thiếu nhiều nhất, không thiếu thì cỡ tốn nhất; từng cỡ xem trong drawer hũ."
              : "Phụ thu nên ≥ giá vốn nguyên liệu của mục này. Bước bắt buộc: trừ phần giá hũ đã trả cho mục mặc định (vd sáp ong chỉ cần bù phần đắt hơn sáp đậu nành). Sáp, màu, hương tính theo gram nên lấy cỡ tốn nhất."
          }
        >
          <span>Giá vốn tối thiểu</span>
        </Tooltip>
      ),
      key: "cost",
      render: (_, o) => {
        const c = checks.get(o.id);
        if (!c)
          return (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              —
            </Typography.Text>
          );
        return (
          <div role="group" aria-label={`Giá vốn ${o.name.vi}`}>
            <CostCheck c={c} min={pricing.minMargin} note={c.floor > 0 && c.size ? `cỡ ${sizeLabel(c.size)}` : undefined} free={c.isDefault ? "Tính trong giá hũ" : undefined} />
          </div>
        );
      },
    },
    {
      title: isVessel ? "Tồn kho theo cỡ" : "Tồn kho",
      key: "stock",
      render: (_, o) => (step.kind === "vessel" ? <VesselStock option={o as VesselOption} map={map} /> : <OptionStock materialId={o.materialId} map={map} />),
    },
    {
      title: "Đang bán",
      dataIndex: "available",
      align: "center",
      render: (v: boolean, o) => <Switch size="small" checked={v} onChange={(checked) => api.patchOption(step.id, o.id, { available: checked })} aria-label={`Đang bán: ${o.name.vi}`} />,
    },
    {
      key: "actions",
      width: 56,
      fixed: "right",
      render: (_, o) => <Button type="text" icon={<EditOutlined />} aria-label={`Sửa ${o.name.vi}`} onClick={() => onEdit(o.id)} />,
    },
  ];

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Typography.Text type="secondary">{isVessel ? "Mỗi cỡ của hũ là một mã riêng trong Kho — hết cỡ nào web chỉ khóa cỡ đó." : "Khách chọn trong các mục đang bán và còn hàng."}</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => onEdit("new")}>
          Thêm lựa chọn
        </Button>
      </Flex>
      <Table
        rowKey="id"
        // Điện thoại: giá và tồn kho dưới tên; giá vốn tối thiểu xem trong drawer
        columns={compact ? compactColumns(columns, "name", ["priceDelta", "stock"], ["available", "actions"]) : columns}
        size={compact ? "small" : undefined}
        dataSource={items}
        pagination={pager.paginationProps(items.length, "lựa chọn")}
        scroll={compact ? undefined : { x: "max-content" }}
        onRow={(o) => ({ style: { opacity: o.available ? 1 : 0.6 } })}
        locale={{ emptyText: "Chưa có lựa chọn nào — bấm “Thêm lựa chọn”." }}
      />
    </Flex>
  );
}

function Details({ step, option, config }: { step: OptionStep; option: StepOption; config: CraftConfig }) {
  const parts: string[] = [];
  if (step.kind === "vessel") {
    const v = option as VesselOption;
    parts.push(shapeLabels[v.shape], v.jarType ? `Kho: ${v.jarType}` : "Chưa chọn loại hũ", v.lid ? "Có nắp" : "Không nắp");
  }
  if ("previewRole" in step && step.previewRole && option.look) {
    const look = previewRoleMeta[step.previewRole].looks?.find((l) => l.value === option.look);
    if (look) parts.push(`Minh họa: ${look.label}`);
  }
  if (option.maxGrams) parts.push(`Tối đa ${option.maxGrams}g`);

  const limits = Object.entries(option.onlyWith ?? {}).map(([stepId, ids]) => {
    const target = config.steps.find((s) => s.id === stepId);
    return `${target?.title.vi ?? stepId}: ${ids.length} mục`;
  });

  return (
    <Flex vertical gap={4} style={{ maxWidth: 280 }}>
      {parts.length > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {parts.join(" · ")}
        </Typography.Text>
      )}
      <Flex gap={4} wrap>
        {option.exclusive && <Tag style={{ marginInlineEnd: 0 }}>Không phối thêm</Tag>}
        {limits.map((l) => (
          <Tag key={l} color="orange" style={{ marginInlineEnd: 0 }}>
            Chỉ với {l}
          </Tag>
        ))}
      </Flex>
    </Flex>
  );
}
