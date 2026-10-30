import {
  CopyOutlined,
  EnvironmentOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PlusOutlined,
  RightOutlined,
  StopOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Alert, App, Button, Col, Drawer, Flex, Form, Grid, Input, Modal, Result, Row, Select, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router";
import { CustomerAvatar, SegmentTag } from "@/components/customers/customer-view";
import { FormSection } from "@/components/form/form-section";
import { InfoRow } from "@/components/info-row";
import { ItemThumb, StatusTag } from "@/components/orders/order-view";
import { CustomerDetailSkeleton } from "@/components/skeletons";
import type { CustomersApi } from "@/hooks/use-customers";
import { tagSuggestions } from "@/lib/customers/mock";
import { favoriteItems, phoneKey, type CustomerRow } from "@/lib/customers/stats";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { itemCount } from "@/lib/orders/labels";
import { radius } from "@/theme";

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
    <Drawer
      open={open}
      onClose={onClose}
      title="Hồ sơ khách hàng"
      size={width}
      styles={{ header: { background: "#fff" }, body: { padding: screens.md ? 24 : 16 } }}
    >
      {(loading || (row && !ready)) && <CustomerDetailSkeleton />}
      {!loading && !row && (
        <Result
          status="404"
          title="Không tìm thấy khách hàng"
          subTitle="Hồ sơ có thể đã bị xóa hoặc đường dẫn không đúng."
          extra={<Button onClick={onClose}>Về danh sách khách</Button>}
        />
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
            { label: "Số đơn", value: String(stats.orderCount), hint: stats.cancelled ? `${stats.cancelled} đơn đã hủy` : undefined },
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

function OrdersSection({ row }: { row: CustomerRow }) {
  const navigate = useNavigate();
  const { orders } = row.stats;
  return (
    <FormSection title={`Đơn hàng (${orders.length})`} description={orders.length ? "Bấm một đơn để mở chi tiết." : undefined}>
      {/* Khách gọi / nhắn đặt thêm → tạo đơn với thông tin khách điền sẵn */}
      <Button icon={<PlusOutlined />} onClick={() => navigate(`/orders?order=new&customer=${row.customer.id}`)} style={{ marginBottom: 12 }}>
        Tạo đơn cho khách này
      </Button>
      {orders.length === 0 ? (
        <Typography.Text type="secondary">Khách chưa đặt đơn nào.</Typography.Text>
      ) : (
        <Flex vertical gap={4} role="list">
          {orders.map((o) => (
            <button key={o.id} type="button" role="listitem" className="list-row-button" onClick={() => navigate(`/orders?order=${o.id}`)}>
              <Flex vertical style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                <Flex gap={8} align="center" wrap>
                  <Typography.Text strong className="tabular">
                    {o.code}
                  </Typography.Text>
                  <StatusTag status={o.status} />
                </Flex>
                <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                  {dayjs(o.createdAt).format("DD/MM/YYYY")} · {itemCount(o)} sản phẩm · {o.items.map((i) => i.name).join(", ")}
                </Typography.Text>
              </Flex>
              <Typography.Text strong className="tabular" style={{ whiteSpace: "nowrap", opacity: o.status === "cancelled" ? 0.6 : 1 }}>
                {formatMoney(o.total)}
              </Typography.Text>
              <RightOutlined aria-hidden style={{ fontSize: 11, color: "#6b6b6b" }} />
            </button>
          ))}
        </Flex>
      )}
    </FormSection>
  );
}

function FavoritesSection({ row }: { row: CustomerRow }) {
  const items = favoriteItems(row.stats);
  if (!items.length) return null;
  return (
    <FormSection title="Hay mua" description="Theo số lượng, không tính đơn đã hủy.">
      <Flex vertical gap={12}>
        {items.map(({ item, quantity }) => (
          <Flex key={item.id} gap={12} align="center">
            <ItemThumb item={item} size={44} />
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text strong ellipsis>
                {item.name}
              </Typography.Text>
              {item.custom && (
                <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                  {item.custom}
                </Typography.Text>
              )}
            </Flex>
            <Typography.Text className="tabular">× {quantity}</Typography.Text>
          </Flex>
        ))}
      </Flex>
    </FormSection>
  );
}

function ContactSection({ row }: { row: CustomerRow }) {
  const { message } = App.useApp();
  const { customer: c, stats } = row;
  const copy = (text: string, what: string) =>
    navigator.clipboard?.writeText(text).then(
      () => message.success(`Đã sao chép ${what}`),
      () => message.error("Trình duyệt chặn sao chép"),
    );

  return (
    <FormSection title="Liên hệ">
      <Flex vertical gap={14}>
        <InfoRow icon={<PhoneOutlined />} label="Số điện thoại">
          <Flex align="center" gap={4}>
            <Typography.Text strong className="tabular">
              {c.phone}
            </Typography.Text>
            <Button type="text" size="small" icon={<CopyOutlined />} aria-label="Sao chép số điện thoại" onClick={() => copy(phoneKey(c.phone), "số điện thoại")} />
          </Flex>
        </InfoRow>
        <InfoRow icon={<MailOutlined />} label="Email">
          <Flex align="center" gap={4} style={{ minWidth: 0 }}>
            <Typography.Text ellipsis>{c.email}</Typography.Text>
            <Button type="text" size="small" icon={<CopyOutlined />} aria-label="Sao chép email" onClick={() => copy(c.email, "email")} />
          </Flex>
        </InfoRow>
        <InfoRow icon={<EnvironmentOutlined />} label={stats.addresses.length > 1 ? `Địa chỉ đã giao (${stats.addresses.length})` : "Địa chỉ giao"}>
          {stats.addresses.length ? (
            <Flex vertical gap={8}>
              {stats.addresses.map((a, i) => (
                <Flex key={a} vertical gap={2}>
                  <Typography.Text>
                    {a}
                    {i === 0 && stats.addresses.length > 1 && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {" "}
                        · gần nhất
                      </Typography.Text>
                    )}
                  </Typography.Text>
                  <Typography.Link href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                    Mở bản đồ
                  </Typography.Link>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Typography.Text type="secondary">Chưa có</Typography.Text>
          )}
        </InfoRow>
      </Flex>
    </FormSection>
  );
}

// Nhãn + ghi chú nội bộ: khách không thấy. Lưu bằng nút, có báo khi chưa lưu
function NotesSection({ row, api }: { row: CustomerRow; api: CustomersApi }) {
  const { message } = App.useApp();
  const { customer: c } = row;
  const [tags, setTags] = useState(c.tags);
  const [note, setNote] = useState(c.note ?? "");
  const dirty = note.trim() !== (c.note ?? "") || tags.join("|") !== c.tags.join("|");
  const options = [...new Set([...tagSuggestions, ...c.tags])].map((t) => ({ value: t, label: t }));

  return (
    <FormSection title="Nhãn & ghi chú" description="Chỉ nhân viên thấy — khách không thấy.">
      <Flex vertical gap={12}>
        <Select
          mode="tags"
          aria-label="Nhãn khách hàng"
          placeholder="Thêm nhãn, vd Mua quà tặng"
          value={tags}
          onChange={(v: string[]) => setTags(v.map((t) => t.trim()).filter(Boolean))}
          options={options}
          maxTagTextLength={24}
        />
        <Input.TextArea
          aria-label="Ghi chú nội bộ"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={500}
          showCount
          placeholder="VD: thích gói quà màu kem, hay đặt dịp sinh nhật tháng 5…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          // Chừa chỗ cho bộ đếm ký tự nằm dưới ô
          style={{ marginBottom: 12 }}
        />
        <Flex justify="flex-end" gap={8} align="center">
          {dirty && (
            <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: "auto" }}>
              Chưa lưu
            </Typography.Text>
          )}
          <Button
            type="primary"
            disabled={!dirty}
            onClick={() => {
              api.patch(c.id, { tags, note: note.trim() || undefined });
              message.success("Đã lưu nhãn & ghi chú");
            }}
          >
            Lưu
          </Button>
        </Flex>
      </Flex>
    </FormSection>
  );
}

function BlockModal({ open, name, onCancel, onBlock }: { open: boolean; name: string; onCancel: () => void; onBlock: (reason: string) => void }) {
  const [form] = Form.useForm<{ reason: string }>();
  return (
    <Modal
      open={open}
      title={`Chặn ${name} đặt hàng?`}
      okText="Chặn khách"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Khách sẽ không đặt được đơn mới trên web (cần BE kiểm tra lúc thanh toán). Đơn đang làm không bị ảnh hưởng.
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={(v) => onBlock(v.reason.trim())} preserve={false}>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, whitespace: true, message: "Ghi lý do để nhân viên khác hiểu." }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={200} placeholder="VD: bom hàng 2 lần, không nghe máy" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
