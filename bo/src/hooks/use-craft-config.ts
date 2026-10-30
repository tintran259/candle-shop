import { useMemo } from "react";
import { defaultCraftConfig } from "@/lib/craft/default-config";
import { isOptionStep, newStep } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, StepKind, StepOption } from "@/lib/craft/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE: GET /api/shop-config/craft để tải,
// PUT /api/shop-config/craft để lưu cả cấu hình (xem docs/craft-builder.md).
// v3: chuyển sang mô hình bước + component — bỏ dữ liệu nhóm cố định (v2)
const store = createLocalStore<CraftConfig>("bo-craft-builder-v3", defaultCraftConfig);

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu giữa các lần render.
// Trả false khi bộ nhớ trình duyệt đầy (thường do ảnh).
const update = (fn: (c: CraftConfig) => CraftConfig) => store.set({ ...fn(store.get()), updatedAt: new Date().toISOString() });

const updateStep = (id: string, fn: (s: CraftStep) => CraftStep) =>
  update((c) => ({ ...c, steps: c.steps.map((s) => (s.id === id ? fn(s) : s)) }));

const addStep = (kind: StepKind, title: string) => {
  const step = newStep(kind, title, store.get().steps.map((s) => s.id));
  update((c) => ({ ...c, steps: [...c.steps, step] }));
  return step;
};

// Xóa bước + gỡ các giới hạn "chỉ dùng với" đang trỏ tới nó
const removeStep = (id: string) =>
  update((c) => ({
    ...c,
    steps: c.steps
      .filter((s) => s.id !== id)
      .map((s) =>
        isOptionStep(s)
          ? ({
              ...s,
              options: (s.options as StepOption[]).map((o) => {
                if (!o.onlyWith?.[id]) return o;
                const rest = Object.fromEntries(Object.entries(o.onlyWith).filter(([k]) => k !== id));
                return { ...o, onlyWith: Object.keys(rest).length ? rest : undefined };
              }),
            } as CraftStep)
          : s,
      ),
  }));

const moveStep = (id: string, delta: -1 | 1) =>
  update((c) => {
    const i = c.steps.findIndex((s) => s.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= c.steps.length) return c;
    const steps = [...c.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    return { ...c, steps };
  });

// Thêm mới hoặc thay lựa chọn cùng id trong bước
const saveOption = (stepId: string, option: StepOption, previousId?: string) =>
  updateStep(stepId, (s) => {
    if (!isOptionStep(s)) return s;
    const list = s.options as StepOption[];
    const key = previousId ?? option.id;
    const options = list.some((o) => o.id === key) ? list.map((o) => (o.id === key ? option : o)) : [...list, option];
    return { ...s, options } as CraftStep;
  });

const patchOption = (stepId: string, id: string, patch: Partial<StepOption>) =>
  updateStep(stepId, (s) => (isOptionStep(s) ? ({ ...s, options: (s.options as StepOption[]).map((o) => (o.id === id ? { ...o, ...patch } : o)) } as CraftStep) : s));

const removeOption = (stepId: string, id: string) =>
  updateStep(stepId, (s) => (isOptionStep(s) ? ({ ...s, options: (s.options as StepOption[]).filter((o) => o.id !== id) } as CraftStep) : s));

const replace = (config: CraftConfig) => store.set(config);
const reset = () => store.set(null);

export function useCraftConfig() {
  const { data: config, loading } = useLocalStore(store);
  return useMemo(
    () => ({ config, loading, update, updateStep, addStep, removeStep, moveStep, saveOption, patchOption, removeOption, replace, reset }),
    [config, loading],
  );
}

export type CraftConfigApi = ReturnType<typeof useCraftConfig>;
