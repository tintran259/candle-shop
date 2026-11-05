import { WarningOutlined } from "@ant-design/icons";
import { Alert, Typography } from "antd";
import { Link } from "react-router";
import type { validateConfig } from "@/lib/craft/steps";

type Props = {
  issues: ReturnType<typeof validateConfig>;
  errors: number;
  // Số cỡ, nắp, lựa chọn cần xem lại giá bán
  lowMargins: number;
  minMargin: number;
  onSelectStep: (id: string) => void;
};

// Thông báo đầu trang Thủ công: lỗi / điểm nên xem lại của cấu hình, và các mục giá bán thấp
export function CraftAlerts({ issues, errors, lowMargins, minMargin, onSelectStep }: Props) {
  return (
    <>
      {issues.length > 0 && (
        <Alert
          type={errors ? "error" : "warning"}
          showIcon
          icon={<WarningOutlined />}
          title={errors ? `${errors} lỗi cần sửa trước khi lên web` : `${issues.length} điểm nên xem lại`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {issues.slice(0, 6).map((i, k) => (
                <li key={k}>{i.stepId ? <Typography.Link onClick={() => onSelectStep(i.stepId!)}>{i.message}</Typography.Link> : i.message}</li>
              ))}
              {issues.length > 6 && <li>và {issues.length - 6} điểm khác…</li>}
            </ul>
          }
        />
      )}

      {lowMargins > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`${lowMargins} cỡ, nắp hoặc lựa chọn cần xem lại giá bán`}
          description={
            <>
              Giá bán thấp hơn giá vốn hoặc lãi dưới {minMargin}% — xem từng cỡ và phụ thu nắp trong drawer hũ, cột Giá vốn tối thiểu ở tab Lựa chọn của từng bước, phụ thu ô nhập và tuỳ chọn thêm ở
              bước Cá nhân hóa. <Link to="/settings">Đổi mức lãi tối thiểu</Link>
            </>
          }
        />
      )}
    </>
  );
}
