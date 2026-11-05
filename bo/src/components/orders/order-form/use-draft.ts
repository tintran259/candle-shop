import type { FormInstance } from "antd";
import { App } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import type { OrderFormValues } from "@/components/orders/order-form/model";
import { draftHasContent, getOrderDraft, saveOrderDraft, type OrderDraft } from "@/hooks/use-order-draft";
import type { Product } from "@/lib/products/types";

type Args = {
  form: FormInstance<OrderFormValues>;
  // Sửa đơn có sẵn: không dùng nháp
  editing: boolean;
  // Mở từ hồ sơ khách (?customer=)
  customerId?: string;
  products: Product[];
  // Ngày làm xong gợi ý khi ngày trong nháp đã qua
  suggestDate: () => string;
  // Giá trị form mới (trống)
  fresh: () => Partial<OrderFormValues>;
  dirty: boolean;
  setDirty: (d: boolean) => void;
  // Theo dõi để tự lưu (giá trị form đang xem)
  watched: unknown;
  onClose: () => void;
};

// Đơn nháp (docs/pages/orders.md#đơn-nháp): mở Tạo đơn hàng thì điền tiếp đơn đang dở.
// Mở từ hồ sơ khách thì điền khách đó, nháp cũ chỉ báo và mở lại được. Tự lưu mỗi khi đổi
export function useOrderFormDraft({ form, editing, customerId, products, suggestDate, fresh, dirty, setDirty, watched, onClose }: Args) {
  const { modal } = App.useApp();
  const [savedDraft] = useState(() => (editing ? null : getOrderDraft()));
  const [restored, setRestored] = useState(() => (savedDraft && !customerId ? savedDraft : null));
  const [otherDraft, setOtherDraft] = useState(() => (savedDraft && customerId ? savedDraft : null));

  // Giá trị form từ nháp: ngày làm xong đã qua thì lấy ngày gợi ý; dòng nến có sẵn lấy lại tên, ảnh, giá hiện tại
  const fromDraft = (d: OrderDraft): Partial<OrderFormValues> => {
    const day = d.values.readyDate ? dayjs(d.values.readyDate) : undefined;
    return {
      ...(d.values as Partial<OrderFormValues>),
      readyDate: day && !day.isBefore(dayjs(), "day") ? day : dayjs(suggestDate()),
      lines: (d.values.lines ?? []).filter(Boolean).map((l) => {
        const p = l.kind === "product" ? products.find((x) => x.id === l.productId) : undefined;
        return p ? { ...l, name: p.name, image: p.images[0], price: p.salePrice ?? p.price } : l;
      }),
    };
  };

  // Thay toàn bộ form (bỏ cả trường chỉ có ở bản cũ, vd mã giao dịch)
  const replaceValues = (next: Partial<OrderFormValues>) => {
    const all = form.getFieldsValue(true) as Record<string, unknown>;
    form.setFieldsValue({ ...Object.fromEntries(Object.keys(all).map((k) => [k, undefined])), ...next });
  };
  // Bắt đầu đơn mới: xóa nháp, form về trống
  const startOver = () => {
    saveOrderDraft(null);
    replaceValues(fresh());
    setRestored(null);
    setOtherDraft(null);
    setDirty(false);
  };
  // Mở từ hồ sơ khách mà đang có nháp khác: chuyển sang nháp đó
  const openOther = () => {
    if (!otherDraft) return;
    replaceValues(fromDraft(otherDraft));
    setRestored(otherDraft);
    setOtherDraft(null);
    setDirty(false);
  };
  const discard = () =>
    modal.confirm({
      title: "Bỏ đơn đang tạo?",
      content: "Đơn nháp sẽ bị xóa, không mở lại được.",
      okText: "Bỏ đơn",
      okButtonProps: { danger: true },
      cancelText: "Giữ lại",
      onOk: () => {
        saveOrderDraft(null);
        onClose();
      },
    });

  // Tự lưu nháp mỗi khi đổi (kể cả thêm nến tự phối) — chỉ khi tạo đơn mới. Trống thì xóa nháp
  // Chỉ ghi khi nội dung đổi thật — mỗi lần ghi làm trang Đơn hàng vẽ lại (nút Tiếp tục đơn nháp)
  const lastSaved = useRef("");
  useEffect(() => {
    if (editing || !dirty) return;
    const all = form.getFieldsValue(true) as Partial<OrderFormValues>;
    const values = { ...all, readyDate: all.readyDate?.format("YYYY-MM-DD") } as OrderDraft["values"];
    const json = draftHasContent(values) ? JSON.stringify(values) : "";
    if (json === lastSaved.current) return;
    lastSaved.current = json;
    saveOrderDraft(json ? { savedAt: new Date().toISOString(), values } : null);
  }, [watched, dirty, editing, form]);

  return { restored, otherDraft, fromDraft, startOver, openOther, discard };
}
