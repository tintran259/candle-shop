// Nội dung trang chủ (bố cục theo Figma "Ember & Earth", chữ tiếng Việt cho 2510 Candle). Sửa chữ / ảnh ở đây, không cần đụng component.
// Sản phẩm, giá, nốt hương là DỮ LIỆU MẪU — sau này đọc từ BE.

export type Photo = { src: string; alt: string; width: number; height: number };
export type Link = { label: string; href: string };

export const brand = "2510 Candle";

export const announcement = "Mỗi hũ nến được đổ tay theo đơn của bạn · Hoàn thành trong 2–3 ngày";

export const nav = {
  shop: [
    { label: "Sản phẩm", href: "/products" },
    { label: "Câu chuyện", href: "/#story" },
    { label: "Cẩm nang", href: "/#care" },
  ] satisfies Link[],
  // Nút mở hộp tìm kiếm (phím tắt Ctrl / ⌘ + K)
  search: "Tìm kiếm",
};

export const search = {
  title: "Tìm kiếm",
  close: "Đóng",
  placeholder: "Tìm mẫu nến, mùi hương…",
  loading: "Đang tải sản phẩm…",
  error: "Chưa tải được sản phẩm — thử lại sau ít phút.",
  suggest: "Gợi ý cho bạn",
  found: (n: number) => `${n} kết quả`,
  none: (q: string) => `Không tìm thấy mẫu nến nào cho “${q}”`,
  all: (n: number) => `Xem tất cả ${n} kết quả`,
  browse: "Xem tất cả sản phẩm",
};

export const hero = {
  eyebrow: "Nến thủ công mẻ nhỏ. Nghi thức mỗi ngày.",
  title: ["Một chút ánh sáng.", "Thật nhiều cảm xúc."],
  text: "Những hũ nến đổ tay dành cho những khoảnh khắc bạn muốn chậm lại. Làm chậm rãi. Cháy thật đẹp.",
  cta: { label: "Tìm ánh nến của bạn", href: "#collection" },
  // Câu lớn ở dải tối dưới ảnh
  mark: "Made by hand, never twice.",
  footnote: ["Sáp đậu nành tự nhiên", "Bấc cotton", "Nhẹ nhàng với môi trường"],
  photo: { src: "/images/hero-2510-v2.jpg", alt: "Người phụ nữ mặc đồ đen ngồi cạnh hũ nến 2510 Candle đang cháy, nắp đồng đặt trên khối đá", width: 2528, height: 1696 } satisfies Photo,
};

export const promises = ["Nguyên liệu chọn lọc", "Đổ tay tỉ mỉ", "Hương thơm dịu nhẹ", "Cho những phút chậm lại"];

export const collection = {
  title: "Xưởng nến",
  heading: "Ngày đẹp bắt đầu từ một ánh nến.",
  note: "Đổ tay tỉ mỉ. Chăm chút từng chi tiết.",
  eyebrow: "Bộ sưu tập đặc trưng",
  products: [
    {
      name: "Sáng Chủ Nhật",
      category: "Mùi hương mỗi ngày",
      price: "320.000 ₫",
      notes: "Cam bergamot · Trà trắng · Xạ hương nhẹ",
      details: "230 g · cháy khoảng 45 giờ",
      photo: { src: "/images/sunday-morning.jpg", alt: "Nến Sáng Chủ Nhật — hũ gốm đen viền đồng trên nền vải lụa trắng ngà", width: 1024, height: 1024 },
    },
    {
      name: "Giờ Vàng",
      category: "Ấm áp & gỗ",
      price: "340.000 ₫",
      notes: "Hổ phách · Đàn hương · Vani",
      details: "230 g · cháy khoảng 45 giờ",
      photo: { src: "/images/golden-hour.jpg", alt: "Nến Giờ Vàng — hũ gốm đen viền đồng trên nền lụa đỏ rượu vang", width: 1024, height: 1024 },
    },
    {
      name: "Vào Rừng",
      category: "Tươi mát & bình yên",
      price: "340.000 ₫",
      notes: "Tuyết tùng · Lá sung · Đất ẩm",
      details: "230 g · cháy khoảng 45 giờ",
      photo: { src: "/images/into-the-woods.jpg", alt: "Nến Vào Rừng — hũ gốm đen viền đồng trên nền vải màu cát", width: 1024, height: 1024 },
    },
  ] satisfies { name: string; category: string; price: string; notes: string; details: string; photo: Photo }[],
  more: { label: "Xem tất cả nến", href: "/products" },
};

