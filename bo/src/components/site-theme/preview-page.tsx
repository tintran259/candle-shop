import type { CSSProperties } from "react";
import { imageUrl } from "@/lib/craft/image";
import { PAGE, type Device } from "@/lib/site-theme/preview";
import { focusPosition, webAssets, webDefaults, type BaseTheme } from "@/lib/site-theme/types";

// Trang chủ web thu nhỏ để xem trước (kích thước px như web ở bề ngang PAGE.w, khung ngoài thu phóng bằng CSS zoom).
// Thanh thông báo + điều hướng, hero theo giao diện đang sửa; phần dưới hero là minh họa (web thật lấy mẫu nổi bật từ BE)

const C = {
  cream: "#f5f2e9",
  night: "#282720",
  smoke: "#39372f",
  linen: "#f5f2e9",
  sand: "#e2d7bd",
  mist: "#eee9de",
  ink: "#312d28",
  muted: "#615e54",
  wine: "#650f21",
  copper: "#876042",
  rule: "#bbb4a4",
};
const serif = "'Cormorant Garamond', 'Times New Roman', serif";
const sans = "Inter, system-ui, sans-serif";
const ANNOUNCE_H = 28;

// Logo: ảnh tải lên, không có thì logo có sẵn tô màu (như web: trắng trên hero, đồng trên nền kem)
function Logo({ src, color, width }: { src?: string; color: string; width: number }) {
  if (src) return <img src={imageUrl(src, width, false)} alt="" style={{ width, maxHeight: 64, objectFit: "contain", objectPosition: "left", display: "block" }} />;
  const mask: CSSProperties = {
    WebkitMaskImage: `url(${webAssets.logo})`,
    maskImage: `url(${webAssets.logo})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };
  return <span style={{ display: "block", width, aspectRatio: "1600 / 374", background: color, ...mask }} />;
}

// Thanh trên cùng (cố định khi cuộn). solid: đã cuộn qua hero → nền kem, chữ tối
export function PreviewHeader({ theme, device, solid }: { theme: BaseTheme; device: Device; solid: boolean }) {
  const mobile = device === "mobile";
  const p = PAGE[device];
  const tone = solid ? C.ink : C.linen;
  return (
    <div style={{ fontFamily: sans }}>
      {theme.announcementOn !== false && (
        <div
          style={{
            height: ANNOUNCE_H,
            display: "grid",
            placeItems: "center",
            background: C.night,
            color: "#f8f5ee",
            fontSize: 10,
            letterSpacing: "0.1em",
            padding: "0 20px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {theme.announcement || webDefaults.announcement}
        </div>
      )}
      <div
        style={{
          height: solid ? p.solidBar : p.bar,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: mobile ? "0 20px" : "0 64px",
          background: solid ? "rgb(245 242 233 / 0.94)" : "transparent",
          borderBottom: `1px solid ${solid ? C.rule : "rgb(245 242 233 / 0.35)"}`,
          transition: "height .4s, background .4s",
        }}
      >
        <Logo src={solid ? theme.logo?.dark : theme.logo?.light} color={solid ? C.copper : C.linen} width={mobile ? 124 : 150} />
        {!mobile && (
          <div style={{ display: "flex", gap: 40, fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: tone }}>
            <span>Sản phẩm</span>
            <span>Câu chuyện</span>
            <span>Cẩm nang</span>
          </div>
        )}
        <div style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: tone }}>{mobile ? "Menu" : "⌕  Tìm kiếm"}</div>
      </div>
    </div>
  );
}

export function PreviewPage({ theme, device }: { theme: BaseTheme; device: Device }) {
  const mobile = device === "mobile";
  const p = PAGE[device];
  const hero = theme.hero ?? {};
  const pad = mobile ? 20 : 64;
  const title = (hero.title || webDefaults.title).split("\n");

  return (
    <div style={{ width: p.w, background: C.cream, color: C.muted, fontFamily: sans }}>
      {/* Hero */}
      <section style={{ position: "relative", height: p.hero, overflow: "hidden", background: C.smoke, color: C.linen }}>
        <img
          src={hero.image ? imageUrl(hero.image, 1400, false) : webAssets.hero}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: hero.image ? focusPosition[hero.focus ?? "right"] : "62% center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgb(17 17 14 / 0.17)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgb(17 17 14 / ${mobile ? 0.45 : 0.25}), transparent ${mobile ? 60 : 45}%)` }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: `${mobile ? 150 : 270}px ${pad}px 0` }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.sand }}>{hero.eyebrow || webDefaults.eyebrow}</div>
          <div style={{ fontFamily: serif, fontSize: mobile ? 40 : 54, lineHeight: 1.06, marginTop: 24 }}>
            {title.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 28, maxWidth: 420, fontSize: 14, lineHeight: "23px", color: C.mist }}>{hero.text || webDefaults.text}</div>
          <div
            style={{
              marginTop: mobile ? 40 : 56,
              width: 242,
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 16px",
              border: "0.6px solid #e5dac1",
              fontSize: 11,
              letterSpacing: "0.07em",
            }}
          >
            {hero.cta || webDefaults.cta} <span>↗</span>
          </div>
          <div style={{ marginTop: "auto", paddingBottom: 20, textAlign: "center", fontFamily: serif, fontSize: Math.min(116, p.w * 0.079), lineHeight: 1, whiteSpace: "nowrap" }}>
            {hero.mark || webDefaults.mark}
          </div>
        </div>
      </section>

      {/* Cam kết */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: mobile ? 24 : 0, padding: `40px ${pad}px` }}>
        {["Nguyên liệu chọn lọc", "Đổ tay tỉ mỉ", "Hương thơm dịu nhẹ", "Cho những phút chậm lại"].map((x) => (
          <div key={x} style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {x}
          </div>
        ))}
      </div>

      {/* Xưởng nến (minh họa) */}
      <section style={{ padding: `40px ${pad}px 60px` }}>
        <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", justifyContent: "space-between", gap: 24 }}>
          <div style={{ fontFamily: serif, fontSize: mobile ? 56 : 90, lineHeight: 1, letterSpacing: "0.1em", color: C.wine, textTransform: "uppercase" }}>Xưởng nến</div>
          <div style={{ textAlign: mobile ? "left" : "right", paddingTop: mobile ? 0 : 52 }}>
            <div style={{ fontFamily: serif, fontSize: mobile ? 24 : 32, color: C.ink }}>Ngày đẹp bắt đầu từ một ánh nến.</div>
            <div style={{ marginTop: 16, fontSize: 11, letterSpacing: "0.11em", textTransform: "uppercase" }}>Đổ tay tỉ mỉ. Chăm chút từng chi tiết.</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: mobile ? 48 : 32, marginTop: 40 }}>
          {webAssets.cards.map((c) => (
            <div key={c.name}>
              <img src={c.image} alt="" style={{ width: "100%", aspectRatio: "416 / 420", objectFit: "cover", display: "block" }} />
              <div style={{ marginTop: 26, fontSize: 9, letterSpacing: "0.11em", textTransform: "uppercase" }}>{c.category}</div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: serif, fontSize: 27, color: C.wine }}>{c.name}</span>
                <span style={{ fontSize: 13 }}>{c.price}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, fontSize: 11, color: C.muted, fontStyle: "italic" }}>Minh họa — web thật hiện 3 mẫu nổi bật đang bán.</div>
      </section>

      {/* Chân trang */}
      <footer style={{ padding: `48px ${pad}px 32px`, borderTop: `1px solid ${C.rule}` }}>
        <Logo src={theme.logo?.dark} color={C.copper} width={mobile ? 200 : 290} />
        <div style={{ marginTop: 20, fontSize: 12 }}>Nến chăm chút. Nghi thức ấm áp.</div>
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid ${C.rule}`, fontSize: 10 }}>© 2026 2510 Candle</div>
      </footer>
    </div>
  );
}
