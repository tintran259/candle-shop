import { findById, fragranceShares } from "@/lib/customizer/options";
import type {
  CandleConfiguration,
  CandleLook,
  CustomCandleSnapshot,
  CustomizerCatalog,
} from "@/lib/customizer/types";
import { pick, type Localized } from "@/lib/shop-config";

// Số hũ tối đa làm được với nguyên liệu đang có (hũ/bấc/phụ kiện theo cái, sáp/hương theo gram)
export function maxQuantity(config: CandleConfiguration, catalog: CustomizerCatalog) {
  const container = findById(catalog.containers, config.containerId);
  const size = findById(catalog.sizes, config.sizeId);
  if (!container || !size) return 0;
  const load = config.intensity && catalog.intensity ? catalog.intensity.load[config.intensity] : 0.08;
  const needs: [number, number][] = [[container.stock, 1]];
  if (config.withLid && container.lid) needs.push([container.lid.stock, 1]);
  const wax = findById(catalog.waxes, config.waxId);
  if (wax) needs.push([wax.stock, size.grams]);
  for (const f of fragranceShares(config.fragrances)) {
    const option = findById(catalog.fragrances, f.id);
    if (option && !option.unscented) needs.push([option.stock, size.grams * load * (f.percent / 100)]);
  }
  for (const o of [
    findById(catalog.wicks, config.wickId),
    findById(catalog.colors, config.colorId),
    findById(catalog.decorations, config.decorationId),
  ])
    if (o) needs.push([o.stock, 1]);
  if (config.personalization.giftBox && catalog.personalization.giftBox)
    needs.push([catalog.personalization.giftBox.stock, 1]);
  return Math.max(0, Math.min(...needs.map(([stock, need]) => (need > 0 ? Math.floor(stock / need) : Infinity))));
}

export function candleLook(config: CandleConfiguration, catalog: CustomizerCatalog): CandleLook {
  const container = findById(catalog.containers, config.containerId);
  const color = findById(catalog.colors, config.colorId);
  const wax = findById(catalog.waxes, config.waxId);
  return {
    shape: container?.shape ?? "tumbler",
    vesselColor: container?.swatch ?? "#e4dcd0",
    translucent: !!container?.translucent,
    waxColor: (!color?.natural && color?.swatch) || wax?.swatch || "#f6efe2",
    wick: config.wickId === "wood" ? "wood" : "cotton",
    decoration: findById(catalog.decorations, config.decorationId)?.look,
    label: config.personalization.labelText.trim() || undefined,
  };
}

// Mô tả ngắn cho giỏ hàng / đơn hàng, cả 2 ngôn ngữ
export function describe(config: CandleConfiguration, catalog: CustomizerCatalog): Localized {
  const line = (locale: "vi" | "en") => {
    const name = (o?: { name: Localized }) => (o ? pick(o.name, locale) : null);
    const size = findById(catalog.sizes, config.sizeId);
    const fragrances = fragranceShares(config.fragrances)
      .map((f) => `${name(findById(catalog.fragrances, f.id))}${config.fragrances.length > 1 ? ` ${f.percent}%` : ""}`)
      .join(" / ");
    return [
      name(findById(catalog.containers, config.containerId)),
      size && `${size.grams}g`,
      name(findById(catalog.waxes, config.waxId)),
      fragrances,
      name(findById(catalog.wicks, config.wickId)),
      name(findById(catalog.colors, config.colorId)),
    ]
      .filter(Boolean)
      .join(" · ");
  };
  return { vi: line("vi"), en: line("en") };
}

export const snapshot = (config: CandleConfiguration, catalog: CustomizerCatalog): CustomCandleSnapshot => ({
  configuration: config,
  preview: candleLook(config, catalog),
  details: describe(config, catalog),
});

// Khóa ổn định để gộp các hũ giống hệt nhau trong giỏ
export function configKey(config: CandleConfiguration) {
  let h = 0;
  for (const ch of JSON.stringify(config)) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0;
  return `custom-${(h >>> 0).toString(36)}`;
}

// "Lưu cấu hình" = link chia sẻ chứa cấu hình (chưa có lưu theo tài khoản)
export const encodeConfiguration = (config: CandleConfiguration) =>
  btoa(encodeURIComponent(JSON.stringify(config))).replace(/=+$/, "");

export function decodeConfiguration(value: string | null): CandleConfiguration | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(value))) as Partial<CandleConfiguration>;
    if (!parsed || !Array.isArray(parsed.fragrances) || typeof parsed.personalization !== "object") return null;
    return parsed as CandleConfiguration;
  } catch {
    return null;
  }
}
