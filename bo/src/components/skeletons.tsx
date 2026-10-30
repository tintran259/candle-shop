import { Alert, Card, Col, Flex, Row, Skeleton, Statistic, Typography } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { CRAFT_PREVIEW_NOTICE } from "@/lib/craft/groups";
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

// Thanh xám nằm bên trong chính component chữ của trang thật (Title, Statistic…):
// chiều cao dòng do chữ thật quyết định nên khi tải xong khung không bị nhảy.
export function Bar({ width, height = 14, block }: { width: number | string; height?: number; block?: boolean }) {
  return <span aria-hidden className="skel-bar" style={{ width, height, display: block ? "block" : undefined }} />;
}

// Giống tiêu đề các trang: Title cấp 3 + mô tả (mobile mô tả thường xuống 2 dòng)
export function PageHeaderSkeleton({ action = true, subLines = 2 }: { action?: boolean; subLines?: 1 | 2 }) {
  return (
    <Flex justify="space-between" align="flex-end" gap={16} wrap>
      <div style={{ minWidth: 0 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          <Bar width={220} height={24} />
        </Typography.Title>
        <Typography.Text>
          <Bar width={420} />
          {subLines === 2 && (
            <span className="skel-mobile-line">
              <Bar width={160} />
            </span>
          )}
        </Typography.Text>
      </div>
      {action && <Skeleton.Button active style={{ width: 150 }} />}
    </Flex>
  );
}

// Giống hàng thẻ Statistic; note = vị trí thẻ có dòng ghi chú bên dưới (vd "2 đơn trễ hạn"), "all" = mọi thẻ
export function StatsSkeleton({ count = 4, note }: { count?: number; note?: number | "all" }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }, (_, i) => (
        <Col key={i} xs={12} lg={24 / count}>
          <Card style={{ height: "100%" }}>
            <Statistic title={<Bar width={90} />} valueRender={() => <Bar width={72} height={28} />} />
            {(note === i || note === "all") && (
              <Typography.Text style={{ fontSize: 13 }}>
                <Bar width={110} height={12} />
              </Typography.Text>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// Mỗi ô là một control cao 36px, dùng cùng quy tắc flex với toolbar thật để xuống dòng giống hệt trên mobile
type FieldRow = { fields: CSSProperties[]; justify?: "space-between" };

export function ToolbarSkeleton({ rows, tabs, padding = 16 }: { rows: FieldRow[]; tabs?: boolean; padding?: number | string }) {
  return (
    <Card styles={{ body: { padding } }}>
      {tabs && (
        // Thanh tab cao 48, cách nội dung 16 như Tabs thật
        <Flex gap={32} align="center" style={{ height: 48, marginBottom: 16, overflow: "hidden" }}>
          {Array.from({ length: 6 }, (_, i) => (
            <Bar key={i} width={88} />
          ))}
        </Flex>
      )}
      <Flex vertical gap={12}>
        {rows.map((row, r) => (
          <Flex key={r} wrap gap={12} justify={row.justify}>
            {row.fields.map((style, i) => (
              <div key={i} style={{ minWidth: 0, ...style }}>
                <Skeleton.Input active block style={{ minWidth: 0 }} />
              </div>
            ))}
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

// Giống thẻ KPI của dashboard: tiêu đề → số lớn → so sánh → link ở đáy
function KpiSkeleton() {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: 4 }, (_, i) => (
        <Col key={i} xs={24} sm={12} xl={6}>
          <Card style={{ height: "100%" }}>
            <Flex vertical gap={8} style={{ height: "100%" }}>
              <Typography.Text strong style={{ fontSize: 17 }}>
                <Bar width={110} height={16} />
              </Typography.Text>
              <span className="big-number" style={{ fontSize: 40, lineHeight: 1.15 }}>
                <Bar width={150} height={34} />
              </span>
              <Typography.Text>
                <Bar width={180} />
              </Typography.Text>
              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <Typography.Text>
                  <Bar width={120} />
                </Typography.Text>
              </div>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function DashboardSkeleton() {
  return (
    <Busy label="Đang tải dashboard…">
      <Flex vertical gap={16}>
        <PageHeaderSkeleton action={false} />
        <KpiSkeleton />
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card title={<Bar width={90} height={16} />} extra={<Skeleton.Button active size="small" style={{ width: 150 }} />}>
              <span className="big-number" style={{ fontSize: 40, lineHeight: 1.15, display: "block" }}>
                <Bar width={170} height={34} />
              </span>
              <Typography.Text>
                <Bar width={110} />
              </Typography.Text>
              <Skeleton.Input active block style={{ height: 280, marginTop: 16 }} />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card title={<Bar width={120} height={16} />} extra={<Bar width={70} />} style={{ height: "100%" }}>
              <Flex vertical gap={10}>
                {[100, 80, 56].map((w) => (
                  <Bar key={w} block width={`${w}%`} height={40} />
                ))}
              </Flex>
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

// statNote: vị trí thẻ thống kê có ghi chú; toolbar: khung thanh lọc của trang; subLines: số dòng mô tả trên mobile
export function ListPageSkeleton({
  label,
  statNote,
  toolbar,
  subLines = 2,
}: {
  label: string;
  statNote?: number | "all";
  toolbar: ReactNode;
  subLines?: 1 | 2;
}) {
  return (
    <Busy label={label}>
      <Flex vertical gap={16}>
        <PageHeaderSkeleton subLines={subLines} />
        <StatsSkeleton note={statNote} />
        {toolbar}
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
        {/* Thông báo tĩnh — hiện luôn nội dung thật, cao đúng như khi tải xong */}
        <Alert type="info" showIcon title={CRAFT_PREVIEW_NOTICE} />
        <StatsSkeleton />
        {/* Thẻ "Cần nhập thêm": đầu thẻ + lưới ô cùng kích thước ô thật */}
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
        {/* Thanh tab cao 48 như Tabs thật */}
        <Flex gap={24} align="center" style={{ height: 48 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Bar key={i} width={80} />
          ))}
        </Flex>
        <TableSkeleton rows={5} />
      </Flex>
    </Busy>
  );
}

// Drawer form (sản phẩm, mã giảm giá, nguyên liệu) trong nhịp đầu khi đang trượt ra
export function DrawerFormSkeleton() {
  return (
    <Busy label="Đang mở biểu mẫu…">
      <Flex vertical gap={16}>
        <Skeleton.Input active block style={{ height: 160, borderRadius: radius.card }} />
        {[3, 2, 4].map((rows, i) => (
          <Card key={i}>
            <Skeleton active title={{ width: 160 }} paragraph={{ rows }} />
          </Card>
        ))}
      </Flex>
    </Busy>
  );
}

// Hồ sơ khách (trong drawer): thẻ tổng quan + 4 ô số liệu, rồi 2 cột thẻ
export function CustomerDetailSkeleton() {
  const card = (rows: number) => (
    <Card>
      <Skeleton active title={{ width: 140 }} paragraph={{ rows }} />
    </Card>
  );
  return (
    <Busy label="Đang tải hồ sơ khách…">
      <Flex vertical gap={16}>
        <Card styles={{ body: { padding: 20 } }}>
          <Flex gap={16} align="center">
            <Skeleton.Avatar active size={64} />
            <Flex vertical gap={8} style={{ flex: 1 }}>
              <Skeleton.Input active style={{ width: 200, height: 28 }} />
              <Skeleton.Input active size="small" style={{ width: 260, maxWidth: "60vw" }} />
            </Flex>
          </Flex>
          <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Col key={i} xs={12} md={6}>
                <Skeleton.Input active block style={{ height: 72, borderRadius: radius.inner }} />
              </Col>
            ))}
          </Row>
        </Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Flex vertical gap={16}>
              {card(6)}
              {card(3)}
            </Flex>
          </Col>
          <Col xs={24} lg={9}>
            <Flex vertical gap={16}>
              {card(4)}
              {card(3)}
            </Flex>
          </Col>
        </Row>
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
// Khung riêng từng trang danh sách — trang và lúc chuyển trang dùng chung để không đổi khung giữa chừng.
// Kích thước ô lấy theo toolbar thật của trang (order-toolbar, product-toolbar, discounts).
export const OrdersSkeleton = () => (
  <ListPageSkeleton
    label="Đang tải đơn hàng…"
    statNote={1}
    toolbar={
      <ToolbarSkeleton
        tabs
        padding="4px 16px 16px"
        rows={[
          {
            fields: [
              { flex: "1 1 260px" },
              { flex: "1 1 150px", maxWidth: 220 },
              { flex: "1 1 240px", maxWidth: 300 },
              { flex: "1 1 150px", maxWidth: 220 },
            ],
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
            fields: [
              { flex: "1 1 260px" },
              { flex: "0 1 160px", minWidth: 140 },
              { flex: "0 1 170px", minWidth: 130 },
              { flex: "0 1 160px", minWidth: 140 },
            ],
          },
        ]}
      />
    }
  />
);

export function RouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname === "/") return <DashboardSkeleton />;
  if (pathname.startsWith("/craft")) return <CraftSkeleton />;
  if (pathname.startsWith("/orders")) return <OrdersSkeleton />;
  if (pathname.startsWith("/products")) return <ProductsSkeleton />;
  if (pathname.startsWith("/discounts")) return <DiscountsSkeleton />;
  if (pathname.startsWith("/customers")) return <CustomersSkeleton />;
  return <ListPageSkeleton label="Đang tải trang…" toolbar={<ToolbarSkeleton rows={[{ fields: [{ flex: "1 1 260px" }, { width: 150 }] }]} />} />;
}

// Lần mở app đầu tiên: khung sidebar + nội dung
export function AppShellSkeleton() {
  return (
    <Flex style={{ minHeight: "100vh", background: brand.page }}>
      <div
        aria-hidden
        className="shell-sider"
        style={{ borderRadius: radius.card, background: brand.mocha, flexShrink: 0 }}
      />
      <div className="shell-content" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <RouteSkeleton pathname={window.location.pathname} />
        </div>
      </div>
    </Flex>
  );
}
