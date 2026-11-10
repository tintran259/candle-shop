import { App, Col, Drawer, Flex, Form, Grid, Row } from "antd";
import dayjs from "dayjs";
import { useDeferredValue, useMemo, useState } from "react";
import { CustomCandleModal, type CustomCandle } from "@/components/orders/custom-candle-modal";
import { CustomerFields } from "@/components/orders/order-form/customer-fields";
import { DraftAlerts } from "@/components/orders/order-form/draft-alerts";
import { NoteFields, OrderFormFooter } from "@/components/orders/order-form/footer";
import { LineFields } from "@/components/orders/order-form/line-fields";
import { fromOrder, type OrderFormValues } from "@/components/orders/order-form/model";
import { OrderSummary } from "@/components/orders/order-form/order-summary";
import { PaymentFields } from "@/components/orders/order-form/payment-fields";
import { ShippingFields } from "@/components/orders/order-form/shipping-fields";
import { useOrderFormDraft } from "@/components/orders/order-form/use-draft";
import { useOrderSubmit } from "@/components/orders/order-form/use-submit";
import { DrawerFormSkeleton } from "@/components/skeletons";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useCustomers } from "@/hooks/use-customers";
import { useDiscounts } from "@/hooks/use-discounts";
import { draftHasContent } from "@/hooks/use-order-draft";
import { getSettings } from "@/hooks/use-settings";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useStockHold } from "@/hooks/use-stock-hold";
import { useWorkshop } from "@/hooks/use-workshop";
import { candleCount } from "@/lib/capacity";
import { discountStatus } from "@/lib/discounts/labels";
import { needsCost } from "@/lib/costs";
import { belowCost, lowMargin } from "@/lib/craft/pricing";
import { phoneKey } from "@/lib/customers/stats";
import { linesNeeds, shortages } from "@/lib/orders/materials";
import { itemsEditable } from "@/lib/orders/edit";
import { paidAmount } from "@/lib/orders/labels";
import { evaluateDiscount, goodsCheck, orderTotals, type DraftLine } from "@/lib/orders/create";
import type { Order } from "@/lib/orders/types";

// order: sửa đơn có sẵn (docs/pages/orders.md#sửa-đơn); không có = tạo đơn mới
type Props = { open: boolean; customerId?: string; order?: Order; onClose: () => void; onCreated?: (orderId: string) => void };

