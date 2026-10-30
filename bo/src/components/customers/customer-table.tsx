import { RightOutlined } from "@ant-design/icons";
import { Button, Flex, Table, Tag, Typography, type TablePaginationConfig, type TableProps } from "antd";
import dayjs from "dayjs";
import { memo } from "react";
import { CustomerAvatar, SegmentTag } from "@/components/customers/customer-view";
import { spentText } from "@/lib/customers/filters";
import type { CustomerRow } from "@/lib/customers/stats";
import { formatMoney } from "@/lib/format";

type Props = { items: CustomerRow[]; onOpen: (id: string) => void; pagination: TablePaginationConfig };

// Bảng khách hàng — bấm cả dòng để mở hồ sơ
function CustomerTableView({ items, onOpen, pagination }: Props) {
  const columns: TableProps<CustomerRow>["columns"] = [
    {
      title: "Khách hàng",
      key: "name",
      render: (_, { customer: c }) => (
        <Flex align="center" gap={12} style={{ minWidth: 220 }}>
          <CustomerAvatar customer={c} />
          <Flex vertical style={{ minWidth: 0 }}>
            <Typography.Link strong onClick={() => onOpen(c.id)}>
              {c.name}
            </Typography.Link>
            <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 220 }}>
              {c.email}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Điện thoại",
      key: "phone",
      responsive: ["md"],
      render: (_, { customer: c }) => (
        <Flex vertical>
          <Typography.Text className="tabular" style={{ whiteSpace: "nowrap" }}>
            {c.phone}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {c.hasAccount ? "Có tài khoản" : "Vãng lai"}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Nhóm",
      key: "segment",
      render: (_, { customer: c, stats }) => <SegmentTag segment={stats.segment} blocked={c.blocked} />,
    },
    {
      title: "Đơn",
      key: "orders",
      align: "right",
      render: (_, { stats }) => (
        <Flex vertical align="flex-end">
          <Typography.Text className="tabular">{stats.orderCount}</Typography.Text>
          {stats.cancelled > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {stats.cancelled} đã hủy
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Đã chi",
      key: "spent",
      align: "right",
      render: (_, { stats }) => (
        <Flex vertical align="flex-end">
          <Typography.Text strong className="tabular" style={{ whiteSpace: "nowrap" }}>
            {spentText(stats.spent)}
          </Typography.Text>
          {stats.orderCount > 1 && (
            <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              TB {formatMoney(stats.average)}/đơn
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Đơn gần nhất",
      key: "last",
      responsive: ["lg"],
      render: (_, { stats }) =>
        stats.lastOrderAt ? (
          <Flex vertical>
            <Typography.Text style={{ whiteSpace: "nowrap" }}>{dayjs(stats.lastOrderAt).fromNow()}</Typography.Text>
            <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
              {dayjs(stats.lastOrderAt).format("DD/MM/YYYY")}
            </Typography.Text>
          </Flex>
        ) : (
          <Typography.Text type="secondary">Chưa đặt</Typography.Text>
        ),
    },
    {
      title: "Nhãn",
      key: "tags",
      responsive: ["xl"],
      render: (_, { customer: c }) =>
        c.tags.length ? (
          <Flex gap={4} wrap style={{ maxWidth: 220 }}>
            {c.tags.map((t) => (
              <Tag key={t} style={{ marginInlineEnd: 0 }}>
                {t}
              </Tag>
            ))}
          </Flex>
        ) : null,
    },
    {
      key: "open",
      width: 56,
      // Ghim mép phải: bảng cuộn ngang trên màn hẹp vẫn thấy nút mở
      fixed: "right",
      render: (_, { customer: c }) => <Button type="text" icon={<RightOutlined />} aria-label={`Xem hồ sơ ${c.name}`} onClick={() => onOpen(c.id)} />,
    },
  ];

  return (
    <Table
      rowKey={(r) => r.customer.id}
      columns={columns}
      dataSource={items}
      pagination={pagination}
      scroll={{ x: "max-content" }}
      onRow={(r) => ({ onClick: () => onOpen(r.customer.id), style: { cursor: "pointer", opacity: r.customer.blocked ? 0.65 : 1 } })}
    />
  );
}

// memo: mở/đóng drawer chỉ đổi ?customer= trên URL — bảng giữ nguyên, không render lại
export const CustomerTable = memo(CustomerTableView);
