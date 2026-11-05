import { Col, Form, Radio, Row, Select, Typography, type FormInstance } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FormSection } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import type { OrderFormValues } from "@/components/orders/order-form/model";
import { CapacityDatePicker, CapacityHint } from "@/components/orders/ready-date";
import type { useWorkshop } from "@/hooks/use-workshop";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/orders/types";
import { shippingOptionLabel, type Carrier, type ShippingOption } from "@/lib/settings/types";

type Props = {
  form: FormInstance<OrderFormValues>;
  shippingOptions: ShippingOption[];
  carriers: Carrier[];
  order?: Order;
  workshop: ReturnType<typeof useWorkshop>;
  readyDate?: Dayjs;
  // Số cây của đơn — để báo ngày đã đầy
  candles: number;
  onDirty: () => void;
};

// Khối Giao hàng: phương thức, phí khách trả, đơn vị vận chuyển, ngày xưởng làm xong
export function ShippingFields({ form, shippingOptions, carriers, order, workshop, readyDate, candles, onDirty }: Props) {
  return (
    <FormSection title="Giao hàng">
      <Row gutter={16}>
        <Col xs={24} sm={13}>
          {/* Radio dọc: nhãn dài (kèm phí) — dạng nút sẽ xuống dòng lệch nhau */}
          <Form.Item name="shippingMethod" label="Phương thức">
            <Radio.Group
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
              onChange={(e) => form.setFieldValue("shippingFee", shippingOptions.find((o) => o.id === e.target.value)?.fee ?? 0)}
              options={shippingOptions.map((o) => ({
                value: o.id,
                label: (
                  <span>
                    {shippingOptionLabel(o)}{" "}
                    <Typography.Text type="secondary" className="tabular">
                      · {o.fee ? formatMoney(o.fee) : "miễn phí"}
                    </Typography.Text>
                  </span>
                ),
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={11}>
          <Form.Item name="shippingFee" label="Phí vận chuyển" extra="Khách trả. Tự điền theo phương thức, sửa được cho đơn này.">
            <MoneyInput aria-label="Phí vận chuyển" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={13}>
          <Form.Item
            name="carrierId"
            label="Đơn vị vận chuyển"
            extra={order?.shipment ? "Đã giao cho vận chuyển — đổi ở Sửa vận chuyển trong chi tiết đơn." : "Lúc giao chọn sẵn đơn vị này; phí trả đơn vị mặc định bằng phí khách trả."}
          >
            <Select aria-label="Đơn vị vận chuyển" disabled={!!order?.shipment} options={carriers.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={13}>
          <Form.Item
            name="readyDate"
            label="Ngày xưởng làm xong"
            rules={[{ required: true, message: "Chọn ngày." }]}
            extra={
              <CapacityHint
                w={workshop}
                date={readyDate}
                candles={candles}
                onPick={(d) => {
                  form.setFieldValue("readyDate", d);
                  onDirty();
                }}
              />
            }
            style={{ marginBottom: 0 }}
          >
            <CapacityDatePicker
              workshop={workshop}
              candles={candles}
              aria-label="Ngày xưởng làm xong"
              format="DD/MM/YYYY"
              allowClear={false}
              disabledDate={(d) => d.isBefore(dayjs(), "day")}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>
    </FormSection>
  );
}