export const story = {
  eyebrow: "Bàn tay chúng tôi. Nghi thức nhỏ của bạn.",
  kicker: "Tạo nên bầu không khí",
  title: ["Câu", "chuyện"],
  heading: ["Làm chậm rãi.", "Để sống trọn vẹn."],
  body: [
    "Chúng tôi tin những nghi thức nhỏ nhất cũng có thể làm một ngày trở nên khác đi. Một mùi hương quen. Một ánh nến lay động. Một khoảnh khắc chỉ của riêng bạn.",
    "Vì vậy chúng tôi gửi chút tâm huyết vào từng hũ nến: sáp đậu nành tự nhiên, mùi hương được chọn kỹ và những chiếc hũ đáng để giữ lại.",
  ],
  cta: { label: "Thêm một chút về chúng tôi", href: "#story" },
  photo: { src: "/images/story.jpg", alt: "Hũ nến gốm đen với nắp đồng và vài hạt bạch đậu khấu trên gờ đá", width: 1200, height: 896 } satisfies Photo,
};

export const care = {
  title: ["Nghệ thuật", "đốt nến"],
  link: { label: "Mẹo nhỏ. Ánh nến bền lâu.", href: "#care" },
  steps: [
    { title: "Cắt tỉa bấc", text: "Giữ bấc dài khoảng 0,5 cm trước mỗi lần đốt để ngọn lửa êm và sạch hơn." },
    { title: "Để nến cháy đủ lâu", text: "Ở lần đốt đầu tiên, hãy để sáp tan đều tới sát thành hũ." },
    { title: "Giữ lại chiếc hũ", text: "Khi nến đã cháy hết, hãy cho chiếc hũ gốm một cuộc đời thứ hai." },
  ],
  photo: { src: "/images/care.jpg", alt: "Hũ nến và cành ô liu trong hốc tường đá ngập nắng", width: 928, height: 1152 } satisfies Photo,
};

export const reminder = {
  eyebrow: "Một lời nhắn nhỏ",
  quote: ["“Không phải khoảnh khắc nào cũng cần nhiều hơn.", "Có những lúc chỉ cần một chút ấm áp.”"],
  signature: "Theo cách của 2510 Candle",
};

export const newsletter = {
  title: ["Ở lại", "một chút"],
  heading: "Một chút ấm áp trong hộp thư của bạn.",
  text: "Mùi hương mới, cảm hứng nhẹ nhàng và được biết trước những điều hay.",
  placeholder: "Địa chỉ email của bạn",
  submit: "Đăng ký",
  invalid: "Vui lòng nhập email hợp lệ.",
  consent: ["Khi đăng ký, bạn đồng ý với Chính sách bảo mật của chúng tôi.", "Chỉ gửi điều hay. Hủy đăng ký bất cứ lúc nào."],
  // Chưa có API đăng ký nhận tin — hiện thông báo này sau khi kiểm tra email
  pending: "Cảm ơn bạn — chúng tôi sẽ sớm mở đăng ký nhận tin.",
  photo: { src: "/images/newsletter.jpg", alt: "Bàn tay đặt cạnh hũ nến đang cháy trên khối đá travertine", width: 928, height: 1152 } satisfies Photo,
};

export const footer = {
  tagline: "Nến chăm chút. Nghi thức ấm áp.",
  columns: [
    {
      title: "Khám phá",
      links: [
        { label: "Tất cả nến", href: "/products" },
        { label: "Câu chuyện", href: "/#story" },
        { label: "Cẩm nang về nến", href: "/#care" },
      ],
    },
    {
      title: "Hỗ trợ",
      links: [
        { label: "Giao hàng & đổi trả", href: "#" },
        { label: "Chăm sóc nến", href: "/#care" },
        { label: "Liên hệ", href: "#" },
      ],
    },
    {
      title: "Theo dõi",
      links: [
        { label: "Instagram", href: "#" },
        { label: "Pinterest", href: "#" },
      ],
    },
  ] satisfies { title: string; links: Link[] }[],
  legal: [
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Điều khoản", href: "#" },
  ] satisfies Link[],
  photo: { src: "/images/footer.jpg", alt: "Hũ nến và nắp đồng trên bậc đá travertine ngập nắng, bóng lá ô liu", width: 1200, height: 896 } satisfies Photo,
};

