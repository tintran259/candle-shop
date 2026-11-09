// Nguồn dữ liệu của BO: mặc định là BE (API). VITE_DATA_SOURCE=local giữ dữ liệu trên trình duyệt như trước —
// bản build cho test e2e dùng chế độ này để các kịch bản tự nạp dữ liệu mẫu vào localStorage
export const REMOTE = import.meta.env.VITE_DATA_SOURCE !== "local";
