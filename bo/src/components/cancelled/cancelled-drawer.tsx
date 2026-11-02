import { CalendarOutlined, FileTextOutlined, InboxOutlined, MessageOutlined, TagOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Drawer, Flex, Grid, Popconfirm, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { InfoRow } from "@/components/info-row";
import { statusMeta } from "@/lib/cancelled/labels";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { formatMoney } from "@/lib/format";

type Props = { open: boolean; item?: CancelledProduct; onCreate: (id: string) => void; onDiscard: (item: CancelledProduct) => void; onClose: () => void };

// Chi tiết sản phẩm: nguồn gốc từ đơn hủy và 2 cách xử lý
export function CancelledDrawer({ open, item, onCreate, onDiscard, onClose }: Props) {
  const screens = Grid.useBreakpoint();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item?.name}
      size={screens.sm === false ? "100%" : 560}
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        item?.status === "pending" && (
          <Flex gap={8} justify="flex-end" wrap>
            <Popconfirm
              title={item.quantity > 1 ? `Bỏ ${item.quantity} cây “${item.name}”?` : `Bỏ “${item.name}”?`}
              description="Không thể hoàn tác."
              okText="Bỏ"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => {
                onDiscard(item);
                onClose();
              }}
            >
              <Button danger>Bỏ</Button>
            </Popconfirm>
            <Button type="primary" onClick={() => onCreate(item.id)}>
              Tạo sản phẩm trưng bày
            </Button>
          </Flex>
        )
      }
    >
      {item && (
        <FormSection title="Nguồn gốc">
          <Flex vertical gap={12}>
            <Tag color={statusMeta[item.status].color} style={{ alignSelf: "flex-start", marginInlineEnd: 0 }}>
              {statusMeta[item.status].label}
            </Tag>
            {item.status === "converted" && item.displayProductId && (
              <Link to={`/products?edit=${item.displayProductId}`} style={{ alignSelf: "flex-start" }}>
                Xem sản phẩm trưng bày
              </Link>
            )}
            <InfoRow icon={<FileTextOutlined />} label="Đơn gốc">
              <Link to={`/orders?order=${item.orderId}`} className="tabular" style={{ alignSelf: "flex-start" }}>
                {item.orderCode}
              </Link>
            </InfoRow>
            <InfoRow icon={<UserOutlined />} label="Khách đặt">
              <Typography.Text>{item.customerName}</Typography.Text>
            </InfoRow>
            <InfoRow icon={<TagOutlined />} label="Giá gốc mỗi cây">
              <Typography.Text className="tabular">{formatMoney(item.price)}</Typography.Text>
            </InfoRow>
            <InfoRow icon={<InboxOutlined />} label="Số lượng">
              <Typography.Text className="tabular">{item.quantity}</Typography.Text>
            </InfoRow>
            <InfoRow icon={<CalendarOutlined />} label="Ngày hủy">
              <Typography.Text className="tabular">{dayjs(item.cancelledAt).format("HH:mm DD/MM/YYYY")}</Typography.Text>
            </InfoRow>
            <InfoRow icon={<MessageOutlined />} label="Lý do hủy">
              <Typography.Text>{item.cancelReason}</Typography.Text>
            </InfoRow>
            {item.custom && (
              <InfoRow icon={<FileTextOutlined />} label="Cấu hình">
                <Typography.Text>{item.custom}</Typography.Text>
              </InfoRow>
            )}
            {item.personalized && (
              <Tag color="orange" style={{ alignSelf: "flex-start", marginInlineEnd: 0 }}>
                Có chữ riêng của khách, kiểm tra trước khi trưng bày
              </Tag>
            )}
          </Flex>
        </FormSection>
      )}
    </Drawer>
  );
}
