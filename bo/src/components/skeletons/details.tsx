import { Alert, Card, Col, Flex, Row, Skeleton, Typography } from "antd";
import type { ReactNode } from "react";
import { CRAFT_PREVIEW_NOTICE } from "@/lib/craft/groups";
import { radius } from "@/theme";
import { Busy, Bar, PageHeaderSkeleton, StatsSkeleton, TableSkeleton } from "@/components/skeletons/parts";

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
        <PageHeaderSkeleton actions={[210]} />
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }, (_, i) => (
            <Col key={i} xs={12} xl={6}>
              <Card style={{ height: "100%" }}>
                <Flex vertical gap={8}>
                  <Bar width={110} />
                  <Bar width={70} height={24} />
                  <Bar width={60} />
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
        <KpiSkeleton />
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card title={<Bar width={90} height={16} />}>
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
  actions,
}: {
  label: string;
  statNote?: number | "all";
  toolbar: ReactNode;
  subLines?: 1 | 2;
  // Bề ngang các nút trên header (bỏ trống = một nút)
  actions?: number[];
}) {
  return (
    <Busy label={label}>
      <Flex vertical gap={16}>
        <PageHeaderSkeleton subLines={subLines} actions={actions} />
        <StatsSkeleton note={statNote} />
        {toolbar}
        <TableSkeleton />
      </Flex>
    </Busy>
  );
}

// Trình dựng Thủ công: đầu trang + thông báo + thống kê, rồi 2 cột (danh sách bước | trình sửa bước)
export function CraftSkeleton() {
  return (
    <Busy label="Đang tải trình dựng Thủ công…">
      <Flex vertical gap={16}>
        <PageHeaderSkeleton actions={[144, 125, 108]} />
        {/* Thông báo tĩnh — hiện luôn nội dung thật, cao đúng như khi tải xong */}
        <Alert type="info" showIcon title={CRAFT_PREVIEW_NOTICE} />
        <StatsSkeleton note={3} />
        <Row gutter={[16, 16]} align="top">
          <Col xs={24} lg={9} xl={7}>
            <Card title={<Bar width={90} height={16} />} extra={<Skeleton.Button active style={{ width: 120 }} />} styles={{ body: { padding: 12 } }}>
              <Flex vertical gap={6}>
                {Array.from({ length: 7 }, (_, i) => (
                  <Flex key={i} align="center" gap={10} style={{ height: 60, padding: "0 8px" }}>
                    <Skeleton.Avatar active size={24} />
                    <Flex vertical gap={6} style={{ flex: 1 }}>
                      <Bar width="55%" />
                      <Bar width="75%" height={10} />
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Card>
          </Col>
          <Col xs={24} lg={15} xl={17}>
            <Card title={<Bar width={160} height={16} />} styles={{ body: { paddingTop: 4 } }}>
              <Flex gap={32} align="center" style={{ height: 46, marginBottom: 16 }}>
                {[60, 70, 70].map((w, i) => (
                  <Bar key={i} width={w} />
                ))}
              </Flex>
              <TableSkeleton rows={5} />
            </Card>
          </Col>
        </Row>
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
