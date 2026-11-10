import { Alert, App, Flex, Form, Input, InputNumber, Modal, Radio, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { ImageUpload } from "@/components/form/image-upload";
import { MoneyInput } from "@/components/money-input";
import { ItemThumb } from "@/components/orders/order-view";
import { CapacityDatePicker, CapacityHint } from "@/components/orders/ready-date";
import type { OrdersApi } from "@/hooks/use-orders";
import { useStockHold } from "@/hooks/use-stock-hold";
import { useWorkshop } from "@/hooks/use-workshop";
import { unitLabel } from "@/lib/craft/groups";
import { uploadError, uploadImages } from "@/lib/craft/image";
import { formatMoney, formatNumber } from "@/lib/format";
import { buildReplacement, maxComplaintRefund, resolutionLabels } from "@/lib/orders/complaint";
import { linesNeeds, shortages } from "@/lib/orders/materials";
import type { ComplaintResolution, Order } from "@/lib/orders/types";

const STAFF = "Admin 2510";

type Values = {
  reason: string;
  images: string[];
  resolution: ComplaintResolution;
  // Gửi bù: số cây mỗi dòng
  quantities: Record<string, number>;
  readyDate: Dayjs;
  refundAmount?: number;
  refundImages: string[];
  refundNote?: string;
};

type Props = { open: boolean; order: Order; api: OrdersApi; onClose: () => void };

// Khiếu nại sau khi giao (đơn Hoàn tất): gửi bù nến mới bằng đơn 0 ₫, hoàn một phần tiền kèm chứng từ, hoặc chỉ ghi nhận
export function ComplaintModal({ open, order, api, onClose }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const workshop = useWorkshop();
  const { available, source } = useStockHold();
  const resolution = Form.useWatch("resolution", form) ?? "resend";
  const quantities = (Form.useWatch("quantities", form) ?? {}) as Record<string, number>;
  const readyDate = Form.useWatch("readyDate", form) as Dayjs | undefined;
  const picks = order.items.map((i) => ({ itemId: i.id, quantity: Math.max(0, Math.round(quantities[i.id] ?? i.quantity)) }));
  const candles = picks.reduce((s, p) => s + p.quantity, 0);
  // Nến gửi bù làm lại từ đầu: kiểm tra nguyên liệu như đơn mới
  const short = shortages(
    linesNeeds(
      picks.map((p) => ({ ...order.items.find((i) => i.id === p.itemId)!, quantity: p.quantity })),
      source,
    ),
    available,
  );
  const maxRefund = maxComplaintRefund(order);

  const [saving, setSaving] = useState(false);

  const finish = async (v: Values) => {
    if (saving) return;
    if (v.resolution === "resend" && !candles) return message.error("Chọn ít nhất một cây để gửi bù.");
    if (v.resolution === "resend" && short.length) return message.error(`Kho không đủ ${short.map(({ m }) => m.name).join(", ")} để làm nến gửi bù.`);
    // Ảnh mới chọn tải lên kho ảnh lúc bấm Ghi nhận
    setSaving(true);
    let images: string[], refundImages: string[];
    try {
      [images, refundImages] = await Promise.all([uploadImages(v.images, "orders"), v.resolution === "refund" ? uploadImages(v.refundImages, "orders") : Promise.resolve(v.refundImages ?? [])]);
    } catch (e) {
      return message.error(uploadError(e));
    } finally {
      setSaving(false);
    }
    const replacement = v.resolution === "resend" ? buildReplacement(order, picks, { readyDate: v.readyDate.format("YYYY-MM-DD"), reason: v.reason.trim(), by: STAFF }, api.orders) : undefined;
    const saved = api.complain(order.id, {
      reason: v.reason,
      images,
      resolution: v.resolution,
      refundAmount: v.resolution === "refund" ? Math.round(v.refundAmount ?? 0) : undefined,
      refundImages,
      refundNote: v.refundNote,
      replacement,
      picks,
      readyDate: v.readyDate?.format("YYYY-MM-DD"),
    });
    if (!saved) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    message.success(
      replacement
        ? `Đã ghi nhận khiếu nại, tạo đơn gửi bù ${replacement.code}`
        : v.resolution === "refund"
          ? `Đã ghi nhận khiếu nại, hoàn ${formatMoney(v.refundAmount ?? 0)}`
          : "Đã ghi nhận khiếu nại",
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`Khiếu nại đơn ${order.code}`}
      okText="Ghi nhận"
      cancelText="Quay lại"
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: saving }}
      destroyOnHidden
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          resolution: "resend",
          images: [],
          refundImages: [],
          quantities: Object.fromEntries(order.items.map((i) => [i.id, i.quantity])),
          readyDate: dayjs(workshop.suggest(order.items.reduce((s, i) => s + i.quantity, 0))),
        }}
        onFinish={finish}
      >
        <Form.Item name="reason" label="Khách phản ánh" rules={[{ required: true, whitespace: true, message: "Nhập nội dung khiếu nại." }]}>
          <Input.TextArea autoFocus autoSize={{ minRows: 2, maxRows: 4 }} maxLength={300} placeholder="VD: Hũ vỡ khi nhận hàng, nến cháy lệch tâm…" />
        </Form.Item>
        <Form.Item name="images" label="Ảnh khách gửi" extra="Không bắt buộc.">
          <ImageUpload />
        </Form.Item>
        <Form.Item name="resolution" label="Cách xử lý">
          <Radio.Group optionType="button" options={(["resend", "refund", "none"] as const).map((value) => ({ value, label: resolutionLabels[value] }))} />
        </Form.Item>

        {resolution === "resend" && (
          <Flex vertical gap={12}>
            <Typography.Text type="secondary">Tạo đơn gửi bù 0 ₫ cho khách: đi qua đủ các bước làm, giao; nguyên liệu trừ Kho khi Bắt đầu làm.</Typography.Text>
            {order.items.map((i) => (
              <Flex key={i.id} gap={12} align="center">
                <ItemThumb item={i} size={40} />
                <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text strong>{i.name}</Typography.Text>
                  {i.custom && (
                    <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                      {i.custom}
                    </Typography.Text>
                  )}
                </Flex>
                <Form.Item name={["quantities", i.id]} noStyle>
                  <InputNumber min={0} max={i.quantity} precision={0} prefix="×" aria-label={`Số cây gửi bù ${i.name}`} style={{ width: 96 }} />
                </Form.Item>
              </Flex>
            ))}
            <Form.Item
              name="readyDate"
              label="Ngày làm xong"
              rules={[{ required: true, message: "Chọn ngày." }]}
              extra={<CapacityHint w={workshop} date={readyDate} candles={candles} onPick={(d) => form.setFieldValue("readyDate", d)} />}
              style={{ marginBottom: 0 }}
            >
              <CapacityDatePicker workshop={workshop} candles={candles} aria-label="Ngày làm xong" format="DD/MM/YYYY" allowClear={false} disabledDate={(d) => d.isBefore(dayjs(), "day")} />
            </Form.Item>
            {short.length > 0 && (
              <Alert
                type="error"
                showIcon
                title="Kho không đủ nguyên liệu để làm nến gửi bù"
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {short.map(({ m, need }) => (
                      <li key={m.id}>
                        {m.name}: cần {formatNumber(need)}, còn {formatNumber(m.stock)} {unitLabel[m.unit]}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
          </Flex>
        )}

        {resolution === "refund" && (
          <>
            <Form.Item
              name="refundAmount"
              label="Số tiền hoàn"
              extra={`Shop đang giữ ${formatMoney(maxRefund)} của đơn này.`}
              rules={[{ required: true, type: "number", min: 1000, max: maxRefund, message: `Nhập từ 1.000 ₫ tới ${formatMoney(maxRefund)}.` }]}
            >
              <MoneyInput aria-label="Số tiền hoàn" />
            </Form.Item>
            <Form.Item name="refundImages" label="Ảnh chứng từ hoàn tiền" rules={[{ required: true, type: "array", min: 1, message: "Thêm ít nhất một ảnh chứng từ." }]}>
              <ImageUpload />
            </Form.Item>
            <Form.Item name="refundNote" label="Ghi chú" style={{ marginBottom: 0 }}>
              <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} placeholder="VD: Chuyển khoản Vietcombank…" />
            </Form.Item>
          </>
        )}

        {resolution === "none" && <Typography.Text type="secondary">Chỉ lưu khiếu nại vào đơn và lịch sử, không bồi thường.</Typography.Text>}
      </Form>
    </Modal>
  );
}
