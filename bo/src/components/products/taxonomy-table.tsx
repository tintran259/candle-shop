import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { App, Button, Flex, Popconfirm, Switch, Table, Tag, Tooltip, Typography, type TableProps } from "antd";
import type { HTMLAttributes } from "react";
import { Link } from "react-router";
import { DragHandle, SortableHandle, SortableList } from "@/components/sortable";
import type { TaxonomyApi } from "@/hooks/use-taxonomy";
import { useSortableItem } from "@/hooks/use-sortable-item";
import type { Taxonomy, TaxonomyKind } from "@/lib/products/taxonomy";
import { rangeText, seasonLabels, seasonOf } from "@/lib/products/concepts";
import { compactColumns, useCompactTable } from "@/components/compact-columns";

type Props = { api: TaxonomyApi; kind: TaxonomyKind; count: (id: string) => number; onEdit: (id: string) => void };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Dòng kéo được: chỉ bắt đầu kéo từ tay nắm để không cản bấm switch, sửa, xóa
function SortableRow(props: HTMLAttributes<HTMLTableRowElement> & { "data-row-key": string }) {
  const { setNodeRef, style, handle } = useSortableItem(props["data-row-key"], props.style);
  return (
    <SortableHandle value={handle}>
      <tr {...props} ref={setNodeRef} style={style} />
    </SortableHandle>
  );
}

// Bảng danh mục / concept: kéo thả thứ tự (thứ tự trong bộ lọc của web), số sản phẩm, hiện trên web, sửa, xóa
export function TaxonomyTable({ api, kind, count, onEdit }: Props) {
  const { message } = App.useApp();
  const { items } = api;

  const remove = (c: Taxonomy) => {
    api.remove(c.id);
    message.success(`Đã xóa ${c.name.vi}`);
  };

  const compact = useCompactTable();
  const columns: TableProps<Taxonomy>["columns"] = [
    { key: "sort", width: 56, align: "center", render: (_, c) => <DragHandle name={c.name.vi} /> },
    {
      title: capitalize(kind.noun),
      key: "name",
      render: (_, c) => (
        <Flex vertical gap={4} align="flex-start">
          <Tag color={c.color} style={{ marginInlineEnd: 0 }}>
            {c.name.vi}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            EN: {c.name.en}
          </Typography.Text>
        </Flex>
      ),
    },
    ...(kind.dates
      ? [
          {
            title: "Thời gian bán",
            key: "season",
            render: (_: unknown, c: Taxonomy) => {
              const s = seasonLabels[seasonOf(c)];
              return (
                <Flex vertical gap={4} align="flex-start">
                  <Tag color={s.color} style={{ marginInlineEnd: 0 }}>
                    {s.label}
                  </Tag>
                  {rangeText(c) && (
                    <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {rangeText(c)}
                    </Typography.Text>
                  )}
                </Flex>
              );
            },
          },
        ]
      : []),
    {
      title: "Sản phẩm",
      key: "products",
      align: "right",
      render: (_, c) => {
        const n = count(c.id);
        return n ? <Link to={kind.productsHref(c.id)}>{n} sản phẩm</Link> : <Typography.Text type="secondary">Chưa có</Typography.Text>;
      },
    },
    {
      title: "Hiện trên web",
      key: "hidden",
      align: "center",
      render: (_, c) => <Switch size="small" checked={!c.hidden} onChange={(on) => api.patch(c.id, { hidden: !on })} aria-label={`Hiện trên web: ${c.name.vi}`} />,
    },
    {
      key: "actions",
      width: 96,
      render: (_, c) => {
        const n = count(c.id);
        return (
          <Flex gap={4} justify="flex-end">
            <Button type="text" icon={<EditOutlined />} aria-label={`Sửa ${c.name.vi}`} onClick={() => onEdit(c.id)} />
            {n && !kind.removeWhenUsed ? (
              // Danh mục còn sản phẩm thì không xóa — tránh sản phẩm mất danh mục; ẩn khỏi web thay vào đó
              <Tooltip title={`Còn ${n} sản phẩm thuộc ${kind.noun} này. Chuyển sang ${kind.noun} khác hoặc tắt "Hiện trên web".`}>
                <Button type="text" icon={<DeleteOutlined />} disabled aria-label={`Không xóa được ${c.name.vi}`} />
              </Tooltip>
            ) : (
              <Popconfirm
                title={`Xóa “${c.name.vi}”?`}
                description={n ? `${n} sản phẩm sẽ rời khỏi ${kind.noun} này (sản phẩm vẫn giữ nguyên).` : undefined}
                okText="Xóa"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                onConfirm={() => remove(c)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${c.name.vi}`} />
              </Popconfirm>
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <SortableList ids={items.map((c) => c.id)} name={(id) => api.byId.get(id)?.name.vi ?? ""} onMove={api.move}>
      <Table
        rowKey="id"
        columns={compact ? compactColumns(columns, "name", ["season", "products"], ["sort", "hidden", "actions"]) : columns}
        dataSource={items}
        components={{ body: { row: SortableRow } }}
        size={compact ? "small" : undefined}
        pagination={false}
        scroll={compact ? undefined : { x: "max-content" }}
      />
    </SortableList>
  );
}
