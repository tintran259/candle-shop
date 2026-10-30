import {
  CommentOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  InboxOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TagOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

// badge: tên bộ đếm động — layout tự tính số ("orders" = đơn đang chờ xử lý, "inventory" = nguyên liệu hết hàng)
export type NavItem = { label: string; path: string; icon: ReactNode; badge?: "orders" | "inventory" };

export const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Tổng quan", items: [{ label: "Dashboard", path: "/", icon: <DashboardOutlined /> }] },
  {
    label: "Bán hàng",
    items: [
      { label: "Đơn hàng", path: "/orders", icon: <ShoppingCartOutlined />, badge: "orders" },
      { label: "Sản phẩm", path: "/products", icon: <ShoppingOutlined /> },
      { label: "Thủ công", path: "/craft", icon: <ExperimentOutlined /> },
      { label: "Kho nguyên liệu", path: "/inventory", icon: <InboxOutlined />, badge: "inventory" },
      { label: "Khách hàng", path: "/customers", icon: <TeamOutlined /> },
      { label: "Đánh giá", path: "/reviews", icon: <CommentOutlined /> },
      { label: "Mã giảm giá", path: "/discounts", icon: <TagOutlined /> },
    ],
  },
  { label: "Hệ thống", items: [{ label: "Cài đặt", path: "/settings", icon: <SettingOutlined /> }] },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

export const findNavItem = (pathname: string) =>
  allNavItems.find((i) => (i.path === "/" ? pathname === "/" : pathname.startsWith(i.path)));
