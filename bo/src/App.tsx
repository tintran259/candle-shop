import { App as AntdApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppShellSkeleton } from "@/components/skeletons";
import { AppLayout } from "@/layouts/app-layout";
import { NotFoundPage, PlaceholderPage } from "@/pages/placeholder";
import { theme } from "@/theme";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    // Hiện khi trang đầu tiên đang tải code (route lazy)
    hydrateFallbackElement: <AppShellSkeleton />,
    children: [
      // Tải code từng trang khi mở tới (tách bundle)
      { index: true, lazy: async () => ({ Component: (await import("@/pages/dashboard")).DashboardPage }) },
      { path: "craft", lazy: async () => ({ Component: (await import("@/pages/craft")).CraftPage }) },
      { path: "orders", lazy: async () => ({ Component: (await import("@/pages/orders")).OrdersPage }) },
      { path: "discounts", lazy: async () => ({ Component: (await import("@/pages/discounts")).DiscountsPage }) },
      { path: "products", lazy: async () => ({ Component: (await import("@/pages/products")).ProductsPage }) },
      { path: ":section", element: <PlaceholderPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
