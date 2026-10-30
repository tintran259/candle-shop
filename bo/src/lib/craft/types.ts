// Cấu hình trình dựng nến Thủ công: admin tự tạo các BƯỚC, mỗi bước dùng một COMPONENT có sẵn.
// Đây là hợp đồng dữ liệu giữa BO → BE → web — đặc tả đầy đủ ở docs/craft-builder.md.
// Tiền là VNĐ, số nguyên (đồng).

export type Localized = { vi: string; en: string };
export type Money = number;

// Các component admin chọn cho một bước (web dựng giao diện theo kiểu này)
export const stepKinds = ["vessel", "cards", "swatches", "blend", "inputs"] as const;
export type StepKind = (typeof stepKinds)[number];

// Bước này điều khiển phần nào của ảnh minh họa cây nến trên web
export const previewRoles = ["waxColor", "wick", "decoration"] as const;
export type PreviewRole = (typeof previewRoles)[number];

// Icon có sẵn — BO và web tự ánh xạ sang bộ icon của mình
export const stepIcons = ["vessel", "layers", "flower", "flame", "palette", "sparkles", "pen", "gift", "tag", "box"] as const;
export type StepIcon = (typeof stepIcons)[number];

export type Unit = "g" | "pcs";
// Tồn kho của một lựa chọn, theo đơn vị của bước. Số rất lớn (UNLIMITED) = không theo dõi
export type Stock = { stock: number; unit: Unit };

// Một lựa chọn trong bước (dùng chung cho vessel / cards / swatches / blend)
export type StepOption = Stock & {
  // Duy nhất trong bước; dùng trong cấu hình khách đã chọn nên không đổi sau khi tạo
  id: string;
  name: Localized;
  description?: Localized;
  // Phụ thu mỗi hũ
  priceDelta: Money;
  // Shop tạm ẩn dù còn hàng
  available: boolean;
  // Màu hiển thị khi chưa có ảnh; swatches không có màu = "không pha màu" (ô sọc)
  swatch?: string;
  // Ảnh thật, ảnh đầu tiên là ảnh chính
  images?: string[];
  // Kiểu hiển thị trên ảnh minh họa khi bước có previewRole (wick: cotton|wood, decoration: flowers|pattern|topper)
  look?: string;
  // Chỉ chọn được khi bước khác đang chọn một trong các mục này: { [stepId]: optionId[] }. Bỏ trống = không giới hạn
  onlyWith?: Record<string, string[]>;
  // Không dùng được cho nến nặng hơn (gram)
  maxGrams?: number;
  // blend: chọn mục này thì không phối thêm mục khác (vd "Không mùi")
  exclusive?: boolean;
};

export type VesselShape = "tumbler" | "jar" | "tin" | "bowl";

export type VesselOption = StepOption & {
  shape: VesselShape;
  translucent?: boolean;
  // Kích thước đổ được (id trong sizes của bước)
  supportedSizeIds: string[];
  // null = không có nắp
  lid: (Stock & { priceDelta: Money }) | null;
};

export type SizeOption = {
  id: string;
  grams: number;
  // Chỉ hiện khi xưởng đã đo thực tế
  burnHours?: number;
  // Giá gốc của cây nến — mọi phụ thu cộng thêm vào đây
  basePrice: Money;
  available: boolean;
};

export type TextFieldDef = {
  id: string;
  label: Localized;
  placeholder?: Localized;
  maxLength: number;
  // Tính phí khi khách có nhập
  priceDelta: Money;
  enabled: boolean;
  multiline?: boolean;
  // In chữ này lên nhãn trong ảnh minh họa
  onLabel?: boolean;
};

export type AddonDef = Stock & {
  id: string;
  name: Localized;
  description?: Localized;
  priceDelta: Money;
  available: boolean;
  enabled: boolean;
};

type StepBase = {
  // Duy nhất trong cấu hình, chữ thường không dấu (vd "wax") — web dùng làm anchor & khóa lựa chọn
  id: string;
  title: Localized;
  hint?: Localized;
  icon: StepIcon;
  // Tắt = ẩn bước khỏi web (giữ dữ liệu)
  enabled: boolean;
  // Bắt buộc chọn trước khi thêm vào giỏ
  required: boolean;
};

export type VesselStep = StepBase & { kind: "vessel"; options: VesselOption[]; sizes: SizeOption[] };

export type CardsStep = StepBase & {
  kind: "cards";
  options: StepOption[];
  // Chọn nhiều (checkbox) hay một (radio)
  multiple: boolean;
  // Chọn nhiều tối đa (bỏ trống = không giới hạn)
  maxSelect?: number;
  previewRole?: PreviewRole;
  // Đơn vị tồn kho; "g" thì mỗi hũ tiêu hao gramsPerGram × khối lượng nến
  unit: Unit;
  gramsPerGram?: number;
};

export type SwatchesStep = StepBase & { kind: "swatches"; options: StepOption[]; previewRole?: PreviewRole; unit: Unit; gramsPerGram?: number };

export type IntensityLevel = "light" | "medium" | "strong";
export type BlendStep = StepBase & {
  kind: "blend";
  options: StepOption[];
  // Số mục phối tối đa trong 1 hũ (1 = chọn một)
  maxBlend: number;
  // null = không cho chọn độ đậm. load = tỉ lệ (gram tinh dầu / gram sáp)
  intensity: { priceDelta: Record<IntensityLevel, Money>; load: Record<IntensityLevel, number> } | null;
  unit: Unit;
};

export type InputsStep = StepBase & { kind: "inputs"; fields: TextFieldDef[]; addons: AddonDef[] };

export type CraftStep = VesselStep | CardsStep | SwatchesStep | BlendStep | InputsStep;
export type OptionStep = Exclude<CraftStep, InputsStep>;

export type CraftConfig = {
  // Tăng khi đổi cấu trúc — BE/web từ chối phiên bản không hiểu
  version: 1;
  currency: "VND";
  // Thứ tự hiển thị trên web
  steps: CraftStep[];
  updatedAt?: string;
};
