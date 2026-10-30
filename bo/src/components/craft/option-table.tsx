import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Switch, Table, Tag, Typography, type TableProps } from "antd";
import { MaterialAvatar, OptionStock, VesselStock } from "@/components/craft/material-view";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { formatDelta, shapeLabels, sizeLabel } from "@/lib/craft/groups";
import { previewRoleMeta } from "@/lib/craft/steps";
import type { CraftConfig, OptionStep, StepOption, VesselOption } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import { usePageQuery } from "@/lib/use-page-query";

type Props = { step: OptionStep; config: CraftConfig; api: CraftConfigApi; map: MaterialMap; onEdit: (optionId: string) => void };

// Bảng lựa chọn của một bước: bật/tắt bán ngay trên bảng, sửa chi tiết trong drawer
export function OptionTable({ step, config, api, map, onEdit }: Props) {
  const items = step.options as StepOption[];
  const pager = usePageQuery(items.length);
  const isVessel = step.kind === "vessel";

  const columns: TableProps<StepOption>["columns"] = [
    {
      title: "Lựa chọn",
      key: "name",
      render: (_, o) => (
        <Flex align="center" gap={12} style={{ minWidth: 200 }}>
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
      title: "Phụ thu",
      dataIndex: "priceDelta",
      align: "right",
      render: (v: number) => (
        <span className="tabular" style={{ whiteSpace: "nowrap" }}>
          {formatDelta(v)}
        </span>
      ),
    },
    {
      title: isVessel ? "Tồn kho theo cỡ" : "Tồn kho",
      key: "stock",
      render: (_, o) => (step.kind === "vessel" ? <VesselStock option={o as VesselOption} sizes={step.sizes} map={map} /> : <OptionStock materialId={o.materialId} map={map} />),
    },
    {
      title: "Đang bán",
      dataIndex: "available",
      align: "center",
      render: (v: boolean, o) => (
        <Switch size="small" checked={v} onChange={(checked) => api.patchOption(step.id, o.id, { available: checked })} aria-label={`Đang bán: ${o.name.vi}`} />
      ),
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
        <Typography.Text type="secondary">
          {isVessel ? "Mỗi cỡ của hũ là một mã riêng trong Kho — hết cỡ nào web chỉ khóa cỡ đó." : "Khách chọn trong các mục đang bán và còn hàng."}
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => onEdit("new")}>
          Thêm lựa chọn
        </Button>
      </Flex>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={pager.paginationProps(items.length, "lựa chọn")}
        scroll={{ x: "max-content" }}
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
    const sizes = step.sizes.filter((s) => v.supportedSizeIds.includes(s.id)).map((s) => sizeLabel(s));
    parts.push(shapeLabels[v.shape], sizes.length ? sizes.join(" · ") : "Chưa chọn kích thước", v.lid ? "Có nắp" : "Không nắp");
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