// Trang Sản phẩm (/products) — dữ liệu sản phẩm lấy từ BE
export const productsPage = {
  eyebrow: "Bộ sưu tập 2510",
  title: "Sản phẩm",
  text: "Mỗi hũ nến được đổ tay theo đơn của bạn và hoàn thành trong 2–3 ngày. Chọn mùi hương hợp với khoảnh khắc của bạn.",
  all: "Tất cả",
  allConcepts: "Mọi dịp",
  soon: "Sắp mở",
  byConcept: "Theo dịp",
  sort: { label: "Sắp xếp", featured: "Nổi bật", priceAsc: "Giá thấp đến cao", priceDesc: "Giá cao đến thấp" },
  count: (n: number) => `${n} mẫu nến`,
  range: (from: number, to: number, n: number) => `${from}–${to} / ${n} mẫu nến`,
  pageSize: 9,
  pagination: { label: "Phân trang", prev: "Trước", next: "Sau", page: (n: number) => `Trang ${n}` },
  empty: "Chưa có mẫu nến nào trong mục này.",
  results: (q: string) => `Kết quả cho “${q}”`,
  clear: "Xóa tìm kiếm",
  error: "Chưa tải được sản phẩm — máy chủ có thể đang khởi động. Bạn thử tải lại sau ít phút nhé.",
  retry: "Tải lại",
  badgeNew: "Mới",
  // Nút trên thẻ sản phẩm: mở chat Zalo theo SĐT người gửi ở BO › Cài đặt (GET /api/shop/contact); chưa có SĐT thì ẩn nút
  contact: { label: "Liên hệ đặt nến", aria: (name: string) => `Liên hệ qua Zalo để đặt nến ${name} (mở cửa sổ mới)` },
  burn: (h: number) => `cháy khoảng ${h} giờ`,
};

// Trang chi tiết sản phẩm (/products/<slug>)
export const productDetail = {
  home: "Trang chủ",
  products: "Sản phẩm",
  concepts: "Thuộc dịp",
  specs: { scent: "Mùi hương", aroma: "Mức hương", size: "Kích cỡ", wax: "Loại sáp", burn: "Thời gian cháy" },
  burn: (h: number) => `Khoảng ${h} giờ`,
  madeToOrder: "Đổ tay theo đơn của bạn · Hoàn thành trong 2–3 ngày",
  saleUntil: (names: string[], date: string) => `Bán theo dịp ${names.join(", ")} đến hết ${date}`,
  noContact: "Liên hệ shop để đặt mẫu này.",
  back: "Xem tất cả sản phẩm",
  care: "Để nến cháy đẹp",
  gallery: (n: number, total: number) => `Ảnh ${n} / ${total}`,
  suggest: { eyebrow: "Gợi ý cho bạn", title: "Có thể bạn cũng thích", more: "Xem tất cả nến" },
  notFound: { title: "Không tìm thấy mẫu nến", text: "Mẫu nến này không còn bán hoặc đường dẫn chưa đúng.", back: "Xem các mẫu đang có" },
};

// Concept (dịp lễ) đang chọn chưa có mẫu: đếm ngược tới ngày mở bán / báo chưa có mẫu
export const conceptEmpty = {
  upcomingEyebrow: "Sắp mở bán",
  upcomingTitle: (name: string) => `Bộ sưu tập ${name} sẽ mở bán sau`,
  units: ["Ngày", "Giờ", "Phút", "Giây"],
  opensOn: (start: string, end: string | null) => (end ? `Mở bán từ ${start} đến hết ${end}` : `Mở bán từ ${start}`),
  preorderHint: "Muốn đặt trước? Nhắn cho shop qua Zalo.",
  emptyEyebrow: "Chưa có mẫu",
  emptyTitle: (name: string) => `Dịp ${name} chưa có mẫu nến nào`,
  emptyText: "Các mẫu nến cho dịp này đang được chuẩn bị. Bạn quay lại sau ít hôm, hoặc nhắn shop để được tư vấn đổ nến riêng theo ý bạn.",
  customHint: "Shop nhận đổ nến riêng theo dịp — nhắn qua Zalo để được tư vấn.",
};
