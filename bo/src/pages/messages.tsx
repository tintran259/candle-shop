import { CheckOutlined, DeleteOutlined, MessageOutlined, UndoOutlined } from "@ant-design/icons";
import { App, Button, Card, Empty, Flex, Popconfirm, Segmented, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { CategoriesSkeleton } from "@/components/skeletons";
import { useMessages, type ContactMessage } from "@/hooks/use-messages";
import { formatNumber } from "@/lib/format";
import { zaloLink } from "@/lib/messages";
import { useTitle } from "@/lib/use-title";

type Filter = "open" | "handled" | "all";

// Bán hàng › Liên hệ (docs/pages/messages.md): lời nhắn khách gửi ở form cuối trang chủ web. Nhắn Zalo / gọi lại theo SĐT, rồi đánh dấu đã xử lý
export function MessagesPage() {
  useTitle("Liên hệ");
  const { message } = App.useApp();
  const { items, loading, setHandled, remove } = useMessages();
  const [filter, setFilter] = useState<Filter>("open");
  const shown = useMemo(() => items.filter((m) => (filter === "all" ? true : filter === "handled" ? m.handled : !m.handled)), [items, filter]);

  if (loading) return <CategoriesSkeleton />;
  const open = items.filter((m) => !m.handled).length;

  return (
    <Flex vertical gap={16}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Liên hệ
        </Typography.Title>
        <Typography.Text type="secondary">Lời nhắn khách gửi ở khối “Gửi lời nhắn” cuối trang chủ web. Nhắn Zalo hoặc gọi lại theo số khách để lại, xong thì đánh dấu đã xử lý.</Typography.Text>
      </div>

      <Card styles={{ body: { padding: 12 } }}>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          style={{ marginBottom: 12 }}
          options={[
            { value: "open", label: `Chưa xử lý (${formatNumber(open)})` },
            { value: "handled", label: `Đã xử lý (${formatNumber(items.length - open)})` },
            { value: "all", label: "Tất cả" },
          ]}
        />
        <Table<ContactMessage>
          rowKey="id"
          dataSource={shown}
          pagination={{ pageSize: 20, hideOnSinglePage: true, showTotal: (n) => `${formatNumber(n)} lời nhắn` }}
          locale={{ emptyText: <Empty description={filter === "open" ? "Không còn lời nhắn chưa xử lý" : "Chưa có lời nhắn"} /> }}
          columns={[
            {
              title: "Khách",
              key: "who",
              width: 220,
              render: (_, m) => (
                <Flex vertical gap={2}>
                  <Typography.Text strong>{m.name}</Typography.Text>
                  <Typography.Text copyable={{ tooltips: ["Sao chép", "Đã sao chép"] }}>{m.phone}</Typography.Text>
                  {m.email && (
                    <Typography.Text type="secondary" copyable={{ tooltips: ["Sao chép", "Đã sao chép"] }} style={{ fontSize: 13 }}>
                      {m.email}
                    </Typography.Text>
                  )}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(m.createdAt).format("HH:mm DD/MM/YYYY")}
                  </Typography.Text>
                </Flex>
              ),
            },
            {
              title: "Nội dung",
              key: "message",
              render: (_, m) => (
                <Flex vertical gap={6} align="flex-start">
                  {m.handled && <Tag color="green">Đã xử lý</Tag>}
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-line" }} ellipsis={{ rows: 4, expandable: "collapsible", symbol: (open) => (open ? "Thu gọn" : "Xem thêm") }}>
                    {m.message}
                  </Typography.Paragraph>
                </Flex>
              ),
            },
            {
              title: "",
              key: "actions",
              width: 150,
              render: (_, m) => {
                const zalo = zaloLink(m.phone);
                return (
                  <Flex gap={4} justify="flex-end">
                    {zalo && (
                      <Tooltip title="Nhắn Zalo">
                        <Button href={zalo} target="_blank" rel="noopener noreferrer" icon={<MessageOutlined />} aria-label={`Nhắn Zalo cho ${m.name}`} />
                      </Tooltip>
                    )}
                    <Tooltip title={m.handled ? "Chuyển về chưa xử lý" : "Đánh dấu đã xử lý"}>
                      <Button
                        icon={m.handled ? <UndoOutlined /> : <CheckOutlined />}
                        type={m.handled ? "default" : "primary"}
                        aria-label={m.handled ? `Chuyển về chưa xử lý: ${m.name}` : `Đã xử lý: ${m.name}`}
                        onClick={() => (setHandled(m.id, !m.handled), message.success(m.handled ? "Đã chuyển về chưa xử lý" : "Đã đánh dấu đã xử lý"))}
                      />
                    </Tooltip>
                    <Popconfirm title="Xóa lời nhắn này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => (remove(m.id), message.success("Đã xóa lời nhắn"))}>
                      <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa lời nhắn của ${m.name}`} />
                    </Popconfirm>
                  </Flex>
                );
              },
            },
          ]}
        />
      </Card>
    </Flex>
  );
}
