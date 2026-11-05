import { Alert, Button } from "antd";
import dayjs from "dayjs";
import type { OrderDraft } from "@/hooks/use-order-draft";

type Props = {
  // Đang tiếp tục đơn nháp
  restored: OrderDraft | null;
  // Mở từ hồ sơ khách mà đang có đơn nháp khác
  otherDraft: OrderDraft | null;
  onStartOver: () => void;
  onOpenOther: () => void;
};

// Thông báo đơn nháp đầu form Tạo đơn hàng (docs/pages/orders.md#đơn-nháp)
export function DraftAlerts({ restored, otherDraft, onStartOver, onOpenOther }: Props) {
  return (
    <>
      {restored && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Đang tiếp tục đơn nháp lưu lúc ${dayjs(restored.savedAt).format("HH:mm DD/MM")}`}
          description="Đơn tự lưu nháp khi bạn nhập; đóng form vẫn giữ. Sản phẩm có sẵn đã lấy lại giá hiện tại."
          action={
            <Button size="small" onClick={onStartOver}>
              Bắt đầu đơn mới
            </Button>
          }
        />
      )}
      {otherDraft && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Đang có đơn nháp${otherDraft.values.name ? ` của ${otherDraft.values.name}` : ""}`}
          description="Nhập đơn này sẽ thay đơn nháp đó."
          action={
            <Button size="small" onClick={onOpenOther}>
              Mở đơn nháp
            </Button>
          }
        />
      )}
    </>
  );
}
