import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, InputNumber, Popconfirm, Switch, Table, Typography, type TableProps } from "antd";
import { MoneyInput } from "@/components/money-input";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import type { CraftStep, SizeOption, VesselStep } from "@/lib/craft/types";

// Kích thước nến và giá gốc của bước hũ — sửa trực tiếp trên bảng
export function SizeTable({ step, api }: { step: VesselStep; api: CraftConfigApi }) {
  const update = (fn: (s: VesselStep) => VesselStep) => api.updateStep(step.id, (s) => (s.kind === "vessel" ? fn(s) : s) as CraftStep);
  const patch = (id: string, p: Partial<SizeOption>) => update((s) => ({ ...s, sizes: s.sizes.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

  const add = () =>
    update((s) => {
      const grams = Math.max(0, ...s.sizes.map((x) => x.grams)) + 50;
      const size: SizeOption = { id: `s${grams}-${Date.now().toString(36)}`, grams, basePrice: 0, available: false };
      return { ...s, sizes: [...s.sizes, size] };
    });

  // Gỡ luôn kích thước khỏi các hũ đang hỗ trợ nó
  const remove = (size: SizeOption) =>
    update((s) => ({
      ...s,
      sizes: s.sizes.filter((x) => x.id !== size.id),
      options: s.options.map((o) => ({ ...o, supportedSizeIds: o.supportedSizeIds.filter((id) => id !== size.id) })),
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
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Typography.Text type="secondary" style={{ flex: 1, minWidth: 240 }}>
          Giá một hũ = giá gốc theo kích thước + phụ thu các lựa chọn khách chọn. Để trống thời gian cháy nếu xưởng chưa đo thực tế.
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={add}>
          Thêm kích thước
        </Button>
      </Flex>
      <Table rowKey="id" columns={columns} dataSource={step.sizes} pagination={false} scroll={{ x: "max-content" }} locale={{ emptyText: "Chưa có kích thước nào." }} />
    </Flex>
  );
}
