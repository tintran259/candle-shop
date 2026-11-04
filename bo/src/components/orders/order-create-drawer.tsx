import { DeleteOutlined, EditOutlined, ExperimentOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Avatar, Button, Col, Drawer, Flex, Form, Grid, Input, InputNumber, Radio, Row, Segmented, Select, Switch, Tag, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useDeferredValue, useMemo, useState } from "react";
import { FormSection } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import { CustomCandleModal, type CustomCandle } from "@/components/orders/custom-candle-modal";
import { ItemThumb } from "@/components/orders/order-view";
import { CapacityDatePicker, CapacityHint } from "@/components/orders/ready-date";
import { DrawerFormSkeleton } from "@/components/skeletons";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useCustomers } from "@/hooks/use-customers";
import { releaseDiscount, useDiscounts } from "@/hooks/use-discounts";
import { getSettings } from "@/hooks/use-settings";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useStockHold } from "@/hooks/use-stock-hold";
import { useWorkshop } from "@/hooks/use-workshop";
import { candleCount } from "@/lib/capacity";
import { unitLabel } from "@/lib/craft/groups";
import { materialNeeds, maxJars } from "@/lib/craft/selection";
import { phoneKey } from "@/lib/customers/stats";
import { formatMoney, formatNumber } from "@/lib/format";
import { linesNeeds, shortages } from "@/lib/orders/materials";
import { itemsEditable } from "@/lib/orders/edit";
import { failedDeliveries, paidAmount } from "@/lib/orders/labels";
import { buildOrder, channelLabels, evaluateDiscount, lineTotal, orderChannels, orderTotals, toLines, type DraftLine, type OrderChannel } from "@/lib/orders/create";
import { providerLabels, statusMeta } from "@/lib/orders/labels";
import type { Order, PaymentPlan, PaymentProvider, ShippingMethod } from "@/lib/orders/types";
import { shippingOptionLabel } from "@/lib/settings/types";
import { fold } from "@/lib/search";
import { brand } from "@/theme";

const STAFF = "Admin 2510";

// Hồ sơ khách vãng lai cho số điện thoại chưa có hồ sơ (sửa đơn đổi sang số mới)
const guestProfile = (v: { name: string; phone: string; email?: string }) => ({
  id: `cus-${Date.now().toString(36)}`,
  name: v.name.trim(),
  phone: v.phone.trim(),
  email: v.email ?? "",
  hasAccount: false,
  newsletter: false,
  tags: [],
  blocked: false,
  createdAt: new Date().toISOString(),
});

type Values = {
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  channel: OrderChannel;
  lines: DraftLine[];
  shippingMethod: ShippingMethod;
  shippingFee?: number;
  readyDate: Dayjs;
  discountCode?: string;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentProvider;
  received: boolean;
  transactionId?: string;
  note?: string;
  internalNote?: string;
};

// order: sửa đơn có sẵn (docs/pages/orders.md#sửa-đơn); không có = tạo đơn mới
type Props = { open: boolean; customerId?: string; order?: Order; onClose: () => void; onCreated?: (orderId: string) => void };

