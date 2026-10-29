// Dữ liệu mẫu theo Figma — sẽ thay bằng API từ BE (/api/products)
// Chữ hiển thị (tagline, nhãn menu, FAQ) nằm trong messages/{vi,en}.json

export const aromaLevels = ["soft", "medium", "strong"] as const;
export const aromaTypes = ["fruits", "nature", "parfum"] as const;
export const productSizes = ["small", "medium", "big"] as const;

export type AromaLevel = (typeof aromaLevels)[number];
export type AromaType = (typeof aromaTypes)[number];
export type ProductSize = (typeof productSizes)[number];

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image: string;
  // Ảnh trang chi tiết; nếu không có thì dùng `image`
  gallery?: string[];
  isNew?: boolean;
  aromaLevel: AromaLevel;
  aromaType: AromaType;
  size: ProductSize;
  rating: number;
  // Thứ tự "Featured" do shop sắp đặt
  featured: number;
  createdAt: string;
};

export const products: Product[] = [
  {
    id: "brown-relac",
    name: "Brown Relac",
    slug: "brown-relac",
    price: 37,
    salePrice: 33,
    image: "/figma/product-brown.jpg",
    aromaLevel: "medium",
    aromaType: "nature",
    size: "medium",
    rating: 4.6,
    featured: 1,
    createdAt: "2026-06-02",
  },
  {
    id: "moon-morning",
    name: "Moon Morning",
    slug: "moon-morning",
    price: 34,
    image: "/figma/product-moon.jpg",
    isNew: true,
    aromaLevel: "soft",
    aromaType: "parfum",
    size: "small",
    rating: 4.8,
    featured: 2,
    createdAt: "2026-10-01",
  },
  {
    id: "vanilla-relax",
    name: "Vanilla Relax",
    slug: "vanilla-relax",
    price: 24,
    salePrice: 20,
    image: "/figma/product-vanilla.jpg",
    gallery: [1, 2, 3, 4].map((i) => `/figma/detail/vanilla-${i}.jpg`),
    aromaLevel: "soft",
    aromaType: "fruits",
    size: "small",
    rating: 4.3,
    featured: 3,
    createdAt: "2026-03-15",
  },
  {
    id: "beach-sunshine",
    name: "Beach Sunshine",
    slug: "beach-sunshine",
    price: 40,
    image: "/figma/product-beach.jpg",
    aromaLevel: "strong",
    aromaType: "nature",
    size: "big",
    rating: 4.5,
    featured: 4,
    createdAt: "2026-05-20",
  },
  {
    id: "moonlight-aurora",
    name: "Moonlight Aurora",
    slug: "moonlight-aurora",
    price: 40,
    image: "/figma/product-moonlight.jpg",
    aromaLevel: "medium",
    aromaType: "parfum",
    size: "big",
    rating: 3.9,
    featured: 5,
    createdAt: "2026-08-10",
  },
  {
    id: "woman-secret",
    name: "Woman Secret",
    slug: "woman-secret",
    price: 38,
    image: "/figma/product-woman.jpg",
    isNew: true,
    aromaLevel: "strong",
    aromaType: "parfum",
    size: "medium",
    rating: 4.7,
    featured: 6,
    createdAt: "2026-10-12",
  },
];

const byId = (id: string) => products.find((p) => p.id === id)!;

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const relatedProducts = (product: Product, limit = 4) =>
  products.filter((p) => p.id !== product.id).slice(0, limit);

export type Review = {
  id: string;
  productId: string;
  author: string;
  avatar?: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  quality: "good" | "excellent";
  size: ProductSize;
  level: AromaLevel;
  reply?: string;
};

// Review mẫu — sau này lấy từ BE (/api/products/:id/reviews)
export const reviews: Review[] = [
  {
    id: "r1",
    productId: "vanilla-relax",
    author: "Wing Sun",
    avatar: "/figma/detail/avatar-wing.jpg",
    rating: 4,
    title: "Safe for children",
    body: "I use candles when playing with children. My son also likes the smell and it is not dangerous for children to inhale",
    date: "2022-12-12",
    quality: "good",
    size: "medium",
    level: "strong",
    reply: "Thank you Wing! We are happy your family enjoys it.",
  },
  {
    id: "r2",
    productId: "vanilla-relax",
    author: "Syam Kara",
    avatar: "/figma/detail/avatar-syam.jpg",
    rating: 4,
    title: "Troubled Packaging",
    body: "The smell is very fragrant but my order came in a broken jar which reduces the beauty but I admit it smells very good",
    date: "2022-11-24",
    quality: "good",
    size: "medium",
    level: "soft",
    reply: "Sorry about the jar, Syam! Our team has sent you a replacement.",
  },
  {
    id: "r3",
    productId: "vanilla-relax",
    author: "Ghandy Hari",
    avatar: "/figma/detail/avatar-ghandy.jpg",
    rating: 5,
    title: "Candle light dinner",
    body: "I used candles for dinner with my husband and it was so romantic. Like having dinner on the beach",
    date: "2022-11-14",
    quality: "excellent",
    size: "medium",
    level: "strong",
  },
  {
    id: "r4",
    productId: "vanilla-relax",
    author: "Linh Tran",
    rating: 5,
    title: "Cozy evenings",
    body: "Soft vanilla scent that fills the living room without being too sweet.",
    date: "2022-10-30",
    quality: "excellent",
    size: "small",
    level: "soft",
  },
  {
    id: "r5",
    productId: "vanilla-relax",
    author: "Minh Le",
    rating: 4,
    title: "Great gift",
    body: "Bought it for my mom and she loved the packaging and the smell.",
    date: "2022-10-02",
    quality: "good",
    size: "big",
    level: "medium",
  },
];

export const getReviews = (productId: string) => {
  const own = reviews.filter((r) => r.productId === productId);
  // Sản phẩm chưa có review riêng thì dùng review mẫu để demo giao diện
  return own.length ? own : reviews.map((r) => ({ ...r, productId }));
};

export const trendingProducts: Product[] = [
  "vanilla-relax",
  "beach-sunshine",
  "brown-relac",
  "moon-morning",
].map(byId);

// key = khóa trong namespace "Nav"
export const navLinks = [
  { key: "shop", href: "/shop" },
  { key: "craft", href: "/craft" },
] as const;

// key = khóa trong namespace "Footer.links"
export const footerLinks = [
  { key: "newArrivals", href: "/shop?sort=newest" },
  { key: "influencer", href: "/influencer" },
  { key: "contact", href: "/contact" },
] as const;

export const socialLinks = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Twitter", href: "https://twitter.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

// key = khóa trong namespace "Faq.groups"
export const faqGroupIds = ["product", "delivery", "refunds"] as const;

export type FaqItem = { q: string; a: string };

export const formatPrice = (value: number) => `$${value}`;
