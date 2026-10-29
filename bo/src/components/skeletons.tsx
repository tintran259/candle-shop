import { Card, Col, Flex, Row, Skeleton } from "antd";
import type { ReactNode } from "react";
import { brand, radius } from "@/theme";

// Khung xương có đúng bố cục từng trang để khi tải xong nội dung không bị nhảy chỗ

function Busy({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <Flex justify="space-between" align="flex-end" gap={16} wrap>
      <Flex vertical gap={8}>
        <Skeleton.Input active style={{ width: 220, height: 30 }} />
        <Skeleton.Input active size="small" style={{ width: 360, maxWidth: "70vw" }} />
      </Flex>
      {action && <Skeleton.Button active style={{ width: 150 }} />}
    </Flex>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }, (_, i) => (
        <Col key={i} xs={12} lg={24 / count}>
          <Card>
            <Skeleton.Input active size="small" style={{ width: 100 }} />
            <div style={{ height: 12 }} />
            <Skeleton.Input active style={{ width: 80, height: 44 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function ToolbarSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={12}>
        {Array.from({ length: rows }, (_, r) => (
          <Flex key={r} gap={12} wrap>
            <Skeleton.Input active style={{ width: r === 0 ? 320 : "min(560px, 100%)" }} />
            <Skeleton.Input active style={{ width: 150 }} />
            <Skeleton.Input active style={{ width: 150 }} />
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}

// Bảng: mỗi dòng gồm ảnh nhỏ + 2 dòng chữ + vài cột
export function TableSkeleton({ rows = 6, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <Card styles={{ body: { padding: 20 } }}>
      <Flex vertical gap={18}>
        {Array.from({ length: rows }, (_, i) => (
          <Flex key={i} align="center" gap={16}>
            {thumb && <Skeleton.Avatar active shape="square" size={44} style={{ borderRadius: 12 }} />}
            <Flex vertical gap={6} style={{ flex: 2, minWidth: 0 }}>
              <Skeleton.Input active size="small" style={{ width: "60%", minWidth: 0 }} block />
              <Skeleton.Input active size="small" style={{ width: "35%", minWidth: 0, height: 14 }} block />
            </Flex>
            {/* Các cột co giãn theo bề rộng thẻ để không tràn ở cột hẹp */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton.Input active size="small" block style={{ minWidth: 0 }} />
            </div>
            <div style={{ flex: 0.8, minWidth: 0 }}>
              <Skeleton.Input active size="small" block style={{ minWidth: 0 }} />
            </div>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <Busy label="Đang tải dashboard…">
      <Flex vertical gap={16}>
        <PageHeaderSkeleton action={false} />
        <StatsSkeleton />
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton.Input active block style={{ height: 240 }} />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card style={{ height: "100%" }}>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <TableSkeleton rows={5} thumb={false} />
          </Col>
          <Col xs={24} xl={8}>
            <TableSkeleton rows={4} />
          </Col>
        </Row>
      </Flex>
    </Busy>
  );
}

export function ListPageSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label}>
      <Flex vertical gap={16}>
        <PageHeaderSkeleton />
        <StatsSkeleton />
        <ToolbarSkeleton />
        <TableSkeleton />
      </Flex>
    </Busy>
  );
}

export function CraftSkeleton() {
  return (
    <Busy label="Đang tải nguyên liệu…">
      <Flex vertical gap={16}>
        <PageHeaderSkeleton />
        <Skeleton.Input active block style={{ height: 44, borderRadius: radius.inner }} />
        <StatsSkeleton />
        <Card>
          <Skeleton active avatar paragraph={{ rows: 1 }} />
          <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Col key={i} xs={24} sm={12} lg={8}>
                <Skeleton.Input active block style={{ height: 96, borderRadius: 16 }} />
              </Col>
            ))}
          </Row>
        </Card>
        <Flex gap={24}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton.Input key={i} active size="small" style={{ width: 80 }} />
          ))}
        </Flex>
        <TableSkeleton rows={5} />
      </Flex>
    </Busy>
  );
}

// Chi tiết đơn (trong drawer): thẻ tiến trình 6 bước + 2 cột thẻ
export function OrderDetailSkeleton() {
  const card = (rows: number) => (
    <Card>
      <Skeleton active title={{ width: 140 }} paragraph={{ rows }} />
    </Card>
  );
  return (
    <Busy label="Đang tải chi tiết đơn…">
      <Flex vertical gap={16}>
        <Card styles={{ body: { padding: 24 } }}>
          <Flex justify="space-between" gap={16} wrap>
            <Flex vertical gap={8}>
              <Skeleton.Input active style={{ width: 180, height: 28 }} />
              <Skeleton.Input active size="small" style={{ width: 260 }} />
              <Skeleton.Input active size="small" style={{ width: 320, maxWidth: "70vw" }} />
            </Flex>
            <Flex gap={8}>
              <Skeleton.Button active style={{ width: 100 }} />
              <Skeleton.Button active size="large" style={{ width: 160 }} />
            </Flex>
          </Flex>
          <Flex justify="space-between" style={{ marginTop: 28 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <Flex key={i} vertical align="center" gap={8}>
                <Skeleton.Avatar active size={24} />
                <Skeleton.Input active size="small" style={{ width: 64, minWidth: 0 }} />
              </Flex>
            ))}
          </Flex>
        </Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Flex vertical gap={16}>
              {card(4)}
              {card(5)}
            </Flex>
          </Col>
          <Col xs={24} lg={9}>
            <Flex vertical gap={16}>
              {card(5)}
              {card(4)}
            </Flex>
          </Col>
        </Row>
      </Flex>
    </Busy>
  );
}

// Chọn khung theo đường dẫn — dùng khi đang chuyển trang (tải code trang)
export function RouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname === "/") return <DashboardSkeleton />;
  if (pathname.startsWith("/craft")) return <CraftSkeleton />;
  return <ListPageSkeleton label="Đang tải trang…" />;
}

// Lần mở app đầu tiên: khung sidebar + nội dung
export function AppShellSkeleton() {
  return (
    <Flex style={{ minHeight: "100vh", background: brand.page }}>
      <div
        aria-hidden
        className="shell-sider"
        style={{ width: 256, margin: 16, borderRadius: radius.card, background: brand.mocha, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0, padding: "88px 24px 24px" }}>
        <RouteSkeleton pathname={window.location.pathname} />
      </div>
    </Flex>
  );
}
