import { Avatar, Button, Flex, Grid, Popconfirm, Table, Tag, Typography, type TablePaginationConfig, type TableProps } from "antd";
import dayjs from "dayjs";
import { memo } from "react";
import { Link } from "react-router";
import { statusMeta } from "@/lib/cancelled/labels";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { formatMoney } from "@/lib/format";
import { brand } from "@/theme";

type Props = {
  items: CancelledProduct[];
  onOpen: (id: string) => void;
  onCreate: (id: string) => void;
  onDiscard: (item: CancelledProduct) => void;
  pagination: TablePaginationConfig;
};

// Đủ 2 nút xử lý quan trọng hơn cột phụ: màn hẹp ẩn bớt cột (vẫn xem được trong drawer), không để bảng cuộn ngang
function CancelledTableView({ items, onOpen, onCreate, onDiscard, pagination }: Props) {
  const screens = Grid.useBreakpoint();
  const columns: TableProps<CancelledProduct>["columns"] = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, c) => (
        <Flex align="center" gap={12} style={{ minWidth: 150, maxWidth: screens.sm === false ? 150 : 240 }}>
          <Avatar shape="square" size={48} src={c.images[0]} alt="" style={{ borderRadius: 12, flexShrink: 0, background: brand.emberLight }} />
          <Flex vertical gap={4} align="flex-start" style={{ minWidth: 0 }}>
            <Typography.Link strong onClick={() => onOpen(c.id)} style={{ color: "inherit" }}>
              {c.name}
            </Typography.Link>
            {c.custom && (
              <Typography.Text type="secondary" ellipsis={{ tooltip: c.custom }} style={{ fontSize: 12, maxWidth: "100%" }}>
                {c.custom}
              </Typography.Text>
            )}
            {c.personalized && (
              <Tag color="orange" style={{ marginInlineEnd: 0 }}>
                Có chữ riêng
              </Tag>
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Đơn gốc",
      key: "order",
      responsive: ["xl"],
      render: (_, c) => (
        <Flex vertical gap={2}>
          <Link to={`/orders?order=${c.orderId}`} className="tabular">
            {c.orderCode}
          </Link>
          <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            {c.customerName}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Ngày hủy",
      key: "cancelledAt",
      responsive: ["xxl"],
      render: (_, c) => (
        <Flex vertical gap={2} style={{ maxWidth: 160 }}>
          <Typography.Text className="tabular" style={{ fontSize: 13 }}>
            {dayjs(c.cancelledAt).format("DD/MM/YYYY")}
          </Typography.Text>
          <Typography.Text type="secondary" ellipsis={{ tooltip: c.cancelReason }} style={{ fontSize: 12 }}>
            {c.cancelReason}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "SL",
      dataIndex: "quantity",
      align: "right",
      responsive: ["sm"],
      render: (v: number) => <span className="tabular">{v}</span>,
    },
    {
      title: "Giá gốc",
      key: "price",
      align: "right",
      responsive: ["xl"],
      render: (_, c) => (
        <span className="tabular" style={{ whiteSpace: "nowrap" }}>
          {formatMoney(c.price)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, c) => (
        <Tag color={statusMeta[c.status].color} style={{ marginInlineEnd: 0, whiteSpace: "nowrap" }}>
          {statusMeta[c.status].label}
        </Tag>
      ),
    },
    {
      title: "Xử lý",
      key: "actions",
      responsive: ["lg"],
      render: (_, c) =>
        c.status === "pending" ? (
          <Flex gap={8} wrap={false}>
            <Button size="small" type="primary" onClick={() => onCreate(c.id)}>
              Tạo sản phẩm trưng bày
            </Button>
            <Popconfirm
              title={c.quantity > 1 ? `Bỏ ${c.quantity} cây “${c.name}”?` : `Bỏ “${c.name}”?`}
              description="Không thể hoàn tác."
              okText="Bỏ"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => onDiscard(c)}
            >
              <Button size="small" danger>
                Bỏ
              </Button>
            </Popconfirm>
          </Flex>
        ) : c.status === "converted" && c.displayProductId ? (
          <Link to={`/products?edit=${c.displayProductId}`} style={{ whiteSpace: "nowrap" }}>
            Xem sản phẩm
          </Link>
        ) : null,
    },
  ];

  return <Table rowKey="id" size="middle" columns={columns} dataSource={items} pagination={pagination} scroll={{ x: "max-content" }} />;
}

export const CancelledTable = memo(CancelledTableView);
