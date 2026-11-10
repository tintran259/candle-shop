import { ReloadOutlined } from "@ant-design/icons";
import { App, Button, Col, Flex, Form, Input, InputNumber, Popconfirm, Row, Typography } from "antd";
import { useEffect, useState } from "react";
import { useBlocker } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import { SettingsSkeleton } from "@/components/skeletons";
import { useSettings } from "@/hooks/use-settings";
import { defaultSettings, type ShopSettings } from "@/lib/settings/types";
import { useTitle } from "@/lib/use-title";
import { Preview } from "@/components/settings/settings-preview";
import { BackupSection } from "@/components/settings/backup-section";
import { ResetSection } from "@/components/settings/reset-section";
import { SessionSection } from "@/components/settings/session-section";
import { CarrierFields } from "@/components/settings/carrier-fields";
import { ShippingOptionFields } from "@/components/settings/shipping-option-fields";

export function SettingsPage() {
  useTitle("Cài đặt");
  const { settings, loading, save } = useSettings();
  if (loading) return <SettingsSkeleton />;
  return <SettingsForm settings={settings} save={save} />;
}

function SettingsForm({ settings, save }: { settings: ShopSettings; save: (s: ShopSettings) => void }) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<ShopSettings>();
  const [dirty, setDirty] = useState(false);
  const values = (Form.useWatch([], { form, preserve: true }) ?? settings) as ShopSettings;

  // Rời trang khi còn thay đổi chưa lưu thì hỏi lại
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    modal.confirm({
      title: "Bỏ các thay đổi chưa lưu?",
      okText: "Bỏ thay đổi",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục sửa",
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    });
  }, [blocker, modal]);

  const finish = () => {
    // getFieldsValue(true): lấy cả id của phương thức — trường không có ô nhập nên onFinish bỏ mất
    const v = form.getFieldsValue(true) as ShopSettings;
    save({
      ...v,
      shippingOptions: v.shippingOptions.map((o) => ({ ...o, name: o.name.trim() })),
      sender: { name: v.sender.name?.trim() ?? "", phone: v.sender.phone?.trim() ?? "", address: v.sender.address?.trim() ?? "" },
      carriers: v.carriers.map((c) => ({ ...c, name: c.name.trim(), trackingUrl: c.trackingUrl?.trim() || undefined })),
    });
    setDirty(false);
    message.success("Đã lưu cài đặt. Áp dụng cho đơn tạo từ bây giờ.");
  };

  return (
    <Form form={form} layout="vertical" initialValues={settings} onFinish={finish} onValuesChange={() => setDirty(true)} scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="flex-end" wrap gap={16}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Cài đặt
            </Typography.Title>
            <Typography.Text type="secondary">Tiền cọc, công suất xưởng, giá bán, giao hàng và phí vận chuyển. Đổi ở đây chỉ áp dụng cho đơn mới, đơn cũ giữ nguyên.</Typography.Text>
          </div>
          <Flex gap={8} align="center" wrap>
            {dirty && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Có thay đổi chưa lưu
              </Typography.Text>
            )}
            <Popconfirm
              title="Khôi phục mặc định?"
              description="Điền lại các giá trị mặc định. Chỉ có hiệu lực khi bấm Lưu."
              okText="Khôi phục"
              cancelText="Hủy"
              onConfirm={() => {
                form.setFieldsValue(defaultSettings);
                setDirty(true);
              }}
            >
              <Button icon={<ReloadOutlined />}>Mặc định</Button>
            </Popconfirm>
            <Button type="primary" htmlType="submit" disabled={!dirty}>
              {dirty ? "Lưu cài đặt" : "Đã lưu"}
            </Button>
          </Flex>
        </Flex>

        <Row gutter={[16, 16]} align="top">
          <Col xs={24} lg={16}>
            <Flex vertical gap={16}>
              <FormSection title="Đặt cọc" description="Khách chọn đặt cọc thì trả trước phần này. Tính trên tiền hàng (sau giảm giá), không gồm phí vận chuyển; còn lại và phí giao thu khi giao.">
                <Form.Item name="depositPercent" label="Mức cọc" rules={[{ required: true, type: "number", min: 1, max: 99, message: "Nhập từ 1 đến 99%." }]} style={{ marginBottom: 0 }}>
                  <InputNumber min={1} max={99} precision={0} suffix="%" aria-label="Mức cọc" style={{ width: 160 }} />
                </Form.Item>
              </FormSection>

              <FormSection title="Xưởng" description="Dùng để gợi ý ngày làm xong khi tạo, sửa đơn và báo ngày quá tải. Chỉ cảnh báo, không chặn nhận đơn.">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="dailyCapacity"
                      label="Số cây làm được mỗi ngày"
                      extra="Tính theo số cây của đơn chưa làm xong, theo ngày làm xong. 0 = không giới hạn."
                      rules={[{ required: true, type: "number", min: 0, max: 1000, message: "Nhập từ 0 đến 1.000 cây." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={1000} precision={0} suffix="cây" aria-label="Số cây làm được mỗi ngày" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="leadDays"
                      label="Số ngày làm tối thiểu"
                      extra="Ngày làm xong gợi ý sớm nhất là hôm nay cộng số ngày này."
                      rules={[{ required: true, type: "number", min: 0, max: 30, message: "Nhập từ 0 đến 30 ngày." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={30} precision={0} suffix="ngày" aria-label="Số ngày làm tối thiểu" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Giá bán" description="So giá bán ở trang Thủ công với giá vốn nguyên liệu trong Kho. Chỉ cảnh báo và gợi ý, không tự đổi giá.">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="minMargin"
                      label="Lãi tối thiểu"
                      extra="Cỡ hoặc lựa chọn lãi thấp hơn mức này có cảnh báo ở Thủ công."
                      rules={[{ required: true, type: "number", min: 0, max: 95, message: "Nhập từ 0 đến 95%." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={95} precision={0} suffix="%" aria-label="Lãi tối thiểu" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="priceMarkup"
                      label="Hệ số gợi ý giá"
                      extra="Gợi ý giá bán = giá vốn × hệ số, không thấp hơn mức lãi tối thiểu, làm tròn lên 5.000 ₫."
                      rules={[{ required: true, type: "number", min: 1, max: 20, message: "Nhập từ 1 đến 20." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={1} max={20} step={0.1} precision={1} prefix="×" aria-label="Hệ số gợi ý giá" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="Giao hàng" description="Áp dụng khi giao không thành.">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="maxDeliveryAttempts"
                      label="Số lần giao tối đa"
                      extra="Hết số lần này thì đơn chuyển sang hoàn về."
                      rules={[{ required: true, type: "number", min: 1, max: 10, message: "Nhập từ 1 đến 10 lần." }]}
                    >
                      <InputNumber min={1} max={10} precision={0} suffix="lần" aria-label="Số lần giao tối đa" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="resendFee" label="Phí gửi lại đơn" extra="Khách trả khi gửi lại đơn đã hoàn về." rules={[{ required: true, message: "Nhập phí gửi lại." }]}>
                      <MoneyInput aria-label="Phí gửi lại đơn" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <ShippingOptionFields />

              <FormSection title="Người gửi" description="In trên nhãn giao hàng và phiếu đơn.">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["sender", "name"]} label="Tên shop" rules={[{ required: true, whitespace: true, message: "Nhập tên shop." }]}>
                      <Input maxLength={60} aria-label="Tên shop" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["sender", "phone"]} label="Số điện thoại" rules={[{ pattern: /^[\d\s+.()-]{8,20}$/, message: "Số điện thoại không đúng." }]}>
                      <Input maxLength={20} inputMode="tel" placeholder="VD: 0901 234 567" aria-label="Số điện thoại người gửi" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name={["sender", "address"]} label="Địa chỉ lấy hàng" style={{ marginBottom: 0 }}>
                  <Input maxLength={200} placeholder="Số nhà, đường, phường, quận, tỉnh" aria-label="Địa chỉ lấy hàng" />
                </Form.Item>
              </FormSection>

              <CarrierFields />

              <BackupSection />

              <SessionSection />

              <ResetSection />
            </Flex>
          </Col>

          <Col xs={24} lg={8}>
            <Preview values={values} />
          </Col>
        </Row>
      </Flex>
    </Form>
  );
}
