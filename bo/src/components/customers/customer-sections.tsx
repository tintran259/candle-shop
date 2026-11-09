import { CopyOutlined, EnvironmentOutlined, MailOutlined, PhoneOutlined, PlusOutlined, RightOutlined, GiftOutlined } from "@ant-design/icons";
import { App, Button, Flex, Form, Input, Modal, Select, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { InfoRow } from "@/components/info-row";
import { ItemThumb, StatusTag } from "@/components/orders/order-view";
import type { CustomersApi } from "@/hooks/use-customers";
import { useDiscounts } from "@/hooks/use-discounts";
import { conditionText, discountStatus, statusMeta, valueText } from "@/lib/discounts/labels";
import { tagSuggestions } from "@/lib/customers/mock";
import { favoriteItems, phoneKey, type CustomerRow } from "@/lib/customers/stats";
import { formatMoney } from "@/lib/format";
import { itemCount } from "@/lib/orders/labels";

// Các khối trong hồ sơ khách (customer-drawer.tsx)
// Mã giảm giá dành riêng cho khách này (Mã giảm giá › Ai dùng được › Khách được chọn)
export function CodesSection({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const { discounts } = useDiscounts();
  const own = discounts.filter((d) => d.customerIds?.includes(customerId));
  return (
    <FormSection title={`Mã giảm giá riêng (${own.length})`} description="Chỉ khách này dùng được. Khi tạo đơn cho khách, mã hiện ngay dưới ô Mã giảm giá.">
      <Flex vertical gap={10} role="list" aria-label="Mã giảm giá riêng">
        {own.map((d) => {
          const status = statusMeta[discountStatus(d)];
          return (
            <Flex key={d.id} role="listitem" justify="space-between" align="center" gap={8}>
              <Flex vertical style={{ minWidth: 0 }}>
                <Typography.Link strong className="tabular" onClick={() => navigate(`/discounts?edit=${d.id}`)}>
                  {d.code} {valueText(d)}
                </Typography.Link>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {conditionText(d)}
                </Typography.Text>
              </Flex>
              <Tag color={status.color} style={{ marginInlineEnd: 0 }}>
                {status.label}
              </Tag>
            </Flex>
          );
        })}
        <Button icon={<GiftOutlined />} onClick={() => navigate(`/discounts?edit=new&customer=${customerId}`)} style={{ alignSelf: "flex-start" }}>
          Tạo mã riêng cho khách
        </Button>
      </Flex>
    </FormSection>
  );
}

export function OrdersSection({ row }: { row: CustomerRow }) {
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
                  <StatusTag status={o.status} order={o} />
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

export function FavoritesSection({ row }: { row: CustomerRow }) {
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

export function ContactSection({ row }: { row: CustomerRow }) {
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
export function NotesSection({ row, api }: { row: CustomerRow; api: CustomersApi }) {
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

export function BlockModal({ open, name, onCancel, onBlock }: { open: boolean; name: string; onCancel: () => void; onBlock: (reason: string) => void }) {
  const [form] = Form.useForm<{ reason: string }>();
  return (
    <Modal open={open} title={`Chặn ${name} đặt hàng?`} okText="Chặn khách" okButtonProps={{ danger: true }} cancelText="Hủy" onCancel={onCancel} onOk={() => form.submit()} destroyOnHidden>
      <Typography.Paragraph type="secondary">Khách sẽ không đặt được đơn mới trên web (cần BE kiểm tra lúc thanh toán). Đơn đang làm không bị ảnh hưởng.</Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={(v) => onBlock(v.reason.trim())} preserve={false}>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, whitespace: true, message: "Ghi lý do để nhân viên khác hiểu." }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={200} placeholder="VD: bom hàng 2 lần, không nghe máy" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
