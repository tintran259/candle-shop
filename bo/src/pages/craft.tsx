import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Card, Col, Flex, Popconfirm, Row, Statistic, Tabs, Typography } from "antd";
import { useRef } from "react";
import { useSearchParams } from "react-router";
import { MaterialTable } from "@/components/craft/material-table";
import { RestockPanel } from "@/components/craft/restock-panel";
import { RulesPanel } from "@/components/craft/rules-panel";
import { SizeTable } from "@/components/craft/size-table";
import { CraftSkeleton } from "@/components/skeletons";
import { useCraftCatalog } from "@/hooks/use-craft-catalog";
import { CRAFT_PREVIEW_NOTICE, optionGroupKeys, optionGroups, stockLevel, type OptionGroup } from "@/lib/craft/groups";
import type { BaseOption, CustomizerCatalog } from "@/lib/craft/types";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

function collect(catalog: CustomizerCatalog) {
  const rows = optionGroupKeys.flatMap((group) => (catalog[group] as BaseOption[]).map((item) => ({ group, item })));
  const low = rows.filter(({ item }) => stockLevel(item) === "low");
  const out = rows.filter(({ item }) => stockLevel(item) === "out");
  return {
    total: rows.length,
    selling: rows.filter(({ item }) => item.available).length,
    low,
    out,
    warnBy: (group: OptionGroup) => [...low, ...out].filter((w) => w.group === group).length,
  };
}

// Cấu hình nguyên liệu cho trang Thủ công của web
export function CraftPage() {
  useTitle("Nguyên liệu Thủ công");
  const api = useCraftCatalog();
  const stats = collect(api.catalog);
  const tabsRef = useRef<HTMLDivElement>(null);
  // Tab đang xem nằm trên URL (?tab=waxes) cùng page/limit của bảng; đổi tab thì về trang 1
  const [params] = useSearchParams();
  const pager = usePageQuery();
  const tabKeys = [...optionGroupKeys, "rules"] as string[];
  const tab = tabKeys.includes(params.get("tab") ?? "") ? params.get("tab")! : "containers";
  const setTab = (next: string) => pager.go(1, pager.limit, { tab: next, edit: null });

  // Bấm một ô "Cần nhập thêm" → mở tab nhóm đó và cuộn tới bảng
  const openGroup = (group: OptionGroup) => {
    setTab(group);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (api.loading) return <CraftSkeleton />;

  const tabLabel = (g: OptionGroup) => (
    <Flex align="center" gap={6}>
      {optionGroups[g].label}
      <Badge count={stats.warnBy(g)} size="small" color="orange" />
    </Flex>
  );

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Nguyên liệu Thủ công
          </Typography.Title>
          <Typography.Text type="secondary">Những gì xưởng đang có sẵn để khách tự phối nến trên trang Thủ công.</Typography.Text>
        </div>
        <Popconfirm
          title="Khôi phục dữ liệu mẫu?"
          description="Các thay đổi trên trình duyệt này sẽ mất."
          okText="Khôi phục"
          cancelText="Hủy"
          onConfirm={api.reset}
        >
          <Button icon={<ReloadOutlined />}>Khôi phục dữ liệu mẫu</Button>
        </Popconfirm>
      </Flex>

      <Alert
        type="info"
        showIcon
        title={CRAFT_PREVIEW_NOTICE}
      />

      <Row gutter={[16, 16]}>
        {[
          { label: "Nguyên liệu", value: stats.total },
          { label: "Đang bán", value: stats.selling },
          { label: "Sắp hết", value: stats.low.length, color: stats.low.length ? "#d46b08" : undefined },
          { label: "Hết hàng", value: stats.out.length, color: stats.out.length ? "#cf1322" : undefined },
        ].map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card>
              <Statistic title={s.label} value={s.value} styles={{ content: { color: s.color } }} />
            </Card>
          </Col>
        ))}
      </Row>

      {stats.out.length + stats.low.length > 0 && <RestockPanel out={stats.out} low={stats.low} onOpen={openGroup} />}

      <div ref={tabsRef} style={{ scrollMarginTop: 16 }}>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          ...optionGroupKeys.map((g) => ({
            key: g,
            label: tabLabel(g),
            children:
              g === "containers" ? (
                <Flex vertical gap={16}>
                  <MaterialTable group={g} api={api} active={tab === g} />
                  <SizeTable api={api} />
                </Flex>
              ) : (
                <MaterialTable group={g} api={api} active={tab === g} />
              ),
          })),
          { key: "rules", label: "Quy tắc & cá nhân hóa", children: <RulesPanel api={api} /> },
        ]}
      />
      </div>
    </Flex>
  );
}
