import { Alert, Button, Flex, Grid, Segmented, Skeleton, Typography } from "antd";
import { Activity, startTransition, useCallback, useOptimistic, useState } from "react";
import { useSearchParams } from "react-router";
import { ModeTabs } from "@/components/color-mix/mode-tabs";
import { useColorMix } from "@/hooks/use-color-mix";
import { MODE_LABEL, type MixView } from "@/lib/color-mix/types";
import { useTitle } from "@/lib/use-title";

const VIEWS = ["oxide", "liquid", "combo"] as const;
const TABS = ["mix", "data", "check"] as const;
const HINT: Record<MixView, string> = { oxide: "Bột khoáng, bền màu", liquid: "Dạng lỏng, tính theo giọt", combo: "Oxit + màu nước" };

// Pha màu cho đế / hũ thạch cao (docs/pages/color-mix.md): nhập màu muốn có + số gram bột → số gram từng màu.
// Ba loại: bột oxit, màu nước (dữ liệu và cách tính riêng), kết hợp (dùng màu của cả hai bộ). Loại và tab nằm trên URL (?mode=combo&tab=check).
// Kết hợp không có tab Dữ liệu mẫu — dữ liệu lấy từ hai bộ kia.
// Mượt khi chuyển: nút loại / tab đổi ngay (useOptimistic), nội dung vẽ trong transition. Loại đã mở giữ trong <Activity> (ẩn, không bỏ):
// quay lại không dựng lại, giữ cả màu mục tiêu đang nhập. Tab con: components/color-mix/mode-tabs.tsx
export function ColorMixPage() {
  useTitle("Pha màu");
  const [params, setParams] = useSearchParams();
  const mode: MixView = VIEWS.find((v) => v === params.get("mode")) ?? "oxide";
  const combo = mode === "combo";
  const asked = TABS.find((t) => t === params.get("tab")) ?? "mix";
  const tab = combo && asked === "data" ? "mix" : asked;
  const { set, data, loading } = useColorMix(mode);
  const [shownMode, showMode] = useOptimistic(mode);
  const [shownTab, showTab] = useOptimistic<string>(tab);
  const switchTo = useCallback(
    (patch: { mode?: MixView; tab?: string }) =>
      startTransition(() => {
        if (patch.mode) showMode(patch.mode);
        if (patch.tab) showTab(patch.tab);
        setParams((p) => ({ ...Object.fromEntries(p), ...patch }), { replace: true });
      }),
    [setParams, showMode, showTab],
  );
  const onTab = useCallback((t: string) => switchTo({ tab: t }), [switchTo]);
  // Các loại đã mở (giữ lại trong Activity)
  const [visited, setVisited] = useState<MixView[]>([mode]);
  if (!visited.includes(shownMode)) setVisited([...visited, shownMode]);
  const mobile = Grid.useBreakpoint().md === false;

  // Kết hợp: bộ nào còn số minh họa thì nút đưa tới tab Dữ liệu mẫu của bộ đó
  const demoOf = combo ? VIEWS.filter((v): v is "oxide" | "liquid" => v !== "combo" && data.sets[v].demo) : set.demo ? [mode as "oxide" | "liquid"] : [];
  const toData = demoOf.length > 0 && (combo || tab !== "data") && (
    <Flex gap={8} wrap>
      {demoOf.map((m) => (
        <Button key={m} size="small" onClick={() => switchTo({ mode: m, tab: "data" })}>
          Nhập dữ liệu {combo ? MODE_LABEL[m].toLowerCase() : ""}
        </Button>
      ))}
    </Flex>
  );

  return (
    <Flex vertical gap={16} className="color-mix-page">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Pha màu
        </Typography.Title>
        <Typography.Text type="secondary">Nhập màu muốn có và số gram thạch cao, BO tính số gram từng màu dựa trên mẫu đổ thử thật.</Typography.Text>
      </div>

      <Segmented<MixView>
        block
        className="color-mix-modes"
        value={shownMode}
        onChange={(m) => switchTo({ mode: m })}
        options={VIEWS.map((v) => ({
          value: v,
          label: (
            <span className="color-mix-mode">
              <span className="color-mix-mode-name">{MODE_LABEL[v]}</span>
              <span className="color-mix-mode-hint">{HINT[v]}</span>
            </span>
          ),
        }))}
      />

      {demoOf.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`Dữ liệu ${demoOf.map((m) => MODE_LABEL[m].toLowerCase()).join(" và ")} đang là số minh họa`}
          description={
            <>
              Nhập màu đổ thử thật ở tab Dữ liệu mẫu thì công thức mới đúng với bột và màu của shop.
              {/* Điện thoại: nút nằm dưới lời nhắn (đặt bên phải thì ép chữ thành cột hẹp) */}
              {mobile && toData && <div style={{ marginTop: 8 }}>{toData}</div>}
            </>
          }
          action={!mobile && toData}
        />
      )}

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        visited.map((v) => (
          <Activity key={v} mode={v === shownMode ? "visible" : "hidden"}>
            <ModeTabs view={v} tab={shownTab} onTab={onTab} />
          </Activity>
        ))
      )}
    </Flex>
  );
}
