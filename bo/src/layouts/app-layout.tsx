import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Flex, Grid, Layout, Menu, Tag, Tooltip, Typography, type MenuProps } from "antd";
import { useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate, useNavigation } from "react-router";
import { GlobalSearch } from "@/components/header/global-search";
import { NotificationBell } from "@/components/header/notification-bell";
import { RouteSkeleton } from "@/components/skeletons";
import { useInventory } from "@/hooks/use-inventory";
import { useMessages } from "@/hooks/use-messages";
import { useStorefrontSync } from "@/hooks/use-storefront-sync";
import { useOrders } from "@/hooks/use-orders";
import { findNavItem, navGroups, type NavItem } from "@/layouts/nav";
import { logout, useSession } from "@/lib/auth";
import { brand, radius } from "@/theme";

const { Sider, Header, Content } = Layout;
const GAP = 16;

const buildMenu = (badges: Record<NonNullable<NavItem["badge"]>, number>): MenuProps["items"] =>
  navGroups.map((group) => ({
    type: "group",
    key: group.label,
    label: group.label,
    children: group.items.map((item) => ({
      key: item.path,
      icon: item.icon,
      className: item.sub ? "nav-sub" : undefined,
      label: (
        <Flex justify="space-between" align="center">
          {item.label}
          {item.badge && <Badge count={badges[item.badge]} size="small" />}
        </Flex>
      ),
    })),
  }));

// Khung bento: sidebar là thẻ nâu mocha bo tròn nổi trên nền kem (giữ logo bản sáng), header trong suốt
export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  // Lần render đầu useBreakpoint chưa có số đo — mặc định coi là desktop
  const mobile = screens.md === false;
  // Desktop: thu gọn còn icon. Mobile: sidebar ẩn hẳn, mở ra đè lên nội dung
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const siderCollapsed = mobile ? !open : collapsed;
  const compact = !mobile && collapsed;
  const current = findNavItem(pathname);
  // Đơn cần xử lý: chờ thanh toán, đã thanh toán nhưng xưởng chưa nhận làm, hoặc giao lỗi chờ quyết định
  const { orders, loading } = useOrders();
  // Nguyên liệu hết hàng — lựa chọn dùng chúng đang bị khóa trên web
  const inventory = useInventory();
  // Lời nhắn khách gửi ở web chưa xử lý
  const messages = useMessages();
  useStorefrontSync();
  const menuItems = buildMenu({
    orders: loading ? 0 : orders.filter((o) => ["pending", "paid", "delivery_failed", "returned"].includes(o.status)).length,
    inventory: inventory.loading ? 0 : inventory.materials.filter((m) => m.tracked && m.stock <= 0).length,
    messages: messages.loading ? 0 : messages.items.filter((m) => !m.handled).length,
  });
  // Đang tải code của trang sắp mở → hiện khung xương đúng trang đó thay vì giữ trang cũ
  const navigation = useNavigation();
  const session = useSession();
  // Đăng xuất ở tab khác hoặc hết phiên → về trang đăng nhập
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  const nextPath = navigation.state === "loading" ? navigation.location.pathname : null;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        className="app-sider"
        width={256}
        collapsedWidth={mobile ? 0 : 80}
        collapsed={siderCollapsed}
        trigger={null}
        style={{
          position: mobile ? "fixed" : "sticky",
          top: GAP,
          left: mobile ? GAP : undefined,
          margin: mobile ? 0 : `${GAP}px 0 ${GAP}px ${GAP}px`,
          height: `calc(100vh - ${GAP * 2}px)`,
          borderRadius: radius.card,
          // Chỉ phần menu cuộn; logo và khối tài khoản đứng yên
          overflow: "hidden",
          zIndex: 100,
          // Mobile khi ẩn: không chiếm chỗ, không để lộ góc bo
          visibility: mobile && !open ? "hidden" : undefined,
        }}
      >
        <Link to="/" aria-label="2510 Scented Candle — Back office">
          <Flex vertical align="center" gap={6} className="sider-brand" style={{ padding: compact ? "20px 0 16px" : "24px 0 18px" }}>
            {/* Thu gọn: chỉ chữ số 2510 có ngọn lửa; mở rộng: đủ logo kèm CANDLE */}
            <img src={compact ? "/logo-2510-mark-light.png" : "/logo-2510-light.png"} alt="2510 Candle" style={{ height: compact ? 30 : 64, width: "auto", transition: "height .2s ease-out" }} />
            {!compact && <Typography.Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, letterSpacing: "0.3em" }}>BACK OFFICE</Typography.Text>}
          </Flex>
        </Link>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={current ? [current.path] : []}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            setOpen(false);
          }}
          className="sider-menu"
          style={{ flex: 1, minHeight: 0, borderInlineEnd: 0 }}
        />

        <Flex
          align="center"
          gap={12}
          justify={compact ? "center" : "flex-start"}
          style={{ margin: 12, padding: compact ? 8 : "10px 8px 10px 12px", borderRadius: radius.inner, background: "rgba(255,255,255,0.1)", flexShrink: 0 }}
        >
          <Avatar style={{ background: brand.peanut, color: brand.ink, fontWeight: 600, flexShrink: 0 }}>AD</Avatar>
          {!compact && (
            <>
              <Flex vertical style={{ minWidth: 0, flex: 1 }}>
                <Typography.Text strong ellipsis style={{ color: "#fff" }}>
                  {session.name}
                </Typography.Text>
                <Tag color="#f3e6da" style={{ color: brand.mocha, width: "fit-content", marginTop: 2, fontSize: 11, lineHeight: "16px" }}>
                  Quản trị
                </Tag>
              </Flex>
              <Tooltip title="Đăng xuất">
                <Button
                  type="text"
                  aria-label="Đăng xuất"
                  icon={<LogoutOutlined />}
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                />
              </Tooltip>
            </>
          )}
        </Flex>
      </Sider>

      {mobile && open && <div aria-hidden onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 99 }} />}

      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 72,
            padding: mobile ? `0 ${GAP}px` : `${GAP}px ${GAP * 1.5}px 0`,
          }}
        >
          <Button
            type="text"
            aria-label={siderCollapsed ? "Mở menu" : "Thu gọn menu"}
            icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => (mobile ? setOpen((v) => !v) : setCollapsed((v) => !v))}
          />
          <Typography.Text type="secondary">{current?.label ?? "Không tìm thấy"}</Typography.Text>

          <Flex align="center" gap={8} style={{ marginLeft: "auto" }}>
            <GlobalSearch compact={mobile} />
            <NotificationBell compact={mobile} />
          </Flex>
        </Header>

        <Content style={{ padding: mobile ? GAP : `${GAP}px ${GAP * 1.5}px ${GAP * 1.5}px` }}>{nextPath && nextPath !== pathname ? <RouteSkeleton pathname={nextPath} /> : <Outlet />}</Content>
      </Layout>
    </Layout>
  );
}
