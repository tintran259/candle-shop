import { CalendarOutlined, CarOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Flex, Grid, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import { conditionText, discountStatus, periodText, statusMeta } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { brand } from "@/theme";

const NOTCH = 20;

// 100.000 → "100K", 1.500.000 → "1,5TR" — gọn cho cuống phiếu
function shortVnd(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}TR`;
  return `${Math.round(n / 1000)}K`;
}

// Giá trị lớn trên cuống phiếu
function Stub({ discount, muted, width, compact }: { discount: Discount; muted: boolean; width: number; compact: boolean }) {
  const fg = muted ? "#6b6b6b" : brand.emberDark;
  const caption = { fontSize: 11, letterSpacing: "0.16em", fontWeight: 600, color: fg, opacity: 0.8 };

  let main: ReactNode;
  if (discount.type === "freeship") {
    main = (
      <>
        <CarOutlined style={{ fontSize: 34, color: fg }} aria-hidden />
        <span style={{ ...caption, marginTop: 6 }}>MIỄN PHÍ SHIP</span>
      </>
    );
  } else {
    const value = discount.type === "percent" ? `${discount.value}%` : shortVnd(discount.value);
    main = (
      <>
        <span style={caption}>GIẢM</span>
        <span className="tabular" style={{ fontSize: (value.length > 4 ? 32 : 40) - (compact ? 8 : 0), lineHeight: 1.05, fontWeight: 600, color: fg, letterSpacing: "-0.02em" }}>
          {value}
          {discount.type === "fixed" && <span style={{ fontSize: 16, marginLeft: 2 }}>₫</span>}
        </span>
      </>
    );
  }

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={2}
      style={{
        width,
        flexShrink: 0,
        boxSizing: "border-box",
        padding: "20px 10px",
        textAlign: "center",
        background: muted ? "#f1f1f1" : `radial-gradient(circle at 30% 20%, #fff 0, ${brand.emberLight} 60%)`,
      }}
    >
      {main}
      {discount.type === "percent" && discount.maxDiscount ? (
        <Typography.Text style={{ fontSize: 12, color: fg, marginTop: 4 }}>tối đa {shortVnd(discount.maxDiscount)}</Typography.Text>
      ) : null}
    </Flex>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Flex gap={8} align="flex-start">
      <span aria-hidden style={{ color: "#8c8c8c", fontSize: 13, marginTop: 2 }}>
        {icon}
      </span>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {children}
      </Typography.Text>
    </Flex>
  );
}

// Phiếu giảm giá xem trước — dáng voucher: cuống giá trị bên trái, đường xé có lỗ khoét, mã + điều kiện bên phải
export function DiscountTicket({ discount }: { discount: Discount }) {
  const status = discountStatus(discount);
  // Mã không còn dùng được thì phiếu chuyển xám
  const muted = status !== "running" && status !== "scheduled";
  // Màn hẹp: cuống và chữ mã nhỏ lại để mã không tràn khỏi phiếu
  const compact = Grid.useBreakpoint().sm === false;
  const STUB = compact ? 116 : 156;

  return (
    <section
      aria-label="Xem trước mã"
      style={{
        position: "relative",
        display: "flex",
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(19,19,19,0.04), 0 8px 24px -12px rgba(122,63,23,0.18)",
      }}
    >
      <Stub discount={discount} muted={muted} width={STUB} compact={compact} />

      {/* Đường xé: nét đứt + 2 lỗ khoét trùng màu nền drawer */}
      <span aria-hidden style={{ position: "absolute", left: STUB - 1, top: NOTCH / 2 + 4, bottom: NOTCH / 2 + 4, borderLeft: "2px dashed #e8dccf" }} />
      {(["top", "bottom"] as const).map((edge) => (
        <span
          key={edge}
          aria-hidden
          style={{ position: "absolute", left: STUB - NOTCH / 2, [edge]: -NOTCH / 2, width: NOTCH, height: NOTCH, borderRadius: 999, background: brand.page }}
        />
      ))}

      <Flex vertical gap={10} style={{ flex: 1, minWidth: 0, padding: compact ? "16px 14px 16px 20px" : "18px 20px 18px 24px" }}>
        <Flex align="center" justify="space-between" gap={8} wrap>
          <span
            className="tabular"
            style={{
              padding: "3px 12px",
              borderRadius: 8,
              border: `1.5px dashed ${muted ? "#d9d9d9" : brand.emberMid}`,
              background: muted ? "#fafafa" : "#fffaf5",
              color: muted ? "#6b6b6b" : brand.ink,
              fontSize: compact ? 14 : 17,
              fontWeight: 700,
              letterSpacing: compact ? "0.05em" : "0.1em",
              maxWidth: "100%",
              overflowWrap: "anywhere",
            }}
          >
            {discount.code || "MÃ CỦA BẠN"}
          </span>
          <Tag color={statusMeta[status].color} style={{ marginInlineEnd: 0 }}>
            {statusMeta[status].label}
          </Tag>
        </Flex>

        {discount.description && (
          <Typography.Text strong style={{ fontSize: 14, lineHeight: 1.45 }}>
            {discount.description}
          </Typography.Text>
        )}

        <Flex vertical gap={4}>
          {/* Mức tối đa đã hiện trên cuống nên bỏ khỏi dòng điều kiện */}
          <Meta icon={<ShoppingOutlined />}>{conditionText({ ...discount, maxDiscount: undefined })}</Meta>
          <Meta icon={<CalendarOutlined />}>{periodText(discount)}</Meta>
        </Flex>
      </Flex>
    </section>
  );
}
