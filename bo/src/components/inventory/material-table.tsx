import { PlusOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Flex, Table, Tag, Tooltip, Typography, type TablePaginationConfig, type TableProps } from "antd";
import dayjs from "dayjs";
import { memo } from "react";
import { MaterialAvatar, MaterialStock } from "@/components/craft/material-view";
import { unitLabel } from "@/lib/craft/groups";
import { costBasis } from "@/lib/costs";
import { formatNumber, formatUnitCost } from "@/lib/format";
import { isMade } from "@/lib/inventory/production";
import { categoryLabels, materialLevel, type Usage } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

type Props = {
  items: Material[];
  usage: Map<string, Usage[]>;
  // Gắn trong bản nháp Thủ công nhưng chưa Lưu lên web
  unsaved: Map<string, Usage[]>;
  // Lượng các đơn Đã thanh toán đang giữ
  held: Map<string, number>;
  pagination: TablePaginationConfig;
  onOpen: (id: string) => void;
  // Mở phiếu nhập kho cho nguyên liệu
  onReceive: (preset: { materialId: string; type: "in" }) => void;
};

const barColor = { out: "#ff7875", low: "#ffc069", ok: "#95de64", untracked: "#d9d9d9" } as const;

// Bảng nguyên liệu — bấm dòng để mở chi tiết; nút + để ghi nhận nhập kho nhanh
function MaterialTableView({ items, usage, unsaved, held, pagination, onOpen, onReceive }: Props) {
  const columns: TableProps<Material>["columns"] = [
    {
      title: "Nguyên liệu",
      key: "name",
      render: (_, m) => (
        <Flex align="center" gap={12} style={{ minWidth: 220 }}>
          <MaterialAvatar item={m} />
          <Flex vertical style={{ minWidth: 0 }}>
            <Typography.Link strong onClick={() => onOpen(m.id)}>
              {m.name}
            </Typography.Link>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {[categoryLabels[m.category], m.sku, isMade(m) && "Tự sản xuất"].filter(Boolean).join(" · ")}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Tồn kho",
      key: "stock",
      render: (_, m) => {
        const level = materialLevel(m);
        return (
          <Flex vertical gap={6} style={{ width: 150 }}>
            <MaterialStock material={m} />
            {!!held.get(m.id) && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Đang giữ {formatNumber(held.get(m.id)!)} · Dùng được {formatNumber(m.stock - held.get(m.id)!)} {unitLabel[m.unit]}
              </Typography.Text>
            )}
            {/* Tồn so với 2 lần ngưỡng sắp hết — đầy thanh là dư dả */}
            {m.tracked && (
              <div aria-hidden style={{ height: 4, borderRadius: 999, background: "#ececea", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (m.stock / Math.max(1, m.lowStock * 2)) * 100)}%`, height: "100%", background: barColor[level] }} />
              </div>
            )}
          </Flex>
        );
      },
    },
    {
      title: "Giá bình quân",
      key: "cost",
      align: "right",
      responsive: ["sm"],
      render: (_, m) =>
        m.unitCost === undefined ? (
          <Typography.Text type="secondary" style={{ whiteSpace: "nowrap", fontSize: 13 }}>
            Chưa có giá
          </Typography.Text>
        ) : (
          <Typography.Text className="tabular" style={{ whiteSpace: "nowrap" }}>
            {formatUnitCost(m.unitCost * costBasis[m.unit])}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {" "}
              / {costBasis[m.unit] > 1 ? `${costBasis[m.unit]} ` : ""}
              {unitLabel[m.unit]}
            </Typography.Text>
          </Typography.Text>
        ),
    },
    {
      title: "Ngưỡng sắp hết",
      key: "low",
      responsive: ["md"],
      render: (_, m) =>
        m.tracked ? (
          <Typography.Text type="secondary" className="tabular" style={{ whiteSpace: "nowrap" }}>
            {formatNumber(m.lowStock)} {unitLabel[m.unit]}
          </Typography.Text>
        ) : (
          "—"
        ),
    },
    {
      title: "Dùng trên web",
      key: "usage",
      responsive: ["lg"],
      render: (_, m) => {
        const used = usage.get(m.id) ?? [];
        const draft = unsaved.get(m.id) ?? [];
        if (!used.length)
          return draft.length ? (
            <Tooltip title={`Đã gắn trong bản nháp Thủ công, chưa Lưu lên web: ${draft.map((u) => `${u.step.title.vi}: ${u.label}`).join(" · ")}`}>
              <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                Chưa lưu
              </Tag>
            </Tooltip>
          ) : (
            <Tag style={{ marginInlineEnd: 0 }}>Chưa dùng</Tag>
          );
        const steps = [...new Set(used.map((u) => u.step.title.vi))];
        return (
          <Tooltip title={used.map((u) => `${u.step.title.vi}: ${u.label}`).join(" · ")}>
            <Flex gap={4} wrap style={{ maxWidth: 220 }}>
              {steps.map((s) => (
                <Tag key={s} color="orange" style={{ marginInlineEnd: 0 }}>
                  {s}
                </Tag>
              ))}
            </Flex>
          </Tooltip>
        );
      },
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      responsive: ["xl"],
      render: (v: string) => (
        <Typography.Text type="secondary" style={{ whiteSpace: "nowrap", fontSize: 13 }} title={dayjs(v).format("HH:mm DD/MM/YYYY")}>
          {dayjs(v).fromNow()}
        </Typography.Text>
      ),
    },
    {
      key: "actions",
      width: 96,
      fixed: "right",
      render: (_, m) => (
        <Flex gap={4} justify="flex-end" onClick={(e) => e.stopPropagation()}>
          {m.tracked && (
            <Tooltip title="Nhập thêm">
              <Button type="text" icon={<PlusOutlined />} aria-label={`Nhập thêm ${m.name}`} onClick={() => onReceive({ materialId: m.id, type: "in" })} />
            </Tooltip>
          )}
          <Button type="text" icon={<RightOutlined />} aria-label={`Mở ${m.name}`} onClick={() => onOpen(m.id)} />
        </Flex>
      ),
    },
  ];

  return (
    <Table rowKey="id" columns={columns} dataSource={items} pagination={pagination} scroll={{ x: "max-content" }} onRow={(m) => ({ onClick: () => onOpen(m.id), style: { cursor: "pointer" } })} />
  );
}

// memo: mở/đóng drawer chỉ đổi ?material= trên URL — bảng giữ nguyên, không render lại
export const MaterialTable = memo(MaterialTableView);
