import {
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ExperimentOutlined,
  GiftOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Flex, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { FormSection } from "@/components/form/form-section";
import { formatMoney } from "@/lib/format";
import { itemCount, providerLabels } from "@/lib/orders/labels";
import { boChannel } from "@/lib/orders/create";
import type { Order, OrderEvent } from "@/lib/orders/types";

type Look = { title: string; detail?: string; icon: ReactNode; fg: string; bg: string };

// Mỗi loại sự kiện: tiêu đề dạng hành động + icon/màu riêng (luôn kèm chữ, không chỉ dựa vào màu)
function present(e: OrderEvent, order: Order): Look {
  if (e.kind === "payment") return { title: e.note ?? "Ghi nhận thanh toán", icon: <DollarOutlined />, fg: "#237804", bg: "#f0f9eb" };
  if (e.kind === "schedule") return { title: "Đổi ngày làm xong", detail: e.note, icon: <CalendarOutlined />, fg: "#0958d9", bg: "#e6f4ff" };

  switch (e.status) {
    case "pending": {
      // Đơn shop tạo hộ (khách đặt qua điện thoại / Zalo…) khác đơn khách tự đặt trên web
      const channel = boChannel(e.note);
      return {
        title: channel !== undefined ? "Shop tạo đơn" : "Khách đặt hàng",
        detail: `${channel ? `Khách đặt qua ${channel} · ` : ""}${itemCount(order)} sản phẩm · ${formatMoney(order.total)} · ${order.paymentPlan === "deposit" ? "chọn cọc 50%" : "chọn trả đủ"}`,
        icon: <ShoppingCartOutlined />,
        fg: "#7a3f17",
        bg: "#fbf1e8",
      };
    }
    case "paid": {
      const first = order.payments[0];
      return {
        title: e.note ?? "Xác nhận đã thanh toán",
        detail: first ? `${formatMoney(first.amount)} qua ${providerLabels[first.provider]}` : undefined,
        icon: <WalletOutlined />,
        fg: "#0958d9",
        bg: "#e6f4ff",
      };
    }
    case "producing":
      return { title: "Xưởng bắt đầu làm", detail: `Hẹn xong ${dayjs(order.readyDate).format("DD/MM")}`, icon: <ExperimentOutlined />, fg: "#ad4e00", bg: "#fff7e6" };
    case "ready":
      return { title: "Đã làm xong", detail: "Chờ bàn giao cho vận chuyển", icon: <GiftOutlined />, fg: "#006d75", bg: "#e6fffb" };
    case "shipping":
      return { title: "Giao cho vận chuyển", icon: <CarOutlined />, fg: "#531dab", bg: "#f9f0ff" };
    case "completed":
      return { title: "Khách đã nhận hàng", icon: <CheckCircleOutlined />, fg: "#237804", bg: "#f0f9eb" };
    case "cancelled":
      return { title: "Đơn bị hủy", detail: e.note ? `Lý do: ${e.note}` : undefined, icon: <CloseCircleOutlined />, fg: "#a8071a", bg: "#fff1f0" };
  }
}

function dayLabel(iso: string) {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), "day")) return "Hôm nay";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Hôm qua";
  const s = d.format("dddd, DD/MM");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Actor({ by }: { by: string }) {
  const system = by === "Hệ thống";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b6b6b" }}>
      {system ? <RobotOutlined aria-hidden /> : <UserOutlined aria-hidden />}
      {by}
    </span>
  );
}

// Dòng thời gian mới nhất ở trên, gom theo ngày
export function HistorySection({ order }: { order: Order }) {
  const events = [...order.history].sort((a, b) => b.at.localeCompare(a.at));
  const days: { label: string; items: OrderEvent[] }[] = [];
  for (const e of events) {
    const label = dayLabel(e.at);
    if (days.at(-1)?.label === label) days.at(-1)!.items.push(e);
    else days.push({ label, items: [e] });
  }

  return (
    <FormSection title="Lịch sử" description={`${events.length} sự kiện · cập nhật ${dayjs(order.updatedAt).format("HH:mm DD/MM")}`}>
      <Flex vertical gap={16}>
        {days.map((day, di) => (
          <section key={day.label} aria-label={day.label}>
            <Typography.Text type="secondary" strong style={{ display: "block", fontSize: 12, letterSpacing: "0.04em", marginBottom: 8 }}>
              {day.label.toUpperCase()}
            </Typography.Text>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {day.items.map((e, i) => {
                const look = present(e, order);
                const latest = di === 0 && i === 0;
                const lastInDay = i === day.items.length - 1;
                return (
                  <li key={`${e.at}-${i}`} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: lastInDay ? 0 : 14 }}>
                    {/* Đường nối giữa các sự kiện trong ngày */}
                    {!lastInDay && <span aria-hidden style={{ position: "absolute", left: 15, top: 34, bottom: 2, width: 2, background: "#f1f1f1" }} />}
                    <span
                      aria-hidden
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 999,
                        fontSize: 15,
                        color: look.fg,
                        background: look.bg,
                        boxShadow: latest ? `0 0 0 3px #fff, 0 0 0 5px ${look.bg}` : undefined,
                      }}
                    >
                      {look.icon}
                    </span>
                    <Flex
                      vertical
                      gap={2}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: latest ? "8px 12px" : "4px 0",
                        marginTop: latest ? -4 : 0,
                        borderRadius: 12,
                        background: latest ? "#f6f6f3" : undefined,
                      }}
                    >
                      <Flex justify="space-between" align="baseline" gap={12}>
                        <Typography.Text strong style={{ color: latest ? look.fg : undefined }}>
                          {look.title}
                          {latest && (
                            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400, marginLeft: 8 }}>
                              Mới nhất
                            </Typography.Text>
                          )}
                        </Typography.Text>
                        <Tooltip title={dayjs(e.at).format("HH:mm:ss DD/MM/YYYY")}>
                          <Typography.Text type="secondary" className="tabular" style={{ fontSize: 13, flexShrink: 0 }}>
                            {dayjs(e.at).format("HH:mm")}
                          </Typography.Text>
                        </Tooltip>
                      </Flex>
                      {look.detail && (
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                          {look.detail}
                        </Typography.Text>
                      )}
                      <Actor by={e.by} />
                    </Flex>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </Flex>
    </FormSection>
  );
}
