import { Flex, Typography } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { useOrders } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";

// Hiệu quả của mã — tính từ đơn hàng đã dùng mã (không tính đơn hủy)
export function Performance({ code }: { code: string }) {
  const { orders } = useOrders();
  const used = orders.filter((o) => o.discountCode === code && o.status !== "cancelled").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const saved = used.reduce((s, o) => s + o.discount, 0);
  const revenue = used.reduce((s, o) => s + o.total, 0);

  return (
    <FormSection title="Hiệu quả" description="Tính từ các đơn có dùng mã này trong hệ thống.">
      <Flex gap={12}>
        {[
          { label: "Đơn dùng mã", value: String(used.length) },
          { label: "Đã giảm cho khách", value: formatMoney(saved) },
          { label: "Doanh thu từ đơn", value: formatMoney(revenue) },
        ].map((f) => (
          <Flex key={f.label} vertical style={{ flex: 1, minWidth: 0, background: "#f6f6f3", borderRadius: 14, padding: "10px 14px" }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {f.label}
            </Typography.Text>
            <span className="big-number" style={{ fontSize: 18 }}>
              {f.value}
            </span>
          </Flex>
        ))}
      </Flex>
      {used.length > 0 && (
        <Flex vertical gap={6} style={{ marginTop: 12 }}>
          {used.slice(0, 5).map((o) => (
            <Flex key={o.id} justify="space-between" gap={12}>
              <Link to={`/orders?order=${o.id}`} className="tabular">
                {o.code} · {o.customer.name}
              </Link>
              <Typography.Text type="secondary" className="tabular">
                −{formatMoney(o.discount)} · {dayjs(o.createdAt).format("DD/MM")}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      )}
    </FormSection>
  );
}
