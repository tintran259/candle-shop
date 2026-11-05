// Tiện ích kho: mức tồn, lựa chọn nào đang dùng nguyên liệu nào
import { sizeLabel } from "@/lib/craft/groups";
import type { CraftConfig, CraftStep, StepOption, VesselOption } from "@/lib/craft/types";
import type { Material, MaterialCategory, MovementType } from "@/lib/inventory/types";

export const categoryLabels: Record<MaterialCategory, string> = {
  vessel: "Hũ & nắp",
  wax: "Sáp",
  fragrance: "Tinh dầu",
  wick: "Bấc",
  dye: "Màu nhuộm",
  decor: "Trang trí",
  packaging: "Bao bì",
  other: "Khác",
};

export const movementLabels: Record<MovementType, string> = { in: "Nhập thêm", out: "Xuất / hao hụt", adjust: "Kiểm kê", order: "Theo đơn hàng", cost: "Sửa giá nhập", make: "Sản xuất" };
// Phiếu nhập phải có tiền để giá vốn không sai lặng lẽ
export const lotPriceRequired = "Nhập tổng tiền đã trả cho lô, hoặc chọn “Không mất tiền”.";
// Nhãn ngắn cho nút chọn loại phiếu (vừa màn hình điện thoại)
export const manualMovements = ["in", "out", "adjust"] as const;
export type ManualMovement = (typeof manualMovements)[number];
export const movementShort: Record<ManualMovement, string> = { in: "Nhập thêm", out: "Xuất kho", adjust: "Kiểm kê" };

// Số tồn sau phiếu; null = phiếu không hợp lệ (xuất quá số đang có, hoặc không đổi gì)
export function stockAfter(stock: number, type: ManualMovement, amount: number | null | undefined) {
  if (amount === null || amount === undefined || amount < 0) return null;
  if (type === "adjust") return amount;
  if (amount === 0) return null;
  if (type === "out" && amount > stock) return null;
  return type === "in" ? stock + amount : stock - amount;
}

// Ngưỡng sắp hết mặc định khi tạo nguyên liệu mới
export const DEFAULT_LOW_STOCK = { g: 500, ml: 500, pcs: 10 } as const;

export type StockLevel = "untracked" | "out" | "low" | "ok";

export function materialLevel(m: Material): StockLevel {
  if (!m.tracked) return "untracked";
  if (m.stock <= 0) return "out";
  return m.stock < m.lowStock ? "low" : "ok";
}

export const levelMeta: Record<StockLevel, { label: string; color: string }> = {
  out: { label: "Hết hàng", color: "error" },
  low: { label: "Sắp hết", color: "warning" },
  ok: { label: "Còn hàng", color: "success" },
  untracked: { label: "Không theo dõi", color: "default" },
};

export type MaterialMap = Map<string, Material>;
export const toMap = (materials: Material[]): MaterialMap => new Map(materials.map((m) => [m.id, m]));

// Mức tồn của lựa chọn: không gắn kho = không theo dõi (luôn còn); gắn kho đã xóa = coi như hết
export function optionLevel(materialId: string | undefined, map: MaterialMap): StockLevel {
  if (!materialId) return "untracked";
  const m = map.get(materialId);
  return m ? materialLevel(m) : "out";
}

export const isVesselOption = (o: StepOption | VesselOption): o is VesselOption => "sizes" in o;

const sizeOf = (o: VesselOption, sizeId: string) => o.sizes.find((s) => s.id === sizeId);
// Mức tồn của hũ ở MỘT cỡ (mỗi cỡ là một mã hũ riêng trong Kho)
export const vesselSizeLevel = (o: VesselOption, sizeId: string, map: MaterialMap) => optionLevel(sizeOf(o, sizeId)?.materialId, map);
// Nắp của cỡ đó — hết nắp chỉ khóa tuỳ chọn "thêm nắp", không khóa hũ
export const lidLevel = (o: VesselOption, sizeId: string, map: MaterialMap) => optionLevel(sizeOf(o, sizeId)?.lidMaterialId, map);

