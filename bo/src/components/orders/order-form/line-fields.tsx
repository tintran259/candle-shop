import { DeleteOutlined, EditOutlined, ExperimentOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Flex, Form, InputNumber, Select, Tag, Typography, type FormInstance } from "antd";
import { FormSection } from "@/components/form/form-section";
import { searchFilter, type OrderFormValues } from "@/components/orders/order-form/model";
import { ItemThumb } from "@/components/orders/order-view";
import type { CraftConfig } from "@/lib/craft/types";
import { materialNeeds, maxJars } from "@/lib/craft/selection";
import type { MaterialMap } from "@/lib/inventory/stock";
import { formatMoney, formatNumber } from "@/lib/format";
import { lineTotal, type DraftLine } from "@/lib/orders/create";
import type { Order } from "@/lib/orders/types";
import type { Product } from "@/lib/products/types";
import { fold } from "@/lib/search";
import { brand } from "@/theme";

type Props = {
  form: FormInstance<OrderFormValues>;
  lines: DraftLine[];
  // Đơn đã Bắt đầu làm: chỉ xem sản phẩm
  locked?: Order;
  products: Product[];
  config: CraftConfig;
  map: MaterialMap;
  // Mở popup Tự phối nến cho dòng index, hoặc "new" để thêm
  onCraft: (index: number | "new") => void;
};

// Khối Sản phẩm: nến có sẵn (giá theo trang Sản phẩm) và nến tự phối (theo các bước Thủ công)
export function LineFields({ form, lines, locked, products, config, map, onCraft }: Props) {
  const productOptions = products.map((p) => ({
    value: p.id,
    search: `${p.name} ${p.slug}`,
    label: (
      <Flex align="center" gap={8}>
        <Typography.Text ellipsis style={{ flex: 1 }}>
          {p.name}
        </Typography.Text>
        {p.status === "hidden" && <Tag style={{ marginInlineEnd: 0 }}>Đang ẩn</Tag>}
        <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
          {formatMoney(p.salePrice ?? p.price)}
        </Typography.Text>
      </Flex>
    ),
  }));

  return (
    <FormSection title="Sản phẩm" description="Nến có sẵn lấy giá theo trang Sản phẩm. Nến tự phối chọn theo các bước Thủ công — nguyên liệu lấy từ Kho, giá tự tính.">
      {locked ? (
        <LockedItems order={locked} />
      ) : (
        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <Flex vertical gap={8}>
              {!fields.length && (
                <div className="order-lines-empty">
                  <Typography.Text type="secondary">Chưa có sản phẩm — thêm nến có sẵn hoặc tự phối một cây nến.</Typography.Text>
                </div>
              )}
              {fields.map((field) => {
                const line = (lines[field.name] ?? form.getFieldValue(["lines", field.name])) as DraftLine | undefined;
                const custom = line?.kind === "custom";
                const jars = custom && line.craft ? maxJars(materialNeeds(config, line.craft, map), map) : Infinity;
                return (
                  <div key={field.key} className="order-line" role="group" aria-label={`Sản phẩm ${field.name + 1}`}>
                    <span className="order-line-thumb" aria-hidden>
                      {custom ? (
                        <ExperimentOutlined style={{ color: brand.emberDark, fontSize: 18 }} />
                      ) : line?.image ? (
                        <Avatar shape="square" size={44} src={line.image} alt="" />
                      ) : (
                        <PlusOutlined style={{ color: "#b0a69b" }} />
                      )}
                    </span>
                    <div className="order-line-main">
                      {custom ? (
                        <>
                          <Flex align="center" gap={8} wrap>
                            <Typography.Text strong>Nến tự phối</Typography.Text>
                            {jars !== Infinity && (
                              <Tag color={jars === 0 ? "error" : jars <= 5 ? "warning" : "success"} style={{ marginInlineEnd: 0 }}>
                                Kho đủ {formatNumber(jars)} hũ
                              </Tag>
                            )}
                          </Flex>
                          <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, tooltip: line.custom }} style={{ margin: "2px 0 0", fontSize: 13 }}>
                            {line.custom}
                          </Typography.Paragraph>
                          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onCraft(field.name)} style={{ padding: 0, height: "auto", alignSelf: "flex-start" }}>
                            Sửa cấu hình
                          </Button>
                        </>
                      ) : (
                        <Form.Item name={[field.name, "productId"]} rules={[{ required: true, message: "Chọn sản phẩm." }]} style={{ marginBottom: 0 }}>
                          <Select
                            showSearch
                            placeholder="Tìm nến có sẵn…"
                            aria-label="Chọn sản phẩm"
                            filterOption={searchFilter(fold)}
                            options={productOptions}
                            onChange={(id: string) => {
                              const p = products.find((x) => x.id === id);
                              if (p) form.setFieldValue(["lines", field.name], { ...line, productId: id, name: p.name, image: p.images[0], price: p.salePrice ?? p.price });
                            }}
                          />
                        </Form.Item>
                      )}
                      <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
                        {line?.price !== undefined ? `Đơn giá ${formatMoney(line.price)}` : "Chọn sản phẩm để có giá"}
                      </Typography.Text>
                    </div>
                    <Form.Item
                      name={[field.name, "quantity"]}
                      className="order-line-qty"
                      rules={[
                        { required: true, type: "number", min: 1, message: "Tối thiểu 1." },
                        // Nến tự phối không vượt số hũ Kho làm được
                        { validator: (_, q?: number) => (custom && q && q > jars ? Promise.reject(new Error(`Kho chỉ đủ ${jars} hũ.`)) : Promise.resolve()) },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={1} max={99} precision={0} aria-label="Số lượng" prefix="×" style={{ width: "100%" }} />
                    </Form.Item>
                    <Typography.Text strong className="tabular order-line-total">
                      {line ? formatMoney(lineTotal(line)) : "—"}
                    </Typography.Text>
                    <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Bỏ sản phẩm ${field.name + 1}`} onClick={() => remove(field.name)} className="order-line-remove" />
                  </div>
                );
              })}
              <Flex gap={8} wrap style={{ marginTop: 4 }}>
                <Button icon={<PlusOutlined />} onClick={() => add({ kind: "product", quantity: 1 })}>
                  Nến có sẵn
                </Button>
                <Button icon={<ExperimentOutlined />} onClick={() => onCraft("new")}>
                  Tự phối nến
                </Button>
              </Flex>
            </Flex>
          )}
        </Form.List>
      )}
    </FormSection>
  );
}

// Đơn đã Bắt đầu làm: chỉ xem sản phẩm, không sửa
function LockedItems({ order }: { order: Order }) {
  return (
    <Flex vertical gap={10}>
      <Alert type="info" showIcon title="Đơn đã bắt đầu làm — không đổi sản phẩm được" description="Nguyên liệu đã trừ Kho. Muốn đổi sản phẩm thì hủy đơn rồi tạo đơn mới." />
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
          <Typography.Text className="tabular">
            {formatMoney(i.price)} × {i.quantity}
          </Typography.Text>
        </Flex>
      ))}
    </Flex>
  );
}
