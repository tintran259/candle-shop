import { DeleteOutlined, EditOutlined, ExperimentOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Avatar, Button, Col, DatePicker, Drawer, Flex, Form, Grid, Input, InputNumber, Radio, Row, Segmented, Select, Switch, Tag, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useDeferredValue, useMemo, useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { CustomCandleModal, type CustomCandle } from "@/components/orders/custom-candle-modal";
import { DrawerFormSkeleton } from "@/components/skeletons";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useCustomers } from "@/hooks/use-customers";
import { useDiscounts } from "@/hooks/use-discounts";
import { useInventory } from "@/hooks/use-inventory";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { unitLabel } from "@/lib/craft/groups";
import { materialNeeds, maxJars } from "@/lib/craft/selection";
import { phoneKey } from "@/lib/customers/stats";
import { formatMoney, formatNumber } from "@/lib/format";
import { toMap } from "@/lib/inventory/stock";
import { buildOrder, channelLabels, evaluateDiscount, lineTotal, orderChannels, orderTotals, type DraftLine, type OrderChannel } from "@/lib/orders/create";
import { providerLabels, SHIPPING_FEE, shippingLabels, statusMeta } from "@/lib/orders/labels";
import type { PaymentPlan, PaymentProvider, ShippingMethod } from "@/lib/orders/types";
import { fold } from "@/lib/search";
import { brand } from "@/theme";

const STAFF = "Admin 2510";
// Xưởng làm theo đơn 2–3 ngày
const DEFAULT_READY_DAYS = 3;

type Values = {
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  channel: OrderChannel;
  lines: DraftLine[];
  shippingMethod: ShippingMethod;
  readyDate: Dayjs;
  discountCode?: string;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentProvider;
  received: boolean;
  transactionId?: string;
  note?: string;
  internalNote?: string;
};

type Props = { open: boolean; customerId?: string; onClose: () => void; onCreated: (orderId: string) => void };

