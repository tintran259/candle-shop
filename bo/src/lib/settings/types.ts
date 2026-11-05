// Cài đặt cửa hàng — các con số admin tự đổi được. Đơn lưu lại giá trị lúc tạo nên đổi cài đặt không ảnh hưởng đơn cũ.

export type ShippingOption = {
  id: string;
  name: string;
  // VNĐ, 0 = miễn phí
  fee: number;
  // Số ngày giao dự kiến
  days: number;
  // false = tạm ẩn, không hiện khi tạo đơn
  enabled: boolean;
};

// Đơn vị vận chuyển chọn khi giao đơn. trackingUrl: link tra cứu, {code} được thay bằng mã vận đơn
export type Carrier = {
  id: string;
  name: string;
  trackingUrl?: string;
  // false = không bắt buộc mã vận đơn (shop tự giao, xe ôm, Grab…)
  requireCode: boolean;
  enabled: boolean;
};

// Người gửi in trên nhãn giao hàng và phiếu đơn
export type Sender = { name: string; phone: string; address: string };

export type ShopSettings = {
  // % tiền cọc khi khách chọn đặt cọc
  depositPercent: number;
  // Số lần giao không thành tối đa trước khi chuyển hoàn về
  maxDeliveryAttempts: number;
  // Phí vận chuyển mặc định khi gửi lại đơn, VNĐ
  resendFee: number;
  shippingOptions: ShippingOption[];
  sender: Sender;
  carriers: Carrier[];
  // Số cây xưởng làm được mỗi ngày, 0 = không giới hạn
  dailyCapacity: number;
  // Số ngày làm tối thiểu: ngày làm xong mặc định sớm nhất là hôm nay + số này
  leadDays: number;
  // Lãi tối thiểu trên giá bán (%): cỡ, lựa chọn ở Thủ công lãi thấp hơn thì cảnh báo
  minMargin: number;
  // Hệ số gợi ý giá bán: giá vốn × hệ số
  priceMarkup: number;
};

export const defaultSettings: ShopSettings = {
  depositPercent: 50,
  maxDeliveryAttempts: 3,
  resendFee: 30_000,
  shippingOptions: [
    { id: "standard", name: "Tiêu chuẩn", fee: 0, days: 3, enabled: true },
    { id: "express", name: "Nhanh", fee: 50_000, days: 1, enabled: true },
  ],
  sender: { name: "2510 Candle", phone: "", address: "" },
  // Link tra cứu: kiểm tra lại với đơn vị vận chuyển, đổi được ở Cài đặt
  carriers: [
    { id: "ghn", name: "Giao Hàng Nhanh", trackingUrl: "https://donhang.ghn.vn/?order_code={code}", requireCode: true, enabled: true },
    { id: "ghtk", name: "Giao Hàng Tiết Kiệm", trackingUrl: "https://i.ghtk.vn/{code}", requireCode: true, enabled: true },
    { id: "viettelpost", name: "Viettel Post", requireCode: true, enabled: true },
    { id: "jt", name: "J&T Express", requireCode: true, enabled: true },
    { id: "self", name: "Shop tự giao", requireCode: false, enabled: true },
  ],
  dailyCapacity: 20,
  leadDays: 3,
  minMargin: 50,
  priceMarkup: 2.5,
};

// Phí giao của phương thức mặc định (đang bật đầu tiên) — dùng khi chưa có đơn, vd kiểm tra giá sản phẩm khi khách bỏ cọc
export const defaultShippingFee = (s: Pick<ShopSettings, "shippingOptions">) => s.shippingOptions.find((o) => o.enabled)?.fee ?? 0;

export const shippingOptionLabel = (o: Pick<ShippingOption, "name" | "days">) => `${o.name} (${o.days} ngày)`;

// Link tra cứu mã vận đơn, không có mẫu thì undefined
export const trackingLink = (template: string | undefined, code: string | undefined) => (template?.includes("{code}") && code ? template.replace(/\{code\}/g, encodeURIComponent(code)) : undefined);
