import { DownloadOutlined, EyeInvisibleOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Empty, Flex, Popconfirm, Row, Statistic, Switch, Tabs, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { AddStepModal } from "@/components/craft/add-step-modal";
import { InputsEditor } from "@/components/craft/inputs-editor";
import { OptionDrawer } from "@/components/craft/option-drawer";
import { OptionTable } from "@/components/craft/option-table";
import { RestockPanel } from "@/components/craft/restock-panel";
import { SizeTable } from "@/components/craft/size-table";
import { StepIconView } from "@/components/craft/step-icon";
import { StepList } from "@/components/craft/step-list";
import { StepPreview } from "@/components/craft/step-preview";
import { StepSettings } from "@/components/craft/step-settings";
import { CraftSkeleton } from "@/components/skeletons";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { CRAFT_PREVIEW_NOTICE, stockLevel } from "@/lib/craft/groups";
import { isOptionStep, kindMeta, optionRows, validateConfig } from "@/lib/craft/steps";
import type { CraftStep, StepOption } from "@/lib/craft/types";
import { useDrawerTarget } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";
import { brand } from "@/theme";

// Tải cấu hình về máy dạng JSON — đúng định dạng BE sẽ nhận (docs/craft-builder.md)
function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `craft-config-${dayjs().format("YYYY-MM-DD")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Trình dựng trang Thủ công: admin tạo các bước, mỗi bước dùng một component, web dựng theo đúng thứ tự
export function CraftPage() {
  useTitle("Trình dựng Thủ công");
  const { message } = App.useApp();
  const api = useCraftConfig();
  const { config } = api;
  const [adding, setAdding] = useState(false);

  // Bước, tab và lựa chọn đang sửa nằm trên URL (?step=wax&view=settings&edit=soy) — tìm kiếm link thẳng tới
  const [params] = useSearchParams();
  const pager = usePageQuery();
  const step = config.steps.find((s) => s.id === params.get("step")) ?? config.steps[0];
  const view = params.get("view") ?? "main";
  const go = (extra: Record<string, string | null>) => pager.go(1, pager.limit, extra);
  const selectStep = (id: string) => go({ step: id, view: null, edit: null });

  const editParam = params.get("edit");
  const { shown: editShown, key: drawerKey } = useDrawerTarget(editParam);
  const options = step && isOptionStep(step) ? (step.options as StepOption[]) : [];
  const editing = editShown && editShown !== "new" ? options.find((o) => o.id === editShown) : undefined;

  const issues = useMemo(() => validateConfig(config), [config]);
  const withIssues = new Set(issues.filter((i) => i.level === "error" || i.level === "warning").map((i) => i.stepId).filter(Boolean) as string[]);

  if (api.loading) return <CraftSkeleton />;

  const rows = optionRows(config).filter(({ step: s }) => s.enabled);
  const low = rows.filter(({ option }) => stockLevel(option) === "low");
  const out = rows.filter(({ option }) => stockLevel(option) === "out");
  const errors = issues.filter((i) => i.level === "error");
  // Số thứ tự trên web chỉ đếm các bước đang hiện
  const webIndex = (s: CraftStep) => config.steps.filter((x) => x.enabled).indexOf(s) + 1;

  const stats = [
    { label: "Bước đang hiện", value: `${config.steps.filter((s) => s.enabled).length}/${config.steps.length}` },
    { label: "Lựa chọn đang bán", value: rows.filter(({ option }) => option.available).length },
    { label: "Sắp hết", value: low.length, color: low.length ? "#d46b08" : undefined },
    { label: "Hết hàng", value: out.length, color: out.length ? "#cf1322" : undefined },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Trình dựng Thủ công
          </Typography.Title>
          <Typography.Text type="secondary">Các bước khách đi qua khi tự phối nến trên web — mỗi bước dùng một component.</Typography.Text>
        </div>
        <Flex gap={8} wrap>
          <Popconfirm title="Khôi phục cấu hình mẫu?" description="Mọi bước và lựa chọn trên trình duyệt này sẽ về mặc định." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
            <Button icon={<ReloadOutlined />}>Cấu hình mẫu</Button>
          </Popconfirm>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              downloadJson(config);
              message.success("Đã tải file cấu hình JSON");
            }}
          >
            Xuất JSON
          </Button>
        </Flex>
      </Flex>

      <Alert type="info" showIcon title={CRAFT_PREVIEW_NOTICE} />

      {issues.length > 0 && (
        <Alert
          type={errors.length ? "error" : "warning"}
          showIcon
          icon={<WarningOutlined />}
          title={errors.length ? `${errors.length} lỗi cần sửa trước khi lên web` : `${issues.length} điểm nên xem lại`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {issues.slice(0, 6).map((i, k) => (
                <li key={k}>
                  {i.stepId ? (
                    <Typography.Link onClick={() => selectStep(i.stepId!)}>{i.message}</Typography.Link>
                  ) : (
                    i.message
                  )}
                </li>
              ))}
              {issues.length > 6 && <li>và {issues.length - 6} điểm khác…</li>}
            </ul>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card>
              <Statistic title={s.label} value={s.value} styles={{ content: { color: s.color } }} />
            </Card>
          </Col>
        ))}
      </Row>

      {out.length + low.length > 0 && <RestockPanel out={out} low={low} onOpen={(stepId, optionId) => go({ step: stepId, view: null, edit: optionId })} />}

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={9} xl={7}>
          <div className="craft-steps-col">
            <StepList steps={config.steps} active={step?.id} withIssues={withIssues} api={api} onSelect={selectStep} onAdd={() => setAdding(true)} />
          </div>
        </Col>
        <Col xs={24} lg={15} xl={17}>
          {step ? (
            <Card
              title={
                <Flex align="center" gap={10} style={{ minWidth: 0 }}>
                  <span aria-hidden style={{ color: brand.emberDark, fontSize: 18 }}>
                    <StepIconView icon={step.icon} />
                  </span>
                  <Typography.Text strong ellipsis style={{ fontSize: 16 }}>
                    {step.title.vi}
                  </Typography.Text>
                  <Tag style={{ marginInlineEnd: 0 }}>{kindMeta[step.kind].label}</Tag>
                  {!step.enabled && (
                    <Tag icon={<EyeInvisibleOutlined />} style={{ marginInlineEnd: 0 }}>
                      Đang ẩn
                    </Tag>
                  )}
                </Flex>
              }
              extra={
                <Flex align="center" gap={8}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Hiện trên web
                  </Typography.Text>
                  <Switch
                    checked={step.enabled}
                    disabled={step.kind === "vessel"}
                    aria-label="Hiện trên web"
                    onChange={(enabled) => api.updateStep(step.id, (s) => ({ ...s, enabled }))}
                  />
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
                        <InputsEditor step={step} api={api} />
                      ) : (
                        <OptionTable step={step} config={config} api={api} onEdit={(id) => go({ step: step.id, view: null, edit: id })} />
                      ),
                  },
                  ...(step.kind === "vessel" ? [{ key: "sizes", label: "Kích thước", children: <SizeTable step={step} api={api} /> }] : []),
                  { key: "settings", label: "Cài đặt", children: <StepSettings step={step} api={api} onRemoved={() => go({ step: null, view: null, edit: null })} /> },
                  {
                    key: "preview",
                    label: "Xem trước",
                    children: (
                      <Flex vertical gap={12}>
                        <Typography.Text type="secondary">
                          {step.enabled
                            ? `Mô phỏng bước ${webIndex(step)} trên trang Thủ công — bấm thử được, không lưu.`
                            : "Bước đang ẩn — khách chưa thấy bước này. Mô phỏng nếu bật lên:"}
                        </Typography.Text>
                        <StepPreview key={step.id} step={step} index={step.enabled ? webIndex(step) : config.steps.filter((x) => x.enabled).length + 1} />
                      </Flex>
                    ),
                  },
                ]}
              />
            </Card>
          ) : (
            <Card>
              <Empty description="Chưa có bước nào.">
                <Button type="primary" onClick={() => setAdding(true)}>
                  Thêm bước đầu tiên
                </Button>
              </Empty>
            </Card>
          )}
        </Col>
      </Row>

      {step && isOptionStep(step) && (
        <OptionDrawer
          key={`${step.id}:${drawerKey}`}
          open={editParam !== null && (editParam === "new" || !!editing)}
          step={step}
          option={editing}
          config={config}
          api={api}
          onClose={() => go({ step: step.id, view: null, edit: null })}
        />
      )}

      <AddStepModal
        open={adding}
        hasVessel={config.steps.some((s) => s.kind === "vessel")}
        onCancel={() => setAdding(false)}
        onCreate={(kind, title) => {
          const created = api.addStep(kind, title);
          setAdding(false);
          message.success(`Đã thêm bước “${title}” — đang ẩn, bật lên khi cấu hình xong.`);
          selectStep(created.id);
        }}
      />
    </Flex>
  );
}
