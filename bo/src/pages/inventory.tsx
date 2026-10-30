import { PlusOutlined, ReloadOutlined, SearchOutlined, SwapOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Empty, Flex, Input, Popconfirm, Row, Segmented, Select, Statistic, Typography } from "antd";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { MaterialDrawer } from "@/components/inventory/material-drawer";
import { MaterialTable } from "@/components/inventory/material-table";
import { MovementList } from "@/components/inventory/movement-list";
import { MovementModal, type ManualMovement } from "@/components/inventory/movement-modal";
import { RestockPanel } from "@/components/inventory/restock-panel";
import { InventorySkeleton } from "@/components/skeletons";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import {
  applyInventoryFilters,
  defaultInventoryFilters,
  matchStatus,
  sortOptions,
  statusLabels,
  statusOrder,
  type InventoryFilters,
  type InventoryStatus,
} from "@/lib/inventory/filters";
import { categoryLabels, materialLevel, materialUsage, movementLabels } from "@/lib/inventory/stock";
import { materialCategories } from "@/lib/inventory/types";
import { useDrawerTarget, useOpenParam } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Kho nguyên liệu của xưởng: số tồn, ngưỡng cảnh báo, phiếu nhập/xuất/kiểm kê.
// Trang Thủ công chỉ gắn lựa chọn với nguyên liệu ở đây.
export function InventoryPage() {
  useTitle("Kho nguyên liệu");
  const { message } = App.useApp();
  const api = useInventory();
  const craft = useCraftConfig();
  const loading = api.loading || craft.loading;
  const usage = useMemo(() => materialUsage(craft.config), [craft.config]);
  const [filters, setFiltersState] = useState<InventoryFilters>(defaultInventoryFilters);

  // Trạng thái lọc nằm trên URL (?status=out) — thông báo trên header link thẳng tới
  const [params] = useSearchParams();
  const status = (statusOrder as string[]).includes(params.get("status") ?? "") ? (params.get("status") as InventoryStatus) : "all";
  const items = useMemo(() => applyInventoryFilters(api.materials, status, filters, usage), [api.materials, status, filters, usage]);
  const pager = usePageQuery(loading ? undefined : items.length);
  const { paginationProps } = pager;
  const pagination = useMemo(() => paginationProps(items.length, "nguyên liệu"), [paginationProps, items.length]);
  const setFilters = (f: InventoryFilters) => {
    setFiltersState(f);
    pager.resetPage();
  };
  const setStatus = (s: InventoryStatus) => pager.go(1, pager.limit, { status: s === "all" ? null : s });

  // Nguyên liệu đang mở (?material=id | new)
  const [openId, setOpenId] = useOpenParam("material");
  const { shown, key: drawerKey } = useDrawerTarget(openId);
  const current = shown && shown !== "new" ? api.materials.find((m) => m.id === shown) : undefined;

  // Phiếu kho nhanh — setter truyền thẳng xuống bảng (giữ nguyên tham chiếu, bảng memo không render lại)
  const [moving, setMoving] = useState<{ materialId?: string; type?: ManualMovement } | null>(null);
  // Mỗi lần mở modal là một phiên mới (key đổi) → form lấy đúng nguyên liệu vừa bấm, không giữ lựa chọn lần trước
  const { key: movingKey } = useDrawerTarget(moving ? `${moving.materialId ?? ""}:${moving.type ?? ""}` : null);

  if (loading) return <InventorySkeleton />;

  const { materials } = api;
  const out = materials.filter((m) => materialLevel(m) === "out");
  const low = materials.filter((m) => materialLevel(m) === "low");
  const count = (s: InventoryStatus) => materials.filter((m) => matchStatus(m, s, usage)).length;

  const stats = [
    { label: "Nguyên liệu", value: materials.length },
    { label: "Sắp hết", value: low.length, color: low.length ? "#d46b08" : undefined },
    { label: "Hết hàng", value: out.length, color: out.length ? "#cf1322" : undefined },
    { label: "Chưa dùng", value: count("unused") },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Kho nguyên liệu
          </Typography.Title>
          <Typography.Text type="secondary">Tồn kho của xưởng — lựa chọn trên trang Thủ công trừ kho theo nguyên liệu gắn kèm.</Typography.Text>
        </div>
        <Flex gap={8} wrap>
          <Popconfirm title="Khôi phục dữ liệu mẫu?" description="Số tồn và lịch sử kho trên trình duyệt này sẽ mất." okText="Khôi phục" cancelText="Hủy" onConfirm={api.reset}>
            <Button icon={<ReloadOutlined />}>Dữ liệu mẫu</Button>
          </Popconfirm>
          <Button icon={<SwapOutlined />} onClick={() => setMoving({})}>
            Phiếu kho
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenId("new")}>
            Thêm nguyên liệu
          </Button>
        </Flex>
      </Flex>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card style={{ height: "100%" }}>
              <Statistic title={s.label} value={s.value} styles={{ content: { color: s.color } }} />
            </Card>
          </Col>
        ))}
      </Row>

      {out.length + low.length > 0 && <RestockPanel out={out} low={low} usage={usage} onOpen={setOpenId} />}

      <Card styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <Segmented<InventoryStatus>
            value={status}
            onChange={setStatus}
            aria-label="Trạng thái tồn"
            options={statusOrder.map((s) => ({ value: s, label: `${statusLabels[s]} · ${count(s)}` }))}
            style={{ maxWidth: "100%", overflowX: "auto", width: "fit-content" }}
          />
          <Flex wrap gap={12} align="center">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#6b6b6b" }} />}
              placeholder="Tên hoặc mã nguyên liệu…"
              aria-label="Tìm nguyên liệu"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              style={{ flex: "1 1 260px" }}
            />
            <Select
              allowClear
              aria-label="Loại nguyên liệu"
              placeholder="Mọi loại"
              value={filters.category}
              onChange={(category) => setFilters({ ...filters, category })}
              options={materialCategories.map((c) => ({ value: c, label: categoryLabels[c] }))}
              style={{ flex: "0 1 180px", minWidth: 140 }}
            />
            <Select
              aria-label="Sắp xếp"
              value={filters.sort}
              onChange={(sort) => setFilters({ ...filters, sort })}
              options={sortOptions}
              style={{ flex: "0 1 180px", minWidth: 150 }}
            />
          </Flex>
        </Flex>
      </Card>

      <Card styles={{ body: { padding: 12 } }}>
        {items.length ? (
          <MaterialTable items={items} usage={usage} pagination={pagination} onOpen={setOpenId} onReceive={setMoving} />
        ) : !materials.length ? (
          // Kho trống khác với lọc không ra kết quả — hướng admin thêm nguyên liệu đầu tiên
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Kho chưa có nguyên liệu nào. Thêm sáp, tinh dầu, hũ… để gắn vào các lựa chọn trên trang Thủ công.">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenId("new")}>
              Thêm nguyên liệu đầu tiên
            </Button>
          </Empty>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có nguyên liệu khớp bộ lọc.">
            <Button
              onClick={() => {
                setFilters(defaultInventoryFilters);
                setStatus("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          </Empty>
        )}
      </Card>

      <Card title="Phiếu kho gần đây" styles={{ body: { paddingTop: 4 } }}>
        <MovementList items={api.movements.slice(0, 8)} materials={materials} showMaterial onOpenMaterial={setOpenId} />
      </Card>

      <MaterialDrawer
        key={drawerKey}
        open={openId !== null && (openId === "new" || !!current)}
        material={current}
        usage={current ? (usage.get(current.id) ?? []) : []}
        api={api}
        onClose={() => setOpenId(null)}
      />

      <MovementModal
        key={movingKey}
        open={moving !== null}
        materials={materials}
        preset={moving ?? undefined}
        onCancel={() => setMoving(null)}
        onSubmit={(v) => {
          api.move(v.materialId, v.type, v.amount, v.note);
          message.success(`${movementLabels[v.type]}: ${materials.find((m) => m.id === v.materialId)?.name}`);
          setMoving(null);
        }}
      />
    </Flex>
  );
}
