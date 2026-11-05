import dayjs from "dayjs";
import { depositLabel, itemCount, paidAmount, paymentState, paymentStateMeta, providerLabels, shippingName, statusMeta } from "@/lib/orders/labels";
import { carrierName, codAmount } from "@/lib/orders/shipping";
import type { Order } from "@/lib/orders/types";
import { downloadXlsx, type XlsxSheet } from "@/lib/xlsx";

const date = (iso?: string) => (iso ? new Date(iso) : undefined);
// Ngày làm xong lưu dạng YYYY-MM-DD: đọc theo giờ máy, không lệch múi giờ
const day = (ymd?: string) => (ymd ? dayjs(ymd).toDate() : undefined);

// Xuất danh sách đơn đang lọc ra Excel: trang "Đơn hàng" mỗi đơn một dòng, trang "Sản phẩm" mỗi sản phẩm một dòng
export function ordersSheets(orders: Order[]): XlsxSheet[] {
  return [
    {
      name: "Đơn hàng",
      columns: [
        { header: "Mã đơn", width: 16 },
        { header: "Ngày đặt", format: "datetime", width: 17 },
        { header: "Trạng thái", width: 16 },
        { header: "Khách hàng", width: 22 },
        { header: "Số điện thoại", width: 14 },
        { header: "Địa chỉ giao", width: 40 },
        { header: "Sản phẩm", width: 40 },
        { header: "Số sản phẩm", format: "number", width: 12 },
        { header: "Tạm tính", format: "money", width: 13 },
        { header: "Giảm giá", format: "money", width: 12 },
        { header: "Mã giảm giá", width: 13 },
        { header: "Phí giao", format: "money", width: 12 },
        { header: "Tổng tiền", format: "money", width: 13 },
        { header: "Đã thu", format: "money", width: 13 },
        { header: "Còn phải thu", format: "money", width: 13 },
        { header: "Thanh toán", width: 18 },
        { header: "Hình thức thu", width: 22 },
        { header: "Ngày làm xong", format: "date", width: 14 },
        { header: "Phương thức giao", width: 20 },
        { header: "Đơn vị vận chuyển", width: 20 },
        { header: "Mã vận đơn", width: 18 },
        { header: "Phí trả đơn vị vận chuyển", format: "money", width: 16 },
        { header: "Ghi chú của khách", width: 30 },
        { header: "Ghi chú nội bộ", width: 30 },
      ],
      rows: orders.map((o) => [
        o.code,
        date(o.createdAt),
        statusMeta[o.status].label,
        o.customer.name,
        o.customer.phone,
        o.shippingAddress,
        o.items.map((i) => `${i.quantity}× ${i.name}`).join("; "),
        itemCount(o),
        o.subtotal,
        o.discount,
        o.discountCode,
        o.shippingFee,
        o.total,
        paidAmount(o),
        o.status === "cancelled" ? 0 : codAmount(o),
        paymentStateMeta[paymentState(o)].label,
        `${providerLabels[o.paymentMethod]} · ${o.paymentPlan === "deposit" ? depositLabel(o) : "Trả đủ"}`,
        day(o.readyDate),
        shippingName(o),
        carrierName(o),
        o.shipment?.trackingCode,
        o.shippingCost,
        o.note,
        o.internalNote,
      ]),
    },
    {
      name: "Sản phẩm",
      columns: [
        { header: "Mã đơn", width: 16 },
        { header: "Ngày đặt", format: "datetime", width: 17 },
        { header: "Trạng thái", width: 16 },
        { header: "Sản phẩm", width: 30 },
        { header: "Loại", width: 13 },
        { header: "Chi tiết nến tự phối", width: 50 },
        { header: "Số lượng", format: "number", width: 10 },
        { header: "Đơn giá", format: "money", width: 13 },
        { header: "Thành tiền", format: "money", width: 13 },
      ],
      rows: orders.flatMap((o) =>
        o.items.map((i) => [o.code, date(o.createdAt), statusMeta[o.status].label, i.name, i.custom ? "Nến tự phối" : "Nến có sẵn", i.custom, i.quantity, i.price, i.price * i.quantity]),
      ),
    },
  ];
}

export const exportOrdersXlsx = (orders: Order[]) => downloadXlsx(`don-hang-${dayjs().format("YYYY-MM-DD")}`, ordersSheets(orders));
