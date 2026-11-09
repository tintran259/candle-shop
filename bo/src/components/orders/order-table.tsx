import { Flex, Table, Tag, Typography, type TablePaginationConfig, type TableProps } from "antd";
import { memo } from "react";
import dayjs from "dayjs";
import { ItemStack, PaymentTag, ReadyDate, StatusTag } from "@/components/orders/order-view";
import { formatMoney } from "@/lib/format";
import { planLabel, itemCount, providerLabels } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";

type Props = { items: Order[]; onOpen: (id: string) => void; pagination: TablePaginationConfig; selected: string[]; onSelect: (ids: string[]) => void };

// Bảng đơn hàng — bấm cả dòng để mở chi tiết, ô chọn ở đầu dòng để in nhiều đơn
function OrderTableView({ items, onOpen, pagination, selected, onSelect }: Props) {
  const columns: TableProps<Order>["columns"] = [
    {
      title: "Mã đơn",
      key: "code",
      render: (_, o) => (
        <Flex vertical>
          <Flex gap={6} align="center" wrap>
            <Typography.Link strong className="tabular" onClick={() => onOpen(o.id)}>
              {o.code}
            </Typography.Link>
            {o.replacementFor && (
              <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                Gửi bù
              </Tag>
            )}
            {!!o.complaints?.length && (
              <Tag color="volcano" style={{ marginInlineEnd: 0 }}>
                Khiếu nại
              </Tag>
            )}
          </Flex>
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
        <Flex vertical style={{ minWidth: 150 }}>
          <Typography.Text>{o.customer.name}</Typography.Text>
          <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
            {o.customer.phone}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items",
      responsive: ["md"],
      render: (_, o) => (
        <Flex align="center" gap={8}>
          <ItemStack order={o} />
          <Flex vertical>
            <Typography.Text style={{ fontSize: 13, whiteSpace: "nowrap" }}>{itemCount(o)} sản phẩm</Typography.Text>
            {o.items.some((i) => i.custom) && (
              <Tag color="orange" style={{ marginInlineEnd: 0, width: "fit-content", fontSize: 11, lineHeight: "18px" }}>
                Có nến tự phối
              </Tag>
            )}
          </Flex>
        </Flex>
      ),
    },
    { title: "Làm xong", key: "ready", render: (_, o) => <ReadyDate order={o} /> },
    {
      title: "Thanh toán",
      key: "payment",
      responsive: ["lg"],
      render: (_, o) => (
        <Flex vertical gap={2} align="flex-start">
          <PaymentTag order={o} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {providerLabels[o.paymentMethod]} · {planLabel(o)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, o) => (
        <Flex vertical gap={2} align="flex-start">
          <StatusTag status={o.status} order={o} />
          {o.shipment && o.status !== "cancelled" && (
            <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {o.shipment.trackingCode ? `${o.shipment.carrier} · ${o.shipment.trackingCode}` : o.shipment.carrier}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      align: "right",
      render: (v: number) => (
        <Typography.Text strong className="tabular" style={{ whiteSpace: "nowrap" }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={items}
      pagination={pagination}
      scroll={{ x: "max-content" }}
      rowSelection={{
        selectedRowKeys: selected,
        onChange: (keys) => onSelect(keys as string[]),
        preserveSelectedRowKeys: true,
        columnWidth: 40,
        getCheckboxProps: (o) => ({ "aria-label": `Chọn đơn ${o.code}` }),
      }}
      onRow={(o) => ({
        // Bấm ô chọn thì không mở đơn
        onClick: (e) => !(e.target as HTMLElement).closest(".ant-table-selection-column") && onOpen(o.id),
        style: { cursor: "pointer", opacity: o.status === "cancelled" ? 0.6 : 1 },
      })}
    />
  );
}

// memo: mở/đóng drawer chỉ đổi ?order= / ?edit= trên URL — bảng giữ nguyên, không render lại
export const OrderTable = memo(OrderTableView);
