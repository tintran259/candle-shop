import { CheckOutlined, DownloadOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Empty, Flex, Grid, Popconfirm, Row, Statistic, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AddStepModal } from "@/components/craft/add-step-modal";
import { OptionDrawer } from "@/components/craft/option-drawer";
import { ChangesDrawer, SaveBar } from "@/components/craft/save-bar";
import { StepList } from "@/components/craft/step-list";
import { CraftSkeleton } from "@/components/skeletons";
import { CraftAlerts } from "@/components/craft/craft-alerts";
import { StepEditorCard } from "@/components/craft/step-editor-card";
import { blockedOptions, cheapestPrice, countLowMargins, downloadJson } from "@/lib/craft/overview";
import { useCraftDraft } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { describeChanges, orderChanged } from "@/lib/craft/changes";
import { CRAFT_PREVIEW_NOTICE } from "@/lib/craft/groups";
import { isOptionStep, optionRows, validateConfig } from "@/lib/craft/steps";
import type { StepOption } from "@/lib/craft/types";
import { formatMoneyShort } from "@/lib/format";
import { toMap } from "@/lib/inventory/stock";
import { useDrawerTarget } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Trình dựng trang Thủ công: admin tạo các bước, mỗi bước dùng một component, web dựng theo đúng thứ tự
export function CraftPage() {
  useTitle("Trình dựng Thủ công");
  const { message, modal } = App.useApp();
  // Trang sửa bản nháp — web chỉ nhận khi bấm Lưu
  const api = useCraftDraft();
  const inventory = useInventory();
  const { settings } = useSettings();
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
  // Số cỡ và lựa chọn đang bán cần xem lại giá: thấp hơn giá vốn, hoặc lãi dưới mức tối thiểu ở Cài đặt
  const lowMargins = useMemo(() => countLowMargins(config, map, settings.minMargin), [config, map, settings.minMargin]);
  const withIssues = new Set(
    issues
      .filter((i) => i.level === "error" || i.level === "warning")
      .map((i) => i.stepId)
      .filter(Boolean) as string[],
  );

  if (api.loading || inventory.loading) return <CraftSkeleton />;

  const rows = optionRows(config).filter(({ step: s }) => s.enabled);
  // Lựa chọn đang bán nhưng nguyên liệu hết hàng — web đang khóa
  const blocked = blockedOptions(config, map);
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

      <CraftAlerts issues={issues} errors={errors.length} lowMargins={lowMargins} minMargin={settings.minMargin} onSelectStep={selectStep} />

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
            <StepEditorCard
              step={step}
              config={config}
              api={api}
              materials={materials}
              map={map}
              settings={settings}
              view={view}
              pending={detail.steps.find((c) => c.step.id === step.id)?.items.length}
              onReview={() => setReviewing(true)}
              go={go}
            />
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
          pricing={settings}
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
        <SaveBar
          changes={detail.steps}
          reordered={detail.reordered}
          newMaterials={api.pending}
          errors={errors.length}
          warnings={warnings}
          onSave={commit}
          onDiscard={api.discard}
          onDetails={() => setReviewing(true)}
        />
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
