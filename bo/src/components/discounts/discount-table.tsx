import { EditOutlined } from "@ant-design/icons";
import { Button, Flex, Progress, Switch, Table, Tag, Typography, type TablePaginationConfig, type TableProps } from "antd";
import { memo } from "react";
import dayjs from "dayjs";
import type { DiscountsApi } from "@/hooks/use-discounts";
import { conditionText, discountStatus, periodHint, periodText, statusMeta, valueText } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { formatNumber } from "@/lib/format";
import { brand } from "@/theme";

type Props = { items: Discount[]; api: DiscountsApi; onEdit: (id: string) => void; pagination: TablePaginationConfig };

function DiscountTableView({ items, api, onEdit, pagination }: Props) {
  const columns: TableProps<Discount>["columns"] = [
    {
      title: "Mã",
      key: "code",
      render: (_, d) => (
        <Flex vertical gap={4} style={{ minWidth: 170, maxWidth: 220 }}>
          <Typography.Text
            strong
            copyable={{ text: d.code, tooltips: ["Sao chép mã", "Đã sao chép"] }}
            className="tabular"
            style={{ letterSpacing: "0.04em" }}
          >
            {d.code}
          </Typography.Text>
          {d.description && (
            <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {d.description}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Ưu đãi",
      key: "value",
      render: (_, d) => (
        <Flex vertical gap={2} style={{ minWidth: 150, maxWidth: 200 }}>
          <Typography.Text strong style={{ color: brand.emberDark, fontSize: 15 }}>
            {valueText(d)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {conditionText(d)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Thời gian",
      key: "period",
      responsive: ["lg"],
      render: (_, d) => {
        const hint = periodHint(d);
        return (
          <Flex vertical gap={2}>
            <Typography.Text className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
              {d.endsAt ? periodText(d) : `Từ ${dayjs(d.startsAt).format("DD/MM/YYYY")}`}
            </Typography.Text>
            {!d.endsAt && !hint && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Không hết hạn
              </Typography.Text>
            )}
            {hint && (
              <Typography.Text type={hint.urgent ? "warning" : "secondary"} strong={hint.urgent} style={{ fontSize: 12 }}>
                {hint.text}
              </Typography.Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: "Lượt dùng",
      key: "usage",
      render: (_, d) => (
        <Flex vertical style={{ width: 110 }}>
          <Typography.Text className="tabular" style={{ fontSize: 13 }}>
            {formatNumber(d.used)}
            <Typography.Text type="secondary"> / {d.usageLimit ? formatNumber(d.usageLimit) : "∞"}</Typography.Text>
          </Typography.Text>
          {d.usageLimit ? (
            <Progress
              percent={Math.min(100, (d.used / d.usageLimit) * 100)}
              showInfo={false}
              size="small"
              strokeColor={d.used >= d.usageLimit ? "#fa8c16" : brand.ember}
              aria-label={`Đã dùng ${d.used} trên ${d.usageLimit} lượt`}
            />
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Không giới hạn
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, d) => {
        const s = discountStatus(d);
        return (
          <Tag color={statusMeta[s].color} style={{ marginInlineEnd: 0 }}>
            {statusMeta[s].label}
          </Tag>
        );
      },
    },
    {
      title: "Bật",
      dataIndex: "active",
      align: "center",
      render: (v: boolean, d) => (
        <Switch size="small" checked={v} onChange={(on) => api.patch(d.id, { active: on })} aria-label={`${v ? "Tạm dừng" : "Bật"} mã ${d.code}`} />
      ),
    },
    {
      key: "actions",
      width: 56,
      // Ghim mép phải: bảng cuộn ngang trên màn hẹp vẫn thấy nút sửa
      fixed: "right",
      render: (_, d) => <Button type="text" icon={<EditOutlined />} aria-label={`Sửa mã ${d.code}`} onClick={() => onEdit(d.id)} />,
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={items}
      pagination={pagination}
      scroll={{ x: "max-content" }}
      onRow={(d) => ({ style: { opacity: ["expired", "paused"].includes(discountStatus(d)) ? 0.65 : 1 } })}
    />
  );
}

// memo: mở/đóng drawer chỉ đổi ?order= / ?edit= trên URL — bảng giữ nguyên, không render lại
export const DiscountTable = memo(DiscountTableView);
