import { DeleteOutlined, RightOutlined } from "@ant-design/icons";
import { App, Button, Col, ColorPicker, Drawer, Empty, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Segmented, Select, Tag, Typography } from "antd";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { MovementList } from "@/components/inventory/movement-list";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { InventoryApi } from "@/hooks/use-inventory";
import { unitLabel, unitNames } from "@/lib/craft/groups";
import { uniqueId } from "@/lib/craft/steps";
import { units, type Unit } from "@/lib/craft/types";
import { formatNumber } from "@/lib/format";
import { categoryLabels, DEFAULT_LOW_STOCK, levelMeta, manualMovements, materialLevel, movementLabels, movementShort, stockAfter, type Usage } from "@/lib/inventory/stock";
import { materialCategories, type Material, type MaterialCategory } from "@/lib/inventory/types";
import { radius } from "@/theme";

type Values = { name: string; sku?: string; category: MaterialCategory; unit: Unit; tracked: boolean; stock?: number; lowStock: number; hasSwatch: boolean; swatch?: string; note?: string };
type Props = { open: boolean; material?: Material; usage: Usage[]; api: InventoryApi; onClose: () => void };

// Thêm/sửa nguyên liệu. Số tồn của nguyên liệu đã có chỉ đổi qua phiếu kho (có lịch sử), không sửa thẳng.
export function MaterialDrawer({ open, material, usage, api, onClose }: Props) {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<Values>();
  const tracked = Form.useWatch("tracked", form);
  const unit = Form.useWatch("unit", form) ?? material?.unit ?? "pcs";
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const history = material ? api.movements.filter((mv) => mv.materialId === material.id).slice(0, 20) : [];

  const finish = (v: Values) => {
    const next: Omit<Material, "updatedAt"> = {
      id: material?.id ?? uniqueId(v.name, api.materials.map((m) => m.id), "material"),
      name: v.name.trim(),
      sku: v.sku?.trim() || undefined,
      category: v.category,
      unit: v.unit,
      tracked: v.tracked,
      // Nguyên liệu mới: tồn ban đầu; đã có: giữ nguyên (đổi qua phiếu kho)
      stock: material ? material.stock : Math.max(0, Math.round(v.stock ?? 0)),
      lowStock: Math.max(0, Math.round(v.lowStock ?? 0)),
      swatch: v.hasSwatch ? v.swatch : undefined,
      note: v.note?.trim() || undefined,
    };
    if (!api.saveMaterial(next)) return message.error("Bộ nhớ trình duyệt đã đầy.");
    message.success(material ? `Đã lưu ${next.name}` : `Đã thêm ${next.name} vào kho`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={material ? "Nguyên liệu" : "Thêm nguyên liệu"}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {material && (
            <Popconfirm
              title={`Xóa “${material.name}” khỏi kho?`}
              description={usage.length ? `Đang dùng ở ${usage.length} lựa chọn trên web — các lựa chọn đó sẽ bị khóa như hết hàng.` : "Xóa cả lịch sử nhập xuất. Không thể hoàn tác."}
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => {
                api.removeMaterial(material.id);
                message.success(`Đã xóa ${material.name}`);
                onClose();
              }}
            >
              <Button danger type="text" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
          <Button onClick={onClose} style={{ marginLeft: "auto" }}>
            Đóng
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            {material ? "Lưu thông tin" : "Thêm vào kho"}
          </Button>
        </Flex>
      }
    >
      {ready ? (
        <Flex vertical gap={16}>
          {material && <StockCard material={material} api={api} />}

          <Form
            form={form}
            layout="vertical"
            onFinish={finish}
            initialValues={{
              name: material?.name ?? "",
              sku: material?.sku,
              category: material?.category ?? "other",
              unit: material?.unit ?? "pcs",
              tracked: material?.tracked ?? true,
              stock: 0,
              lowStock: material?.lowStock ?? DEFAULT_LOW_STOCK.pcs,
              hasSwatch: !!material?.swatch,
              swatch: material?.swatch ?? "#e8dccb",
              note: material?.note,
            }}
            onValuesChange={(changed: Partial<Values>) => {
              // Đổi đơn vị khi tạo mới thì gợi ý lại ngưỡng sắp hết
              if (!material && changed.unit) form.setFieldValue("lowStock", DEFAULT_LOW_STOCK[changed.unit]);
            }}
          >
            <Flex vertical gap={16}>
              <FormSection title="Thông tin" description="Tên nội bộ của xưởng — khách không thấy (khách thấy tên lựa chọn trên trang Thủ công).">
                <Row gutter={16}>
                  <Col xs={24} sm={14}>
                    <Form.Item name="name" label="Tên nguyên liệu" rules={[{ required: true, whitespace: true, message: "Nhập tên." }]}>
                      <Input autoFocus={!material} maxLength={60} placeholder="VD: Sáp đậu nành" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item name="sku" label="Mã nội bộ / NCC">
                      <Input maxLength={30} placeholder="VD: SAP-DN" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="category" label="Loại">
                      <Select options={materialCategories.map((c) => ({ value: c, label: categoryLabels[c] }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="unit"
                      label="Tính theo"
                      extra={material && usage.length ? "Đổi đơn vị sẽ đổi cách trừ kho của các lựa chọn đang dùng." : undefined}
                    >
                      <Radio.Group optionType="button" options={units.map((u) => ({ value: u, label: unitNames[u] }))} />
                    </Form.Item>
                  </Col>
                </Row>
                <Flex justify="space-between" align="center" gap={16}>
                  <Flex vertical>
                    <Typography.Text strong>Màu nhận diện</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      Hiện trong bảng kho cho dễ nhìn.
                    </Typography.Text>
                  </Flex>
                  <Flex gap={8} align="center">
                    {hasSwatch && (
                      <Form.Item name="swatch" noStyle getValueFromEvent={(c) => c.toHexString()}>
                        <ColorPicker showText disabledAlpha aria-label="Màu nhận diện" />
                      </Form.Item>
                    )}
                    <Form.Item name="hasSwatch" noStyle>
                      <Segmented
                        options={[
                          { value: false, label: "Không" },
                          { value: true, label: "Có màu" },
                        ]}
                      />
                    </Form.Item>
                  </Flex>
                </Flex>
              </FormSection>

              <FormSection title="Tồn kho" description={material ? "Số tồn đổi qua phiếu nhập / xuất / kiểm kê ở trên để luôn có lịch sử." : undefined}>
                <SwitchField name="tracked" label="Theo dõi tồn kho" description="Tắt cho mục không cần đếm (vd “Không mùi”) — luôn coi là còn hàng." last={!tracked} />
                {tracked && (
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    {!material && (
                      <Col span={12}>
                        <Form.Item name="stock" label="Tồn ban đầu" style={{ marginBottom: 0 }}>
                          <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    )}
                    <Col span={12}>
                      <Form.Item name="lowStock" label="Báo sắp hết khi dưới" style={{ marginBottom: 0 }}>
                        <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </FormSection>

              <FormSection title="Ghi chú">
                <Form.Item name="note" noStyle>
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={300} placeholder="VD: nhà cung cấp, hạn dùng, nơi cất…" />
                </Form.Item>
              </FormSection>
            </Flex>
          </Form>

          {material && (
            <>
              <FormSection title={`Dùng trên web (${usage.length})`} description="Các lựa chọn trên trang Thủ công trừ kho bằng nguyên liệu này.">
                {usage.length ? (
                  <Flex vertical gap={4}>
                    {usage.map((u, i) => (
                      <Link
                        key={i}
                        to={`/craft?step=${u.target.stepId}${u.target.optionId ? `&edit=${u.target.optionId}` : ""}`}
                        className="list-row-button"
                        style={{ color: "inherit" }}
                      >
                        <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                          <Typography.Text strong>{u.label}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Bước {u.step.title.vi}
                            {!u.step.enabled && " · đang ẩn"}
                          </Typography.Text>
                        </Flex>
                        <RightOutlined aria-hidden style={{ fontSize: 11, color: "#6b6b6b" }} />
                      </Link>
                    ))}
                  </Flex>
                ) : (
                  <Typography.Text type="secondary">Chưa gắn với lựa chọn nào — gắn trong drawer sửa lựa chọn ở trang Thủ công.</Typography.Text>
                )}
              </FormSection>

              <FormSection title="Lịch sử kho" description="20 phiếu gần nhất.">
                {history.length ? <MovementList items={history} materials={api.materials} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phiếu nào." />}
              </FormSection>
            </>
          )}
        </Flex>
      ) : (
        <DrawerFormSkeleton />
      )}
    </Drawer>
  );
}

// Thẻ đầu drawer: số tồn hiện tại + phiếu nhanh (nhập / xuất / kiểm kê)
function StockCard({ material, api }: { material: Material; api: InventoryApi }) {
  const { message } = App.useApp();
  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const level = materialLevel(material);
  const unit = unitLabel[material.unit];

  const after = stockAfter(material.stock, type, amount);
  const overdraw = type === "out" && amount !== null && amount > material.stock;

  const submit = () => {
    if (amount === null || after === null) return;
    api.move(material.id, type, amount, note);
    message.success(`${movementLabels[type]}: ${material.name}`);
    setAmount(null);
    setNote("");
  };

  return (
    <section aria-label="Tồn kho hiện tại" style={{ background: "#fff", borderRadius: radius.card, padding: 20 }}>
      <Flex justify="space-between" align="flex-start" gap={12}>
        <Flex vertical style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {categoryLabels[material.category]}
            {material.sku && ` · ${material.sku}`}
          </Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {material.name}
          </Typography.Title>
        </Flex>
        <Tag color={levelMeta[level].color} style={{ marginInlineEnd: 0 }}>
          {levelMeta[level].label}
        </Tag>
      </Flex>
      {material.tracked ? (
        <>
          <span className="big-number" style={{ fontSize: 40, lineHeight: 1.2, display: "block", marginTop: 8 }}>
            {formatNumber(material.stock)}
            <span style={{ fontSize: 16, marginLeft: 6, color: "#6b6b6b" }}>{unit}</span>
          </span>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Báo sắp hết khi dưới {formatNumber(material.lowStock)} {unit}
          </Typography.Text>
          <Flex vertical gap={8} style={{ marginTop: 16, background: "#f6f6f3", borderRadius: radius.inner, padding: 12 }}>
            <Segmented<"in" | "out" | "adjust">
              block
              value={type}
              onChange={setType}
              options={manualMovements.map((t) => ({ value: t, label: movementShort[t] }))}
            />
            <Flex gap={8} wrap>
              <InputNumber
                aria-label={type === "adjust" ? "Số đếm thực tế" : "Số lượng"}
                min={0}
                precision={0}
                placeholder={type === "adjust" ? "Số đếm thực tế" : type === "out" ? "Số lượng xuất / hao hụt" : "Số lượng nhập"}
                suffix={unit}
                value={amount}
                onChange={setAmount}
                style={{ flex: "1 1 140px" }}
              />
              <Input aria-label="Ghi chú phiếu" placeholder="Ghi chú (không bắt buộc)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} style={{ flex: "2 1 180px" }} />
              <Button type="primary" onClick={submit} disabled={after === null}>
                Ghi nhận
              </Button>
            </Flex>
            {/* Xem trước kết quả trước khi ghi — xuất quá số đang có thì chặn thay vì tự về 0 */}
            {amount !== null && (
              <Typography.Text type={overdraw ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13 }} role="status">
                {overdraw
                  ? `Chỉ còn ${formatNumber(material.stock)} ${unit} — không xuất quá số đang có. Đếm lại thực tế thì dùng Kiểm kê.`
                  : after !== null
                    ? `Sau phiếu: ${formatNumber(after)} ${unit}`
                    : "Nhập số lượng lớn hơn 0."}
              </Typography.Text>
            )}
          </Flex>
        </>
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
          Không theo dõi tồn — lựa chọn dùng nguyên liệu này luôn được coi là còn hàng.
        </Typography.Paragraph>
      )}
    </section>
  );
}
