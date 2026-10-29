// Kiểu dữ liệu cho trang tự phối nến (Thủ công).
// Tiền luôn là số nguyên theo đơn vị nhỏ nhất (cent) để không lệch số khi cộng.

import type { Localized } from "@/lib/shop-config";

export type Money = number;

export const groupIds = ["container", "wax", "fragrance", "wick", "color", "decoration", "personalization"] as const;
export type GroupId = (typeof groupIds)[number];

export const intensities = ["light", "medium", "strong"] as const;
export type Intensity = (typeof intensities)[number];

// Lượng tồn kho: "g" cho sáp/hương, "pcs" cho hũ/bấc/phụ kiện
export type Stock = { stock: number; unit: "g" | "pcs" };

export type BaseOption = Stock & {
  id: string;
  name: Localized;
  description?: Localized;
  priceDelta: Money;
  // Shop tắt tạm thời trong BO dù còn hàng
  available: boolean;
  swatch?: string;
};

export type ContainerOption = BaseOption & {
  shape: "tumbler" | "jar" | "tin" | "bowl";
  supportedSizeIds: string[];
  // null = hũ này không có nắp
  lid: (Stock & { priceDelta: Money }) | null;
  translucent?: boolean;
};

export type SizeOption = {
  id: string;
  grams: number;
  // Chỉ hiển thị khi xưởng đã đo thực tế
  burnHours?: number;
  basePrice: Money;
  available: boolean;
};

export type FragranceOption = BaseOption & { unscented?: boolean };

export type WickOption = BaseOption & {
  // Bỏ trống = dùng được với mọi lựa chọn
  containerIds?: string[];
  waxIds?: string[];
  maxGrams?: number;
};

export type ColorOption = BaseOption & { natural?: boolean };

export type DecorationOption = BaseOption & {
  // Xưởng đã duyệt an toàn khi đốt — chỉ hiện các mục true
  approved: boolean;
  look?: "flowers" | "pattern" | "topper";
};

export type TextField = { enabled: boolean; maxLength: number; priceDelta: Money };

export type PersonalizationConfig = {
  labelText: TextField;
  recipientName: TextField;
  giftMessage: TextField;
  giftBox: (Stock & { enabled: boolean; priceDelta: Money; available: boolean }) | null;
};

export type CustomizerCatalog = {
  containers: ContainerOption[];
  sizes: SizeOption[];
  waxes: BaseOption[];
  fragrances: FragranceOption[];
  wicks: WickOption[];
  colors: ColorOption[];
  decorations: DecorationOption[];
  personalization: PersonalizationConfig;
  // Số mùi được phối trong 1 hũ (1 = chọn 1 mùi)
  maxFragrances: number;
  // null = không cho chọn độ đậm
  intensity: { priceDelta: Record<Intensity, Money>; load: Record<Intensity, number> } | null;
};

export type CandleConfiguration = {
  containerId: string | null;
  withLid: boolean;
  sizeId: string | null;
  waxId: string | null;
  // weight là tỉ lệ tương đối, quy ra % khi hiển thị
  fragrances: { id: string; weight: number }[];
  intensity: Intensity | null;
  wickId: string | null;
  colorId: string | null;
  decorationId: string | null;
  personalization: {
    labelText: string;
    recipientName: string;
    giftMessage: string;
    giftBox: boolean;
  };
};

export type IssueCode = "required" | "unavailable" | "incompatible" | "tooLong" | "tooMany" | "outOfStock";

export type ConfigIssue = {
  group: GroupId;
  // Mục cụ thể trong nhóm (vd "size", "lid", "labelText") để báo lỗi đúng chỗ
  field: string;
  code: IssueCode;
  params?: Record<string, string | number>;
};

export type PriceLine = { key: string; amount: Money };

// Lưu kèm dòng giỏ hàng để hiển thị mà không cần tải lại catalog
export type CandleLook = {
  shape: ContainerOption["shape"];
  vesselColor: string;
  translucent: boolean;
  waxColor: string;
  wick: "cotton" | "wood";
  decoration?: DecorationOption["look"];
  label?: string;
};

export type CustomCandleSnapshot = {
  configuration: CandleConfiguration;
  preview: CandleLook;
  details: Localized;
};
