import { CheckOutlined, DownloadOutlined, EyeInvisibleOutlined, ReloadOutlined, SaveOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Empty, Flex, Grid, Popconfirm, Row, Statistic, Switch, Tabs, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AddStepModal } from "@/components/craft/add-step-modal";
import { InputsEditor } from "@/components/craft/inputs-editor";
import { OptionDrawer } from "@/components/craft/option-drawer";
import { OptionTable } from "@/components/craft/option-table";
import { ChangesDrawer, SaveBar } from "@/components/craft/save-bar";
import { SizeTable } from "@/components/craft/size-table";
import { StepIconView } from "@/components/craft/step-icon";
import { StepList } from "@/components/craft/step-list";
import { StepPreview } from "@/components/craft/step-preview";
import { StepSettings } from "@/components/craft/step-settings";
import { CraftSkeleton } from "@/components/skeletons";
import { useCraftDraft } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { describeChanges, orderChanged } from "@/lib/craft/changes";
import { CRAFT_PREVIEW_NOTICE } from "@/lib/craft/groups";
import { isOptionStep, kindMeta, optionRows, validateConfig } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, StepOption, VesselOption } from "@/lib/craft/types";
import { formatMoneyShort } from "@/lib/format";
import { sellable, sellableSizes, toMap, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";
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

// Giá một hũ rẻ nhất (ước tính): kích thước + lựa chọn rẻ nhất còn bán ở mỗi bước bắt buộc đang hiện
function cheapestPrice(config: CraftConfig, map: MaterialMap) {
  const vessel = config.steps.find((s) => s.kind === "vessel");
  if (!vessel || vessel.kind !== "vessel") return 0;
  // Chỉ tính cỡ mà ít nhất một hũ đang bán còn mã hũ cỡ đó
  const sizes = vessel.sizes.filter((x) => vessel.options.some((o) => sellable(o, map) && sellableSizes(o, [x], map).length)).map((x) => x.basePrice);
  if (!sizes.length) return 0;
  let total = Math.min(...sizes);
  for (const step of config.steps) {
    if (!step.enabled || !step.required || step.kind === "inputs") continue;
    const prices = (step.options as StepOption[]).filter((o) => sellable(o, map)).map((o) => o.priceDelta);
    if (prices.length) total += Math.min(...prices);
    if (step.kind === "blend" && step.intensity) total += Math.min(...Object.values(step.intensity.priceDelta));
  }
  return total;
}

// Trình dựng trang Thủ công: admin tạo các bước, mỗi bước dùng một component, web dựng theo đúng thứ tự
export function CraftPage() {
  useTitle("Trình dựng Thủ công");
  const { message, modal } = App.useApp();
  // Trang sửa bản nháp — web chỉ nhận khi bấm Lưu
  const api = useCraftDraft();
  const inventory = useInventory();
  const { config } = api;
  // Kho + nguyên liệu chờ tạo của bản nháp (tạo từ drawer lựa chọn, vào Kho khi Lưu)
  const materials = useMemo(() => [...inventory.materials, ...api.pending], [inventory.materials, api.pending]);
  const map = useMemo(() => toMap(materials), [materials]);
  const [adding, setAdding] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  // Danh sách thay đổi chi tiết (cũ → mới) theo từng bước — chỉ tính khi có bản nháp
  const detail = useMemo(
    () => (api.dirty ? { steps: describeChanges(api.saved, config, map), reordered: orderChanged(api.saved, config) } : { steps: [], reordered: false }),
    [api.dirty, api.saved, config, map],
  );

  // Bước, tab và lựa chọn đang sửa nằm trên URL (?step=wax&view=settings&edit=soy) — tìm kiếm link thẳng tới
  const [params] = useSearchParams();
  const pager = usePageQuery();
  const step = config.steps.find((s) => s.id === params.get("step")) ?? config.steps[0];
  const view = params.get("view") ?? "main";
  const go = (extra: Record<string, string | null>) => pager.go(1, pager.limit, extra);
  const screens = Grid.useBreakpoint();
  // Màn hẹp: danh sách bước nằm trên editor — chọn bước xong cuộn xuống phần sửa, nếu không admin tưởng chưa bấm được
  const scrollToEditor = useRef(false);
  const selectStep = (id: string) => {
    scrollToEditor.current = screens.lg === false;
    go({ step: id, view: null, edit: null });
  };

  // Cuộn sau khi editor của bước mới đã render (cuộn ngay lúc bấm thì layout còn đổi, dừng giữa chừng)
  useEffect(() => {
    if (!scrollToEditor.current) return;
    scrollToEditor.current = false;
    document.getElementById("craft-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step?.id]);

  const editParam = params.get("edit");
  const { shown: editShown, key: drawerKey } = useDrawerTarget(editParam);
  const options = step && isOptionStep(step) ? (step.options as StepOption[]) : [];
  const editing = editShown && editShown !== "new" ? options.find((o) => o.id === editShown) : undefined;

  const issues = useMemo(() => validateConfig(config, materials), [config, materials]);
  const withIssues = new Set(issues.filter((i) => i.level === "error" || i.level === "warning").map((i) => i.stepId).filter(Boolean) as string[]);

  if (api.loading || inventory.loading) return <CraftSkeleton />;

  const rows = optionRows(config).filter(({ step: s }) => s.enabled);
  // Lựa chọn đang bán nhưng nguyên liệu hết hàng — web đang khóa. Hũ đếm theo từng cỡ hết mã hũ (vd Hũ gốm 200ml)
  const blocked = rows.flatMap(({ step: s, option }) => {
    if (!option.available) return [];
    if (s.kind !== "vessel") return sellable(option, map) ? [] : [option.id];
    const v = option as VesselOption;
    return s.sizes.filter((size) => size.available && v.supportedSizeIds.includes(size.id) && vesselSizeLevel(v, size.id, map) === "out").map((size) => `${v.id}:${size.id}`);
  });
  const cheapest = cheapestPrice(config, map);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.length - errors.length;
  // Bước có thay đổi chưa lưu — chấm trên danh sách bước
  const changed = new Set([...(api.changes?.edited ?? []), ...(api.changes?.added ?? [])].map((s) => s.id));

  // Lưu được cả khi còn cảnh báo; còn lỗi thì hỏi lại vì web có thể không dựng được bước đó
  const doSave = () => {
    if (!api.save()) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    setReviewing(false);
    const created = api.pending.length ? ` Đã tạo ${api.pending.length} nguyên liệu mới trong Kho.` : "";
    message.success(`${warnings ? `Đã lưu — còn ${warnings} điểm nên xem lại.` : "Đã lưu — web dùng cấu hình mới."}${created}`);
  };
  const commit = () => {
    if (!errors.length) return doSave();
    modal.confirm({
      title: `Còn ${errors.length} lỗi — vẫn lưu?`,
      content: (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {errors.slice(0, 4).map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
      ),
      okText: "Vẫn lưu",
      cancelText: "Sửa tiếp",
      onOk: doSave,
    });
  };
  // Số thứ tự trên web chỉ đếm các bước đang hiện
  const webIndex = (s: CraftStep) => config.steps.filter((x) => x.enabled).indexOf(s) + 1;

  const stats = [
    { label: "Bước đang hiện", value: `${config.steps.filter((s) => s.enabled).length}/${config.steps.length}` },
    { label: "Lựa chọn đang bán", value: rows.filter(({ option }) => option.available).length },
    {
      label: "Đang bị khóa",
      value: blocked.length,
      color: blocked.length ? "#cf1322" : undefined,
      note: blocked.length ? <Link to="/inventory?status=out">Mở Kho nguyên liệu</Link> : undefined,
    },
    { label: "Giá thấp nhất", value: cheapest ? formatMoneyShort(cheapest) : "—", note: <span style={{ color: "#6b6b6b" }}>Hũ rẻ nhất có thể đặt</span> },
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
          <Popconfirm title="Dùng cấu hình mẫu?" description="Cấu hình mẫu được đưa vào bản nháp — chỉ lên web khi bấm Lưu." okText="Dùng mẫu" cancelText="Hủy" onConfirm={api.reset}>
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
          <Button type="primary" icon={api.dirty ? <SaveOutlined /> : <CheckOutlined />} disabled={!api.dirty} onClick={commit}>
            {api.dirty ? "Lưu thay đổi" : "Đã lưu"}
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
            <Card style={{ height: "100%" }}>
              <Statistic title={s.label} value={s.value} styles={{ content: { color: s.color } }} />
              {s.note && <Typography.Text style={{ fontSize: 13 }}>{s.note}</Typography.Text>}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={9} xl={7}>
          <div className="craft-steps-col">
            <StepList steps={config.steps} active={step?.id} withIssues={withIssues} changed={changed} api={api} onSelect={selectStep} onAdd={() => setAdding(true)} />
          </div>
        </Col>
        <Col xs={24} lg={15} xl={17} id="craft-editor" style={{ scrollMarginTop: 16 }}>
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
                  {/* Màn hẹp bỏ tag loại bước để tên bước không bị cắt còn "H…" */}
                  {screens.sm !== false && <Tag style={{ marginInlineEnd: 0 }}>{kindMeta[step.kind].label}</Tag>}
                  {!step.enabled && (
                    <Tag icon={<EyeInvisibleOutlined />} style={{ marginInlineEnd: 0 }}>
                      Đang ẩn
                    </Tag>
                  )}
                  {(() => {
                    const n = detail.steps.find((c) => c.step.id === step.id)?.items.length;
                    return n ? (
                      <Tag color="orange" style={{ marginInlineEnd: 0, cursor: "pointer" }} onClick={() => setReviewing(true)}>
                        {n} thay đổi chưa lưu
                      </Tag>
                    ) : null;
                  })()}
                </Flex>
              }
              extra={
                <Flex align="center" gap={8}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }} className="hide-xs">
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
                        <InputsEditor step={step} api={api} materials={materials} />
                      ) : (
                        <OptionTable step={step} config={config} api={api} map={map} onEdit={(id) => go({ step: step.id, view: null, edit: id })} />
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
                        <StepPreview key={step.id} step={step} map={map} index={step.enabled ? webIndex(step) : config.steps.filter((x) => x.enabled).length + 1} />
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
          materials={materials}
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
      {api.dirty && (
        <SaveBar changes={detail.steps} reordered={detail.reordered} newMaterials={api.pending} errors={errors.length} warnings={warnings} onSave={commit} onDiscard={api.discard} onDetails={() => setReviewing(true)} />
      )}
      <ChangesDrawer
        open={reviewing}
        changes={detail.steps}
        reordered={detail.reordered}
        newMaterials={api.pending}
        onClose={() => setReviewing(false)}
        onSave={commit}
        onRevert={(id) => {
          api.revertStep(id);
          message.success("Đã hoàn tác bước");
        }}
        onOpen={(stepId, target) => {
          setReviewing(false);
          go({ step: stepId, view: target.optionId ? null : (target.view ?? null), edit: target.optionId ?? null });
        }}
      />
    </Flex>
  );
}
