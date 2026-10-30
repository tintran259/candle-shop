import { Flex, Form, Input, InputNumber, Modal, Segmented, Typography } from "antd";
import { MaterialSelect } from "@/components/inventory/material-select";
import { unitLabel } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import { manualMovements, movementShort, stockAfter } from "@/lib/inventory/stock";
import type { Material, MovementType } from "@/lib/inventory/types";

export type ManualMovement = Exclude<MovementType, "order">;
type Values = { materialId: string; type: ManualMovement; amount: number; note?: string };

type Props = {
  open: boolean;
  materials: Material[];
  // Mở sẵn cho một nguyên liệu / loại phiếu
  preset?: { materialId?: string; type?: ManualMovement };
  onCancel: () => void;
  onSubmit: (v: Values) => void;
};

// Phiếu nhập/xuất/kiểm kê — luôn ghi lịch sử, không sửa thẳng số tồn
export function MovementModal({ open, materials, preset, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<Values>();
  const tracked = materials.filter((m) => m.tracked);
  const materialId = Form.useWatch("materialId", form);
  const type = Form.useWatch("type", form) ?? "in";
  const amount = Form.useWatch("amount", form) ?? 0;
  const m = tracked.find((x) => x.id === materialId);
  const after = m ? stockAfter(m.stock, type, amount) : null;
  const overdraw = !!m && type === "out" && amount > m.stock;

  return (
    <Modal
      open={open}
      title="Ghi nhận kho"
      okText="Ghi nhận"
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ materialId: preset?.materialId, type: preset?.type ?? "in" }}
        onFinish={(v) => onSubmit({ ...v, amount: Math.round(v.amount) })}
      >
        <Form.Item name="type" label="Loại phiếu">
          <Segmented<ManualMovement>
            block
            options={manualMovements.map((t) => ({ value: t, label: movementShort[t] }))}
          />
        </Form.Item>
        <Form.Item name="materialId" label="Nguyên liệu" rules={[{ required: true, message: "Chọn nguyên liệu." }]}>
          <MaterialSelect materials={tracked} allowNone={false} />
        </Form.Item>
        <Form.Item
          name="amount"
          label={type === "adjust" ? "Số đếm thực tế" : "Số lượng"}
          dependencies={["type", "materialId"]}
          rules={[
            { required: true, type: "number", min: type === "adjust" ? 0 : 1, message: type === "adjust" ? "Nhập số đếm được." : "Nhập số lượng lớn hơn 0." },
            // Không cho xuất quá số đang có (trước đây tự về 0, mất dấu hao hụt thật)
            { validator: (_, v: number | undefined) => (m && type === "out" && (v ?? 0) > m.stock ? Promise.reject(new Error(`Chỉ còn ${formatNumber(m.stock)} ${unitLabel[m.unit]} — đếm lại thực tế thì dùng Kiểm kê.`)) : Promise.resolve()) },
          ]}
          extra={type === "adjust" ? "Đặt lại tồn kho bằng số đếm được khi kiểm kê." : undefined}
        >
          <InputNumber min={0} precision={0} suffix={m ? unitLabel[m.unit] : undefined} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú" style={{ marginBottom: m ? 12 : 0 }}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={200} placeholder={type === "in" ? "VD: Lô tháng 11 — NCC Hạt Mộc" : "VD: Vỡ khi vận chuyển"} />
        </Form.Item>
        {m && (
          <Flex justify="space-between" style={{ background: "#f6f6f3", borderRadius: 12, padding: "10px 14px" }}>
            <Typography.Text type="secondary">
              Hiện có {formatNumber(m.stock)} {unitLabel[m.unit]}
            </Typography.Text>
            <Typography.Text strong className="tabular" type={overdraw ? "danger" : undefined}>
              {after === null ? (overdraw ? "Vượt số tồn" : "Sau phiếu: —") : `Sau phiếu: ${formatNumber(after)} ${unitLabel[m.unit]}`}
            </Typography.Text>
          </Flex>
        )}
      </Form>
    </Modal>
  );
}
