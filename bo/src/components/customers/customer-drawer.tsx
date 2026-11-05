import { MailOutlined, MessageOutlined, PhoneOutlined, StopOutlined, UnlockOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Drawer, Flex, Grid, Result, Row, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useDeferredValue, useState } from "react";
import { CustomerAvatar, SegmentTag } from "@/components/customers/customer-view";
import { FormSection } from "@/components/form/form-section";
import { CustomerDetailSkeleton } from "@/components/skeletons";
import type { CustomersApi } from "@/hooks/use-customers";
import { phoneKey, type CustomerRow } from "@/lib/customers/stats";
import { formatMoneyShort } from "@/lib/format";
import { radius } from "@/theme";
import { CodesSection, OrdersSection, FavoritesSection, ContactSection, NotesSection, BlockModal } from "@/components/customers/customer-sections";

type Props = { open: boolean; row?: CustomerRow; api: CustomersApi; loading: boolean; onClose: () => void };

// Hồ sơ khách: tổng quan mua hàng, lịch sử đơn, liên hệ, ghi chú nội bộ. Màn rộng chia 2 cột như drawer đơn hàng.
export function CustomerDrawer({ open, row, api, loading, onClose }: Props) {
  const screens = Grid.useBreakpoint();
  const width = screens.xl ? 1000 : screens.lg ? 900 : "100%";
  // Drawer trượt ra ngay với khung xương, nội dung render sau ở chế độ ưu tiên thấp (giống drawer đơn hàng)
  const id = row?.customer.id;
  const readyId = useDeferredValue(id, undefined);
  const ready = !!row && readyId === id;

  return (
    <Drawer open={open} onClose={onClose} title="Hồ sơ khách hàng" size={width} styles={{ header: { background: "#fff" }, body: { padding: screens.md ? 24 : 16 } }}>
      {(loading || (row && !ready)) && <CustomerDetailSkeleton />}
      {!loading && !row && (
        <Result status="404" title="Không tìm thấy khách hàng" subTitle="Hồ sơ có thể đã bị xóa hoặc đường dẫn không đúng." extra={<Button onClick={onClose}>Về danh sách khách</Button>} />
      )}
      {!loading && row && ready && <Profile row={row} api={api} />}
    </Drawer>
  );
}

function Profile({ row, api }: { row: CustomerRow; api: CustomersApi }) {
  const { customer: c, stats } = row;
  const [blocking, setBlocking] = useState(false);
  const phone = phoneKey(c.phone);
  const screens = Grid.useBreakpoint();

  return (
    <Flex vertical gap={16}>
      {c.blocked && (
        <Alert
          type="error"
          showIcon
          icon={<StopOutlined />}
          title="Khách đang bị chặn đặt hàng"
          description={c.blockReason}
          action={
            <Button size="small" icon={<UnlockOutlined />} onClick={() => api.setBlocked(c.id, false)}>
              Bỏ chặn
            </Button>
          }
        />
      )}

      {/* Đầu hồ sơ: ai, thuộc nhóm nào, liên hệ nhanh */}
      <section style={{ background: "#fff", borderRadius: radius.card, padding: 20 }} aria-label="Tổng quan">
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex gap={16} align="center" style={{ minWidth: 0 }}>
            <CustomerAvatar customer={c} size={64} />
            <Flex vertical gap={6} style={{ minWidth: 0 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {c.name}
              </Typography.Title>
              <Flex gap={6} wrap align="center">
                <SegmentTag segment={stats.segment} blocked={c.blocked} />
                {c.tags.map((t) => (
                  <Tag key={t} style={{ marginInlineEnd: 0 }}>
                    {t}
                  </Tag>
                ))}
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {c.hasAccount ? "Có tài khoản" : "Khách vãng lai"} · khách từ {dayjs(c.createdAt).format("DD/MM/YYYY")}
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex gap={8} style={{ flex: screens.md ? undefined : "1 1 100%" }}>
            <Button icon={<PhoneOutlined />} href={`tel:${phone}`} style={{ flex: 1 }}>
              Gọi
            </Button>
            <Button icon={<MessageOutlined />} href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
              Zalo
            </Button>
            <Button icon={<MailOutlined />} href={`mailto:${c.email}`} style={{ flex: 1 }}>
              Email
            </Button>
          </Flex>
        </Flex>

        {/* Số liệu mua hàng */}
        <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
          {[
            { label: "Đã chi", value: stats.spent ? formatMoneyShort(stats.spent) : "—", hint: "Gồm tiền cọc, trừ đơn hủy" },
            {
              label: "Số đơn",
              value: String(stats.orderCount),
              hint: [stats.cancelled && `${stats.cancelled} đơn đã hủy`, stats.failedDeliveries && `${stats.failedDeliveries} lần giao không thành`].filter(Boolean).join(" · ") || undefined,
            },
            { label: "Trung bình / đơn", value: stats.average ? formatMoneyShort(stats.average) : "—" },
            {
              label: "Đơn gần nhất",
              value: stats.lastOrderAt ? dayjs(stats.lastOrderAt).fromNow() : "Chưa đặt",
              hint: stats.firstOrderAt ? `Đơn đầu ${dayjs(stats.firstOrderAt).format("DD/MM/YYYY")}` : undefined,
            },
          ].map((f) => (
            <Col key={f.label} xs={12} md={6} style={{ display: "flex" }}>
              <Flex vertical style={{ flex: 1, background: "#f6f6f3", borderRadius: radius.inner, padding: "12px 14px" }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {f.label}
                </Typography.Text>
                <Typography.Text strong className="tabular" style={{ fontSize: 18 }}>
                  {f.value}
                </Typography.Text>
                {f.hint && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {f.hint}
                  </Typography.Text>
                )}
              </Flex>
            </Col>
          ))}
        </Row>
      </section>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Flex vertical gap={16}>
            <OrdersSection row={row} />
            <FavoritesSection row={row} />
          </Flex>
        </Col>
        <Col xs={24} lg={9}>
          <Flex vertical gap={16}>
            <ContactSection row={row} />
            <NotesSection key={c.id} row={row} api={api} />
            <CodesSection customerId={c.id} />
            <FormSection title="Tài khoản">
              <Flex vertical gap={10}>
                <Flex justify="space-between">
                  <Typography.Text type="secondary">Loại</Typography.Text>
                  <Typography.Text>{c.hasAccount ? "Có tài khoản trên web" : "Vãng lai (không đăng nhập)"}</Typography.Text>
                </Flex>
                <Flex justify="space-between">
                  <Typography.Text type="secondary">Nhận email ưu đãi</Typography.Text>
                  <Typography.Text>{c.newsletter ? "Có" : "Không"}</Typography.Text>
                </Flex>
                {!c.blocked && (
                  <Button danger icon={<StopOutlined />} onClick={() => setBlocking(true)} style={{ marginTop: 8 }}>
                    Chặn đặt hàng
                  </Button>
                )}
              </Flex>
            </FormSection>
          </Flex>
        </Col>
      </Row>

      <BlockModal
        open={blocking}
        name={c.name}
        onCancel={() => setBlocking(false)}
        onBlock={(reason) => {
          api.setBlocked(c.id, true, reason);
          setBlocking(false);
        }}
      />
    </Flex>
  );
}
