// Lọc và tổng hợp phiếu kho cho trang Phiếu kho (docs/pages/stock-movements.md)
import dayjs from "dayjs";
import { unitLabel } from "@/lib/craft/groups";
import { movementLabels } from "@/lib/inventory/stock";
import type { Material, MovementType, StockMovement } from "@/lib/inventory/types";
import { fold } from "@/lib/search";
import { downloadXlsx } from "@/lib/xlsx";

export const movementTypes: MovementType[] = ["in", "make", "out", "adjust", "order", "cost"];

// from, to: ngày YYYY-MM-DD (tính cả hai đầu). q: tìm theo tên nguyên liệu, ghi chú, mã đơn, mã mẻ (không dấu)
export type MovementFilters = { type?: MovementType; materialId?: string; from?: string; to?: string; q?: string };

export function filterMovements(list: StockMovement[], materials: Material[], f: MovementFilters) {
  const names = new Map(materials.map((m) => [m.id, fold(m.name)]));
  const q = fold(f.q?.trim() ?? "");
  const from = f.from ? dayjs(f.from).startOf("day") : undefined;
  const to = f.to ? dayjs(f.to).endOf("day") : undefined;
  return list.filter((mv) => {
    if (f.type && mv.type !== f.type) return false;
    if (f.materialId && mv.materialId !== f.materialId) return false;
    if (from && dayjs(mv.at).isBefore(from)) return false;
    if (to && dayjs(mv.at).isAfter(to)) return false;
    if (q && ![names.get(mv.materialId), fold(mv.note ?? ""), fold(mv.orderCode ?? ""), fold(mv.batch ?? "")].some((s) => s?.includes(q))) return false;
    return true;
  });
}

// Tổng theo bộ lọc: số phiếu, tiền nhập (tổng tiền lô các phiếu Nhập thêm), số phiếu nhập, số phiếu làm giảm tồn (xuất, theo đơn, trừ nguyên liệu khi sản xuất)
export function movementTotals(list: StockMovement[]) {
  return {
    count: list.length,
    lotMoney: list.reduce((s, mv) => s + (mv.type === "in" ? (mv.totalCost ?? 0) : 0), 0),
    inCount: list.filter((mv) => mv.change > 0).length,
    outCount: list.filter((mv) => mv.change < 0).length,
  };
}

// Xuất phiếu đang lọc ra Excel
export function exportMovementsXlsx(items: StockMovement[], materials: Material[]) {
  const byId = new Map(materials.map((m) => [m.id, m]));
  downloadXlsx(`phieu-kho-${dayjs().format("YYYY-MM-DD")}`, [
    {
      name: "Phiếu kho",
      columns: [
        { header: "Thời gian", format: "datetime", width: 17 },
        { header: "Loại phiếu", width: 15 },
        { header: "Nguyên liệu", width: 26 },
        { header: "Mã nội bộ", width: 12 },
        { header: "Thay đổi", format: "number", width: 11 },
        { header: "Tồn sau", format: "number", width: 11 },
        { header: "Đơn vị", width: 8 },
        { header: "Tiền lô", format: "money", width: 13 },
        { header: "Giá mỗi đơn vị", format: "money", width: 14 },
        { header: "Giá trước khi sửa", format: "money", width: 16 },
        { header: "Mã đơn", width: 16 },
        { header: "Mã mẻ", width: 14 },
        { header: "Ghi chú", width: 30 },
        { header: "Người ghi", width: 14 },
      ],
      rows: items.map((m) => {
        const mat = byId.get(m.materialId);
        return [
          new Date(m.at),
          movementLabels[m.type],
          mat?.name ?? m.materialId,
          mat?.sku,
          m.type === "cost" ? undefined : m.change,
          m.after,
          mat ? unitLabel[mat.unit] : undefined,
          m.totalCost,
          m.unitCost,
          m.previousCost,
          m.orderCode,
          m.batch,
          m.note,
          m.by,
        ];
      }),
    },
  ]);
}
