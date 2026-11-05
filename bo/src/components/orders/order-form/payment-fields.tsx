import { Button, Col, Flex, Form, Input, Radio, Row, Segmented, Switch, Typography, type FormInstance } from "antd";
import { FormSection } from "@/components/form/form-section";
import type { OrderFormValues } from "@/components/orders/order-form/model";
import { discountRule, valueText } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { formatMoney } from "@/lib/format";
import type { DiscountResult } from "@/lib/orders/create";
import { providerLabels } from "@/lib/orders/labels";
import type { Order, PaymentProvider } from "@/lib/orders/types";

type Props = {
  form: FormInstance<OrderFormValues>;
  // Sửa đơn: chỉ xem cách thanh toán đã chọn
  order?: Order;
  lockItems: boolean;
  discount: DiscountResult;
  // Mã riêng đang chạy của khách — gợi ý dưới ô mã
  ownCodes: Discount[];
  paid: number;
  dueNow: number;
  depositPercent: number;
  values: Partial<OrderFormValues>;
};

// Khối Thanh toán: mã giảm giá, cọc hoặc trả đủ, kênh thanh toán, đã nhận tiền
export function PaymentFields({ form, order, lockItems, discount, ownCodes, paid, dueNow, depositPercent, values: v }: Props) {
  return (
    <FormSection title="Thanh toán" description={order ? "Các khoản đã thu giữ nguyên. Thu thêm khi giao; thu dư thì ghi nhận hoàn ở khối Thanh toán của đơn." : undefined}>
      {/* Có dòng báo thì antd bù lề âm cho ô — dùng padding (lề sẽ bị gộp mất) để giữ khoảng cách với "Hình thức" */}
      {!lockItems && (
        <div style={discount.error || discount.discount || ownCodes.length ? { paddingBottom: 16 } : undefined}>
          <Form.Item
            name="discountCode"
            label="Mã giảm giá"
            normalize={(s?: string) => s?.toUpperCase().replace(/\s/g, "")}
            validateStatus={discount.error ? "error" : discount.discount ? "success" : undefined}
            // Luật thật của mã (−80%, tối đa…), không dùng mô tả tự gõ — mô tả không tự đổi khi sửa mức giảm
            help={
              discount.error ??
              (discount.discount ? (
                `Giảm ${formatMoney(discount.amount)} · ${discountRule(discount.discount)}`
              ) : ownCodes.length ? (
                <span role="group" aria-label="Mã riêng của khách">
                  Khách có mã riêng:{" "}
                  {ownCodes.map((d) => (
                    <Button key={d.id} type="link" size="small" style={{ paddingInline: 4, height: "auto" }} onClick={() => form.setFieldValue("discountCode", d.code)}>
                      {d.code} {valueText(d)}
                    </Button>
                  ))}
                </span>
              ) : undefined)
            }
          >
            <Input allowClear maxLength={30} placeholder="Không bắt buộc" style={{ maxWidth: 260 }} />
          </Form.Item>
        </div>
      )}
      {order ? (
        <Typography.Text type="secondary">
          {order.paymentPlan === "deposit" ? `Cọc ${order.depositPercent ?? 50}%` : "Trả đủ"} · {providerLabels[order.paymentMethod]} · đã thu {formatMoney(paid)}
        </Typography.Text>
      ) : (
        <>
          <Row gutter={16}>
            <Col xs={24} sm={9}>
              <Form.Item name="paymentPlan" label="Hình thức">
                <Radio.Group
                  optionType="button"
                  options={[
                    { value: "deposit", label: `Cọc ${depositPercent}%` },
                    { value: "full", label: "Trả đủ" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={15}>
              <Form.Item name="paymentMethod" label="Kênh thanh toán">
                <Segmented<PaymentProvider> options={(["cod", "vnpay", "momo"] as const).map((p) => ({ value: p, label: providerLabels[p] }))} />
              </Form.Item>
            </Col>
          </Row>
          <Flex justify="space-between" align="center" gap={16} style={{ padding: "4px 0" }}>
            <Flex vertical>
              <Typography.Text strong>Đã nhận {v.paymentPlan === "full" ? "đủ tiền" : "tiền cọc"}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Bật nếu khách đã chuyển {formatMoney(dueNow)} — đơn chuyển sang “Đã thanh toán”. Tắt thì đơn chờ thanh toán.
              </Typography.Text>
            </Flex>
            <Form.Item name="received" valuePropName="checked" noStyle>
              <Switch aria-label="Đã nhận tiền" />
            </Form.Item>
          </Flex>
          {v.received && v.paymentMethod !== "cod" && (
            <Form.Item name="transactionId" label="Mã giao dịch" style={{ marginTop: 12, marginBottom: 0 }}>
              <Input maxLength={40} placeholder="Mã giao dịch VNPay / MoMo (không bắt buộc)" style={{ maxWidth: 320 }} />
            </Form.Item>
          )}
        </>
      )}
    </FormSection>
  );
}
