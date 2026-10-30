import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Badge, Button, Empty, Flex, Popover, Segmented, Skeleton, Typography } from "antd";
import dayjs from "dayjs";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useNotifications, type NotificationsApi } from "@/hooks/use-notifications";
import type { AppNotification, NotificationKind, NotificationTone } from "@/lib/notifications";
import { radius, text } from "@/theme";

const kindIcons: Record<NotificationKind, ReactNode> = {
  "order-late": <ExclamationCircleOutlined />,
  "order-due": <ClockCircleOutlined />,
  "order-new": <ShoppingCartOutlined />,
  "order-paid": <DollarOutlined />,
  "stock-out": <InboxOutlined />,
  "stock-low": <InboxOutlined />,
  discount: <TagOutlined />,
};

// Nền nhạt + chữ đậm cùng sắc — chữ đạt 4.5:1 trên nền của nó
const toneColors: Record<NotificationTone, { bg: string; fg: string }> = {
  danger: { bg: "#fff1f0", fg: "#a8071a" },
  warning: { bg: "#fff7e6", fg: "#ad4e00" },
  info: { bg: "#fbf1e8", fg: "#7a3f17" },
};

// Chuông thông báo trên header: nhắc việc cần làm (đơn trễ hạn, hết nguyên liệu…) và hoạt động mới
export function NotificationBell({ compact }: { compact: boolean }) {
  const [open, setOpen] = useState(false);
  const api = useNotifications();
  const count = api.unread.length;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      destroyOnHidden
      styles={{ container: { padding: 0, width: compact ? "calc(100vw - 32px)" : 400, borderRadius: radius.card, overflow: "hidden" } }}
      content={<NotificationPanel api={api} onClose={() => setOpen(false)} />}
    >
      <Badge count={count} size="small" offset={[-4, 4]} overflowCount={9}>
        <Button
          shape="circle"
          aria-label={count ? `Thông báo, ${count} chưa đọc` : "Thông báo"}
          aria-expanded={open}
          aria-haspopup="dialog"
          icon={<BellOutlined />}
          style={{ borderColor: "transparent" }}
        />
      </Badge>
    </Popover>
  );
}

type Filter = "all" | "unread";

function NotificationPanel({ api, onClose }: { api: NotificationsApi; onClose: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>(api.unread.length ? "unread" : "all");
  const list = filter === "unread" ? api.unread : api.items;
  // Cần xử lý (trễ hạn, sắp đến hạn, hết hàng) tách khỏi hoạt động mới
  const todo = list.filter((n) => n.tone !== "info");
  const activity = list.filter((n) => n.tone === "info");

  const open = (n: AppNotification) => {
    api.markRead([n.id]);
    onClose();
    navigate(n.to);
  };

  return (
    <div role="dialog" aria-label="Thông báo">
      <Flex justify="space-between" align="center" style={{ padding: "16px 16px 8px" }}>
        <Typography.Text strong style={{ fontSize: 16 }}>
          Thông báo
        </Typography.Text>
        <Button
          type="link"
          size="small"
          icon={<CheckOutlined />}
          disabled={!api.unread.length}
          onClick={() => api.markRead(api.unread.map((n) => n.id))}
          style={{ paddingInline: 0 }}
        >
          Đánh dấu đã đọc hết
        </Button>
      </Flex>
      <div style={{ padding: "0 16px 8px" }}>
        <Segmented<Filter>
          block
          size="small"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "unread", label: `Chưa đọc · ${api.unread.length}` },
            { value: "all", label: `Tất cả · ${api.items.length}` },
          ]}
        />
      </div>

      <div style={{ maxHeight: "min(60vh, 460px)", overflowY: "auto", padding: "0 8px 8px" }}>
        {api.loading ? (
          <div style={{ padding: 8 }}>
            <Skeleton avatar active paragraph={{ rows: 1 }} />
            <Skeleton avatar active paragraph={{ rows: 1 }} />
          </div>
        ) : list.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter === "unread" ? "Bạn đã xem hết thông báo." : "Chưa có thông báo nào."}
            style={{ padding: "24px 0" }}
          >
            {filter === "unread" && api.items.length > 0 && (
              <Button size="small" onClick={() => setFilter("all")}>
                Xem tất cả
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <Section title="Cần xử lý" items={todo} api={api} onOpen={open} />
            <Section title="Hoạt động mới" items={activity} api={api} onOpen={open} />
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  api,
  onOpen,
}: {
  title: string;
  items: AppNotification[];
  api: NotificationsApi;
  onOpen: (n: AppNotification) => void;
}) {
  if (!items.length) return null;
  return (
    <section>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, fontWeight: 600, padding: "10px 8px 4px" }}>
        {title} · {items.length}
      </Typography.Text>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((n) => {
          const read = api.isRead(n.id);
          const tone = toneColors[n.tone];
          return (
            <li key={n.id}>
              <button type="button" className={`notif-row${read ? "" : " is-unread"}`} onClick={() => onOpen(n)}>
                <Flex
                  aria-hidden
                  align="center"
                  justify="center"
                  style={{ width: 36, height: 36, borderRadius: "50%", background: tone.bg, color: tone.fg, fontSize: 16, flexShrink: 0 }}
                >
                  {kindIcons[n.kind]}
                </Flex>
                <Flex vertical gap={2} style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <Typography.Text strong={!read} style={{ color: read ? text.secondary : undefined }}>
                    {n.title}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45 }}>
                    {n.description}
                  </Typography.Text>
                  {n.at && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }} title={dayjs(n.at).format("HH:mm DD/MM/YYYY")}>
                      {dayjs(n.at).fromNow()}
                    </Typography.Text>
                  )}
                </Flex>
                {!read && (
                  <span className="notif-dot">
                    <span className="sr-only">Chưa đọc</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
