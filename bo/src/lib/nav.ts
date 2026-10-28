export type NavItem = {
  label: string;
  href: string;
  icon: "dashboard" | "orders" | "products" | "customers" | "reviews" | "discounts" | "settings";
  badge?: string;
};

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Tổng quan",
    items: [{ label: "Dashboard", href: "/", icon: "dashboard" }],
  },
  {
    label: "Bán hàng",
    items: [
      { label: "Đơn hàng", href: "/orders", icon: "orders", badge: "3" },
      { label: "Sản phẩm", href: "/products", icon: "products" },
      { label: "Khách hàng", href: "/customers", icon: "customers" },
      { label: "Đánh giá", href: "/reviews", icon: "reviews" },
      { label: "Mã giảm giá", href: "/discounts", icon: "discounts" },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ label: "Cài đặt", href: "/settings", icon: "settings" }],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);
