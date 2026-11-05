// Số liệu đầu trang Thủ công: giá hũ rẻ nhất, số mục cần xem lại giá, lựa chọn đang bị khóa; xuất cấu hình JSON
import dayjs from "dayjs";
import { inputsChecks, lidCheck, needsReview, optionCheck, sizeCheck } from "@/lib/craft/pricing";
import { emptySelection, priceSelection, type StepSelection } from "@/lib/craft/selection";
import { isOptionStep, optionRows } from "@/lib/craft/steps";
import type { CraftConfig, OptionStep, StepOption, VesselOption } from "@/lib/craft/types";
import { sellable, sellableSizes, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";

// Tải cấu hình về máy dạng JSON — đúng định dạng BE sẽ nhận (docs/craft-builder.md)
export function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `craft-config-${dayjs().format("YYYY-MM-DD")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Giá một hũ rẻ nhất (ước tính): hũ và cỡ rẻ nhất còn đặt được + lựa chọn rẻ nhất còn bán ở mỗi bước bắt buộc đang hiện
export function cheapestPrice(config: CraftConfig, map: MaterialMap) {
  const vessel = config.steps.find((s) => s.kind === "vessel");
  if (!vessel || vessel.kind !== "vessel") return 0;
  const empty = emptySelection(config);
  const totals = vessel.options
    .filter((o) => sellable(o, map))
    .flatMap((o) => sellableSizes(o, map).map((size) => ({ [vessel.id]: { kind: "vessel" as const, optionId: o.id, sizeId: size.id, withLid: false } })))
    .map((jar) => {
      let total = priceSelection(config, jar).unit;
      for (const step of config.steps) {
        if (!step.enabled || !step.required || step.kind === "inputs" || step.kind === "vessel" || !empty[step.id]) continue;
        const pick = (id: string): StepSelection => {
          const sel = empty[step.id];
          return sel.kind === "blend" ? { ...sel, items: [{ optionId: id, weight: 1 }] } : { ...(sel as Extract<StepSelection, { optionIds: string[] }>), optionIds: [id] };
        };
        const prices = (step.options as StepOption[]).filter((o) => sellable(o, map)).map((o) => priceSelection(config, { ...jar, [step.id]: pick(o.id) }).unit - priceSelection(config, jar).unit);
        if (prices.length) total += Math.min(...prices);
      }
      return total;
    });
  return totals.length ? Math.min(...totals) : 0;
}

// Số cỡ và lựa chọn đang bán cần xem lại giá: thấp hơn giá vốn, hoặc lãi dưới mức tối thiểu ở Cài đặt
export function countLowMargins(config: CraftConfig, map: MaterialMap, minMargin: number) {
  // Hũ đếm từng cỡ, lựa chọn khác đếm theo cỡ tệ nhất
  const vessel = config.steps.find((s) => s.kind === "vessel");
  const sizes =
    vessel?.kind === "vessel" ? vessel.options.filter((o) => o.available).flatMap((o) => o.sizes.filter((s) => s.available && needsReview(sizeCheck(config, o, s, map), minMargin))).length : 0;
  const options = config.steps
    .filter((s): s is OptionStep => s.enabled && isOptionStep(s) && s.kind !== "vessel")
    .flatMap((s) => (s.options as StepOption[]).filter((o) => o.available).map((o) => optionCheck(config, s, o, map)))
    .filter((c) => c && needsReview(c, minMargin)).length;
  // Nắp (đếm theo hũ) và ô nhập / tuỳ chọn thêm có gắn nguyên liệu
  const lids =
    vessel?.kind === "vessel" && vessel.enabled
      ? vessel.options
          .filter((o) => o.available)
          .filter((o) => {
            const c = lidCheck(o, map);
            return c && needsReview(c, minMargin);
          }).length
      : 0;
  const inputs = config.steps.flatMap((s) => (s.enabled && s.kind === "inputs" ? inputsChecks(s, map) : [])).filter((x) => needsReview(x.check, minMargin)).length;
  return sizes + options + lids + inputs;
}

// Lựa chọn đang bán nhưng nguyên liệu hết hàng — web đang khóa. Hũ đếm theo từng cỡ hết mã hũ (vd Hũ gốm 200ml)
export function blockedOptions(config: CraftConfig, map: MaterialMap) {
  return optionRows(config)
    .filter(({ step: s }) => s.enabled)
    .flatMap(({ step: s, option }) => {
      if (!option.available) return [];
      if (s.kind !== "vessel") return sellable(option, map) ? [] : [option.id];
      const v = option as VesselOption;
      return v.sizes.filter((size) => size.available && vesselSizeLevel(v, size.id, map) === "out").map((size) => `${v.id}:${size.id}`);
    });
}
