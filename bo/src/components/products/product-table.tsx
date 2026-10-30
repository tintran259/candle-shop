import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { Button, Flex, Popconfirm, Switch, Table, Tag, Tooltip, Typography, type TablePaginationConfig, type TableProps } from "antd";
import { memo, useState } from "react";
import { PriceText, ProductBadges, ProductThumb, RatingText } from "@/components/products/product-view";
import type { ProductsApi } from "@/hooks/use-products";
import { formatNumber } from "@/lib/format";
import { aromaLevelLabels, aromaTypeColors, aromaTypeLabels, sizeLabels } from "@/lib/products/labels";
import type { Product } from "@/lib/products/types";
import { brand } from "@/theme";

type Props = { items: Product[]; api: ProductsApi; onEdit: (id: string) => void; pagination: TablePaginationConfig };

// Bảng sản phẩm: chọn nhiều để ẩn/hiện/xóa hàng loạt; bật/tắt bán và nổi bật ngay trên dòng
function ProductTableView({ items, api, onEdit, pagination }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  // Bỏ các id không còn trong danh sách đang lọc
  const picked = selected.filter((id) => items.some((p) => p.id === id));

  const columns: TableProps<Product>["columns"] = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, p) => (
        <Flex align="center" gap={12} style={{ minWidth: 240 }}>
          <ProductThumb product={p} />
          <Flex vertical gap={4} style={{ minWidth: 0 }}>
            <Typography.Link strong onClick={() => onEdit(p.id)} style={{ color: "inherit" }}>
              {p.name}
            </Typography.Link>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              /{p.slug}
            </Typography.Text>
            <ProductBadges product={{ ...p, isFeatured: false }} />
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Phân loại",
      key: "type",
      responsive: ["md"],
      render: (_, p) => (
        <Flex vertical gap={4} align="flex-start">
          <Tag color={aromaTypeColors[p.aromaType]} style={{ marginInlineEnd: 0 }}>
            {aromaTypeLabels[p.aromaType]}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            Cỡ {sizeLabels[p.size].toLowerCase()} · Hương {aromaLevelLabels[p.aromaLevel].toLowerCase()}
          </Typography.Text>
        </Flex>
      ),
    },
    { title: "Giá", key: "price", render: (_, p) => <PriceText product={p} /> },
    { title: "Đánh giá", key: "rating", responsive: ["lg"], render: (_, p) => <RatingText product={p} /> },
    {
      title: "Đã bán",
      dataIndex: "sold",
      align: "right",
      responsive: ["lg"],
      render: (v: number) => <span className="tabular">{formatNumber(v)}</span>,
    },
    {
      title: "Nổi bật",
      dataIndex: "isFeatured",
      align: "center",
      render: (v: boolean, p) => (
        <Tooltip title={v ? "Bỏ nổi bật" : "Đặt nổi bật"}>
          <Button
            type="text"
            aria-pressed={v}
            aria-label={`${v ? "Bỏ nổi bật" : "Đặt nổi bật"}: ${p.name}`}
            icon={v ? <StarFilled style={{ color: "#faad14" }} /> : <StarOutlined />}
            onClick={() => api.patch([p.id], { isFeatured: !v })}
          />
        </Tooltip>
      ),
    },
    {
      title: "Đang bán",
      dataIndex: "status",
      align: "center",
      render: (s: Product["status"], p) => (
        <Switch
          size="small"
          checked={s === "active"}
          onChange={(on) => api.patch([p.id], { status: on ? "active" : "hidden" })}
          aria-label={`Đang bán: ${p.name}`}
        />
      ),
    },
    {
      key: "actions",
      width: 56,
      render: (_, p) => <Button type="text" icon={<EditOutlined />} aria-label={`Sửa ${p.name}`} onClick={() => onEdit(p.id)} />,
    },
  ];

  return (
    <>
      {picked.length > 0 && (
        <Flex
          align="center"
          gap={8}
          wrap
          role="region"
          aria-label="Thao tác hàng loạt"
          style={{ padding: "10px 16px", margin: "0 0 8px", borderRadius: 12, background: brand.emberLight }}
        >
          <Typography.Text strong>Đã chọn {picked.length} sản phẩm</Typography.Text>
          <Button size="small" icon={<EyeOutlined />} onClick={() => api.patch(picked, { status: "active" })} style={{ marginLeft: "auto" }}>
            Hiện
          </Button>
          <Button size="small" icon={<EyeInvisibleOutlined />} onClick={() => api.patch(picked, { status: "hidden" })}>
            Ẩn
          </Button>
          <Popconfirm
            title={`Xóa ${picked.length} sản phẩm?`}
            description="Không thể hoàn tác. Đơn hàng cũ vẫn giữ thông tin sản phẩm."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => {
              api.remove(picked);
              setSelected([]);
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
          <Button size="small" type="text" onClick={() => setSelected([])}>
            Bỏ chọn
          </Button>
        </Flex>
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        rowSelection={{ selectedRowKeys: picked, onChange: (keys) => setSelected(keys as string[]) }}
        pagination={pagination}
        scroll={{ x: "max-content" }}
        onRow={(p) => ({ style: { opacity: p.status === "hidden" ? 0.7 : 1 } })}
      />
    </>
  );
}

// memo: mở/đóng drawer chỉ đổi ?order= / ?edit= trên URL — bảng giữ nguyên, không render lại
export const ProductTable = memo(ProductTableView);
