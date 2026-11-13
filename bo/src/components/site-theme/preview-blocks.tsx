import { imageUrl } from "@/lib/craft/image";
import { blockDefaults as D, type BlocksTheme, type CareTheme, type ContactTheme, type StoryTheme } from "@/lib/site-theme/blocks";
import { C, serif, type Device } from "@/lib/site-theme/preview";

// Các khối trang chủ trong khung xem trước (bố cục gần giống web — fe/src/components/sections/story.tsx, care.tsx, contact.tsx):
// chữ / ảnh theo giao diện đang sửa, trống thì nội dung có sẵn; khối bị ẩn thì không vẽ

const lines = (text: string | undefined, fallback: string) => (text || fallback).split("\n").filter((l) => l.trim());
const img = (src: string | undefined, fallback: string) => (src ? imageUrl(src, 900, false) : fallback);
const cover = { width: "100%", objectFit: "cover", display: "block" } as const;
const Rule = () => <div style={{ height: 1, background: C.rule, marginTop: 56 }} />;

function Story({ t, mobile, pad }: { t: StoryTheme; mobile: boolean; pad: number }) {
  return (
    <section style={{ padding: `56px ${pad}px 0` }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "760fr 552fr", gap: mobile ? 40 : 0 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>{t.eyebrow || D.story.eyebrow}</div>
          <div style={{ fontFamily: serif, fontSize: mobile ? 24 : 31, letterSpacing: "0.065em", color: C.ink, textTransform: "uppercase", marginTop: 20 }}>{t.kicker || D.story.kicker}</div>
          <img src={img(t.image, D.story.image)} alt="" style={{ ...cover, aspectRatio: "760 / 510", marginTop: 40 }} />
        </div>
        <div style={{ paddingLeft: mobile ? 0 : 92 }}>
          <div style={{ fontFamily: serif, fontSize: mobile ? 56 : 82, lineHeight: 1.07, letterSpacing: "0.085em", color: C.wine, textTransform: "uppercase" }}>
            {lines(t.title, D.story.title).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: serif, fontSize: mobile ? 30 : 38, lineHeight: 1.1, color: C.ink, marginTop: 44 }}>
            {lines(t.heading, D.story.heading).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 32, maxWidth: 420, fontSize: 14, lineHeight: "24px", display: "grid", gap: 20 }}>
            {lines(t.body, D.story.body).map((l, i) => (
              <p key={i} style={{ margin: 0 }}>
                {l}
              </p>
            ))}
          </div>
          <div style={{ marginTop: 48, fontSize: 11, letterSpacing: "0.09em", color: C.wine }}>{t.cta || D.story.cta} ↗</div>
        </div>
      </div>
      <Rule />
    </section>
  );
}

function Care({ t, mobile, pad }: { t: CareTheme; mobile: boolean; pad: number }) {
  return (
    <section style={{ padding: `54px ${pad}px 0` }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "800fr 512fr", gap: mobile ? 48 : 0 }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: mobile ? 52 : 76, lineHeight: 1.05, color: C.wine }}>
            {lines(t.title, D.care.title).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 40, fontSize: 11, letterSpacing: "0.09em" }}>{t.link || D.care.link} ↗</div>
          <ol style={{ listStyle: "none", padding: 0, margin: "56px 0 0", maxWidth: 640 }}>
            {D.care.steps.map((d, i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "50px 1fr", padding: "0 0 28px", marginBottom: 19, borderBottom: `1px solid ${C.rule}` }}>
                <span style={{ fontSize: 10, color: C.wine, paddingTop: 6 }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 24, color: C.ink }}>{t.steps?.[i]?.title || d.title}</div>
                  <div style={{ fontSize: 12, lineHeight: "20px", marginTop: 8 }}>{t.steps?.[i]?.text || d.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <img src={img(t.image, D.care.image)} alt="" style={{ ...cover, aspectRatio: "512 / 506", marginTop: mobile ? 0 : 120 }} />
      </div>
      <Rule />
    </section>
  );
}

function Contact({ t, mobile, pad }: { t: ContactTheme; mobile: boolean; pad: number }) {
  const field = { borderBottom: `1px solid ${C.rule}`, padding: "0 0 14px", fontSize: 12 } as const;
  return (
    <section style={{ padding: `48px ${pad}px 70px` }}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "590fr 146fr 576fr", gap: mobile ? 40 : 0 }}>
        <img src={img(t.image, D.contact.image)} alt="" style={{ ...cover, aspectRatio: "590 / 600", order: mobile ? 2 : 0 }} />
        <div style={{ gridColumn: mobile ? undefined : 3, paddingTop: mobile ? 0 : 26 }}>
          <div style={{ fontFamily: serif, fontSize: mobile ? 56 : 86, lineHeight: 1.06, letterSpacing: "0.08em", color: C.wine, textTransform: "uppercase" }}>
            {lines(t.title, D.contact.title).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: serif, fontSize: mobile ? 28 : 34, color: C.ink, marginTop: 48 }}>{t.heading || D.contact.heading}</div>
          <div style={{ marginTop: 24, fontSize: 13, lineHeight: "22px", maxWidth: 480 }}>{t.text || D.contact.text}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 32px", marginTop: 48 }}>
            <div style={field}>Họ và tên</div>
            <div style={field}>Số điện thoại (Zalo)</div>
            <div style={{ ...field, gridColumn: "1 / -1" }}>Bạn cần chúng tôi giúp gì?</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Ba khối giữa trang (sau Xưởng nến); chân trang vẽ ở preview-page.tsx (ảnh + khẩu hiệu lấy từ theme.footer)
export function PreviewBlocks({ theme, device }: { theme: BlocksTheme; device: Device }) {
  const mobile = device === "mobile";
  const pad = mobile ? 20 : 64;
  return (
    <>
      {!theme.story?.hidden && <Story t={theme.story ?? {}} mobile={mobile} pad={pad} />}
      {!theme.care?.hidden && <Care t={theme.care ?? {}} mobile={mobile} pad={pad} />}
      {!theme.contact?.hidden && <Contact t={theme.contact ?? {}} mobile={mobile} pad={pad} />}
    </>
  );
}
