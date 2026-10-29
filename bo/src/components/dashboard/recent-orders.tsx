import { Card, Flex, Table, Typography, type TableProps } from "antd";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router";
import { MoreLink } from "@/components/more-link";
import { ReadyDate, StatusTag } from "@/components/orders/order-view";
import { useOrders } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import { itemCount } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";

const columns: TableProps<Order>["columns"] = [
  {
    title: "Mã đơn",
    dataIndex: "code",
    render: (v: string, o) => (
      <Flex vertical>
        <Link to={`/orders?order=${o.id}`} className="tabular" style={{ fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
          {v}
        </Link>
        <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
          {dayjs(o.createdAt).format("HH:mm DD/MM")}
        </Typography.Text>
      </Flex>
    ),
  },
  {
    title: "Khách hàng",
    key: "customer",
    render: (_, o) => (
      <Flex vertical>
        <Typography.Text>{o.customer.name}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {itemCount(o)} sản phẩm
        </Typography.Text>
      </Flex>
    ),
  },
  { title: "Làm xong", key: "ready", responsive: ["sm"], render: (_, o) => <ReadyDate order={o} /> },
  { title: "Trạng thái", key: "status", render: (_, o) => <StatusTag status={o.status} /> },
  {
    title: "Tổng",
    dataIndex: "total",
    align: "right",
    render: (v: number) => (
      <Typography.Text strong className="tabular" style={{ whiteSpace: "nowrap" }}>
        {formatMoney(v)}
      </Typography.Text>
    ),
  },
];

// 7 đơn mới nhất — bấm một dòng để mở luôn chi tiết đơn đó ở trang Đơn hàng
export function RecentOrders() {
  const { orders } = useOrders();
  const navigate = useNavigate();
  const latest = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);

  return (
    <Card title="Đơn hàng gần đây" extra={<MoreLink to="/orders">Tất cả đơn</MoreLink>} styles={{ body: { padding: "0 12px 12px" } }}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={latest}
        pagination={false}
        scroll={{ x: "max-content" }}
        onRow={(o) => ({ onClick: () => navigate(`/orders?order=${o.id}`), style: { cursor: "pointer" } })}
      />
    </Card>
  );
}
