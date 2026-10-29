import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Ảnh chia sẻ mạng xã hội (Facebook, Zalo, X…) cho từng ngôn ngữ
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateImageMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Metadata",
  });
  return [{ id: "default", alt: t("ogAlt"), size, contentType }];
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const [display, body, hero, logo] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/LexendExa-Light.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Inter-Regular.ttf")),
    readFile(join(process.cwd(), "public/images/hero-candle.jpg"), "base64"),
    readFile(join(process.cwd(), "public/images/logo-2510-vertical-light.png"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0c0d12" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/jpeg;base64,${hero}`}
          alt=""
          width={460}
          height={630}
          style={{ width: 460, height: 630, objectFit: "cover" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "0 72px",
            color: "#f9f5ea",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${logo}`} alt="" width={112} height={130} />
          <div
            style={{
              marginTop: 40,
              fontFamily: "Lexend Exa",
              fontSize: 58,
              lineHeight: 1.15,
              letterSpacing: -2,
              textTransform: "uppercase",
            }}
          >
            {t("ogTagline")}
          </div>
          <div style={{ marginTop: 24, width: 96, height: 2, background: "#c9a489" }} />
          <div style={{ marginTop: 24, fontFamily: "Inter", fontSize: 28, color: "#e9dbd0" }}>{t("ogSub")}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lexend Exa", data: display, weight: 300, style: "normal" },
        { name: "Inter", data: body, weight: 400, style: "normal" },
      ],
    },
  );
}
