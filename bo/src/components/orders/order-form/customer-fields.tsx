import { Alert, Col, Form, Input, Row, Select, type FormInstance } from "antd";
import { FormSection } from "@/components/form/form-section";
import { searchFilter, type OrderFormValues } from "@/components/orders/order-form/model";
import { phoneKey } from "@/lib/customers/stats";
import type { Customer } from "@/lib/customers/types";
import { channelLabels, orderChannels } from "@/lib/orders/create";
import { failedDeliveries } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";
import { fold } from "@/lib/search";

type Props = {
  form: FormInstance<OrderFormValues>;
  customers: Customer[];
  // Điền tên, SĐT, email, địa chỉ của khách đã chọn
  fromCustomer: (id?: string) => Partial<OrderFormValues>;
  editing: boolean;
  // Hồ sơ khách theo số điện thoại đang nhập, và các đơn trước của số đó
  profile?: Customer;
  phone: string;
  previous: Order[];
};

// Khối Khách hàng: chọn khách đã có hoặc nhập khách mới (hồ sơ gộp theo số điện thoại)
export function CustomerFields({ form, customers, fromCustomer, editing, profile, phone, previous }: Props) {
  return (
    <FormSection title="Khách hàng" description="Chọn khách đã có để điền nhanh, hoặc nhập khách mới — hồ sơ khách gộp theo số điện thoại.">
      <Form.Item name="customerId" label="Khách đã có">
        <Select
          allowClear
          showSearch
          placeholder="Tìm theo tên hoặc số điện thoại…"
          filterOption={searchFilter(fold)}
          options={customers.map((c) => ({ value: c.id, search: `${c.name} ${c.phone} ${phoneKey(c.phone)}`, label: `${c.name} · ${c.phone}` }))}
          onChange={(id?: string) => id && form.setFieldsValue(fromCustomer(id))}
        />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="name" label="Tên khách" rules={[{ required: true, whitespace: true, message: "Nhập tên khách." }]}>
            <Input maxLength={60} placeholder="VD: Nguyễn Minh Anh" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Nhập số điện thoại." },
              { validator: (_, value?: string) => (!value || /^\d{9,11}$/.test(phoneKey(value)) ? Promise.resolve() : Promise.reject(new Error("Số điện thoại 9–11 chữ số."))) },
            ]}
          >
            <Input maxLength={16} inputMode="tel" placeholder="VD: 0912 345 678" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Email chưa đúng." }]}>
            <Input maxLength={80} placeholder="Không bắt buộc" />
          </Form.Item>
        </Col>
        {!editing && (
          <Col xs={24} sm={12}>
            <Form.Item name="channel" label="Khách đặt qua">
              <Select options={orderChannels.map((c) => ({ value: c, label: channelLabels[c] }))} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Form.Item name="address" label="Địa chỉ giao" rules={[{ required: true, whitespace: true, message: "Nhập địa chỉ giao." }]} style={{ marginBottom: profile || phone.length >= 9 ? 12 : 0 }}>
        <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} maxLength={200} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
      </Form.Item>
      {profile?.blocked ? (
        <Alert type="error" showIcon title={`${profile.name} đang bị chặn đặt hàng`} description={profile.blockReason} />
      ) : profile ? (
        <Alert
          type="info"
          showIcon
          title={`Số này thuộc hồ sơ ${profile.name} · ${previous.filter((o) => o.status !== "cancelled").length} đơn trước${failedDeliveries(previous) ? ` · ${failedDeliveries(previous)} lần giao không thành` : ""}`}
        />
      ) : phone.length >= 9 ? (
        <Alert type="success" showIcon title={`Khách mới — tạo hồ sơ khách khi ${editing ? "lưu" : "tạo đơn"}.`} />
      ) : null}
    </FormSection>
  );
}
