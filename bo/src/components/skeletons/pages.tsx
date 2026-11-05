import { Card, Col, Flex, Row, Skeleton, Typography } from "antd";
import { brand, radius } from "@/theme";
import { Busy, Bar, PageHeaderSkeleton, StatsSkeleton, ToolbarSkeleton, TableSkeleton } from "@/components/skeletons/parts";
import { DashboardSkeleton, ListPageSkeleton, CraftSkeleton } from "@/components/skeletons/details";

// Chọn khung theo đường dẫn — dùng khi đang chuyển trang (tải code trang)
// Khung riêng từng trang danh sách — trang và lúc chuyển trang dùng chung để không đổi khung giữa chừng.
// Kích thước ô lấy theo toolbar thật của trang (order-toolbar, product-toolbar, discounts).
export const OrdersSkeleton = () => (
  <ListPageSkeleton
    label="Đang tải đơn hàng…"
    statNote={1}
    actions={[124, 140]}
    toolbar={
      <ToolbarSkeleton
        tabs
        padding="4px 16px 16px"
        rows={[
          {
            fields: [{ flex: "1 1 260px" }, { flex: "1 1 150px", maxWidth: 220 }, { flex: "1 1 240px", maxWidth: 300 }, { flex: "1 1 150px", maxWidth: 220 }],
          },
        ]}
      />
    }
  />
);

export const ProductsSkeleton = () => (
  <ListPageSkeleton
    label="Đang tải sản phẩm…"
    toolbar={
      <ToolbarSkeleton
        rows={[
          { fields: [{ width: 300, maxWidth: "100%" }, { width: 240 }], justify: "space-between" },
          { fields: [{ flex: "1 1 240px" }, { flex: "0 1 160px", minWidth: 130 }, { flex: "0 1 150px", minWidth: 120 }] },
        ]}
      />
    }
  />
);

export const CancelledSkeleton = () => (
  <ListPageSkeleton label="Đang tải sản phẩm hủy đơn…" actions={[124]} toolbar={<ToolbarSkeleton rows={[{ fields: [{ width: 520, maxWidth: "100%" }, { flex: "1 1 240px" }] }]} />} />
);

export const SettingsSkeleton = () => (
  <Busy label="Đang tải cài đặt…">
    <Flex vertical gap={16}>
      <PageHeaderSkeleton actions={[118, 96]} />
      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={16}>
          <Flex vertical gap={16}>
            {[110, 130, 220].map((h) => (
              <Card key={h} styles={{ body: { minHeight: h } }}>
                <Bar width={140} height={16} />
                <div style={{ marginTop: 10 }}>
                  <Bar width="60%" />
                </div>
              </Card>
            ))}
          </Flex>
        </Col>
        <Col xs={24} lg={8}>
          <Card styles={{ body: { minHeight: 300 } }}>
            <Bar width={100} height={16} />
          </Card>
        </Col>
      </Row>
    </Flex>
  </Busy>
);

// Danh mục: đầu trang + bảng ngắn, không có thống kê và thanh lọc
export const CategoriesSkeleton = () => (
  <Busy label="Đang tải danh mục…">
    <Flex vertical gap={16}>
      <PageHeaderSkeleton subLines={1} actions={[130, 150]} />
      <TableSkeleton rows={3} thumb={false} />
    </Flex>
  </Busy>
);

export const DiscountsSkeleton = () => (
  <ListPageSkeleton
    label="Đang tải mã giảm giá…"
    statNote={0}
    subLines={1}
    toolbar={<ToolbarSkeleton rows={[{ fields: [{ width: 560, maxWidth: "100%" }, { flex: "1 1 220px" }, { flex: "0 1 170px", minWidth: 150 }] }]} />}
  />
);

export const CustomersSkeleton = () => (
  <ListPageSkeleton
    label="Đang tải khách hàng…"
    statNote="all"
    toolbar={
      <ToolbarSkeleton
        rows={[
          { fields: [{ width: 640, maxWidth: "100%" }] },
          {
            fields: [{ flex: "1 1 260px" }, { flex: "0 1 160px", minWidth: 140 }, { flex: "0 1 170px", minWidth: 130 }, { flex: "0 1 160px", minWidth: 140 }],
          },
        ]}
      />
    }
  />
);

// Thẻ "Cần nhập thêm" (trang Kho): đầu thẻ + lưới ô cùng kích thước ô thật
function RestockSkeleton() {
  return (
    <Card styles={{ body: { padding: 20 } }}>
      <Flex align="center" gap={12}>
        <Skeleton.Avatar active shape="square" size={40} style={{ borderRadius: 12 }} />
        <Flex vertical>
          <Typography.Text strong style={{ fontSize: 17 }}>
            <Bar width={130} height={16} />
          </Typography.Text>
          <Typography.Text style={{ fontSize: 13 }}>
            <Bar width={260} height={12} />
            <span className="skel-mobile-line">
              <Bar width={120} height={12} />
            </span>
          </Typography.Text>
        </Flex>
      </Flex>
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Col key={i} xs={24} sm={12} lg={8} xxl={6}>
            <Skeleton.Input active block style={{ height: 118, borderRadius: 16 }} />
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export const InventorySkeleton = () => (
  <Busy label="Đang tải kho nguyên liệu…">
    <Flex vertical gap={16}>
      <PageHeaderSkeleton subLines={2} actions={[124, 112, 176]} />
      <StatsSkeleton />
      <RestockSkeleton />
      <ToolbarSkeleton rows={[{ fields: [{ width: 720, maxWidth: "100%" }] }, { fields: [{ flex: "1 1 260px" }, { flex: "0 1 180px", minWidth: 140 }, { flex: "0 1 180px", minWidth: 150 }] }]} />
      <TableSkeleton />
    </Flex>
  </Busy>
);

export function RouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname === "/") return <DashboardSkeleton />;
  if (pathname.startsWith("/craft")) return <CraftSkeleton />;
  if (pathname.startsWith("/orders")) return <OrdersSkeleton />;
  if (pathname.startsWith("/products")) return <ProductsSkeleton />;
  if (pathname.startsWith("/cancelled-products")) return <CancelledSkeleton />;
  if (pathname.startsWith("/settings")) return <SettingsSkeleton />;
  if (pathname.startsWith("/discounts")) return <DiscountsSkeleton />;
  if (pathname.startsWith("/categories")) return <CategoriesSkeleton />;
  if (pathname.startsWith("/customers")) return <CustomersSkeleton />;
  if (pathname.startsWith("/inventory/movements"))
    return <ListPageSkeleton label="Đang tải phiếu kho…" toolbar={<ToolbarSkeleton rows={[{ fields: [{ flex: "1 1 260px" }, { width: 160 }, { width: 200 }, { width: 240 }] }]} />} />;
  if (pathname.startsWith("/inventory")) return <InventorySkeleton />;
  return <ListPageSkeleton label="Đang tải trang…" toolbar={<ToolbarSkeleton rows={[{ fields: [{ flex: "1 1 260px" }, { width: 150 }] }]} />} />;
}

// Lần mở app đầu tiên: khung sidebar + nội dung
export function AppShellSkeleton() {
  return (
    <Flex style={{ minHeight: "100vh", background: brand.page }}>
      <div aria-hidden className="shell-sider" style={{ borderRadius: radius.card, background: brand.mocha, flexShrink: 0 }} />
      <div className="shell-content" style={{ flex: 1, minWidth: 0 }}>
        <RouteSkeleton pathname={window.location.pathname} />
      </div>
    </Flex>
  );
}
