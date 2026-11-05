import { DownloadOutlined, SearchOutlined, SwapOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, DatePicker, Flex, Input, Pagination, Row, Select, Statistic, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { MaterialSelect } from "@/components/inventory/material-select";
import { MovementList } from "@/components/inventory/movement-list";
import { MovementModal, type ManualMovement } from "@/components/inventory/movement-modal";
import { ListPageSkeleton, ToolbarSkeleton } from "@/components/skeletons";
import { useInventory } from "@/hooks/use-inventory";
import { lotTotal } from "@/lib/costs";
import { formatMoneyShort } from "@/lib/format";
import { exportMovementsXlsx, filterMovements, movementTotals, movementTypes, type MovementFilters } from "@/lib/inventory/movements";
import { movementLabels } from "@/lib/inventory/stock";
import type { MovementType } from "@/lib/inventory/types";
import { useDrawerTarget } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { useTitle } from "@/lib/use-title";

// Lịch sử nhập / xuất / kiểm kê / sản xuất / trừ theo đơn / sửa giá của mọi nguyên liệu. Bộ lọc nằm trên URL để gửi link được
export function StockMovementsPage() {
  useTitle("Phiếu kho");
  const { message } = App.useApp();
  const api = useInventory();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type = (movementTypes as string[]).includes(params.get("type") ?? "") ? (params.get("type") as MovementType) : undefined;
  const filters: MovementFilters = {
    type,
    materialId: params.get("material") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    q: params.get("q") ?? undefined,
  };
  const items = useMemo(
    () => filterMovements(api.movements, api.materials, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.movements, api.materials, params],
  );
  const pager = usePageQuery(api.loading ? undefined : items.length);
  // Đổi bộ lọc thì về trang 1
  const setFilter = (extra: Record<string, string | null>) => pager.go(1, pager.limit, extra);

  // Ghi phiếu kho ngay trên trang
  const [moving, setMoving] = useState<{ materialId?: string; type?: ManualMovement } | null>(null);
  const { key: movingKey } = useDrawerTarget(moving ? `${moving.materialId ?? ""}:${moving.type ?? ""}` : null);

  if (api.loading)
    return <ListPageSkeleton label="Đang tải phiếu kho…" toolbar={<ToolbarSkeleton rows={[{ fields: [{ flex: "1 1 260px" }, { width: 160 }, { width: 200 }, { width: 240 }] }]} />} />;

  const totals = movementTotals(items);
  const { pageItems } = pager.paginate(items);
  const filtered = !!(filters.type || filters.materialId || filters.from || filters.to || filters.q);
  const stats = [
    { label: "Số phiếu", value: totals.count, note: filtered ? `Trong ${api.movements.length} phiếu` : "Tất cả phiếu đang lưu" },
    { label: "Tiền nhập", value: formatMoneyShort(totals.lotMoney), note: "Tổng tiền lô các phiếu Nhập thêm" },
    { label: "Phiếu cộng tồn", value: totals.inCount, note: "Nhập thêm, thành phẩm sản xuất, kiểm kê tăng" },
    { label: "Phiếu trừ tồn", value: totals.outCount, note: "Xuất, theo đơn, nguyên liệu dùng sản xuất" },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Phiếu kho
          </Typography.Title>
          <Typography.Text type="secondary">
            Mọi lần nhập, xuất, kiểm kê, sản xuất, trừ theo đơn và sửa giá. Số tồn từng nguyên liệu ở <Link to="/inventory">Kho nguyên liệu</Link>.
          </Typography.Text>
        </div>
        <Flex gap={8} wrap>
          <Button icon={<DownloadOutlined />} disabled={!items.length} onClick={() => exportMovementsXlsx(items, api.materials)}>
            Xuất Excel
          </Button>
          <Button type="primary" icon={<SwapOutlined />} onClick={() => setMoving({})}>
            Ghi phiếu kho
          </Button>
        </Flex>
      </Flex>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card style={{ height: "100%" }}>
              <Statistic title={s.label} value={s.value} />
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {s.note}
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Flex gap={12} wrap role="search" aria-label="Lọc phiếu kho">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm nguyên liệu, ghi chú, mã đơn, mã mẻ…"
            aria-label="Tìm phiếu kho"
            defaultValue={filters.q}
            onChange={(e) => setFilter({ q: e.target.value || null })}
            style={{ flex: "1 1 260px" }}
          />
          <Select
            allowClear
            placeholder="Mọi loại phiếu"
            aria-label="Loại phiếu"
            value={filters.type}
            onChange={(v?: MovementType) => setFilter({ type: v ?? null })}
            options={movementTypes.map((t) => ({ value: t, label: movementLabels[t] }))}
            style={{ width: 170 }}
          />
          <div style={{ width: 220 }}>
            <MaterialSelect
              materials={api.materials}
              allowNone={false}
              ariaLabel="Nguyên liệu"
              placeholder="Mọi nguyên liệu"
              allowClear
              value={filters.materialId}
              onChange={(v) => setFilter({ material: v || null })}
              style={{ width: "100%" }}
            />
          </div>
          <DatePicker.RangePicker
            aria-label="Khoảng ngày"
            format="DD/MM/YYYY"
            value={filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null}
            onChange={(r) => setFilter({ from: r?.[0]?.format("YYYY-MM-DD") ?? null, to: r?.[1]?.format("YYYY-MM-DD") ?? null })}
            style={{ width: 250 }}
          />
          {filtered && <Button onClick={() => setFilter({ type: null, material: null, from: null, to: null, q: null })}>Xóa bộ lọc</Button>}
        </Flex>
      </Card>

      <Card styles={{ body: { paddingTop: 4 } }}>
        <MovementList
          items={pageItems}
          materials={api.materials}
          showMaterial
          onOpenMaterial={(id) => navigate(`/inventory?material=${id}`)}
          onBatch={(batch) => setFilter({ q: batch })}
          empty={filtered ? "Không có phiếu khớp bộ lọc." : undefined}
        />
        {items.length > 0 && (
          <Flex justify="flex-end" style={{ marginTop: 16 }}>
            <Pagination {...pager.paginationProps(items.length, "phiếu")} />
          </Flex>
        )}
      </Card>

      <MovementModal
        key={movingKey}
        open={moving !== null}
        materials={api.materials}
        preset={moving ?? undefined}
        onCancel={() => setMoving(null)}
        onSubmit={(v) => {
          api.move(v.materialId, v.type, v.amount, v.note, v.type === "in" ? lotTotal(v.lot) : undefined);
          message.success(`${movementLabels[v.type]}: ${api.materials.find((m) => m.id === v.materialId)?.name}`);
          setMoving(null);
        }}
      />
    </Flex>
  );
}
