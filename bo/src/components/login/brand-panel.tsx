import { Flex, Typography } from "antd";
import { brand, radius } from "@/theme";

// Khối thương hiệu: ảnh nến 2510 phủ nền mocha, logo bản sáng giữ nguyên như sidebar
export function BrandPanel({ mobile }: { mobile: boolean }) {
  return (
    <Flex
      vertical
      justify={mobile ? "center" : "space-between"}
      align={mobile ? "center" : "flex-start"}
      style={{
        flex: mobile ? "none" : "1 1 54%",
        minHeight: mobile ? 132 : undefined,
        borderRadius: radius.card,
        padding: mobile ? 20 : 48,
        backgroundColor: brand.mocha,
        // Mobile: logo nằm giữa ảnh nên phủ đều và đậm hơn để logo không lẫn vào chữ trên hũ nến
        backgroundImage: `${mobile ? "linear-gradient(rgba(74,55,43,0.78), rgba(74,55,43,0.78))" : "linear-gradient(180deg, rgba(74,55,43,0.55) 0%, rgba(74,55,43,0.35) 45%, rgba(58,42,32,0.9) 100%)"}, url("/login-hero.webp")`,
        backgroundSize: "cover",
        backgroundPosition: "center 60%",
      }}
    >
      <Flex vertical align={mobile ? "center" : "flex-start"} gap={10}>
        <img src="/logo-2510-light.png" alt="2510 Candle" style={{ height: mobile ? 52 : 88, width: "auto" }} />
        <Typography.Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, letterSpacing: "0.28em" }}>BACK OFFICE</Typography.Text>
      </Flex>
      {!mobile && (
        <div style={{ maxWidth: 420 }}>
          <Typography.Title level={3} style={{ color: "#fff", fontWeight: 500, lineHeight: 1.35, margin: 0 }}>
            Mỗi ngọn nến được đổ tay theo đơn.
          </Typography.Title>
          <Typography.Paragraph style={{ color: "rgba(255,255,255,0.8)", margin: "10px 0 0" }}>Theo dõi đơn, giữ nguyên liệu và cấu hình nến tự phối ở một nơi.</Typography.Paragraph>
        </div>
      )}
    </Flex>
  );
}