// Tạo đơn tại BO cho khách đặt qua điện thoại / Zalo / tại cửa hàng. Mount lại mỗi lần mở (key) nên form luôn mới.
// Màn rộng: form bên trái, tóm tắt đơn dính bên phải. Nến tự phối cấu hình theo các bước Thủ công (nguyên liệu trong Kho).
export function OrderCreateDrawer({ open, customerId, onClose, onCreated }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const wide = !!screens.xl;
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<Values>();
  const [dirty, setDirty] = useState(false);
  // Đang cấu hình nến tự phối: index dòng đang sửa, hoặc "new" khi thêm mới
  const [crafting, setCrafting] = useState<number | "new" | null>(null);
  const orders = useOrders();
  const { products } = useProducts();
  const { discounts, patch: patchDiscount } = useDiscounts();
  const customers = useCustomers();
  // Web dùng bản Thủ công đã lưu; tồn kho lấy trực tiếp từ Kho
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const map = useMemo(() => toMap(materials), [materials]);

  // Khách chọn sẵn (vd mở từ hồ sơ khách): điền tên, SĐT, email, địa chỉ giao gần nhất
  const fromCustomer = (id?: string) => {
    const c = customers.customers.find((x) => x.id === id);
    if (!c) return {};
    const last = orders.orders.find((o) => phoneKey(o.customer.phone) === phoneKey(c.phone));
    return { name: c.name, phone: c.phone, email: c.email, address: last?.shippingAddress ?? "" };
  };

  const initialValues = useMemo<Partial<Values>>(
    () => ({
      customerId,
      ...fromCustomer(customerId),
      channel: "phone",
      lines: [],
      shippingMethod: "standard",
      readyDate: dayjs().add(DEFAULT_READY_DAYS, "day"),
      paymentPlan: "deposit",
      paymentMethod: "cod",
      received: false,
    }),
    // Chỉ tính một lần khi mount — dữ liệu khách đã tải xong trước khi mở drawer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const requestClose = () => {
    if (!dirty) return onClose();
    modal.confirm({
      title: "Bỏ đơn đang tạo?",
      content: "Thông tin bạn vừa nhập sẽ không được lưu.",
      okText: "Bỏ đơn",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục nhập",
      onOk: onClose,
    });
  };

  // preserve: lấy cả trường không có ô nhập (loại dòng, tên / ảnh / giá / cấu hình) — thiếu thì dòng nào cũng thành "tự phối"
  const v = (Form.useWatch([], { form, preserve: true }) ?? initialValues) as Partial<Values>;
  const lines = (v.lines ?? []).filter(Boolean);
  const phone = phoneKey(v.phone ?? "");
  const profile = phone.length >= 9 ? customers.customers.find((c) => phoneKey(c.phone) === phone) : undefined;
  const previous = phone ? orders.orders.filter((o) => phoneKey(o.customer.phone) === phone) : [];
  const shipping = v.shippingMethod ?? "standard";
  const discount = evaluateDiscount(v.discountCode, discounts, lines, SHIPPING_FEE[shipping], previous);
  const totals = orderTotals(lines, shipping, v.paymentPlan ?? "deposit", discount.amount);

  // Nguyên liệu cho cả đơn (mọi dòng tự phối × số lượng) — báo thiếu khi nhiều dòng dùng chung một nguyên liệu
  const needs = new Map<string, number>();
  for (const l of lines)
    if (l.kind === "custom" && l.craft) for (const [id, n] of materialNeeds(config, l.craft, map)) needs.set(id, (needs.get(id) ?? 0) + n * (l.quantity ?? 1));
  const shortages = [...needs].map(([id, need]) => ({ m: map.get(id)!, need })).filter(({ m, need }) => m && m.stock < need);

  const setLine = (index: number | "new", candle: CustomCandle) => {
    const current = (form.getFieldValue("lines") ?? []) as DraftLine[];
    const line: DraftLine = { kind: "custom", name: "Nến tự phối", craft: candle.selection, custom: candle.description, price: candle.price, quantity: index === "new" ? 1 : (current[index]?.quantity ?? 1) };
    form.setFieldValue("lines", index === "new" ? [...current, line] : current.map((l, i) => (i === index ? line : l)));
    setDirty(true);
    setCrafting(null);
  };

  const create = (values: Values) => {
    const order = buildOrder(
      {
        customer: { name: values.name, phone: values.phone, email: values.email ?? "" },
        shippingAddress: values.address,
        shippingMethod: values.shippingMethod,
        lines: values.lines,
        discount,
        paymentPlan: values.paymentPlan,
        paymentMethod: values.paymentMethod,
        received: values.received,
        transactionId: values.transactionId,
        readyDate: values.readyDate.format("YYYY-MM-DD"),
        channel: values.channel,
        note: values.note,
        internalNote: values.internalNote,
        by: STAFF,
      },
      orders.orders,
    );
    orders.create(order);
    // Khách chưa có hồ sơ (gộp theo SĐT) thì tạo hồ sơ khách vãng lai
    if (!profile)
      customers.add({
        id: `cus-${order.id.replace("ord-", "")}`,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        hasAccount: false,
        newsletter: false,
        tags: [],
        blocked: false,
        createdAt: order.createdAt,
      });
    if (discount.discount) patchDiscount(discount.discount.id, { used: discount.discount.used + 1 });
    message.success(`Đã tạo đơn ${order.code}${profile ? "" : " · thêm khách mới"}`);
    onCreated(order.id);
  };

  const finish = (validated: Values) => {
    // onFinish chỉ trả trường có ô nhập — lấy đủ cả loại dòng, tên / ảnh / giá / cấu hình
    const all = form.getFieldsValue(true) as Values;
    const values = { ...all, ...validated, lines: all.lines ?? [] };
    if (!values.lines.length) return message.error("Thêm ít nhất một sản phẩm.");
    if (discount.error) return message.error(`Mã giảm giá: ${discount.error}`);
    if (shortages.length) return message.error(`Kho không đủ ${shortages.map(({ m }) => m.name).join(", ")} — giảm số lượng hoặc đổi cấu hình.`);
    if (!profile?.blocked) return create(values);
    modal.confirm({
      title: `${profile.name} đang bị chặn đặt hàng`,
      content: profile.blockReason ? `Lý do: ${profile.blockReason}` : "Vẫn tạo đơn cho khách này?",
      okText: "Vẫn tạo đơn",
      okButtonProps: { danger: true },
      cancelText: "Xem lại",
      onOk: () => create(values),
    });
  };

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

  const summary = (
    <aside className="order-summary" aria-label="Tóm tắt đơn">
      <Typography.Title level={5} style={{ margin: 0 }}>
        Tóm tắt đơn
      </Typography.Title>
      {lines.length ? (
        <Flex vertical gap={6} style={{ margin: "12px 0" }} role="list">
          {lines.map((l, i) => (
            <Flex key={i} role="listitem" justify="space-between" gap={12} style={{ fontSize: 13 }}>
              <Typography.Text ellipsis style={{ fontSize: 13, minWidth: 0 }}>
                {l.kind === "custom" ? "Nến tự phối" : (l.name ?? "Chưa chọn sản phẩm")} × {l.quantity ?? 0}
              </Typography.Text>
              <Typography.Text className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                {formatMoney(lineTotal(l))}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: "12px 0", fontSize: 13 }}>
          Chưa có sản phẩm.
        </Typography.Paragraph>
      )}
      <div className="order-summary-rows">
        {[
          ["Tạm tính", formatMoney(totals.subtotal)],
          [discount.discount ? `Giảm giá (${discount.discount.code})` : "Giảm giá", totals.discount ? `−${formatMoney(totals.discount)}` : "—"],
          ["Phí giao", totals.shippingFee ? formatMoney(totals.shippingFee) : "Miễn phí"],
        ].map(([label, value]) => (
          <Flex key={label} justify="space-between" style={{ padding: "3px 0" }}>
            <Typography.Text type="secondary">{label}</Typography.Text>
            <Typography.Text className="tabular">{value}</Typography.Text>
          </Flex>
        ))}
        <Flex justify="space-between" align="baseline" style={{ padding: "8px 0 4px", borderTop: "1px solid #eee5da", marginTop: 6 }}>
          <Typography.Text strong>Tổng</Typography.Text>
          <Typography.Text strong className="tabular" style={{ fontSize: 20 }}>
            {formatMoney(totals.total)}
          </Typography.Text>
        </Flex>
        <Flex justify="space-between" style={{ padding: "3px 0" }}>
          <Typography.Text type="secondary">{v.paymentPlan === "full" ? "Thu khi đặt" : "Cọc 50% khi đặt"}</Typography.Text>
          <Typography.Text className="tabular">{formatMoney(totals.dueNow)}</Typography.Text>
        </Flex>
        {totals.total > totals.dueNow && (
          <Flex justify="space-between" style={{ padding: "3px 0" }}>
            <Typography.Text type="secondary">Thu nốt khi giao</Typography.Text>
            <Typography.Text className="tabular">{formatMoney(totals.total - totals.dueNow)}</Typography.Text>
          </Flex>
        )}
      </div>
      <Flex align="center" gap={8} style={{ marginTop: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Trạng thái khi tạo:
        </Typography.Text>
        <Tag color={statusMeta[v.received ? "paid" : "pending"].color} style={{ marginInlineEnd: 0 }}>
          {statusMeta[v.received ? "paid" : "pending"].label}
        </Tag>
      </Flex>
      {shortages.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 12 }}
          title="Kho không đủ nguyên liệu"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {shortages.map(({ m, need }) => (
                <li key={m.id}>
                  {m.name}: cần {formatNumber(need)}, còn {formatNumber(m.stock)} {unitLabel[m.unit]}
                </li>
              ))}
            </ul>
          }
        />
      )}
    </aside>
  );

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title="Tạo đơn hàng"
      size={wide ? 1120 : screens.sm === false ? "100%" : 760}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={12} align="center" wrap>
          {/* Màn rộng đã có tóm tắt bên phải — chân drawer chỉ còn nút */}
          {!wide && (
            <Flex vertical style={{ marginRight: "auto" }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Tổng đơn
              </Typography.Text>
              <Typography.Text strong className="tabular" style={{ fontSize: 18 }}>
                {formatMoney(totals.total)}
              </Typography.Text>
            </Flex>
          )}
          <Button onClick={requestClose} style={wide ? { marginLeft: "auto" } : undefined}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            Tạo đơn · {formatMoney(totals.total)}
          </Button>
        </Flex>
      }
    >
      {ready ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={finish}
          onValuesChange={() => setDirty(true)}
          scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
        >
          <Row gutter={16} align="top">
            <Col span={wide ? 15 : 24}>
              <Flex vertical gap={16}>
                <FormSection title="Khách hàng" description="Chọn khách đã có để điền nhanh, hoặc nhập khách mới — hồ sơ khách gộp theo số điện thoại.">
                  <Form.Item name="customerId" label="Khách đã có">
                    <Select
                      allowClear
                      showSearch
                      placeholder="Tìm theo tên hoặc số điện thoại…"
                      filterOption={(input, o) => fold((o as { search?: string })?.search ?? "").includes(fold(input.trim()))}
                      options={customers.customers.map((c) => ({ value: c.id, search: `${c.name} ${c.phone} ${phoneKey(c.phone)}`, label: `${c.name} · ${c.phone}` }))}
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
                    <Col xs={24} sm={12}>
                      <Form.Item name="channel" label="Khách đặt qua">
                        <Select options={orderChannels.map((c) => ({ value: c, label: channelLabels[c] }))} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="address" label="Địa chỉ giao" rules={[{ required: true, whitespace: true, message: "Nhập địa chỉ giao." }]} style={{ marginBottom: profile || phone.length >= 9 ? 12 : 0 }}>
                    <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} maxLength={200} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
                  </Form.Item>
                  {profile?.blocked ? (
                    <Alert type="error" showIcon title={`${profile.name} đang bị chặn đặt hàng`} description={profile.blockReason} />
                  ) : profile ? (
                    <Alert type="info" showIcon title={`Số này thuộc hồ sơ ${profile.name} · ${previous.filter((o) => o.status !== "cancelled").length} đơn trước`} />
                  ) : phone.length >= 9 ? (
                    <Alert type="success" showIcon title="Khách mới — tạo hồ sơ khách khi tạo đơn." />
                  ) : null}
                </FormSection>

                <FormSection title="Sản phẩm" description="Nến có sẵn lấy giá theo trang Sản phẩm. Nến tự phối chọn theo các bước Thủ công — nguyên liệu lấy từ Kho, giá tự tính.">
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
                                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setCrafting(field.name)} style={{ padding: 0, height: "auto", alignSelf: "flex-start" }}>
                                      Sửa cấu hình
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Form.Item name={[field.name, "productId"]} rules={[{ required: true, message: "Chọn sản phẩm." }]} style={{ marginBottom: 0 }}>
                                      <Select
                                        showSearch
                                        placeholder="Tìm nến có sẵn…"
                                        aria-label="Chọn sản phẩm"
                                        filterOption={(input, o) => fold((o as { search?: string })?.search ?? "").includes(fold(input.trim()))}
                                        options={productOptions}
                                        onChange={(id: string) => {
                                          const p = products.find((x) => x.id === id);
                                          if (p) form.setFieldValue(["lines", field.name], { ...line, productId: id, name: p.name, image: p.images[0], price: p.salePrice ?? p.price });
                                        }}
                                      />
                                    </Form.Item>
                                  </>
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
                          <Button icon={<ExperimentOutlined />} onClick={() => setCrafting("new")}>
                            Tự phối nến
                          </Button>
                        </Flex>
                      </Flex>
                    )}
                  </Form.List>
                </FormSection>

                <FormSection title="Giao hàng">
                  <Row gutter={16}>
                    <Col xs={24} sm={13}>
                      {/* Radio dọc: nhãn dài (kèm phí) — dạng nút sẽ xuống dòng lệch nhau */}
                      <Form.Item name="shippingMethod" label="Phương thức">
                        <Radio.Group
                          style={{ display: "flex", flexDirection: "column", gap: 8 }}
                          options={(Object.keys(shippingLabels) as ShippingMethod[]).map((m) => ({
                            value: m,
                            label: (
                              <span>
                                {shippingLabels[m]}{" "}
                                <Typography.Text type="secondary" className="tabular">
                                  · {SHIPPING_FEE[m] ? formatMoney(SHIPPING_FEE[m]) : "miễn phí"}
                                </Typography.Text>
                              </span>
                            ),
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={11}>
                      <Form.Item name="readyDate" label="Ngày xưởng làm xong" rules={[{ required: true, message: "Chọn ngày." }]} extra="Xưởng làm theo đơn 2–3 ngày." style={{ marginBottom: 0 }}>
                        <DatePicker format="DD/MM/YYYY" allowClear={false} disabledDate={(d) => d.isBefore(dayjs(), "day")} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </FormSection>

                <FormSection title="Thanh toán">
                  {/* Có dòng báo thì antd bù lề âm cho ô — dùng padding (lề sẽ bị gộp mất) để giữ khoảng cách với "Hình thức" */}
                  <div style={discount.error || discount.discount ? { paddingBottom: 16 } : undefined}>
                    <Form.Item
                      name="discountCode"
                      label="Mã giảm giá"
                      normalize={(s?: string) => s?.toUpperCase().replace(/\s/g, "")}
                      validateStatus={discount.error ? "error" : discount.discount ? "success" : undefined}
                      help={discount.error ?? (discount.discount ? `Giảm ${formatMoney(discount.amount)} · ${discount.discount.description ?? discount.discount.code}` : undefined)}
                    >
                      <Input allowClear maxLength={30} placeholder="Không bắt buộc" style={{ maxWidth: 260 }} />
                    </Form.Item>
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} sm={9}>
                      <Form.Item name="paymentPlan" label="Hình thức">
                        <Radio.Group
                          optionType="button"
                          options={[
                            { value: "deposit", label: "Cọc 50%" },
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
                        Bật nếu khách đã chuyển {formatMoney(totals.dueNow)} — đơn chuyển sang “Đã thanh toán”. Tắt thì đơn chờ thanh toán.
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
                </FormSection>

                <FormSection title="Ghi chú">
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="note" label="Ghi chú của khách" style={{ marginBottom: screens.md ? 0 : undefined }}>
                        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={300} placeholder="VD: Gói quà, giao giờ hành chính…" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="internalNote" label="Ghi chú nội bộ" style={{ marginBottom: 0 }}>
                        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={300} placeholder="Chỉ shop thấy" />
                      </Form.Item>
                    </Col>
                  </Row>
                </FormSection>

                {!wide && summary}
              </Flex>
            </Col>
            {wide && (
              <Col span={9} style={{ position: "sticky", top: 0 }}>
                {summary}
              </Col>
            )}
          </Row>
        </Form>
      ) : (
        <DrawerFormSkeleton />
      )}

      {crafting !== null && (
        <CustomCandleModal
          open
          config={config}
          map={map}
          initial={crafting === "new" ? undefined : (form.getFieldValue(["lines", crafting]) as DraftLine | undefined)?.craft}
          onCancel={() => setCrafting(null)}
          onApply={(candle) => setLine(crafting, candle)}
        />
      )}
    </Drawer>
  );
}
