import { Tabs } from "antd";
import { Activity, memo, useMemo } from "react";
import { useColorMix } from "@/hooks/use-color-mix";
import type { MixView } from "@/lib/color-mix/types";
import { CheckPanel } from "./check-panel";
import { DataPanel } from "./data-panel";
import { MixPanel, type MixShared } from "./mix-panel";

// Tab con của một loại (Pha màu / Dữ liệu mẫu / Kiểm chứng). Trang giữ mỗi loại đã mở trong <Activity> (ẩn chứ không bỏ) nên quay lại
// không dựng lại. Khung đã mở cũng nằm trong <Activity> riêng: khung ẩn không chạy lại hiệu ứng / đo kích thước khi chuyển tab, đổi loại —
// chỉ khung đang xem. Phần tử khung giữ nguyên (useMemo) nên chuyển tab không vẽ lại khung khác. Kết hợp không có Dữ liệu mẫu
export const ModeTabs = memo(function ModeTabs({ view, tab, onTab, shared }: { view: MixView; tab: string; onTab: (tab: string) => void; shared: MixShared }) {
  const { set, update, prefs, savePrefs } = useColorMix(view);
  const active = view === "combo" && tab === "data" ? "mix" : tab;
  const panels = useMemo(
    () => [
      {
        key: "mix",
        label: "Pha màu",
        panel: <MixPanel mode={view} set={set} shared={shared} prefs={prefs} onPrefs={savePrefs} onAddCheck={(c) => update((s) => ({ ...s, checks: [...s.checks, c] }), false)} />,
      },
      ...(view === "combo" ? [] : [{ key: "data", label: "Dữ liệu mẫu", panel: <DataPanel mode={view} set={set} update={update} /> }]),
      { key: "check", label: `Kiểm chứng${set.checks.length ? ` (${set.checks.length})` : ""}`, panel: <CheckPanel mode={view} set={set} update={(fn) => update(fn, false)} /> },
    ],
    [view, set, shared, prefs, savePrefs, update],
  );
  const items = panels.map(({ key, label, panel }) => ({ key, label, children: <Activity mode={key === active ? "visible" : "hidden"}>{panel}</Activity> }));
  return <Tabs className="color-mix-tabs" activeKey={active} onChange={onTab} items={items} />;
});
