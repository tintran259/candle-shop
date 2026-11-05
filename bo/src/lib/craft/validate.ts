import { activeSteps, chosenIds, findOption, optionBlock, type CraftSelection } from "@/lib/craft/selection";
// Lựa chọn của khách trên trình dựng Thủ công (CraftSelection) → giá, mô tả, nguyên liệu tiêu hao, kiểm tra hợp lệ.
// Đúng công thức ở docs/craft-builder.md (mục 6–8) và docs/inventory.md (mục 6) — web và BE dùng cùng cách tính.
import type { CraftConfig, VesselOption } from "@/lib/craft/types";
import { lidLevel, optionLevel, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";

export type SelectionIssue = { stepId: string; message: string };

// Kiểm tra trước khi thêm vào đơn — giống BE kiểm tra lúc tạo đơn (docs/craft-builder.md mục 9.5)
export function validateSelection(config: CraftConfig, selection: CraftSelection, map: MaterialMap): SelectionIssue[] {
  const issues: SelectionIssue[] = [];
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    const push = (message: string) => issues.push({ stepId: step.id, message });
    if (step.kind === "vessel" && sel?.kind === "vessel") {
      const o = findOption(step, sel.optionId) as VesselOption | undefined;
      if (!o) push("Chọn hũ.");
      else if (!sel.sizeId) push("Chọn kích thước.");
      else if (vesselSizeLevel(o, sel.sizeId, map) === "out") push("Cỡ này đã hết hũ.");
      else if (sel.withLid && lidLevel(o, sel.sizeId, map) === "out") push("Nắp cỡ này đã hết.");
      continue;
    }
    if (step.kind === "inputs" && sel?.kind === "inputs") {
      if (step.required && !Object.values(sel.values).some((v) => v.trim()) && !sel.addons.length) push("Nhập ít nhất một ô hoặc chọn tuỳ chọn.");
      for (const f of step.fields) if ((sel.values[f.id]?.trim().length ?? 0) > f.maxLength) push(`${f.label.vi} quá ${f.maxLength} ký tự.`);
      for (const f of step.fields) if (f.enabled && sel.values[f.id]?.trim() && optionLevel(f.materialId, map) === "out") push(`${f.label.vi}: nguyên liệu đã hết.`);
      for (const a of step.addons) if (sel.addons.includes(a.id) && (!a.available || optionLevel(a.materialId, map) === "out")) push(`${a.name.vi} đã hết.`);
      continue;
    }
    const ids = chosenIds(sel);
    if (step.required && !ids.length) push("Chưa chọn.");
    for (const id of ids) {
      const o = findOption(step, id);
      const block = o ? optionBlock(config, selection, step, o, map) : "Không còn";
      if (block) push(`${o?.name.vi ?? id}: ${block.toLowerCase()}.`);
    }
    if (step.kind === "blend" && sel?.kind === "blend" && sel.items.length > 1 && sel.items.some((i) => findOption(step, i.optionId)?.exclusive)) push("Mục “không phối thêm” phải chọn riêng.");
  }
  return issues;
}
