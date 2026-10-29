import type {
  CandleConfiguration,
  ContainerOption,
  CustomizerCatalog,
  Stock,
  WickOption,
} from "@/lib/customizer/types";

export const findById = <T extends { id: string }>(list: T[], id: string | null) =>
  id ? list.find((o) => o.id === id) : undefined;

export const inStock = (o: Stock & { available: boolean }) => o.available && o.stock > 0;

export const sizeSupported = (container: ContainerOption | undefined, sizeId: string) =>
  !container || container.supportedSizeIds.includes(sizeId);

export function wickCompatible(wick: WickOption, config: CandleConfiguration, catalog: CustomizerCatalog) {
  const size = findById(catalog.sizes, config.sizeId);
  if (wick.containerIds && config.containerId && !wick.containerIds.includes(config.containerId)) return false;
  if (wick.waxIds && config.waxId && !wick.waxIds.includes(config.waxId)) return false;
  if (wick.maxGrams && size && size.grams > wick.maxGrams) return false;
  return true;
}

// Phần trăm từng mùi khi phối, làm tròn để tổng luôn = 100
export function fragranceShares(fragrances: CandleConfiguration["fragrances"]) {
  const total = fragrances.reduce((s, x) => s + x.weight, 0) || 1;
  const raw = fragrances.map((x) => (x.weight / total) * 100);
  const rounded = raw.map(Math.floor);
  let rest = 100 - rounded.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest-- <= 0) break;
    rounded[i]++;
  }
  return fragrances.map((x, i) => ({ ...x, percent: rounded[i] }));
}

export const isUnscented = (config: CandleConfiguration, catalog: CustomizerCatalog) =>
  config.fragrances.some((f) => findById(catalog.fragrances, f.id)?.unscented);

// Lựa chọn mặc định: món đầu tiên còn hàng của mỗi nhóm
export function defaultConfiguration(catalog: CustomizerCatalog): CandleConfiguration {
  const container = catalog.containers.find(inStock);
  const size = catalog.sizes.find((s) => s.available && sizeSupported(container, s.id));
  const fragrance = catalog.fragrances.find((f) => inStock(f) && !f.unscented);
  const config: CandleConfiguration = {
    containerId: container?.id ?? null,
    withLid: false,
    sizeId: size?.id ?? null,
    waxId: catalog.waxes.find(inStock)?.id ?? null,
    fragrances: fragrance ? [{ id: fragrance.id, weight: 50 }] : [],
    intensity: catalog.intensity ? "medium" : null,
    wickId: null,
    colorId: catalog.colors.find((c) => inStock(c) && !c.natural)?.id ?? catalog.colors.find(inStock)?.id ?? null,
    decorationId: catalog.decorations.find((d) => d.approved && inStock(d))?.id ?? null,
    personalization: { labelText: "", recipientName: "", giftMessage: "", giftBox: false },
  };
  config.wickId = catalog.wicks.find((w) => inStock(w) && wickCompatible(w, config, catalog))?.id ?? null;
  return config;
}
