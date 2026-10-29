import { findById, fragranceShares } from "@/lib/customizer/options";
import type { CandleConfiguration, CustomizerCatalog, Money, PriceLine } from "@/lib/customizer/types";

/**
 * Giá ƯỚC TÍNH ở client: giá gốc theo kích thước + phụ thu từng thành phần.
 * BE phải tính lại khi tạo đơn — không tin giá client gửi lên.
 */
export function priceBreakdown(config: CandleConfiguration, catalog: CustomizerCatalog) {
  const container = findById(catalog.containers, config.containerId);
  const size = findById(catalog.sizes, config.sizeId);
  const p = catalog.personalization;
  const fragrance = Math.round(
    fragranceShares(config.fragrances).reduce(
      (sum, f) => sum + (findById(catalog.fragrances, f.id)?.priceDelta ?? 0) * f.percent,
      0,
    ) / 100,
  );

  const extras: PriceLine[] = [
    { key: "container", amount: container?.priceDelta ?? 0 },
    { key: "lid", amount: config.withLid ? (container?.lid?.priceDelta ?? 0) : 0 },
    { key: "wax", amount: findById(catalog.waxes, config.waxId)?.priceDelta ?? 0 },
    { key: "fragrance", amount: fragrance },
    { key: "intensity", amount: config.intensity && catalog.intensity ? catalog.intensity.priceDelta[config.intensity] : 0 },
    { key: "wick", amount: findById(catalog.wicks, config.wickId)?.priceDelta ?? 0 },
    { key: "color", amount: findById(catalog.colors, config.colorId)?.priceDelta ?? 0 },
    { key: "decoration", amount: findById(catalog.decorations, config.decorationId)?.priceDelta ?? 0 },
    { key: "labelText", amount: config.personalization.labelText.trim() ? p.labelText.priceDelta : 0 },
    { key: "recipientName", amount: config.personalization.recipientName.trim() ? p.recipientName.priceDelta : 0 },
    { key: "giftBox", amount: config.personalization.giftBox ? (p.giftBox?.priceDelta ?? 0) : 0 },
  ].filter((l) => l.amount !== 0);

  const base: Money = size?.basePrice ?? 0;
  const extrasTotal = extras.reduce((s, l) => s + l.amount, 0);
  return { base, extras, extrasTotal, unit: base + extrasTotal };
}

// Hiển thị theo tiền tệ hiện tại của web (USD); amount là cent
export const formatMoney = (amount: Money) => `$${(amount / 100).toFixed(2)}`;
export const formatDelta = (amount: Money) => (amount > 0 ? `+${formatMoney(amount)}` : formatMoney(amount));
