import { PrinterOutlined } from "@ant-design/icons";
import { App, Button, Dropdown } from "antd";
import dayjs from "dayjs";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getSettings, useSettings } from "@/hooks/use-settings";
import { formatMoney } from "@/lib/format";
import { paidAmount, providerLabels, shippingName } from "@/lib/orders/labels";
import { codAmount, itemsSummary } from "@/lib/orders/shipping";
import type { Order } from "@/lib/orders/types";
import type { Sender } from "@/lib/settings/types";

// In phiếu đơn (A5) và nhãn giao hàng (100 × 150 mm, khổ máy in nhiệt) — docs/pages/orders.md#in-đơn-và-nhãn-giao-hàng.
// Trang in vẽ vào .print-root ở cuối body; lúc in chỉ hiện phần này (index.css › @media print)
export type PrintKind = "invoice" | "label";
type Job = { kind: PrintKind; orders: Order[] };

let job: Job | null = null;
const listeners = new Set<() => void>();
const setJob = (next: Job | null) => {
  job = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const printLabels: Record<PrintKind, string> = { invoice: "In phiếu đơn", label: "In nhãn giao hàng" };

// Khổ giấy theo loại
const pageCss: Record<PrintKind, string> = {
  invoice: "@page { size: A5 portrait; margin: 10mm; }",
  label: "@page { size: 100mm 150mm; margin: 0; }",
};

// Gắn một lần ở trang Đơn hàng
export function PrintHost() {
  const current = useSyncExternalStore(subscribe, () => job);
  const { settings } = useSettings();
  useEffect(() => {
    if (!current) return;
    const done = () => setJob(null);
    window.addEventListener("afterprint", done, { once: true });
    // Chờ trình duyệt vẽ xong trang in rồi mới mở hộp thoại in
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [current]);
  if (!current) return null;
  return createPortal(
    <div className={`print-root print-kind-${current.kind}`} aria-hidden>
      <style>{pageCss[current.kind]}</style>
      {current.orders.map((o) => (current.kind === "invoice" ? <InvoicePage key={o.id} order={o} sender={settings.sender} /> : <LabelPage key={o.id} order={o} sender={settings.sender} />))}
    </div>,
    document.body,
  );
}

// Nút In: chọn phiếu đơn hoặc nhãn giao hàng. Thiếu SĐT / địa chỉ người gửi thì nhắc, vẫn in
export function PrintMenu({ orders, label = "In", size }: { orders: Order[]; label?: ReactNode; size?: "small" | "middle" }) {
  const { message } = App.useApp();
  const print = (kind: PrintKind) => {
    const { sender } = getSettings();
    if (kind === "label" && (!sender.phone.trim() || !sender.address.trim())) message.warning("Nhãn chưa có SĐT hoặc địa chỉ người gửi — điền ở Cài đặt › Người gửi.");
    setJob({ kind, orders });
  };
  return (
    <Dropdown
      disabled={!orders.length}
      trigger={["click"]}
      menu={{ items: (["invoice", "label"] as const).map((k) => ({ key: k, label: printLabels[k] })), onClick: ({ key }) => print(key as PrintKind) }}
    >
      <Button size={size} icon={<PrinterOutlined />} disabled={!orders.length}>
        {label}
      </Button>
    </Dropdown>
  );
}

function InvoicePage({ order: o, sender }: { order: Order; sender: Sender }) {
  const paid = paidAmount(o);
  const due = codAmount(o);
  return (
    <section className="print-page invoice">
      <header className="invoice-head">
        <div>
          <div className="print-brand">{sender.name || "2510 Candle"}</div>
          {sender.phone && <div>{sender.phone}</div>}
          {sender.address && <div>{sender.address}</div>}
        </div>
        <div className="invoice-title">
          <div>PHIẾU ĐƠN HÀNG</div>
          <strong>{o.code}</strong>
          <div>Đặt {dayjs(o.createdAt).format("HH:mm DD/MM/YYYY")}</div>
        </div>
      </header>

      <div className="invoice-parties">
        <div>
          <div className="print-label">Khách hàng</div>
          <strong>{o.customer.name}</strong>
          <div>{o.customer.phone}</div>
          <div>{o.shippingAddress}</div>
        </div>
        <div>
          <div className="print-label">Giao hàng</div>
          <div>{shippingName(o)}</div>
          {o.shipment && <div>{o.shipment.trackingCode ? `${o.shipment.carrier} · ${o.shipment.trackingCode}` : o.shipment.carrier}</div>}
          <div>Thanh toán: {providerLabels[o.paymentMethod]}</div>
        </div>
      </div>

      <table className="invoice-items">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th className="num">SL</th>
            <th className="num">Đơn giá</th>
            <th className="num">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, k) => (
            <tr key={i.id}>
              <td>{k + 1}</td>
              <td>
                {i.name}
                {i.custom && <div className="print-muted">{i.custom}</div>}
              </td>
              <td className="num">{i.quantity}</td>
              <td className="num">{formatMoney(i.price)}</td>
              <td className="num">{formatMoney(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="invoice-totals">
        <tbody>
          <tr>
            <td>Tạm tính</td>
            <td className="num">{formatMoney(o.subtotal)}</td>
          </tr>
          {o.discount > 0 && (
            <tr>
              <td>Giảm giá{o.discountCode ? ` (${o.discountCode})` : ""}</td>
              <td className="num">−{formatMoney(o.discount)}</td>
            </tr>
          )}
          <tr>
            <td>Phí giao</td>
            <td className="num">{o.shippingFee ? formatMoney(o.shippingFee) : "Miễn phí"}</td>
          </tr>
          <tr className="strong">
            <td>Tổng cộng</td>
            <td className="num">{formatMoney(o.total)}</td>
          </tr>
          <tr>
            <td>Đã thanh toán</td>
            <td className="num">{formatMoney(paid)}</td>
          </tr>
          <tr className="strong big">
            <td>Còn phải thu</td>
            <td className="num">{formatMoney(due)}</td>
          </tr>
        </tbody>
      </table>

      {o.note && (
        <p>
          <span className="print-label">Ghi chú của khách: </span>
          {o.note}
        </p>
      )}
      <footer className="print-muted">Cảm ơn bạn đã chọn {sender.name || "2510 Candle"}. Nến thủ công — tránh để nơi nóng, đốt lần đầu 2–3 giờ để mặt sáp tan đều.</footer>
    </section>
  );
}

function LabelPage({ order: o, sender }: { order: Order; sender: Sender }) {
  const cod = codAmount(o);
  return (
    <section className="print-page ship-label">
      <div className="label-row label-top">
        <div className="print-brand">{sender.name || "2510 Candle"}</div>
        {o.shipment ? (
          <div className="label-carrier">
            <div>{o.shipment.carrier}</div>
            {o.shipment.trackingCode && <strong>{o.shipment.trackingCode}</strong>}
          </div>
        ) : (
          <div className="label-carrier">{shippingName(o)}</div>
        )}
      </div>
      <div className="label-row label-code">
        <span className="print-label">Mã đơn</span>
        <strong>{o.code}</strong>
      </div>
      <div className="label-row">
        <div className="print-label">Người gửi</div>
        <div>
          {[sender.name, sender.phone].filter(Boolean).join(" · ")}
        </div>
        {sender.address && <div>{sender.address}</div>}
      </div>
      <div className="label-row label-to">
        <div className="print-label">Người nhận</div>
        <strong className="label-name">{o.customer.name}</strong>
        <strong className="label-phone">{o.customer.phone}</strong>
        <div className="label-address">{o.shippingAddress}</div>
      </div>
      <div className="label-row label-items">
        <div className="print-label">Nội dung hàng</div>
        <div>{itemsSummary(o)}</div>
        {o.note && <div className="print-muted">Ghi chú: {o.note}</div>}
      </div>
      <div className="label-row label-cod">
        <span>Thu hộ (COD)</span>
        <strong>{cod ? formatMoney(cod) : "Không thu tiền"}</strong>
      </div>
      <div className="label-foot">Hàng dễ vỡ — nến thủ công, xin nhẹ tay · In {dayjs().format("DD/MM/YYYY")}</div>
    </section>
  );
}
