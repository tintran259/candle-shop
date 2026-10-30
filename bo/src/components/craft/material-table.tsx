import { EditOutlined, PlusOutlined, SafetyCertificateOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Switch, Table, Typography, type TableProps } from "antd";
import { MaterialDrawer } from "@/components/craft/material-drawer";
import { MaterialAvatar, StockText } from "@/components/craft/material-view";
import type { CraftCatalogApi } from "@/hooks/use-craft-catalog";
import { useDrawerTarget, useOpenParam } from "@/lib/use-open-param";
import { usePageQuery } from "@/lib/use-page-query";
import { formatDelta, lookLabels, optionGroups, shapeLabels, type OptionGroup } from "@/lib/craft/groups";
import type { BaseOption, ContainerOption, CustomizerCatalog, DecorationOption, WickOption } from "@/lib/craft/types";

// Bảng nguyên liệu của một nhóm: bật/tắt bán ngay trên bảng, sửa chi tiết trong drawer
// active: tab đang xem — chỉ tab này mở drawer theo ?edit= trên URL (các tab đã xem vẫn còn mount)
export function MaterialTable({ group, api, active }: { group: OptionGroup; api: CraftCatalogApi; active: boolean }) {
  const items = api.catalog[group] as BaseOption[];
  const pager = usePageQuery(items.length);
  const meta = optionGroups[group];
  // Trên URL (?tab=waxes&edit=id): null = đóng, "new" = thêm mới, còn lại là id đang sửa
  const [param, setEditing] = useOpenParam("edit");
  const editing = active ? param : null;
  // Giữ mục cũ lúc drawer trượt ra; key đổi mỗi lần mở để form luôn bắt đầu mới
  const { shown, key: drawerKey } = useDrawerTarget(editing);
  const current = shown && shown !== "new" ? items.find((o) => o.id === shown) : undefined;

  const columns: TableProps<BaseOption>["columns"] = [
    {
      title: "Nguyên liệu",
      key: "name",
      render: (_, o) => (
        <Flex align="center" gap={12} style={{ opacity: o.available ? 1 : 0.55 }}>
          <MaterialAvatar item={o} swatch={meta.swatch} />
          <Flex vertical>
            <Typography.Text strong>{o.name.vi}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {o.name.en}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    { title: "Chi tiết", key: "details", responsive: ["lg"], render: (_, o) => <Details group={group} item={o} catalog={api.catalog} /> },
    { title: "Phụ thu", dataIndex: "priceDelta", align: "right", render: (v: number) => <span className="tabular">{formatDelta(v)}</span> },
    { title: "Tồn kho", key: "stock", render: (_, o) => <StockText item={o} /> },
    {
      title: "Đang bán",
      dataIndex: "available",
      align: "center",
      render: (v: boolean, o) => (
        <Switch size="small" checked={v} onChange={(checked) => api.patchOption(group, o.id, { available: checked })} aria-label={`Đang bán: ${o.name.vi}`} />
      ),
    },
    {
      key: "actions",
      width: 56,
      render: (_, o) => <Button type="text" icon={<EditOutlined />} aria-label={`Sửa ${o.name.vi}`} onClick={() => setEditing(o.id)} />,
    },
  ];

  return (
    <Card
      title={meta.label}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing("new")}>
          Thêm
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Typography.Paragraph type="secondary" style={{ margin: 0, padding: "12px 24px 0" }}>
        {meta.description}
      </Typography.Paragraph>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={pager.paginationProps(items.length, "nguyên liệu")}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Chưa có nguyên liệu nào — bấm “Thêm” để tạo." }}
      />
      <MaterialDrawer key={drawerKey} open={editing !== null && (editing === "new" || !!current)} group={group} item={current} api={api} onClose={() => setEditing(null)} />
    </Card>
  );
}

function Details({ group, item, catalog }: { group: OptionGroup; item: BaseOption; catalog: CustomizerCatalog }) {
  const names = (list: BaseOption[], ids?: string[]) =>
    ids?.length ? ids.map((id) => list.find((o) => o.id === id)?.name.vi ?? id).join(", ") : "Tất cả";

  switch (group) {
    case "containers": {
      const c = item as ContainerOption;
      const sizes = c.supportedSizeIds.map((id) => catalog.sizes.find((s) => s.id === id)?.grams).filter(Boolean);
      return (
        <Flex vertical>
          <Typography.Text>
            {shapeLabels[c.shape]} · {sizes.map((g) => `${g}g`).join(" / ")}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {c.lid ? `Có nắp ${c.lid.priceDelta ? formatDelta(c.lid.priceDelta) : "miễn phí"} · còn ${c.lid.stock}` : "Không có nắp"}
          </Typography.Text>
        </Flex>
      );
    }
    case "wicks": {
      const w = item as WickOption;
      return (
        <Flex vertical style={{ maxWidth: 320 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Hũ: {names(catalog.containers, w.containerIds)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Sáp: {names(catalog.waxes, w.waxIds)}
          </Typography.Text>
        </Flex>
      );
    }
    case "decorations": {
      const d = item as DecorationOption;
      return d.approved ? (
        <Typography.Text type="success">
          <SafetyCertificateOutlined /> Đã duyệt an toàn{d.look && ` · ${lookLabels[d.look]}`}
        </Typography.Text>
      ) : (
        <Typography.Text type="warning">
          <WarningOutlined /> Chưa duyệt — ẩn với khách
        </Typography.Text>
      );
    }
    default:
      return <Typography.Text type="secondary">{item.description?.vi ?? "—"}</Typography.Text>;
  }
}