// Tạo đơn tại BO cho khách đặt qua điện thoại / Zalo / tại cửa hàng, và sửa đơn sau khi tạo. Mount lại mỗi lần mở (key) nên form luôn mới.
// Màn rộng: form bên trái, tóm tắt đơn dính bên phải. Nến tự phối cấu hình theo các bước Thủ công (nguyên liệu trong Kho).
export function OrderCreateDrawer({ open, customerId, order, onClose, onCreated }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const wide = !!screens.xl;
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<OrderFormValues>();
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
  // Đơn vị vận chuyển đang dùng (Cài đặt); đơn vị của đơn đang sửa vẫn giữ dù đã tắt
  const carriers = (settings.carriers ?? []).filter((c) => c.enabled || c.id === order?.carrier?.id || c.id === order?.shipment?.carrierId);

  // Khách chọn sẵn (vd mở từ hồ sơ khách): điền tên, SĐT, email, địa chỉ giao gần nhất
  const fromCustomer = (id?: string) => {
    const c = customers.customers.find((x) => x.id === id);
    if (!c) return {};
    const last = orders.orders.find((o) => phoneKey(o.customer.phone) === phoneKey(c.phone));
    return { name: c.name, phone: c.phone, email: c.email, address: last?.shippingAddress ?? "" };
  };

  const freshValues = (): Partial<OrderFormValues> => ({
    customerId,
    ...fromCustomer(customerId),
    channel: "phone",
    lines: [],
    shippingMethod: shippingOptions[0]?.id,
    carrierId: carriers[0]?.id,
    shippingFee: shippingOptions[0]?.fee ?? 0,
    // Ngày sớm nhất còn chỗ từ hôm nay + số ngày làm tối thiểu (Cài đặt › Xưởng)
    readyDate: dayjs(workshop.suggest(0)),
    paymentPlan: "deposit",
    depositPercent: settings.depositPercent,
    paymentMethod: "cod",
    received: false,
  });

  // preserve: lấy cả trường không có ô nhập (loại dòng, tên / ảnh / giá / cấu hình) — thiếu thì dòng nào cũng thành "tự phối"
  const watched = Form.useWatch([], { form, preserve: true });
  const draft = useOrderFormDraft({ form, editing, customerId, products, suggestDate: () => workshop.suggest(0), fresh: freshValues, dirty, setDirty, watched, onClose });

  const initialValues = useMemo<Partial<OrderFormValues>>(
    () => (order ? fromOrder(order) : { ...freshValues(), ...(draft.restored ? draft.fromDraft(draft.restored) : {}) }),
    // Chỉ tính một lần khi mount — dữ liệu khách đã tải xong trước khi mở drawer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const requestClose = () => {
    // Tạo đơn: đóng là giữ nháp, mở lại Tạo đơn hàng làm tiếp
    if (!editing) {
      if (dirty && draftHasContent(form.getFieldsValue(true))) message.info("Đã lưu nháp đơn — bấm Tiếp tục đơn nháp để làm tiếp.");
      return onClose();
    }
    if (!dirty) return onClose();
    modal.confirm({
      title: "Bỏ các thay đổi?",
      content: "Thông tin bạn vừa nhập sẽ không được lưu.",
      okText: "Bỏ thay đổi",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục nhập",
      onOk: onClose,
    });
  };

  const v = (watched ?? initialValues) as Partial<OrderFormValues>;
  const lines = (v.lines ?? []).filter(Boolean);
  const phone = phoneKey(v.phone ?? "");
  const profile = phone.length >= 9 ? customers.customers.find((c) => phoneKey(c.phone) === phone) : undefined;
  const previous = phone ? orders.orders.filter((o) => o.id !== order?.id && phoneKey(o.customer.phone) === phone) : [];
  const shippingFee = Math.max(0, Number(v.shippingFee) || 0);
  // Sửa đơn giữ mã cũ: mã đã hợp lệ lúc đặt nên bỏ qua hạn dùng và số lượt (đơn này đã tính một lượt), chỉ kiểm tra lại đơn tối thiểu và phạm vi
  const pool = useMemo(
    () =>
      order?.discountCode
        ? discounts.map((d) =>
            d.code === order.discountCode
              ? { ...d, active: true, startsAt: "2000-01-01", endsAt: undefined, usageLimit: undefined, perCustomerLimit: undefined, firstOrderOnly: false, customerIds: undefined }
              : d,
          )
        : discounts,
    [discounts, order],
  );
  const discount = lockItems ? { amount: order!.discount } : evaluateDiscount(v.discountCode, pool, lines, shippingFee, previous, profile?.id);
  // Mã riêng đang chạy của khách này — gợi ý dưới ô mã khi chưa nhập
  const ownCodes = profile && !lockItems ? discounts.filter((d) => d.customerIds?.includes(profile.id) && discountStatus(d) === "running") : [];
  // % cọc: đơn đã tạo giữ % lúc tạo; đơn mới theo ô % cọc (điền sẵn theo Cài đặt)
  const depositPercent = order?.depositPercent ?? Math.min(99, Math.max(1, Math.round(v.depositPercent ?? settings.depositPercent)));
  const totals = orderTotals(lines, shippingFee, v.paymentPlan ?? "deposit", discount.amount, depositPercent);
  const paid = order ? paidAmount(order) : 0;
  const candles = candleCount(lines);

  // Nguyên liệu cho cả đơn — báo thiếu khi nhiều dòng dùng chung một nguyên liệu. Đã trừ Kho thì không kiểm tra lại
  const needs = linesNeeds(lines, { ...source, map });
  const shortage = lockItems ? [] : shortages(needs, map);
  // Tiền hàng sau giảm giá so với giá vốn nguyên liệu (giá nhập hiện tại) — mã giảm lớn có thể làm đơn lỗ
  const cost = needsCost(needs, map);
  const goods = goodsCheck(totals, cost.cost);
  const goodsWarning = cost.cost > 0 && (belowCost(goods) || lowMargin(goods, settings.minMargin));

  const setLine = (index: number | "new", candle: CustomCandle) => {
    const current = (form.getFieldValue("lines") ?? []) as DraftLine[];
    const line: DraftLine = {
      kind: "custom",
      name: "Nến tự phối",
      craft: candle.selection,
      recipe: candle.recipe,
      custom: candle.description,
      price: candle.price,
      quantity: index === "new" ? 1 : (current[index]?.quantity ?? 1),
    };
    form.setFieldValue("lines", index === "new" ? [...current, line] : current.map((l, i) => (i === index ? line : l)));
    setDirty(true);
    setCrafting(null);
  };

  const finish = useOrderSubmit({
    form,
    order,
    lockItems,
    discount,
    shortage,
    profile,
    shippingOptions,
    carriers,
    shippingFee,
    depositPercent,
    orders,
    customers,
    patchDiscount,
    onClose,
    onCreated,
  });

  const summary = (
    <OrderSummary
      lines={lines}
      totals={totals}
      discount={discount}
      order={order}
      lockItems={lockItems}
      paid={paid}
      paymentPlan={v.paymentPlan}
      received={v.received}
      depositPercent={depositPercent}
      minMargin={settings.minMargin}
      goods={goods}
      goodsWarning={goodsWarning}
      shortage={shortage}
    />
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
        <OrderFormFooter wide={wide} total={totals.total} editing={editing} onClose={requestClose} onDiscard={dirty || draft.restored ? draft.discard : onClose} onSubmit={() => form.submit()} />
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
          <DraftAlerts restored={draft.restored} otherDraft={draft.otherDraft} onStartOver={draft.startOver} onOpenOther={draft.openOther} />
          <Row gutter={16} align="top">
            <Col span={wide ? 15 : 24}>
              <Flex vertical gap={16}>
                <CustomerFields form={form} customers={customers.customers} fromCustomer={fromCustomer} editing={editing} profile={profile} phone={phone} previous={previous} />
                <LineFields form={form} lines={lines} locked={lockItems ? order : undefined} products={products} config={config} map={map} onCraft={setCrafting} />
                <ShippingFields
                  form={form}
                  shippingOptions={shippingOptions}
                  carriers={carriers}
                  order={order}
                  workshop={workshop}
                  readyDate={v.readyDate}
                  candles={candles}
                  onDirty={() => setDirty(true)}
                />
                <PaymentFields
                  form={form}
                  order={order}
                  lockItems={lockItems}
                  discount={discount}
                  ownCodes={ownCodes}
                  paid={paid}
                  dueNow={totals.dueNow}
                  total={totals.total}
                  depositPercent={settings.depositPercent}
                  values={v}
                />
                <NoteFields />
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
