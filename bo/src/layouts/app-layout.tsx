import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Flex, Grid, Layout, Menu, Tag, Tooltip, Typography, type MenuProps } from "antd";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useNavigation } from "react-router";
import { GlobalSearch } from "@/components/header/global-search";
import { NotificationBell } from "@/components/header/notification-bell";
import { RouteSkeleton } from "@/components/skeletons";
import { useOrders } from "@/hooks/use-orders";
import { findNavItem, navGroups, type NavItem } from "@/layouts/nav";
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
  // Đơn cần xử lý: chờ thanh toán hoặc đã thanh toán nhưng xưởng chưa nhận làm
  const { orders, loading } = useOrders();
  const menuItems = buildMenu({ orders: loading ? 0 : orders.filter((o) => o.status === "pending" || o.status === "paid").length });
  // Đang tải code của trang sắp mở → hiện khung xương đúng trang đó thay vì giữ trang cũ
  const navigation = useNavigation();
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
          overflow: "auto",
          zIndex: 100,
          // Mobile khi ẩn: không chiếm chỗ, không để lộ góc bo
          visibility: mobile && !open ? "hidden" : undefined,
        }}
      >
        <Link to="/" aria-label="2510 Scented Candle — Back office">
          <Flex vertical align="center" gap={8} style={{ padding: compact ? "20px 0 16px" : "28px 0 20px" }}>
            <img
              src="/logo-2510-vertical-light.png"
              alt="2510 Scented Candle"
              style={{ height: compact ? 32 : 60, width: "auto", transition: "height .2s ease-out" }}
            />
            {!compact && (
              <Typography.Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, letterSpacing: "0.24em" }}>
                BACK OFFICE
              </Typography.Text>
            )}
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
          style={{ flex: 1, borderInlineEnd: 0 }}
        />

        <Flex
          align="center"
          gap={12}
          justify={compact ? "center" : "flex-start"}
          style={{ margin: 12, padding: 12, borderRadius: radius.inner, background: "rgba(255,255,255,0.1)" }}
        >
          <Avatar style={{ background: brand.peanut, color: brand.ink, fontWeight: 600, flexShrink: 0 }}>AD</Avatar>
          {!compact && (
            <>
              <Flex vertical style={{ minWidth: 0, flex: 1 }}>
                <Typography.Text strong ellipsis style={{ color: "#fff" }}>
                  Admin 2510
                </Typography.Text>
                <Tag color="#f3e6da" style={{ color: brand.mocha, width: "fit-content", marginTop: 2, fontSize: 11, lineHeight: "16px" }}>
                  Quản trị
                </Tag>
              </Flex>
              <Tooltip title="Đăng xuất">
                <Button type="text" aria-label="Đăng xuất" icon={<LogoutOutlined />} style={{ color: "rgba(255,255,255,0.85)" }} />
              </Tooltip>
            </>
          )}
        </Flex>
      </Sider>

      {mobile && open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 99 }}
        />
      )}

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

        <Content style={{ padding: mobile ? GAP : `${GAP}px ${GAP * 1.5}px ${GAP * 1.5}px` }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {nextPath && nextPath !== pathname ? <RouteSkeleton pathname={nextPath} /> : <Outlet />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
