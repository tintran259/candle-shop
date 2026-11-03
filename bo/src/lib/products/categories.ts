// Danh mục sản phẩm (loại hương): admin tự thêm, sửa, sắp xếp ở trang Danh mục.
// Web dùng làm bộ lọc chính; danh mục ẩn không hiện trong bộ lọc của web.

export type Category = {
  // Tạo từ tên lúc thêm, không đổi về sau để sản phẩm giữ liên kết
  id: string;
  name: { vi: string; en: string };
  // Màu tag preset của antd — luôn kèm chữ
  color: string;
  hidden: boolean;
};

export const categoryColors = [
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

// Giữ đúng id cũ (fruits/nature/parfum) để sản phẩm và web hiện tại vẫn khớp
export const defaultCategories: Category[] = [
  { id: "nature", name: { vi: "Thiên nhiên", en: "Nature" }, color: "green", hidden: false },
  { id: "parfum", name: { vi: "Nước hoa", en: "Parfum" }, color: "purple", hidden: false },
  { id: "fruits", name: { vi: "Trái cây", en: "Fruits" }, color: "orange", hidden: false },
];

export const UNCATEGORIZED = "Chưa phân loại";
