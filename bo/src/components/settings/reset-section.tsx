import { CloudDownloadOutlined, DeleteOutlined } from "@ant-design/icons";
import { Alert, App, Button, Flex, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { api } from "@/lib/api";
import { clearLocalData, downloadBackup } from "@/lib/backup";
import { REMOTE } from "@/lib/data-mode";
import { registeredStores } from "@/lib/local-store";

// Câu phải gõ để xác nhận — BE cũng kiểm tra đúng câu này (POST /api/admin/reset)
export const RESET_PHRASE = "XÓA HẾT";

const WIPED = "đơn hàng, sản phẩm, danh mục, sản phẩm hủy đơn, kho và phiếu kho, khách hàng, mã giảm giá, cấu hình Thủ công, cài đặt, đơn nháp";

// Xóa toàn bộ dữ liệu BO, chỉ giữ đăng nhập (PIN, phiên đang dùng). Hộp thoại bắt gõ câu xác nhận, gợi ý sao lưu trước
export function ResetSection() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const matched = typed.trim().toUpperCase() === RESET_PHRASE;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setTyped("");
    setBackedUp(false);
  };

  const backup = async () => {
    if (REMOTE) await Promise.all([...registeredStores.values()].map((s) => s.reload()));
    downloadBackup();
    setBackedUp(true);
  };

  const reset = async () => {
    if (!matched) return;
    setBusy(true);
    try {
      if (REMOTE) await api("POST", "/admin/reset", { confirm: typed });
      else clearLocalData();
      message.success("Đã xóa toàn bộ dữ liệu.");
      // Tải lại trang để mọi màn hình bắt đầu từ dữ liệu trống; phiên đăng nhập giữ nguyên
      setTimeout(() => window.location.assign("/"), 600);
    } catch (e) {
      setBusy(false);
      message.error(e instanceof Error ? e.message : "Chưa xóa được, thử lại.");
    }
  };

  return (
    <FormSection title="Xóa toàn bộ dữ liệu" description="Đưa BO về trạng thái trống để bắt đầu lại. Đăng nhập bằng PIN vẫn giữ nguyên.">
      <Flex vertical gap={12} align="flex-start">
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Xóa {WIPED}. Cài đặt về mặc định; Thủ công giữ các bước, bỏ hết lựa chọn. Không thể hoàn tác.
        </Typography.Text>
        <Button danger icon={<DeleteOutlined />} onClick={() => setOpen(true)}>
          Xóa toàn bộ dữ liệu…
        </Button>
      </Flex>

      <Modal
        open={open}
        title="Xóa toàn bộ dữ liệu?"
        okText="Xóa toàn bộ"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: !matched, loading: busy }}
        cancelButtonProps={{ disabled: busy }}
        onOk={() => void reset()}
        onCancel={close}
        closable={!busy}
        maskClosable={false}
        destroyOnHidden
      >
        <Flex vertical gap={16}>
          <Alert type="error" showIcon title="Không thể hoàn tác" description={`Sẽ xóa ${WIPED}. Chỉ giữ đăng nhập.`} />
          <Flex align="center" justify="space-between" gap={8} wrap>
            <Typography.Text type="secondary">{backedUp ? "Đã tải file sao lưu." : "Nên tải file sao lưu trước khi xóa."}</Typography.Text>
            <Button icon={<CloudDownloadOutlined />} onClick={() => void backup()} disabled={busy}>
              {backedUp ? "Tải lại file sao lưu" : "Sao lưu trước"}
            </Button>
          </Flex>
          <div>
            <label htmlFor="reset-confirm" style={{ display: "block", marginBottom: 6 }}>
              Gõ <Typography.Text strong>{RESET_PHRASE}</Typography.Text> để xác nhận
            </label>
            <Input
              id="reset-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onPressEnter={() => void reset()}
              placeholder={RESET_PHRASE}
              autoComplete="off"
              disabled={busy}
              status={typed && !matched ? "warning" : undefined}
            />
          </div>
        </Flex>
      </Modal>
    </FormSection>
  );
}
