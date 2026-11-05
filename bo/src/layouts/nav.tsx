import {
  AppstoreOutlined,
  CommentOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  InboxOutlined,
  RollbackOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  SwapOutlined,
  TagOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

// badge: tên bộ đếm động — layout tự tính số ("orders" = đơn đang chờ xử lý, "inventory" = nguyên liệu hết hàng).
// sub: mục con, thụt vào dưới mục ngay trên (vd Phiếu kho dưới Kho nguyên liệu)
export type NavItem = { label: string; path: string; icon: ReactNode; badge?: "orders" | "inventory"; sub?: boolean };

export const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Tổng quan", items: [{ label: "Dashboard", path: "/", icon: <DashboardOutlined /> }] },
  // Bán hàng: việc với khách. Sản phẩm: những gì hiện trên web. Xưởng: cấu hình nến tự phối và nguyên liệu
  {
    label: "Bán hàng",
    items: [
      { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined />, badge: "orders" },
      { label: "Khách hàng", path: "/customers", icon: <TeamOutlined /> },
      { label: "Đánh giá", path: "/reviews", icon: <CommentOutlined /> },
      { label: "Mã giảm giá", path: "/discounts", icon: <TagOutlined /> },
    ],
  },
  {
    label: "Sản phẩm",
    items: [
      { label: "Sản phẩm trưng bày", path: "/products", icon: <ShoppingOutlined /> },
      { label: "Danh mục", path: "/categories", icon: <AppstoreOutlined /> },
      { label: "Sản phẩm hủy đơn", path: "/cancelled-products", icon: <RollbackOutlined /> },
    ],
  },
  {
    label: "Xưởng",
    items: [
      { label: "Thủ công", path: "/craft", icon: <ExperimentOutlined /> },
      { label: "Kho nguyên liệu", path: "/inventory", icon: <InboxOutlined />, badge: "inventory" },
      { label: "Phiếu kho", path: "/inventory/movements", icon: <SwapOutlined />, sub: true },
    ],
  },
  { label: "Hệ thống", items: [{ label: "Cài đặt", path: "/settings", icon: <SettingOutlined /> }] },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

// Mục khớp dài nhất: /inventory/movements là Phiếu kho, không phải Kho nguyên liệu
export const findNavItem = (pathname: string) =>
  allNavItems
    .filter((i) => (i.path === "/" ? pathname === "/" : pathname === i.path || pathname.startsWith(`${i.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0];
