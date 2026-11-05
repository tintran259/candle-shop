import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { App, Button, Flex, Popconfirm, Switch, Table, Tag, Tooltip, Typography, type TableProps } from "antd";
import type { HTMLAttributes } from "react";
import { Link } from "react-router";
import { DragHandle, SortableHandle, SortableList } from "@/components/sortable";
import type { CategoriesApi } from "@/hooks/use-categories";
import { useSortableItem } from "@/hooks/use-sortable-item";
import type { Category } from "@/lib/products/categories";

type Props = { api: CategoriesApi; count: (id: string) => number; onEdit: (id: string) => void };

// Dòng kéo được: chỉ bắt đầu kéo từ tay nắm để không cản bấm switch, sửa, xóa
function SortableRow(props: HTMLAttributes<HTMLTableRowElement> & { "data-row-key": string }) {
  const { setNodeRef, style, handle } = useSortableItem(props["data-row-key"], props.style);
  return (
    <SortableHandle value={handle}>
      <tr {...props} ref={setNodeRef} style={style} />
    </SortableHandle>
  );
}

export function CategoryTable({ api, count, onEdit }: Props) {
  const { message } = App.useApp();
  const { categories } = api;

  const columns: TableProps<Category>["columns"] = [
    { key: "sort", width: 56, align: "center", render: (_, c) => <DragHandle name={c.name.vi} /> },
    {
      title: "Danh mục",
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
    {
      title: "Sản phẩm",
      key: "products",
      align: "right",
      render: (_, c) => {
        const n = count(c.id);
        return n ? <Link to={`/products?category=${encodeURIComponent(c.id)}`}>{n} sản phẩm</Link> : <Typography.Text type="secondary">Chưa có</Typography.Text>;
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
            {n ? (
              // Còn sản phẩm thì không xóa — tránh sản phẩm mất danh mục; ẩn khỏi web thay vào đó
              <Tooltip title={`Còn ${n} sản phẩm thuộc danh mục này. Chuyển sang danh mục khác hoặc tắt "Hiện trên web".`}>
                <Button type="text" icon={<DeleteOutlined />} disabled aria-label={`Không xóa được ${c.name.vi}`} />
              </Tooltip>
            ) : (
              <Popconfirm
                title={`Xóa “${c.name.vi}”?`}
                okText="Xóa"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                onConfirm={() => {
                  api.remove(c.id);
                  message.success(`Đã xóa ${c.name.vi}`);
                }}
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
    <SortableList ids={categories.map((c) => c.id)} name={(id) => api.byId.get(id)?.name.vi ?? ""} onMove={api.move}>
      <Table rowKey="id" columns={columns} dataSource={categories} components={{ body: { row: SortableRow } }} pagination={false} scroll={{ x: "max-content" }} />
    </SortableList>
  );
}
