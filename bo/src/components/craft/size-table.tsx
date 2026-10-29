import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, InputNumber, Popconfirm, Switch, Table, Typography, type TableProps } from "antd";
import { MoneyInput } from "@/components/money-input";
import type { CraftCatalogApi } from "@/hooks/use-craft-catalog";
import type { SizeOption } from "@/lib/craft/types";

// Kích thước nến và giá gốc — sửa trực tiếp trên bảng
export function SizeTable({ api }: { api: CraftCatalogApi }) {
  const patch = (id: string, p: Partial<SizeOption>) =>
    api.update((c) => ({ ...c, sizes: c.sizes.map((s) => (s.id === id ? { ...s, ...p } : s)) }));

  const add = () =>
    api.update((c) => {
      const grams = Math.max(0, ...c.sizes.map((s) => s.grams)) + 50;
      const size: SizeOption = { id: `s${grams}-${Date.now().toString(36)}`, grams, basePrice: 0, available: false };
      return { ...c, sizes: [...c.sizes, size] };
    });

  // Gỡ luôn kích thước khỏi các hũ đang hỗ trợ nó
  const remove = (s: SizeOption) =>
    api.update((c) => ({
      ...c,
      sizes: c.sizes.filter((x) => x.id !== s.id),
      containers: c.containers.map((ct) => ({ ...ct, supportedSizeIds: ct.supportedSizeIds.filter((id) => id !== s.id) })),
    }));

  const columns: TableProps<SizeOption>["columns"] = [
    {
      title: "Khối lượng",
      dataIndex: "grams",
      render: (v: number, s) => (
        <InputNumber aria-label="Khối lượng" min={0} precision={0} suffix="g" value={v} onChange={(n) => patch(s.id, { grams: n ?? 0 })} style={{ width: 120 }} />
      ),
    },
    {
      title: "Giá gốc",
      dataIndex: "basePrice",
      render: (v: number, s) => (
        <MoneyInput aria-label={`Giá gốc ${s.grams}g`} value={v} onChange={(n) => patch(s.id, { basePrice: n ?? 0 })} style={{ width: 160 }} />
      ),
    },
    {
      title: "Thời gian cháy",
      dataIndex: "burnHours",
      render: (v: number | undefined, s) => (
        <InputNumber
          aria-label={`Thời gian cháy ${s.grams}g`}
          min={0}
          precision={0}
          suffix="giờ"
          placeholder="Chưa đo"
          value={v}
          onChange={(n) => patch(s.id, { burnHours: n || undefined })}
          style={{ width: 130 }}
        />
      ),
    },
    {
      title: "Đang bán",
      dataIndex: "available",
      align: "center",
      render: (v: boolean, s) => <Switch size="small" checked={v} onChange={(checked) => patch(s.id, { available: checked })} aria-label={`Đang bán ${s.grams}g`} />,
    },
    {
      key: "actions",
      width: 56,
      render: (_, s) => (
        <Popconfirm title={`Xóa kích thước ${s.grams}g?`} description="Các hũ đang hỗ trợ cỡ này sẽ tự bỏ theo." okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => remove(s)}>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${s.grams}g`} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title="Kích thước & giá gốc"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={add}>
          Thêm
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Typography.Paragraph type="secondary" style={{ margin: 0, padding: "12px 24px 0" }}>
        Giá một hũ = giá gốc theo kích thước + phụ thu các nguyên liệu khách chọn. Để trống thời gian cháy nếu xưởng chưa đo thực tế.
      </Typography.Paragraph>
      <Table rowKey="id" columns={columns} dataSource={api.catalog.sizes} pagination={false} scroll={{ x: "max-content" }} />
    </Card>
  );
}
