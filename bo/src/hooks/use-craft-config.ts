import { useMemo } from "react";
import { defaultCraftConfig } from "@/lib/craft/default-config";
import { isOptionStep, newStep } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, StepKind, StepOption } from "@/lib/craft/types";
import { createMaterials } from "@/hooks/use-inventory";
import { materialUsage } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE: GET /api/shop-config/craft để tải,
// PUT /api/shop-config/craft để lưu cả cấu hình (xem docs/craft-builder.md).
// v5: hũ gắn kho theo từng cỡ (sizeMaterials), cỡ có dung tích ml — bỏ dữ liệu v4
const store = createLocalStore<CraftConfig>("bo-craft-builder-v5", defaultCraftConfig);

// Bản nháp trên trang Thủ công: mọi chỉnh sửa vào đây, chỉ lên web (store) khi bấm Lưu.
// Giữ trên trình duyệt để rời trang / tải lại không mất việc đang làm. null = không có thay đổi.
const draftStore = createLocalStore<CraftConfig | null>("bo-craft-builder-v5-draft", null);

// Nguyên liệu tạo mới từ drawer lựa chọn ("Tạo nguyên liệu mới trong Kho") — thuộc bản nháp:
// chỉ vào Kho khi bấm Lưu, Bỏ thay đổi thì không sót lại gì trong Kho.
type PendingMaterial = Omit<Material, "updatedAt">;
const pendingStore = createLocalStore<PendingMaterial[]>("bo-craft-builder-v5-new-materials", []);
const addPendingMaterial = (m: PendingMaterial) => pendingStore.set([...pendingStore.get().filter((x) => x.id !== m.id), m]);
// Chỉ giữ nguyên liệu chờ tạo mà bản nháp còn dùng (xóa lựa chọn / hoàn tác bước thì tự rơi)
const usedPending = (config: CraftConfig, pending: PendingMaterial[]) => {
  const used = materialUsage(config);
  return pending.filter((m) => used.has(m.id));
};

const current = () => draftStore.get() ?? store.get();

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu giữa các lần render.
// Trả false khi bộ nhớ trình duyệt đầy (thường do ảnh).
const update = (fn: (c: CraftConfig) => CraftConfig) => draftStore.set({ ...fn(current()), updatedAt: new Date().toISOString() });

const updateStep = (id: string, fn: (s: CraftStep) => CraftStep) =>
  update((c) => ({ ...c, steps: c.steps.map((s) => (s.id === id ? fn(s) : s)) }));

const addStep = (kind: StepKind, title: string) => {
  const step = newStep(kind, title, current().steps.map((s) => s.id));
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

const replace = (config: CraftConfig) => draftStore.set(config);
// Cấu hình mẫu vào bản nháp — xem lại rồi mới Lưu
const reset = () => draftStore.set({ ...defaultCraftConfig, updatedAt: new Date().toISOString() });

// Lưu bản nháp lên web (khi có BE: tạo nguyên liệu mới rồi PUT cả cấu hình), rồi xóa nháp
const save = () => {
  const draft = draftStore.get();
  if (!draft) return true;
  if (!store.set(draft)) return false;
  createMaterials(usedPending(draft, pendingStore.get()));
  draftStore.set(null);
  pendingStore.set(null);
  return true;
};
const discard = () => {
  draftStore.set(null);
  pendingStore.set(null);
};

// Hoàn tác một bước về bản đã lưu (bước mới thêm thì bỏ, bước đã xóa thì đặt lại đúng vị trí cũ).
// Hết khác biệt thì xóa luôn bản nháp.
const revertStep = (id: string) => {
  const draft = draftStore.get();
  if (!draft) return;
  const saved = store.get();
  const original = saved.steps.find((s) => s.id === id);
  let steps = draft.steps.filter((s) => s.id !== id || original);
  if (original) {
    if (steps.some((s) => s.id === id)) steps = steps.map((s) => (s.id === id ? original : s));
    else {
      steps = [...steps];
      steps.splice(Math.min(saved.steps.indexOf(original), steps.length), 0, original);
    }
  }
  const next = { ...draft, steps };
  if (same(next.steps, saved.steps)) discard();
  else draftStore.set(next);
};

// So sánh bỏ qua updatedAt — sửa rồi sửa lại như cũ thì không còn tính là thay đổi
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export type DraftChanges = { added: CraftStep[]; removed: CraftStep[]; edited: CraftStep[]; reordered: boolean };

function diff(saved: CraftConfig, draft: CraftConfig): DraftChanges {
  const before = new Map(saved.steps.map((s) => [s.id, s]));
  const after = new Set(draft.steps.map((s) => s.id));
  const kept = draft.steps.filter((s) => before.has(s.id)).map((s) => s.id);
  return {
    added: draft.steps.filter((s) => !before.has(s.id)),
    removed: saved.steps.filter((s) => !after.has(s.id)),
    edited: draft.steps.filter((s) => before.has(s.id) && !same(s, before.get(s.id))),
    reordered: !same(kept, saved.steps.map((s) => s.id).filter((id) => after.has(id))),
  };
}

// Cấu hình ĐÃ LƯU (bản web đang dùng) — cho Kho, tìm kiếm, sản phẩm
export function useCraftConfig() {
  const { data: config, loading } = useLocalStore(store);
  return useMemo(() => ({ config, loading }), [config, loading]);
}

// Trang Thủ công: đọc / sửa bản nháp, Lưu để lên web
export function useCraftDraft() {
  const { data: saved, loading: l1 } = useLocalStore(store);
  const { data: draft, loading: l2 } = useLocalStore<CraftConfig | null>(draftStore);
  const { data: allPending } = useLocalStore(pendingStore);
  const config = draft ?? saved;
  // Nguyên liệu chờ tạo (gắn cờ draft) — trang Thủ công gộp vào danh sách kho để chọn / hiện tồn / kiểm tra
  const pending = useMemo(() => (draft ? usedPending(draft, allPending).map((m): Material => ({ ...m, updatedAt: "", draft: true })) : []), [draft, allPending]);
  const changes = useMemo(() => (draft ? diff(saved, draft) : null), [draft, saved]);
  const dirty = !!changes && (changes.added.length + changes.removed.length + changes.edited.length > 0 || changes.reordered);
  return useMemo(
    () => ({ config, saved, dirty, changes, pending, loading: l1 || l2, addPendingMaterial, update, updateStep, addStep, removeStep, moveStep, saveOption, patchOption, removeOption, replace, reset, save, discard, revertStep }),
    [config, saved, dirty, changes, pending, l1, l2],
  );
}

export type CraftConfigApi = ReturnType<typeof useCraftDraft>;
