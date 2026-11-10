import { LogoutOutlined } from "@ant-design/icons";
import { App, Button, Flex, Typography } from "antd";
import { FormSection } from "@/components/form/form-section";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import { REMOTE } from "@/lib/data-mode";

// Đăng xuất mọi thiết bị (POST /api/auth/logout-all): lỡ mất điện thoại / máy, hoặc nghi lộ phiên — mọi phiên đang mở hết hiệu lực, kể cả máy này.
// Đổi PIN thì làm ở máy chủ (ADMIN_PIN_HASH). Chỉ có khi dùng BE
export function SessionSection() {
  const { message, modal } = App.useApp();
  if (!REMOTE) return null;

  const confirm = () =>
    modal.confirm({
      title: "Đăng xuất mọi thiết bị?",
      content: "Mọi máy đang đăng nhập BO (kể cả máy này) phải nhập lại PIN. Dùng khi lỡ mất điện thoại, máy tính hoặc nghi người khác đang dùng phiên của bạn.",
      okText: "Đăng xuất tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api("POST", "/auth/logout-all");
          message.success("Đã đăng xuất mọi thiết bị.");
          logout();
        } catch (e) {
          message.error(e instanceof Error ? e.message : "Chưa đăng xuất được, thử lại.");
        }
      },
    });

  return (
    <FormSection title="Phiên đăng nhập" description="Phiên ghi nhớ thiết bị giữ 30 ngày. Lỡ mất máy thì đăng xuất mọi thiết bị.">
      <Flex vertical gap={8} align="flex-start">
        <Button danger icon={<LogoutOutlined />} onClick={confirm}>
          Đăng xuất mọi thiết bị…
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Muốn đổi PIN: tạo mã mới bằng <Typography.Text code>pnpm auth:pin &lt;6 số&gt;</Typography.Text> rồi thay ADMIN_PIN_HASH trên Render.
        </Typography.Text>
      </Flex>
    </FormSection>
  );
}
