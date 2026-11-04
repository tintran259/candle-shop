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

export type ShopSettings = {
  // % tiền cọc khi khách chọn đặt cọc
  depositPercent: number;
  // Số lần giao không thành tối đa trước khi chuyển hoàn về
  maxDeliveryAttempts: number;
  // Phí vận chuyển mặc định khi gửi lại đơn, VNĐ
  resendFee: number;
  shippingOptions: ShippingOption[];
  // Số cây xưởng làm được mỗi ngày, 0 = không giới hạn
  dailyCapacity: number;
  // Số ngày làm tối thiểu: ngày làm xong mặc định sớm nhất là hôm nay + số này
  leadDays: number;
};

export const defaultSettings: ShopSettings = {
  depositPercent: 50,
  maxDeliveryAttempts: 3,
  resendFee: 30_000,
  shippingOptions: [
    { id: "standard", name: "Tiêu chuẩn", fee: 0, days: 3, enabled: true },
    { id: "express", name: "Nhanh", fee: 50_000, days: 1, enabled: true },
  ],
  dailyCapacity: 20,
  leadDays: 3,
};

export const shippingOptionLabel = (o: Pick<ShippingOption, "name" | "days">) => `${o.name} (${o.days} ngày)`;
