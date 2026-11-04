import { BuildOutlined, DeleteOutlined, EditOutlined, RightOutlined, ShoppingOutlined } from "@ant-design/icons";
import { App, Button, Col, ColorPicker, Drawer, Empty, Flex, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Segmented, Select, Tag, Typography, type FormRule } from "antd";
import { useDeferredValue, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { BatchNeeds, BatchPriceInput } from "@/components/inventory/batch-inputs";
import { MovementList } from "@/components/inventory/movement-list";
import { LotPriceInput, PurchaseInput } from "@/components/inventory/price-inputs";
import { RecipeField } from "@/components/products/recipe-field";
import { DrawerFormSkeleton } from "@/components/skeletons";
import type { InventoryApi } from "@/hooks/use-inventory";
import { unitLabel, unitNames } from "@/lib/craft/groups";
import { uniqueId } from "@/lib/craft/steps";
import { units, type Unit } from "@/lib/craft/types";
import { averageCost, lotPreview, lotTotal, purchaseCost, purchaseFrom, purchaseUnits, unitPrice, type LotPrice, type Purchase } from "@/lib/costs";
import { formatCostChange, formatMoney, formatNumber, formatUnitCost } from "@/lib/format";
import { batchError, batchPlan, batchTotal, isMade, madeFrom, madeWith, type BatchPrice } from "@/lib/inventory/production";
import {
  categoryLabels,
  DEFAULT_LOW_STOCK,
  levelMeta,
  lotPriceRequired,
  manualMovements,
  materialLevel,
  movementLabels,
  movementShort,
  stockAfter,
  toMap,
  type ManualMovement,
  type Usage,
} from "@/lib/inventory/stock";
import { materialCategories, type Material, type MaterialCategory } from "@/lib/inventory/types";
import type { RecipeLine } from "@/lib/products/types";
import { radius } from "@/theme";

type Values = {
  // Nguyên liệu mua về, hay xưởng tự sản xuất từ nguyên liệu khác trong Kho (vd hũ gốm từ thạch cao)
  source: "bought" | "made";
  // Sản xuất từ: định mức cho 1 đơn vị
  recipe?: (RecipeLine | undefined)[];
  // Tạo mới dạng sản xuất: số lượng làm mẻ đầu (cũng là tồn ban đầu) và giá mẻ
  makeCount?: number | null;
  makePrice?: BatchPrice;
  name: string;
  sku?: string;
  category: MaterialCategory;
  unit: Unit;
  tracked: boolean;
  stock?: number;
  // Tiền mua số tồn ban đầu (chỉ khi tạo mới, có tồn)
  opening?: LotPrice;
  lowStock: number;
  // Giá nhập của nguyên liệu không theo dõi tồn — không có phiếu nhập để tự tính
  buy?: Purchase;
  hasSwatch: boolean;
  swatch?: string;
  note?: string;
};
type Props = { open: boolean; material?: Material; usage: Usage[]; api: InventoryApi; onClose: () => void };

// Tạo mới: có tồn ban đầu thì bắt buộc tiền đã trả; ghi tiền mà tồn 0 thì không chia ra được giá mỗi đơn vị
const openingRule: FormRule = ({ getFieldValue }) => ({
  validator: (_, v?: LotPrice) => {
    const stock = getFieldValue("stock") ?? 0;
    if (stock > 0 && lotTotal(v) === undefined) return Promise.reject(new Error(lotPriceRequired));
    if (!stock && v?.total && !v.free) return Promise.reject(new Error("Nhập tồn ban đầu để chia ra giá mỗi đơn vị."));
    return Promise.resolve();
  },
});

const cleanRecipe = (lines?: (RecipeLine | undefined)[]) => (lines ?? []).filter((r): r is RecipeLine => !!r?.materialId && !!r.quantity);

// Thêm/sửa nguyên liệu. Nguyên liệu đã có: số tồn và giá nhập chỉ đổi qua thẻ tồn kho trên cùng (có lịch sử),
// form bên dưới chỉ sửa thông tin và cài đặt — không có ô nào trông như nhập hàng.
export function MaterialDrawer({ open, material, usage, api, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<Values>();
  const tracked = Form.useWatch("tracked", form);
  const unit = Form.useWatch("unit", form) ?? material?.unit ?? "pcs";
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const openingStock = Form.useWatch("stock", form);
  const opening = Form.useWatch("opening", form) as LotPrice | undefined;
  const buy = Form.useWatch("buy", form) as Purchase | undefined;
  const buyCost = purchaseCost(unit, buy);
  const openingCost = !material && openingStock ? lotPreview(0, undefined, openingStock, opening) : undefined;
  const made = (Form.useWatch("source", form) ?? (isMade(material) ? "made" : "bought")) === "made";
  const recipe = cleanRecipe(Form.useWatch("recipe", form) as (RecipeLine | undefined)[] | undefined);
  const makeCount = Form.useWatch("makeCount", form) as number | null | undefined;
  const makePrice = Form.useWatch("makePrice", form) as BatchPrice | undefined;
  const map = toMap(api.materials);
  const plan = batchPlan(recipe, makeCount ?? 0, map);
  const makeTotal = makeCount ? batchTotal(plan, makePrice) : undefined;
  const makeUnit = makeTotal !== undefined && makeCount ? unitPrice(makeTotal, makeCount) : undefined;
  // Công thức không được chọn chính nó và thứ đang làm từ nó (tránh vòng)
  const exclude = material ? api.materials.filter((m) => m.id === material.id || madeFrom(map, m.id, material.id)).map((m) => m.id) : [];
  const usedToMake = material ? madeWith(api.materials, material.id) : [];

  // Tạo mới dạng sản xuất: đủ nguyên liệu, có giá mới tạo được. 0 = chỉ lưu công thức, sản xuất sau
  const makeRule: FormRule = ({ getFieldValue }) => ({
    validator: (_, count?: number | null) => {
      const err = count ? batchError(batchPlan(cleanRecipe(getFieldValue("recipe")), count, map), getFieldValue("makePrice"), count) : null;
      return err ? Promise.reject(new Error(err)) : Promise.resolve();
    },
  });
  const history = material ? api.movements.filter((mv) => mv.materialId === material.id).slice(0, 20) : [];
  // Phiếu kho gõ dở trong thẻ tồn: Lưu thông tin không ghi phiếu đó, đóng drawer thì mất
  const [pending, setPending] = useState(false);

  const close = () => {
    if (!pending) return onClose();
    modal.confirm({
      title: "Bỏ phiếu kho chưa ghi nhận?",
      content: "Đã nhập số lượng nhưng chưa bấm Ghi nhận — số tồn chưa đổi.",
      okText: "Bỏ phiếu",
      cancelText: "Ở lại",
      onOk: onClose,
    });
  };

  const finish = (v: Values) => {
    if (pending) return message.warning("Phiếu kho chưa ghi nhận — bấm Ghi nhận trong thẻ tồn kho, hoặc xóa số lượng.");
    const makes = v.source === "made";
    const lines = makes ? cleanRecipe(v.recipe) : [];
    // Thành phẩm sản xuất luôn theo dõi tồn (làm tới đâu cộng tới đó)
    const tracked = makes || v.tracked;
    const count = !material && makes ? Math.max(0, Math.round(v.makeCount ?? 0)) : 0;
    const stock = material ? material.stock : !makes && tracked ? Math.max(0, Math.round(v.stock ?? 0)) : 0;
    const next: Omit<Material, "updatedAt"> = {
      id: material?.id ?? uniqueId(v.name, api.materials.map((m) => m.id), "material"),
      name: v.name.trim(),
      sku: v.sku?.trim() || undefined,
      category: v.category,
      unit: v.unit,
      tracked,
      // Nguyên liệu mới: tồn ban đầu; đã có: giữ nguyên (đổi qua phiếu kho)
      stock,
      lowStock: Math.max(0, Math.round(v.lowStock ?? 0)),
      // Theo dõi tồn: giá lấy từ phiếu nhập có tiền / Sửa giá, form giữ nguyên số mới nhất.
      // Không theo dõi: sửa thẳng ở ô Giá nhập (chỉ khi có đụng tới, tránh làm tròn lại giá cũ)
      unitCost: !tracked && form.isFieldTouched("buy") ? purchaseCost(v.unit, v.buy) : material?.unitCost,
      recipe: lines.length ? lines : undefined,
      swatch: v.hasSwatch ? v.swatch : undefined,
      note: v.note?.trim() || undefined,
    };
    const openingTotal = !material && !makes && tracked && stock > 0 ? lotTotal(v.opening) : undefined;
    if (!api.saveMaterial(next, openingTotal)) return message.error("Bộ nhớ trình duyệt đã đầy.");
    // Mẻ đầu: trừ từng nguyên liệu (mỗi nguyên liệu một phiếu), cộng thành phẩm
    if (count > 0) api.produce(next.id, count, batchTotal(batchPlan(lines, count, map), v.makePrice) ?? 0, "Mẻ đầu tiên");
    message.success(material ? `Đã lưu ${next.name}` : `Đã thêm ${next.name} vào kho`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title={material ? "Nguyên liệu" : "Thêm nguyên liệu"}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {material && (
            <Popconfirm
              title={`Xóa “${material.name}” khỏi kho?`}
              description={
                [
                  usage.length ? `Đang dùng ở ${usage.length} lựa chọn trên web — các lựa chọn đó sẽ bị khóa như hết hàng.` : "",
                  usedToMake.length ? `Đang dùng để sản xuất ${usedToMake.map((m) => m.name).join(", ")} — xóa thì không sản xuất được nữa.` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || "Xóa cả lịch sử nhập xuất. Không thể hoàn tác."
              }
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
          <Button onClick={close} style={{ marginLeft: "auto" }}>
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
          {material && <StockCard material={material} api={api} onPending={setPending} />}

          <Form
            form={form}
            layout="vertical"
            onFinish={finish}
            initialValues={{
              source: isMade(material) ? "made" : "bought",
              recipe: material?.recipe ?? [],
              makeCount: null,
              makePrice: { manual: false, total: null },
              name: material?.name ?? "",
              sku: material?.sku,
              category: material?.category ?? "other",
              unit: material?.unit ?? "pcs",
              tracked: material?.tracked ?? true,
              stock: 0,
              opening: { total: null, free: false },
              lowStock: material?.lowStock ?? DEFAULT_LOW_STOCK.pcs,
              buy: purchaseFrom(material?.unit ?? "pcs", material?.unitCost),
              hasSwatch: !!material?.swatch,
              swatch: material?.swatch ?? "#e8dccb",
              note: material?.note,
            }}
            onValuesChange={(changed: Partial<Values>) => {
              // Đổi đơn vị khi tạo mới thì gợi ý lại ngưỡng sắp hết
              if (!material && changed.unit) form.setFieldValue("lowStock", DEFAULT_LOW_STOCK[changed.unit]);
              // Đơn vị lúc mua đi theo đơn vị Kho (g → kg, ml → lít)
              if (changed.unit) form.setFieldValue("buy", { ...form.getFieldValue("buy"), unit: purchaseUnits[changed.unit][0].value });
              // Ô tiền đang báo lỗi thì đổi tồn ban đầu kiểm tra lại ngay — chưa báo thì chờ tới lúc bấm Thêm vào kho
              if (("stock" in changed || "opening" in changed) && form.getFieldError("opening").length) void form.validateFields(["opening"]).catch(() => undefined);
              // Chọn Sản xuất thì mở sẵn một dòng công thức
              if (changed.source === "made" && !form.getFieldValue("recipe")?.length) form.setFieldValue("recipe", [{}]);
              // Ô số lượng sản xuất đang báo lỗi thì sửa công thức hay giá là kiểm tra lại
              if (("recipe" in changed || "makePrice" in changed) && form.getFieldError("makeCount").length) void form.validateFields(["makeCount"]).catch(() => undefined);
            }}
          >
            <Flex vertical gap={16}>
              <FormSection title="Thông tin" description="Tên nội bộ của xưởng — khách không thấy (khách thấy tên lựa chọn trên trang Thủ công).">
                <Form.Item name="source" label="Nguồn">
                  <Segmented
                    block
                    className="source-choice"
                    options={[
                      { value: "bought", label: <SourceOption icon={<ShoppingOutlined />} title="Nguyên liệu" hint="Mua về từ nhà cung cấp" /> },
                      { value: "made", label: <SourceOption icon={<BuildOutlined />} title="Sản xuất" hint="Xưởng tự làm, trừ kho theo công thức" /> },
                    ]}
                  />
                </Form.Item>
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

              {made && (
                <FormSection title="Sản xuất từ" description={`Lượng nguyên liệu cho 1 ${unitLabel[unit]}. Mỗi lần sản xuất trừ kho theo lượng này × số lượng làm.`}>
                  <RecipeField required exclude={exclude} />
                </FormSection>
              )}

              {/* Nguyên liệu đã có: chỉ cài đặt (theo dõi, ngưỡng) — nhập / xuất và giá nằm ở thẻ tồn kho trên cùng */}
              <FormSection
                title={material ? "Cài đặt tồn kho" : "Tồn kho"}
                description={material ? "Số tồn và giá nhập đổi qua phiếu ở thẻ trên cùng để luôn có lịch sử." : undefined}
              >
                {!made && <SwitchField name="tracked" label="Theo dõi tồn kho" description="Tắt cho mục không cần đếm (vd “Không mùi”) — luôn coi là còn hàng." last={!tracked} />}
                {made || tracked ? (
                  <>
                    {/* Tạo mới dạng sản xuất: làm mẻ đầu — số lượng làm là tồn ban đầu, trừ nguyên liệu theo công thức */}
                    {!material && made && (
                      <SubPanel title="Mẻ đầu tiên" description="Làm luôn khi tạo — số lượng làm là tồn ban đầu. Để 0 nếu chưa làm, sản xuất sau ở thẻ tồn kho.">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={9}>
                            <Form.Item name="makeCount" label="Số lượng sản xuất" rules={[makeRule]} style={{ marginBottom: 0 }}>
                              <InputNumber min={0} precision={0} suffix={unitLabel[unit]} aria-label="Số lượng sản xuất" style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={15}>
                            <Form.Item name="makePrice" label="Giá" style={{ marginBottom: 0 }}>
                              <BatchPriceInput auto={makeCount ? plan.cost : undefined} missing={makeCount ? plan.missing.map((m) => m.name) : undefined} />
                            </Form.Item>
                          </Col>
                        </Row>
                        {makeCount ? <BatchNeeds lines={plan.lines} /> : null}
                        {makeTotal !== undefined && makeUnit !== undefined && (
                          <Typography.Text strong className="tabular" role="status">
                            Chi phí mẻ {formatMoney(makeTotal)} = {formatUnitCost(makeUnit)}/{unitLabel[unit]}
                            <Typography.Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
                              {" "}
                              — giá ban đầu của thành phẩm.
                            </Typography.Text>
                          </Typography.Text>
                        )}
                      </SubPanel>
                    )}
                    {/* Tạo mới: lần nhập đầu tiên — số lượng và tiền đã trả nằm cạnh nhau, tự chia ra giá mỗi đơn vị */}
                    {!material && !made && (
                      <SubPanel title="Nhập kho lần đầu" description="Số đang có và tiền đã trả cho số đó — hệ thống tự chia ra giá mỗi đơn vị." style={{ marginTop: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={9}>
                          <Form.Item name="stock" label="Tồn ban đầu" style={{ marginBottom: 0 }}>
                            <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={15}>
                          <Form.Item
                            name="opening"
                            label="Tổng tiền đã trả"
                            required={!!openingStock}
                            rules={[openingRule]}
                            // Chỉ kiểm tra khi bấm Thêm vào kho (gõ tiền trước số tồn không bị báo đỏ giữa chừng)
                            validateTrigger={false}
                            extra={
                              openingCost
                                ? `= ${formatUnitCost(openingCost.price)}/${unitLabel[unit]} — giá nhập ban đầu, dùng tính giá vốn.`
                                : openingStock
                                  ? "Tiền mua số tồn ban đầu, hệ thống tự chia ra giá mỗi đơn vị."
                                  : "Chưa có hàng thì để trống — giá có từ phiếu Nhập thêm đầu tiên."
                            }
                            style={{ marginBottom: 0 }}
                          >
                            <LotPriceInput label="Tổng tiền đã trả" />
                          </Form.Item>
                        </Col>
                      </Row>
                      </SubPanel>
                    )}
                    <Row gutter={16} style={{ marginTop: made && material ? 0 : 16 }}>
                      <Col xs={24} sm={9}>
                        <Form.Item name="lowStock" label="Báo sắp hết khi dưới" style={{ marginBottom: 0 }}>
                          <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Form.Item
                    name="buy"
                    label="Giá nhập"
                    extra={
                      buyCost !== undefined
                        ? `= ${formatUnitCost(buyCost)}/${unitLabel[unit]}. Dùng tính giá vốn và lãi gộp.`
                        : "Không theo dõi tồn nên không có phiếu nhập — ghi lần mua gần nhất, hệ thống tự chia ra giá mỗi đơn vị. Bỏ trống nếu không tốn tiền."
                    }
                    style={{ marginTop: 16, marginBottom: 0 }}
                  >
                    <PurchaseInput unit={unit} />
                  </Form.Item>
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

// Một lựa chọn Nguồn: icon, tên, một dòng mô tả
function SourceOption({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <Flex align="center" gap={10} style={{ padding: "8px 4px", textAlign: "left" }}>
      <span aria-hidden style={{ fontSize: 18, display: "flex" }}>
        {icon}
      </span>
      <Flex vertical style={{ minWidth: 0, lineHeight: 1.35 }}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "normal" }}>
          {hint}
        </Typography.Text>
      </Flex>
    </Flex>
  );
}

// Khối con nền xám trong form: gom các ô của lần nhập / mẻ làm đầu tiên, cùng kiểu khối Ghi phiếu kho
function SubPanel({ title, description, style, children }: { title: string; description: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <Flex vertical gap={12} role="group" aria-label={title} className="sub-panel" style={{ background: "#f6f6f3", borderRadius: radius.inner, padding: 16, ...style }}>
      <Flex vertical gap={2}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {description}
        </Typography.Text>
      </Flex>
      {children}
    </Flex>
  );
}

type StockAction = ManualMovement | "make";
const actionLabel = (t: StockAction) => (t === "make" ? "Sản xuất" : movementShort[t]);

// Thẻ đầu drawer: số tồn, giá nhập hiện tại + phiếu nhanh (nhập / sản xuất / xuất / kiểm kê). Nơi duy nhất đổi số tồn và giá
function StockCard({ material, api, onPending }: { material: Material; api: InventoryApi; onPending: (pending: boolean) => void }) {
  const { message } = App.useApp();
  const [type, setTypeState] = useState<StockAction>("in");
  const [amount, setAmountState] = useState<number | null>(null);
  const [note, setNote] = useState("");
  // Tiền lô nhập — bắt buộc với Nhập thêm (tổng đã trả, hoặc không mất tiền)
  const [lot, setLot] = useState<LotPrice>({});
  // Bấm Ghi nhận khi chưa có tiền lô thì báo đỏ ngay ô tiền
  const [tried, setTried] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  // Giá mẻ khi Sản xuất: theo nguyên liệu tiêu tốn hoặc tự nhập
  const [batchPrice, setBatchPrice] = useState<BatchPrice>({});
  const level = materialLevel(material);
  const unit = unitLabel[material.unit];
  const actions: readonly StockAction[] = isMade(material) ? ["in", "make", "out", "adjust"] : manualMovements;

  const after = stockAfter(material.stock, type === "make" ? "in" : type, amount);
  const plan = type === "make" ? batchPlan(material.recipe ?? [], amount ?? 0, toMap(api.materials)) : undefined;
  const makeErr = plan ? batchError(plan, batchPrice, amount) : null;
  const makeTotal = plan && amount ? batchTotal(plan, batchPrice) : undefined;
  const makePrice = makeTotal !== undefined && amount ? unitPrice(makeTotal, amount) : undefined;
  const overdraw = type === "out" && amount !== null && amount > material.stock;
  const missingLot = type === "in" && lotTotal(lot) === undefined;
  const lotError = tried && missingLot;
  const makeError = tried && !!makeErr;

  const setType = (t: StockAction) => {
    setTypeState(t);
    setTried(false);
  };
  const preview = type === "in" ? lotPreview(material.stock, material.unitCost, amount, lot) : undefined;

  const setAmount = (v: number | null) => {
    setAmountState(v);
    onPending(v !== null);
  };

  const submit = () => {
    if (amount === null || after === null) return;
    if (type === "make") {
      if (makeErr) return setTried(true);
      api.produce(material.id, amount, makeTotal ?? 0, note);
    } else {
      if (missingLot) return setTried(true);
      api.move(material.id, type, amount, note, type === "in" ? lotTotal(lot) : undefined);
    }
    message.success(`${movementLabels[type]}: ${material.name}`);
    setAmount(null);
    setNote("");
    setLot({});
    setBatchPrice({});
    setTried(false);
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
          <Flex align="center" gap={4} wrap>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Báo sắp hết khi dưới {formatNumber(material.lowStock)} {unit}
              {" · "}
              {material.unitCost !== undefined ? `Giá nhập bình quân ${formatUnitCost(material.unitCost)}/${unit}` : "Chưa có giá nhập"}
            </Typography.Text>
            {!editingCost && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditingCost(true)} style={{ paddingInline: 4 }}>
                {material.unitCost !== undefined ? "Sửa giá" : "Đặt giá"}
              </Button>
            )}
          </Flex>
          {editingCost && <CostEditor material={material} api={api} onDone={() => setEditingCost(false)} />}

          <Flex vertical gap={8} role="group" aria-label="Ghi phiếu kho" className="sub-panel" style={{ marginTop: 16, background: "#f6f6f3", borderRadius: radius.inner, padding: 12 }}>
            <Segmented<StockAction> block value={type} onChange={setType} options={actions.map((t) => ({ value: t, label: actionLabel(t) }))} />
            <Flex gap={8} wrap>
              <InputNumber
                aria-label={type === "adjust" ? "Số đếm thực tế" : type === "make" ? "Số lượng sản xuất" : "Số lượng"}
                min={0}
                precision={0}
                placeholder={type === "adjust" ? "Số đếm thực tế" : type === "out" ? "Số lượng xuất / hao hụt" : type === "make" ? "Số lượng làm" : "Số lượng nhập"}
                suffix={unit}
                value={amount}
                onChange={setAmount}
                style={{ flex: "1 1 140px" }}
              />
              {type === "in" && <LotPriceInput value={lot} onChange={setLot} status={lotError ? "error" : undefined} />}
            </Flex>
            {plan && (
              <>
                <BatchPriceInput value={batchPrice} onChange={setBatchPrice} auto={amount ? plan.cost : undefined} missing={amount ? plan.missing.map((m) => m.name) : undefined} />
                {amount ? <BatchNeeds lines={plan.lines} /> : null}
              </>
            )}
            <Flex gap={8} wrap>
              <Input aria-label="Ghi chú phiếu" placeholder="Ghi chú (không bắt buộc)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} style={{ flex: "1 1 200px" }} />
              <Button type="primary" onClick={submit} disabled={after === null}>
                Ghi nhận
              </Button>
            </Flex>
            {/* Xem trước kết quả trước khi ghi — xuất quá số đang có thì chặn thay vì tự về 0; nhập thiếu tiền lô thì chặn */}
            {amount !== null && (
              <Typography.Text type={overdraw || lotError || makeError ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13 }} role="status">
                {overdraw
                  ? `Chỉ còn ${formatNumber(material.stock)} ${unit} — không xuất quá số đang có. Đếm lại thực tế thì dùng Kiểm kê.`
                  : after === null
                    ? "Nhập số lượng lớn hơn 0."
                    : type === "make"
                      ? (makeErr ??
                        `Sau phiếu: ${formatNumber(after)} ${unit}` +
                          (makeTotal !== undefined && makePrice !== undefined
                            ? ` · chi phí mẻ ${formatMoney(makeTotal)} = ${formatUnitCost(makePrice)}/${unit} · bình quân ${formatCostChange(material.unitCost, averageCost(material.stock, material.unitCost, amount, makePrice))}/${unit}`
                            : ""))
                      : lotError
                      ? lotPriceRequired
                      : `Sau phiếu: ${formatNumber(after)} ${unit}` +
                        (preview
                          ? ` · giá lô ${formatUnitCost(preview.price)}/${unit} · bình quân ${formatCostChange(material.unitCost, preview.average)}/${unit}`
                          : missingLot
                            ? " · ghi tổng tiền lô để tính giá"
                            : "")}
              </Typography.Text>
            )}
          </Flex>
        </>
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
          Không theo dõi tồn — lựa chọn dùng nguyên liệu này luôn được coi là còn hàng. Giá nhập sửa ở phần Cài đặt tồn kho bên dưới.
        </Typography.Paragraph>
      )}
    </section>
  );
}

// Sửa tay giá nhập bình quân: nhập nhầm tiền lô, hoặc nguyên liệu chưa có giá. Có ghi lịch sử (Sửa giá nhập)
function CostEditor({ material, api, onDone }: { material: Material; api: InventoryApi; onDone: () => void }) {
  const { message } = App.useApp();
  const [buy, setBuy] = useState<Purchase>(() => purchaseFrom(material.unit, material.unitCost));
  const cost = purchaseCost(material.unit, buy);
  const unit = unitLabel[material.unit];

  const save = () => {
    if (cost === undefined) return;
    api.setCost(material.id, cost);
    message.success(`Đã đổi giá nhập ${material.name}: ${formatUnitCost(cost)}/${unit}`);
    onDone();
  };

  return (
    <Flex vertical gap={8} role="group" aria-label="Sửa giá nhập" style={{ marginTop: 12, border: "1px solid #ececec", borderRadius: radius.inner, padding: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Chỉ dùng khi giá đang sai hoặc chưa có giá — không đổi số tồn. Nhập hàng thì ghi phiếu Nhập thêm kèm tổng tiền, giá tự tính lại.
      </Typography.Text>
      <PurchaseInput unit={material.unit} value={buy} onChange={setBuy} />
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Typography.Text className="tabular" style={{ fontSize: 13 }}>
          {cost !== undefined ? `= ${formatUnitCost(cost)}/${unit}` : "Nhập lượng mua và giá."}
        </Typography.Text>
        <Flex gap={8}>
          <Button size="small" onClick={onDone}>
            Hủy
          </Button>
          <Button size="small" type="primary" onClick={save} disabled={cost === undefined}>
            Lưu giá
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