// Tạo đơn tại BO cho khách đặt qua điện thoại / Zalo / tại cửa hàng, và sửa đơn sau khi tạo. Mount lại mỗi lần mở (key) nên form luôn mới.
// Màn rộng: form bên trái, tóm tắt đơn dính bên phải. Nến tự phối cấu hình theo các bước Thủ công (nguyên liệu trong Kho).
export function OrderCreateDrawer({ open, customerId, order, onClose, onCreated }: Props) {
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
  const editing = !!order;
  // Đã Bắt đầu làm: nguyên liệu đã trừ Kho, không đổi sản phẩm được nữa
  const lockItems = !!order && !itemsEditable(order.status);
  // Web dùng bản Thủ công đã lưu; tồn kho là số còn dùng được, đã trừ phần các đơn khác đang giữ
  const { config } = useCraftConfig();
  const { available: map, source } = useStockHold(order?.id);
  const workshop = useWorkshop(order?.id);
  // Lấy một lần lúc mở — đơn đang tạo không đổi theo Cài đặt
  const [settings] = useState(getSettings);
  // Sửa đơn: giữ được phương thức của đơn dù đã tắt trong Cài đặt
  const shippingOptions = settings.shippingOptions.filter((o) => o.enabled || o.id === order?.shippingMethod);

  // Khách chọn sẵn (vd mở từ hồ sơ khách): điền tên, SĐT, email, địa chỉ giao gần nhất
  const fromCustomer = (id?: string) => {
    const c = customers.customers.find((x) => x.id === id);
    if (!c) return {};
    const last = orders.orders.find((o) => phoneKey(o.customer.phone) === phoneKey(c.phone));
    return { name: c.name, phone: c.phone, email: c.email, address: last?.shippingAddress ?? "" };
  };

  const initialValues = useMemo<Partial<Values>>(
    () =>
      order
        ? {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
            address: order.shippingAddress,
            lines: toLines(order.items),
            shippingMethod: order.shippingMethod,
            shippingFee: order.shippingFee,
            readyDate: dayjs(order.readyDate),
            discountCode: order.discountCode,
            paymentPlan: order.paymentPlan,
            paymentMethod: order.paymentMethod,
            note: order.note,
            internalNote: order.internalNote,
          }
        : {
            customerId,
            ...fromCustomer(customerId),
            channel: "phone",
            lines: [],
            shippingMethod: shippingOptions[0]?.id,
            shippingFee: shippingOptions[0]?.fee ?? 0,
            // Ngày sớm nhất còn chỗ từ hôm nay + số ngày làm tối thiểu (Cài đặt › Xưởng)
            readyDate: dayjs(workshop.suggest(0)),
            paymentPlan: "deposit",
            paymentMethod: "cod",
            received: false,
          },
    // Chỉ tính một lần khi mount — dữ liệu khách đã tải xong trước khi mở drawer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const requestClose = () => {
    if (!dirty) return onClose();
    modal.confirm({
      title: editing ? "Bỏ các thay đổi?" : "Bỏ đơn đang tạo?",
      content: "Thông tin bạn vừa nhập sẽ không được lưu.",
      okText: editing ? "Bỏ thay đổi" : "Bỏ đơn",
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
  const previous = phone ? orders.orders.filter((o) => o.id !== order?.id && phoneKey(o.customer.phone) === phone) : [];
  const shippingFee = Math.max(0, Number(v.shippingFee) || 0);
  // Sửa đơn giữ mã cũ: mã đã hợp lệ lúc đặt nên bỏ qua hạn dùng và số lượt (đơn này đã tính một lượt), chỉ kiểm tra lại đơn tối thiểu và phạm vi
  const pool = useMemo(
    () =>
      order?.discountCode
        ? discounts.map((d) => (d.code === order.discountCode ? { ...d, active: true, startsAt: "2000-01-01", endsAt: undefined, usageLimit: undefined, perCustomerLimit: undefined, firstOrderOnly: false } : d))
        : discounts,
    [discounts, order],
  );
  const discount = lockItems ? { amount: order!.discount } : evaluateDiscount(v.discountCode, pool, lines, shippingFee, previous);
  const totals = orderTotals(lines, shippingFee, v.paymentPlan ?? "deposit", discount.amount, order?.depositPercent ?? settings.depositPercent);
  const paid = order ? paidAmount(order) : 0;
  const candles = candleCount(lines);

  // Nguyên liệu cho cả đơn — báo thiếu khi nhiều dòng dùng chung một nguyên liệu. Đã trừ Kho thì không kiểm tra lại
  const shortage = lockItems ? [] : shortages(linesNeeds(lines, { ...source, map }), map);

  const setLine = (index: number | "new", candle: CustomCandle) => {
    const current = (form.getFieldValue("lines") ?? []) as DraftLine[];
    const line: DraftLine = { kind: "custom", name: "Nến tự phối", craft: candle.selection, recipe: candle.recipe, custom: candle.description, price: candle.price, quantity: index === "new" ? 1 : (current[index]?.quantity ?? 1) };
    form.setFieldValue("lines", index === "new" ? [...current, line] : current.map((l, i) => (i === index ? line : l)));
    setDirty(true);
    setCrafting(null);
  };

  const create = (values: Values) => {
    const order = buildOrder(
      {
        customer: { name: values.name, phone: values.phone, email: values.email ?? "" },
        shippingAddress: values.address,
        shipping: shippingOptions.find((o) => o.id === values.shippingMethod) ?? shippingOptions[0],
        shippingFee,
        depositPercent: settings.depositPercent,
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
    onCreated?.(order.id);
  };

  // Lưu sửa đơn: mã giảm giá đổi thì trả lượt mã cũ, tính lượt mã mới
  const saveEdit = (values: Values) => {
    if (!order) return;
    const changes = orders.edit(order.id, {
      customer: { name: values.name, phone: values.phone, email: values.email ?? "" },
      shippingAddress: values.address,
      shipping: shippingOptions.find((o) => o.id === values.shippingMethod),
      shippingFee,
      readyDate: values.readyDate.format("YYYY-MM-DD"),
      lines: lockItems ? undefined : values.lines,
      discount: lockItems ? undefined : discount,
      note: values.note,
      internalNote: values.internalNote,
    });
    const before = order.discountCode;
    const after = lockItems ? before : discount.discount?.code;
    if (changes.length && before !== after) {
      if (before) releaseDiscount(before);
      if (!lockItems && discount.discount) patchDiscount(discount.discount.id, { used: discount.discount.used + 1 });
    }
    // Đổi sang số điện thoại chưa có hồ sơ: tạo hồ sơ khách vãng lai như lúc tạo đơn
    if (changes.length && !profile) customers.add(guestProfile(values));
    if (changes.length) message.success(`Đã lưu ${changes.length} thay đổi của đơn ${order.code}`);
    else message.info("Không có thay đổi nào.");
    onClose();
  };

  const finish = (validated: Values) => {
    // onFinish chỉ trả trường có ô nhập — lấy đủ cả loại dòng, tên / ảnh / giá / cấu hình
    const all = form.getFieldsValue(true) as Values;
    const values = { ...all, ...validated, lines: all.lines ?? [] };
    if (!lockItems && !values.lines.length) return message.error("Thêm ít nhất một sản phẩm.");
    if (discount.error) return message.error(`Mã giảm giá: ${discount.error}`);
    if (shortage.length) return message.error(`Kho không đủ ${shortage.map(({ m }) => m.name).join(", ")} — giảm số lượng hoặc đổi cấu hình.`);
    if (editing) return saveEdit(values);
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
          [discount.discount ? `Giảm giá (${discount.discount.code})` : lockItems && order?.discountCode ? `Giảm giá (${order.discountCode})` : "Giảm giá", totals.discount ? `−${formatMoney(totals.discount)}` : "—"],
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
        {editing ? (
          <>
            <Flex justify="space-between" style={{ padding: "3px 0" }}>
              <Typography.Text type="secondary">Đã thu</Typography.Text>
              <Typography.Text className="tabular">{formatMoney(paid)}</Typography.Text>
            </Flex>
            {paid > totals.total ? (
              <Flex justify="space-between" style={{ padding: "3px 0" }}>
                <Typography.Text type="warning">Thu dư, cần hoàn</Typography.Text>
                <Typography.Text type="warning" strong className="tabular">
                  {formatMoney(paid - totals.total)}
                </Typography.Text>
              </Flex>
            ) : (
              <Flex justify="space-between" style={{ padding: "3px 0" }}>
                <Typography.Text type="secondary">Còn phải thu</Typography.Text>
                <Typography.Text className="tabular">{formatMoney(totals.total - paid)}</Typography.Text>
              </Flex>
            )}
          </>
        ) : (
          <>
            <Flex justify="space-between" style={{ padding: "3px 0" }}>
              <Typography.Text type="secondary">{v.paymentPlan === "full" ? "Thu khi đặt" : `Cọc ${settings.depositPercent}% khi đặt`}</Typography.Text>
              <Typography.Text className="tabular">{formatMoney(totals.dueNow)}</Typography.Text>
            </Flex>
            {totals.total > totals.dueNow && (
              <Flex justify="space-between" style={{ padding: "3px 0" }}>
                <Typography.Text type="secondary">Thu nốt khi giao</Typography.Text>
                <Typography.Text className="tabular">{formatMoney(totals.total - totals.dueNow)}</Typography.Text>
              </Flex>
            )}
          </>
        )}
      </div>
      {!editing && (
        <Flex align="center" gap={8} style={{ marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Trạng thái khi tạo:
          </Typography.Text>
          <Tag color={statusMeta[v.received ? "paid" : "pending"].color} style={{ marginInlineEnd: 0 }}>
            {statusMeta[v.received ? "paid" : "pending"].label}
          </Tag>
        </Flex>
      )}
      {shortage.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 12 }}
          title="Kho không đủ nguyên liệu"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {shortage.map(({ m, need }) => (
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
      title={order ? `Sửa đơn ${order.code}` : "Tạo đơn hàng"}
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
            {editing ? "Lưu thay đổi" : "Tạo đơn"} · {formatMoney(totals.total)}
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
                    <Alert type="info" showIcon title={`Số này thuộc hồ sơ ${profile.name} · ${previous.filter((o) => o.status !== "cancelled").length} đơn trước${failedDeliveries(previous) ? ` · ${failedDeliveries(previous)} lần giao không thành` : ""}`} />
                  ) : phone.length >= 9 ? (
                    <Alert type="success" showIcon title={`Khách mới — tạo hồ sơ khách khi ${editing ? "lưu" : "tạo đơn"}.`} />
                  ) : null}
                </FormSection>

                <FormSection title="Sản phẩm" description="Nến có sẵn lấy giá theo trang Sản phẩm. Nến tự phối chọn theo các bước Thủ công — nguyên liệu lấy từ Kho, giá tự tính.">
                  {lockItems && order ? (
                    <LockedItems order={order} />
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
                  )}
                </FormSection>

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
                      <Form.Item name="shippingFee" label="Phí vận chuyển" extra="Tự điền theo phương thức, sửa được cho đơn này.">
                        <MoneyInput aria-label="Phí vận chuyển" />
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
                            date={v.readyDate}
                            candles={candles}
                            onPick={(d) => {
                              form.setFieldValue("readyDate", d);
                              setDirty(true);
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

                <FormSection title="Thanh toán" description={editing ? "Các khoản đã thu giữ nguyên. Thu thêm khi giao; thu dư thì ghi nhận hoàn ở khối Thanh toán của đơn." : undefined}>
                  {/* Có dòng báo thì antd bù lề âm cho ô — dùng padding (lề sẽ bị gộp mất) để giữ khoảng cách với "Hình thức" */}
                  {!lockItems && (
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
                  )}
                  {editing ? (
                    <Typography.Text type="secondary">
                      {order!.paymentPlan === "deposit" ? `Cọc ${order!.depositPercent ?? 50}%` : "Trả đủ"} · {providerLabels[order!.paymentMethod]} · đã thu {formatMoney(paid)}
                    </Typography.Text>
                  ) : (
                  <>
                    <Row gutter={16}>
                      <Col xs={24} sm={9}>
                        <Form.Item name="paymentPlan" label="Hình thức">
                          <Radio.Group
                            optionType="button"
                            options={[
                              { value: "deposit", label: `Cọc ${settings.depositPercent}%` },
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
                  </>
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
