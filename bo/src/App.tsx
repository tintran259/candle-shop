import { App as AntdApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { createBrowserRouter, RouterProvider } from "react-router";
import { RouteError } from "@/components/route-error";
import { AppShellSkeleton } from "@/components/skeletons";
import { AppLayout } from "@/layouts/app-layout";
import { NotFoundPage, PlaceholderPage } from "@/pages/placeholder";
import { theme } from "@/theme";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    // Hiện khi trang đầu tiên đang tải code (route lazy)
    hydrateFallbackElement: <AppShellSkeleton />,
    // Lỗi ở chính layout (hiếm) — vẫn có trang báo lỗi thay màn hình mặc định
    errorElement: <RouteError />,
    children: [
      {
        // Lỗi trong trang (kể cả không tải được code trang) hiện bên trong layout — sidebar vẫn còn để chuyển trang khác
        errorElement: <RouteError />,
        children: [
          // Tải code từng trang khi mở tới (tách bundle)
          { index: true, lazy: async () => ({ Component: (await import("@/pages/dashboard")).DashboardPage }) },
          { path: "craft", lazy: async () => ({ Component: (await import("@/pages/craft")).CraftPage }) },
          { path: "inventory", lazy: async () => ({ Component: (await import("@/pages/inventory")).InventoryPage }) },
          { path: "orders", lazy: async () => ({ Component: (await import("@/pages/orders")).OrdersPage }) },
          { path: "discounts", lazy: async () => ({ Component: (await import("@/pages/discounts")).DiscountsPage }) },
          { path: "products", lazy: async () => ({ Component: (await import("@/pages/products")).ProductsPage }) },
          { path: "customers", lazy: async () => ({ Component: (await import("@/pages/customers")).CustomersPage }) },
          { path: ":section", element: <PlaceholderPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      {/* Thông báo nằm dưới vạch header của drawer (~57px) — không che nút đóng và tiêu đề */}
      <AntdApp message={{ top: 72 }}>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
