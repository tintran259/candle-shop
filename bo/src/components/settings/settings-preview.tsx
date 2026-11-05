import { Flex, Typography } from "antd";
import { formatMoney } from "@/lib/format";
import { depositAmount } from "@/lib/orders/create";
import { shippingOptionLabel, type ShopSettings } from "@/lib/settings/types";
import { radius } from "@/theme";

// Đơn mẫu ở khung xem trước
const SAMPLE_SUBTOTAL = 1_000_000;

// Khung xem trước bên phải trang Cài đặt
const money = (n?: number | string) => formatMoney(Number(n) || 0);

// Xem trước tiền trên một đơn mẫu theo các giá trị đang nhập
export function Preview({ values }: { values: ShopSettings }) {
  const options = (values.shippingOptions ?? []).filter((o) => o?.enabled);
  const first = options[0];
  const fee = Number(first?.fee) || 0;
  const total = SAMPLE_SUBTOTAL + fee;
  const percent = Number(values.depositPercent) || 0;
  // Cọc trên tiền hàng, không gồm phí giao
  const deposit = depositAmount(SAMPLE_SUBTOTAL, percent);
  const rows = [
    ["Tạm tính", money(SAMPLE_SUBTOTAL)],
    [first?.name?.trim() ? `Phí giao · ${first.name.trim()}` : "Phí giao", fee ? money(fee) : "Miễn phí"],
  ];

  return (
    <aside className="settings-preview" aria-label="Xem trước trên đơn mẫu" style={{ borderRadius: radius.card }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Xem trước
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Đơn mẫu theo các số đang nhập.
      </Typography.Text>
      <div style={{ marginTop: 12 }}>
        {rows.map(([label, value]) => (
          <Flex key={label} justify="space-between" gap={12} style={{ padding: "3px 0" }}>
            <Typography.Text type="secondary">{label}</Typography.Text>
            <Typography.Text className="tabular" style={{ whiteSpace: "nowrap" }}>
              {value}
            </Typography.Text>
          </Flex>
        ))}
        <Flex justify="space-between" align="baseline" style={{ padding: "8px 0 4px", borderTop: "1px solid #eee5da", marginTop: 6 }}>
          <Typography.Text strong>Tổng</Typography.Text>
          <Typography.Text strong className="tabular" style={{ fontSize: 20 }}>
            {money(total)}
          </Typography.Text>
        </Flex>
        <Flex justify="space-between" style={{ padding: "3px 0" }}>
          <Typography.Text type="secondary">Cọc {percent}% tiền hàng khi đặt</Typography.Text>
          <Typography.Text className="tabular">{money(deposit)}</Typography.Text>
        </Flex>
        <Flex justify="space-between" style={{ padding: "3px 0" }}>
          <Typography.Text type="secondary">Thu nốt khi giao</Typography.Text>
          <Typography.Text className="tabular">{money(total - deposit)}</Typography.Text>
        </Flex>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee5da" }}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Khi tạo đơn hiện {options.length} phương thức
        </Typography.Text>
        <ul style={{ margin: "4px 0 0", paddingInlineStart: 18, fontSize: 13 }}>
          {options.map((o) => (
            <li key={o.id}>
              {shippingOptionLabel({ name: o.name?.trim() || "Chưa đặt tên", days: o.days ?? 0 })} · {Number(o.fee) ? money(o.fee) : "miễn phí"}
            </li>
          ))}
        </ul>
        <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0", fontSize: 13 }}>
          Giao tối đa {values.maxDeliveryAttempts ?? 0} lần · Gửi lại đơn {money(values.resendFee)}
        </Typography.Paragraph>
      </div>
    </aside>
  );
}
