import { CloudDownloadOutlined, CloudUploadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Flex, Typography, Upload } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { backupSummary, downloadBackup, lastBackupAt, parseBackup, restoreBackup } from "@/lib/backup";
import { REMOTE } from "@/lib/data-mode";
import { registeredStores } from "@/lib/local-store";
import { formatNumber } from "@/lib/format";

// Quá số ngày này chưa sao lưu thì nhắc
const REMIND_DAYS = 7;

// Cài đặt › Sao lưu dữ liệu: tải toàn bộ dữ liệu về file, khôi phục từ file (dữ liệu đang nằm trên trình duyệt, chưa có BE)
export function BackupSection() {
  const { message, modal } = App.useApp();
  const [last, setLast] = useState(lastBackupAt);
  const stale = !last || dayjs().diff(dayjs(last), "day") >= REMIND_DAYS;

  const backup = async () => {
    // Chế độ BE: tải đủ mọi kho từ BE trước (kho chưa mở trang nào thì chưa có trong bộ nhớ)
    if (REMOTE) await Promise.all([...registeredStores.values()].map((s) => s.reload()));
    const file = downloadBackup();
    setLast(file.exportedAt);
    message.success("Đã tải file sao lưu — cất ở nơi an toàn (Google Drive, máy khác…).");
  };

  const restore = async (picked: File) => {
    const parsed = parseBackup(await picked.text());
    if ("error" in parsed) return message.error(parsed.error);
    const s = backupSummary(parsed.file);
    modal.confirm({
      title: "Khôi phục từ file sao lưu?",
      content: (
        <Flex vertical gap={4}>
          <Typography.Text>Sao lưu lúc {dayjs(s.exportedAt).format("HH:mm DD/MM/YYYY")}:</Typography.Text>
          <Typography.Text>
            {formatNumber(s.orders)} đơn · {formatNumber(s.products)} sản phẩm · {formatNumber(s.customers)} khách · {formatNumber(s.materials)} nguyên liệu · {formatNumber(s.discounts)} mã giảm giá
          </Typography.Text>
          <Typography.Text type="danger">Toàn bộ dữ liệu hiện tại trên trình duyệt này sẽ bị thay bằng dữ liệu trong file. Nên sao lưu dữ liệu hiện tại trước.</Typography.Text>
        </Flex>
      ),
      okText: "Khôi phục",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => {
        if (!restoreBackup(parsed.file)) return void message.error("Trình duyệt hết chỗ lưu — giữ nguyên dữ liệu cũ.");
        message.success("Đã khôi phục — đang tải lại trang…");
        setTimeout(() => window.location.reload(), 600);
      },
    });
  };

  return (
    <FormSection
      title="Sao lưu dữ liệu"
      description={
        REMOTE
          ? "Dữ liệu nằm trên máy chủ. Tải file sao lưu để cất thêm một bản riêng."
          : "Dữ liệu đang nằm trên trình duyệt này: xóa dữ liệu trình duyệt hoặc đổi máy là mất. Sao lưu thường xuyên để khôi phục khi cần."
      }
    >
      <Flex vertical gap={12}>
        <Alert
          type={stale ? "warning" : "info"}
          showIcon
          title={last ? `Sao lưu gần nhất ${dayjs(last).format("HH:mm DD/MM/YYYY")}` : "Chưa sao lưu lần nào"}
          description={stale ? `Nên sao lưu ít nhất mỗi ${REMIND_DAYS} ngày.` : undefined}
        />
        <Flex gap={8} wrap>
          <Button type="primary" icon={<CloudDownloadOutlined />} onClick={() => void backup()}>
            Sao lưu (tải file)
          </Button>
          {!REMOTE && (
            <Upload
              accept=".json,application/json"
              showUploadList={false}
              beforeUpload={(f) => {
                void restore(f);
                return false;
              }}
            >
              <Button icon={<CloudUploadOutlined />}>Khôi phục từ file</Button>
            </Upload>
          )}
        </Flex>
        {REMOTE && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Khôi phục từ file làm trên máy chủ: <Typography.Text code>pnpm db:import &lt;file&gt;</Typography.Text> ở thư mục be (xóa dữ liệu hiện có rồi ghi lại theo file).
          </Typography.Text>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          File gồm đơn hàng, sản phẩm, danh mục, kho, phiếu kho, khách hàng, mã giảm giá, Thủ công và cài đặt. Không gồm thông tin đăng nhập.
        </Typography.Text>
      </Flex>
    </FormSection>
  );
}
