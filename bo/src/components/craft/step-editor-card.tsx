import { EyeInvisibleOutlined } from "@ant-design/icons";
import { Card, Flex, Grid, Switch, Tabs, Tag, Typography } from "antd";
import { InputsEditor } from "@/components/craft/inputs-editor";
import { OptionTable } from "@/components/craft/option-table";
import { StepIconView } from "@/components/craft/step-icon";
import { StepPreview } from "@/components/craft/step-preview";
import { StepSettings } from "@/components/craft/step-settings";
import type { useCraftDraft } from "@/hooks/use-craft-config";
import { kindMeta } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import type { ShopSettings } from "@/lib/settings/types";
import { brand } from "@/theme";

type Props = {
  step: CraftStep;
  config: CraftConfig;
  api: ReturnType<typeof useCraftDraft>;
  materials: Material[];
  map: MaterialMap;
  settings: ShopSettings;
  view: string;
  // Số thay đổi chưa lưu của bước này — bấm để xem danh sách thay đổi
  pending?: number;
  onReview: () => void;
  // Đổi tham số trên URL (?step=&view=&edit=)
  go: (extra: Record<string, string | null>) => void;
};

// Thẻ sửa một bước ở trang Thủ công: tên, loại, hiện trên web; tab Lựa chọn / Cài đặt / Xem trước
export function StepEditorCard({ step, config, api, materials, map, settings, view, pending, onReview, go }: Props) {
  const screens = Grid.useBreakpoint();
  // Số thứ tự trên web chỉ đếm các bước đang hiện
  const webIndex = config.steps.filter((x) => x.enabled).indexOf(step) + 1;
  return (
    <Card
      title={
        <Flex align="center" gap={10} style={{ minWidth: 0 }}>
          <span aria-hidden style={{ color: brand.emberDark, fontSize: 18 }}>
            <StepIconView icon={step.icon} />
          </span>
          <Typography.Text strong ellipsis style={{ fontSize: 16 }}>
            {step.title.vi}
          </Typography.Text>
          {/* Màn hẹp bỏ tag loại bước để tên bước không bị cắt còn "H…" */}
          {screens.sm !== false && <Tag style={{ marginInlineEnd: 0 }}>{kindMeta[step.kind].label}</Tag>}
          {!step.enabled && (
            <Tag icon={<EyeInvisibleOutlined />} style={{ marginInlineEnd: 0 }}>
              Đang ẩn
            </Tag>
          )}
          {pending ? (
            <Tag color="orange" style={{ marginInlineEnd: 0, cursor: "pointer" }} onClick={onReview}>
              {pending} thay đổi chưa lưu
            </Tag>
          ) : null}
        </Flex>
      }
      extra={
        <Flex align="center" gap={8}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }} className="hide-xs">
            Hiện trên web
          </Typography.Text>
          <Switch checked={step.enabled} disabled={step.kind === "vessel"} aria-label="Hiện trên web" onChange={(enabled) => api.updateStep(step.id, (s) => ({ ...s, enabled }))} />
        </Flex>
      }
      styles={{ body: { paddingTop: 4 } }}
    >
      <Tabs
        activeKey={view}
        onChange={(k) => go({ step: step.id, view: k === "main" ? null : k, edit: null })}
        items={[
          {
            key: "main",
            label: step.kind === "vessel" ? "Hũ" : step.kind === "inputs" ? "Ô nhập & tuỳ chọn" : "Lựa chọn",
            children:
              step.kind === "inputs" ? (
                <InputsEditor step={step} api={api} materials={materials} />
              ) : (
                <OptionTable step={step} config={config} api={api} map={map} pricing={settings} onEdit={(id) => go({ step: step.id, view: null, edit: id })} />
              ),
          },
          { key: "settings", label: "Cài đặt", children: <StepSettings step={step} api={api} onRemoved={() => go({ step: null, view: null, edit: null })} /> },
          {
            key: "preview",
            label: "Xem trước",
            children: (
              <Flex vertical gap={12}>
                <Typography.Text type="secondary">
                  {step.enabled ? `Mô phỏng bước ${webIndex} trên trang Thủ công — bấm thử được, không lưu.` : "Bước đang ẩn — khách chưa thấy bước này. Mô phỏng nếu bật lên:"}
                </Typography.Text>
                <StepPreview key={step.id} step={step} map={map} index={step.enabled ? webIndex : config.steps.filter((x) => x.enabled).length + 1} />
              </Flex>
            ),
          },
        ]}
      />
    </Card>
  );
}
