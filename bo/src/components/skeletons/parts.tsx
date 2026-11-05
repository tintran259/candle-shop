import { Card, Col, Flex, Row, Skeleton, Statistic, Typography } from "antd";
import type { CSSProperties, ReactNode } from "react";

// Khung xương có đúng bố cục từng trang để khi tải xong nội dung không bị nhảy chỗ

export function Busy({ label, children }: { label: string; children: ReactNode }) {
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
// actions: bề rộng từng nút bên phải (khớp số nút thật để xuống dòng giống trên mobile)
export function PageHeaderSkeleton({ action = true, subLines = 2, actions }: { action?: boolean; subLines?: 1 | 2; actions?: number[] }) {
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
      {actions ? (
        <Flex gap={8} wrap>
          {actions.map((w, i) => (
            <Skeleton.Button key={i} active style={{ width: w }} />
          ))}
        </Flex>
      ) : (
        action && <Skeleton.Button active style={{ width: 150 }} />
      )}
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
