import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Grid, Popconfirm, Segmented, Skeleton, Tabs, Typography } from "antd";
import { useSearchParams } from "react-router";
import { CheckPanel } from "@/components/color-mix/check-panel";
import { DataPanel } from "@/components/color-mix/data-panel";
import { MixPanel } from "@/components/color-mix/mix-panel";
import { useColorMix } from "@/hooks/use-color-mix";
import { MODE_LABEL, type MixMode } from "@/lib/color-mix/types";
import { useTitle } from "@/lib/use-title";

const TABS = ["mix", "data", "check"] as const;

// Pha màu cho đế / hũ thạch cao (docs/pages/color-mix.md): nhập màu muốn có + số gram bột → số gram từng màu.
// Hai loại màu, dữ liệu và cách tính riêng: bột oxit, màu nước. Loại và tab nằm trên URL (?mode=liquid&tab=data)
export function ColorMixPage() {
  useTitle("Pha màu");
  const [params, setParams] = useSearchParams();
  const mode: MixMode = params.get("mode") === "liquid" ? "liquid" : "oxide";
  const tab = TABS.find((t) => t === params.get("tab")) ?? "mix";
  const { set, loading, update, reset } = useColorMix(mode);
  const go = (patch: Record<string, string>) => setParams((p) => ({ ...Object.fromEntries(p), ...patch }), { replace: true });
  const mobile = Grid.useBreakpoint().md === false;
  const toData = tab !== "data" && (
    <Button size="small" onClick={() => go({ tab: "data" })}>
      Nhập dữ liệu
    </Button>
  );

  return (
    <Flex vertical gap={16} className="color-mix-page">
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Pha màu
          </Typography.Title>
          <Typography.Text type="secondary">Nhập màu muốn có và số gram thạch cao, BO tính số gram từng màu dựa trên mẫu đổ thử thật.</Typography.Text>
        </div>
        <Flex gap={8} wrap>
          <Segmented<MixMode> value={mode} onChange={(m) => go({ mode: m })} options={(["oxide", "liquid"] as const).map((m) => ({ value: m, label: MODE_LABEL[m] }))} />
          <Popconfirm
            title={`Khôi phục dữ liệu minh họa (${MODE_LABEL[mode]})?`}
            description="Mẫu đổ thử và mẫu kiểm chứng của loại này sẽ mất."
            okText="Khôi phục"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={reset}
          >
            <Button icon={<ReloadOutlined />}>Dữ liệu minh họa</Button>
          </Popconfirm>
        </Flex>
      </Flex>

      {set.demo && (
        <Alert
          type="warning"
          showIcon
          title={`Dữ liệu ${MODE_LABEL[mode].toLowerCase()} đang là số minh họa`}
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
        <Tabs
          activeKey={tab}
          onChange={(t) => go({ tab: t })}
          items={[
            { key: "mix", label: "Pha màu", children: <MixPanel key={mode} mode={mode} set={set} onAddCheck={(c) => update((s) => ({ ...s, checks: [...s.checks, c] }), false)} /> },
            { key: "data", label: "Dữ liệu mẫu", children: <DataPanel mode={mode} set={set} update={update} /> },
            { key: "check", label: `Kiểm chứng${set.checks.length ? ` (${set.checks.length})` : ""}`, children: <CheckPanel set={set} update={(fn) => update(fn, false)} /> },
          ]}
        />
      )}
    </Flex>
  );
}
