import type { FormInstance } from "antd";
import { App } from "antd";
import { guestProfile, STAFF, type OrderFormValues } from "@/components/orders/order-form/model";
import type { CustomersApi } from "@/hooks/use-customers";
import { releaseDiscount } from "@/hooks/use-discounts";
import { saveOrderDraft } from "@/hooks/use-order-draft";
import type { OrdersApi } from "@/hooks/use-orders";
import type { Customer } from "@/lib/customers/types";
import type { Discount } from "@/lib/discounts/types";
import { buildOrder, type DiscountResult } from "@/lib/orders/create";
import type { shortages } from "@/lib/orders/materials";
import type { Order } from "@/lib/orders/types";
import type { Carrier, ShippingOption } from "@/lib/settings/types";

type Args = {
  form: FormInstance<OrderFormValues>;
  order?: Order;
  lockItems: boolean;
  discount: DiscountResult;
  shortage: ReturnType<typeof shortages>;
  profile?: Customer;
  shippingOptions: ShippingOption[];
  carriers: Carrier[];
  shippingFee: number;
  depositPercent: number;
  orders: OrdersApi;
  customers: CustomersApi;
  patchDiscount: (id: string, patch: Partial<Discount>) => void;
  onClose: () => void;
  onCreated?: (orderId: string) => void;
};

// Tạo đơn mới hoặc lưu sửa đơn sau khi kiểm tra sản phẩm, mã giảm giá, Kho, khách bị chặn
export function useOrderSubmit(a: Args) {
  const { message, modal } = App.useApp();
  const { form, order, lockItems, discount, profile } = a;
  const editing = !!order;

  const create = (values: OrderFormValues) => {
    const created = buildOrder(
      {
        customer: { name: values.name, phone: values.phone, email: values.email ?? "" },
        shippingAddress: values.address,
        shipping: a.shippingOptions.find((o) => o.id === values.shippingMethod) ?? a.shippingOptions[0],
        carrier: a.carriers.find((c) => c.id === values.carrierId),
        shippingFee: a.shippingFee,
        depositPercent: a.depositPercent,
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
      a.orders.orders,
    );
    a.orders.create(created);
    // Khách chưa có hồ sơ (gộp theo SĐT) thì tạo hồ sơ khách vãng lai
    if (!profile)
      a.customers.add({
        id: `cus-${created.id.replace("ord-", "")}`,
        name: created.customer.name,
        phone: created.customer.phone,
        email: created.customer.email,
        hasAccount: false,
        newsletter: false,
        tags: [],
        blocked: false,
        createdAt: created.createdAt,
      });
    if (discount.discount) a.patchDiscount(discount.discount.id, { used: discount.discount.used + 1 });
    saveOrderDraft(null);
    message.success(`Đã tạo đơn ${created.code}${profile ? "" : " · thêm khách mới"}`);
    a.onCreated?.(created.id);
  };

  // Lưu sửa đơn: mã giảm giá đổi thì trả lượt mã cũ, tính lượt mã mới
  const saveEdit = (values: OrderFormValues) => {
    if (!order) return;
    const changes = a.orders.edit(order.id, {
      customer: { name: values.name, phone: values.phone, email: values.email ?? "" },
      shippingAddress: values.address,
      shipping: a.shippingOptions.find((o) => o.id === values.shippingMethod),
      carrier: a.carriers.find((c) => c.id === values.carrierId),
      shippingFee: a.shippingFee,
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
      if (!lockItems && discount.discount) a.patchDiscount(discount.discount.id, { used: discount.discount.used + 1 });
    }
    // Đổi sang số điện thoại chưa có hồ sơ: tạo hồ sơ khách vãng lai như lúc tạo đơn
    if (changes.length && !profile) a.customers.add(guestProfile(values));
    if (changes.length) message.success(`Đã lưu ${changes.length} thay đổi của đơn ${order.code}`);
    else message.info("Không có thay đổi nào.");
    a.onClose();
  };

  return (validated: OrderFormValues) => {
    // onFinish chỉ trả trường có ô nhập — lấy đủ cả loại dòng, tên / ảnh / giá / cấu hình
    const all = form.getFieldsValue(true) as OrderFormValues;
    const values = { ...all, ...validated, lines: all.lines ?? [] };
    if (!lockItems && !values.lines.length) return message.error("Thêm ít nhất một sản phẩm.");
    if (discount.error) return message.error(`Mã giảm giá: ${discount.error}`);
    if (a.shortage.length) return message.error(`Kho không đủ ${a.shortage.map(({ m }) => m.name).join(", ")} — giảm số lượng hoặc đổi cấu hình.`);
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
}
