// Cách phân loại sản phẩm do admin tự đặt: Danh mục (loại hương, mỗi sản phẩm 1) và Concept (dịp lễ: Noel, Tết…, mỗi sản phẩm 0..n).
// Cùng dạng dữ liệu, cùng trang quản lý (bảng kéo thả + modal) — khác nhau ở chữ hiển thị và quy tắc xóa (TaxonomyKind)

export type Taxonomy = {
  // Tạo từ tên lúc thêm, không đổi về sau để sản phẩm giữ liên kết
  id: string;
  name: { vi: string; en: string };
  // Màu tag preset của antd — luôn kèm chữ
  color: string;
  hidden: boolean;
  // Chỉ concept: thời gian bán (YYYY-MM-DD, giờ VN), null / thiếu = mọi ngày
  startsOn?: string | null;
  endsOn?: string | null;
};

export type TaxonomyKind = {
  // Chữ thường, dùng trong câu: "danh mục", "concept"
  noun: string;
  placeholder: string;
  // Id khi tên không tạo được slug
  fallbackId: string;
  // Liên kết "N sản phẩm" sang trang Sản phẩm đã lọc
  productsHref: (id: string) => string;
  // false: còn sản phẩm thì không xóa (danh mục — sản phẩm bắt buộc có). true: xóa được, sản phẩm chỉ rời khỏi (concept)
  removeWhenUsed: boolean;
  // Có thời gian bán (concept): modal có ô chọn khoảng ngày, bảng có cột Thời gian
  dates?: boolean;
};

export const taxonomyColors = [
  { value: "default", label: "Xám" },
  { value: "red", label: "Đỏ" },
  { value: "volcano", label: "Cam đỏ" },
  { value: "orange", label: "Cam" },
  { value: "gold", label: "Vàng" },
  { value: "lime", label: "Xanh chanh" },
  { value: "green", label: "Xanh lá" },
  { value: "cyan", label: "Xanh ngọc" },
  { value: "blue", label: "Xanh dương" },
  { value: "geekblue", label: "Xanh đậm" },
  { value: "purple", label: "Tím" },
  { value: "magenta", label: "Hồng" },
];