// Cỡ khách đặt được với hũ này: cỡ đang bán và mã hũ cỡ đó còn hàng
export const sellableSizes = (o: VesselOption, map: MaterialMap) => o.sizes.filter((s) => s.available && optionLevel(s.materialId, map) !== "out");

// Mức tồn chung của hũ trên các cỡ đang bán: hết khi MỌI cỡ hết; sắp hết khi có cỡ hết hoặc sắp hết
export function vesselLevel(o: VesselOption, map: MaterialMap): StockLevel {
  const levels = o.sizes.filter((s) => s.available).map((s) => optionLevel(s.materialId, map));
  if (!levels.length) return "out";
  if (levels.every((l) => l === "untracked")) return "untracked";
  if (levels.every((l) => l === "out")) return "out";
  return levels.some((l) => l === "out" || l === "low") ? "low" : "ok";
}

// Mức tồn của bất kỳ lựa chọn nào (hũ tính theo từng cỡ)
export const levelOf = (o: StepOption, map: MaterialMap) => (isVesselOption(o) ? vesselLevel(o, map) : optionLevel(o.materialId, map));

// Lựa chọn bán được: đang bán và nguyên liệu (nếu có) còn hàng; hũ cần còn ít nhất một cỡ
export const sellable = (o: StepOption, map: MaterialMap) => o.available && levelOf(o, map) !== "out";

export type Usage = { step: CraftStep; label: string; target: { stepId: string; optionId?: string } };

// Mọi materialId một hũ đang trỏ tới (theo từng cỡ)
export function vesselMaterialIds(o: VesselOption) {
  return o.sizes.flatMap((x) => [x.materialId, x.lidMaterialId]).filter(Boolean) as string[];
}

// Hũ trong Kho: các loại hũ và mã hũ của từng loại, xếp theo dung tích
export const jarTypes = (materials: Material[]) => [...new Set(materials.map((m) => m.jarType?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "vi"));
export const jarsOfType = (materials: Material[], type?: string) =>
  type ? materials.filter((m) => m.category === "vessel" && m.jarType?.trim() === type.trim()).sort((a, b) => (a.capacity ?? 0) - (b.capacity ?? 0)) : [];

// Bản lưu trước khi hũ có loại hũ, dung tích: "Hũ gốm trụ 150ml" → loại "Hũ gốm trụ", 150ml. Nắp chỉ lấy dung tích
export function guessJar(name: string): Pick<Material, "jarType" | "capacity"> {
  const m = /^(.*?)\s*(\d+)\s*ml\s*$/i.exec(name.trim());
  if (!m) return {};
  return { capacity: Number(m[2]), jarType: /^nắp/i.test(m[1]) || !m[1] ? undefined : m[1] };
}

// Nguyên liệu → nơi đang dùng trên trang Thủ công (lựa chọn, nắp hũ, tuỳ chọn thêm)
export function materialUsage(config: CraftConfig) {
  const usage = new Map<string, Usage[]>();
  const add = (id: string | undefined, u: Usage) => id && usage.set(id, [...(usage.get(id) ?? []), u]);
  for (const step of config.steps) {
    if (step.kind !== "inputs") {
      if (step.kind === "vessel") {
        for (const o of step.options)
          for (const size of o.sizes) {
            const target = { stepId: step.id, optionId: o.id };
            add(size.materialId, { step, label: `${o.name.vi} ${sizeLabel(size)}`, target });
            if (o.lid) add(size.lidMaterialId, { step, label: `Nắp ${o.name.vi.toLowerCase()} ${sizeLabel(size)}`, target });
          }
        continue;
      }
      for (const o of step.options as StepOption[]) add(o.materialId, { step, label: o.name.vi, target: { stepId: step.id, optionId: o.id } });
    } else {
      for (const a of step.addons) add(a.materialId, { step, label: a.name.vi, target: { stepId: step.id } });
    }
  }
  return usage;
}
