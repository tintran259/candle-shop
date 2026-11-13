import type { CSSProperties } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useConcepts } from "@/hooks/use-concepts";
import { useProducts } from "@/hooks/use-products";
import { PreviewBlocks } from "@/components/site-theme/preview-blocks";
import { imageUrl } from "@/lib/craft/image";
import { blockDefaults } from "@/lib/site-theme/blocks";
import { formatMoney } from "@/lib/format";
import { outOfSeason } from "@/lib/products/concepts";
import { C, PAGE, previewCards, sans, serif, type Device } from "@/lib/site-theme/preview";
import { focusPosition, webAssets, webDefaults, type BaseTheme } from "@/lib/site-theme/types";

// Trang chủ web thu nhỏ để xem trước (kích thước px như web ở bề ngang PAGE.w, khung ngoài thu phóng bằng CSS zoom).
// Thanh thông báo + điều hướng, hero, Xưởng nến theo giao diện đang sửa (mẫu chọn như BE, thiếu thì 3 thẻ có sẵn); phần còn lại là minh họa

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

const MARQUEE_CSS = "@keyframes preview-marquee { to { transform: translateX(-50%) } } .preview-marquee:hover > div { animation-play-state: paused }";

type Card = { key: string; name: string; category: string; price: string; image?: string };
function PreviewCard({ c }: { c: Card }) {
  return (
    <div>
      {c.image ? (
        <img src={c.image} alt="" style={{ width: "100%", aspectRatio: "416 / 420", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", aspectRatio: "416 / 420", background: C.mist }} />
      )}
      <div style={{ marginTop: 26, fontSize: 9, letterSpacing: "0.11em", textTransform: "uppercase" }}>{c.category}</div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: serif, fontSize: 27, color: C.wine }}>{c.name}</span>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{c.price}</span>
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
  const coll = { ...webDefaults.collection, ...Object.fromEntries(Object.entries(theme.collection ?? {}).filter(([, v]) => v)) };
  const { products = [] } = useProducts();
  const { categories = [] } = useCategories();
  const concepts = useConcepts();
  const real = previewCards(theme.collection?.productIds, products, categories, (p) => !outOfSeason(p.conceptIds, concepts.byId));
  const cards: Card[] = real
    ? real.map((c) => ({ key: c.id, name: c.name, category: c.category, price: formatMoney(c.price), image: c.image && imageUrl(c.image, 420, false) }))
    : webAssets.cards.map((c) => ({ key: c.name, ...c }));

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

      {/* Xưởng nến */}
      <section style={{ padding: `40px ${pad}px 60px` }}>
        <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", justifyContent: "space-between", gap: 24 }}>
          <div style={{ fontFamily: serif, fontSize: mobile ? 56 : 90, lineHeight: 1, letterSpacing: "0.1em", color: C.wine, textTransform: "uppercase" }}>{coll.title}</div>
          <div style={{ textAlign: mobile ? "left" : "right", paddingTop: mobile ? 0 : 52 }}>
            <div style={{ fontFamily: serif, fontSize: mobile ? 24 : 32, color: C.ink }}>{coll.heading}</div>
            <div style={{ marginTop: 16, fontSize: 11, letterSpacing: "0.11em", textTransform: "uppercase" }}>{coll.note}</div>
          </div>
        </div>
        <div style={{ marginTop: 37, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>{coll.eyebrow}</div>
        {cards.length > 3 ? (
          // Hơn 3 mẫu: băng chuyền tự cuộn vô hạn như web (nhân đôi danh sách, trượt nửa chiều dài), rê chuột thì dừng
          <div className="preview-marquee" style={{ margin: `32px -${pad}px 0`, overflow: "hidden" }} aria-label="Băng chuyền Xưởng nến">
            <style>{MARQUEE_CSS}</style>
            <div style={{ display: "flex", width: "max-content", animation: `preview-marquee ${cards.length * 7}s linear infinite` }}>
              {[...cards, ...cards].map((c, i) => (
                <div key={`${c.key}-${i}`} style={{ width: mobile ? p.w * 0.78 : (p.w - 2 * pad - 64) / 3, paddingLeft: mobile ? 20 : 32, flexShrink: 0, boxSizing: "content-box" }}>
                  <PreviewCard c={c} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: mobile ? 48 : 32, marginTop: 32 }}>
            {cards.map((c) => (
              <PreviewCard key={c.key} c={c} />
            ))}
          </div>
        )}
        {!real && <div style={{ marginTop: 24, fontSize: 11, color: C.muted, fontStyle: "italic" }}>Chưa đủ 3 mẫu đang bán — web hiện 3 thẻ có sẵn này.</div>}
      </section>

      {/* Câu chuyện, Nghệ thuật đốt nến, Gửi lời nhắn */}
      <PreviewBlocks theme={theme} device={device} />

      {/* Chân trang: logo, khẩu hiệu, ảnh (theo giao diện, trống thì có sẵn) */}
      <footer style={{ padding: `48px ${pad}px 32px`, borderTop: `1px solid ${C.rule}` }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "800fr 512fr", gap: 40, alignItems: "start" }}>
          <div>
            <Logo src={theme.logo?.dark} color={C.copper} width={mobile ? 200 : 290} />
            <div style={{ marginTop: 20, fontSize: 12 }}>{theme.footer?.tagline || blockDefaults.footer.tagline}</div>
          </div>
          <img
            src={theme.footer?.image ? imageUrl(theme.footer.image, 900, false) : blockDefaults.footer.image}
            alt=""
            style={{ width: "100%", aspectRatio: "512 / 338", objectFit: "cover", display: "block" }}
          />
        </div>
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid ${C.rule}`, fontSize: 10 }}>© 2026 2510 Candle</div>
      </footer>
    </div>
  );
}
