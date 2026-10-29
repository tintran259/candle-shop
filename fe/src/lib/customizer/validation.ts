import { findById, inStock, sizeSupported, wickCompatible } from "@/lib/customizer/options";
import type { CandleConfiguration, ConfigIssue, CustomizerCatalog } from "@/lib/customizer/types";

/**
 * Kiểm tra cấu hình: thiếu lựa chọn, món tạm hết, kết hợp không tương thích, chữ quá dài.
 * Trả về danh sách lỗi để hiển thị đúng nhóm — không tự xóa lựa chọn của khách.
 */
export function validateConfiguration(config: CandleConfiguration, catalog: CustomizerCatalog): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const container = findById(catalog.containers, config.containerId);
  const size = findById(catalog.sizes, config.sizeId);

  if (!container) issues.push({ group: "container", field: "container", code: "required" });
  else if (!inStock(container)) issues.push({ group: "container", field: "container", code: "unavailable" });

  if (config.withLid && container && !container.lid)
    issues.push({ group: "container", field: "lid", code: "incompatible" });

  if (!size) issues.push({ group: "container", field: "size", code: "required" });
  else if (!size.available) issues.push({ group: "container", field: "size", code: "unavailable" });
  else if (!sizeSupported(container, size.id))
    issues.push({ group: "container", field: "size", code: "incompatible", params: { grams: size.grams } });

  const wax = findById(catalog.waxes, config.waxId);
  if (!wax) issues.push({ group: "wax", field: "wax", code: "required" });
  else if (!inStock(wax)) issues.push({ group: "wax", field: "wax", code: "unavailable" });

  if (config.fragrances.length === 0) issues.push({ group: "fragrance", field: "fragrance", code: "required" });
  if (config.fragrances.length > catalog.maxFragrances)
    issues.push({ group: "fragrance", field: "fragrance", code: "tooMany", params: { max: catalog.maxFragrances } });
  for (const f of config.fragrances) {
    const option = findById(catalog.fragrances, f.id);
    if (!option || !inStock(option)) issues.push({ group: "fragrance", field: "fragrance", code: "unavailable" });
  }

  const wick = findById(catalog.wicks, config.wickId);
  if (!wick) issues.push({ group: "wick", field: "wick", code: "required" });
  else if (!inStock(wick)) issues.push({ group: "wick", field: "wick", code: "unavailable" });
  else if (!wickCompatible(wick, config, catalog)) issues.push({ group: "wick", field: "wick", code: "incompatible" });

  const color = findById(catalog.colors, config.colorId);
  if (!color) issues.push({ group: "color", field: "color", code: "required" });
  else if (!inStock(color)) issues.push({ group: "color", field: "color", code: "unavailable" });

  const decoration = findById(catalog.decorations, config.decorationId);
  if (decoration && (!decoration.approved || !inStock(decoration)))
    issues.push({ group: "decoration", field: "decoration", code: "unavailable" });

  const p = catalog.personalization;
  for (const field of ["labelText", "recipientName", "giftMessage"] as const) {
    if (config.personalization[field].length > p[field].maxLength)
      issues.push({ group: "personalization", field, code: "tooLong", params: { max: p[field].maxLength } });
  }
  if (config.personalization.giftBox && (!p.giftBox || !p.giftBox.available || p.giftBox.stock <= 0))
    issues.push({ group: "personalization", field: "giftBox", code: "unavailable" });

  return issues;
}

export const issuesFor = (issues: ConfigIssue[], field: string) => issues.filter((i) => i.field === field);
