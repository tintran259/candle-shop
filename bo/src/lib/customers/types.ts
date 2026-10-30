// Khách hàng — dựa theo bảng User (role CUSTOMER) bên BE (Prisma), cộng thông tin nội bộ của shop.
// Khách đặt không đăng nhập (Order.userId = null) vẫn có hồ sơ, gộp theo số điện thoại.
// BE chưa có: tags, note, blocked, newsletter — cần thêm khi nối API (PATCH /api/customers/:id).

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  // Có tài khoản trên web hay chỉ đặt hàng không đăng nhập (khách vãng lai)
  hasAccount: boolean;
  // Đồng ý nhận email ưu đãi (NewsletterSubscriber)
  newsletter: boolean;
  // Nhãn nội bộ do shop tự đặt, vd "Mua quà tặng", "Khách sỉ"
  tags: string[];
  note?: string;
  // Chặn đặt hàng (vd bom hàng nhiều lần)
  blocked: boolean;
  blockReason?: string;
  createdAt: string;
};
