import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, InputNumber, Popconfirm, Switch, Table, Typography, type TableProps } from "antd";
import { MoneyInput } from "@/components/money-input";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { sizeLabel } from "@/lib/craft/groups";
import type { CraftStep, SizeOption, VesselStep } from "@/lib/craft/types";

// Kích thước nến và giá gốc của bước hũ — sửa trực tiếp trên bảng
export function SizeTable({ step, api }: { step: VesselStep; api: CraftConfigApi }) {
  const update = (fn: (s: VesselStep) => VesselStep) => api.updateStep(step.id, (s) => (s.kind === "vessel" ? fn(s) : s) as CraftStep);
  const patch = (id: string, p: Partial<SizeOption>) => update((s) => ({ ...s, sizes: s.sizes.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

  const add = () =>
    update((s) => {
      // Cỡ đầu tiên 150ml, cỡ sau lớn hơn cỡ lớn nhất 50ml. Sáp đổ ~80% dung tích (sửa theo đo thực tế)
      const ml = s.sizes.length ? Math.max(...s.sizes.map((x) => x.ml)) + 50 : 150;
      // Id không chứa số ml — admin đổi dung tích sau đó thì id vẫn không gây hiểu nhầm
      const size: SizeOption = { id: `size-${Date.now().toString(36)}`, ml, grams: Math.round(ml * 0.8), basePrice: 0, available: false };
      return { ...s, sizes: [...s.sizes, size] };
    });

  // Gỡ luôn kích thước khỏi các hũ đang hỗ trợ nó
  const remove = (size: SizeOption) =>
    update((s) => ({
      ...s,
      sizes: s.sizes.filter((x) => x.id !== size.id),
      options: s.options.map((o) => ({
        ...o,
        supportedSizeIds: o.supportedSizeIds.filter((id) => id !== size.id),
        sizeMaterials: Object.fromEntries(Object.entries(o.sizeMaterials ?? {}).filter(([id]) => id !== size.id)),
      })),
    }));

  const columns: TableProps<SizeOption>["columns"] = [
    {
      title: "Dung tích hũ",
      dataIndex: "ml",
      render: (v: number, s) => (
        <InputNumber aria-label={`Dung tích hũ ${sizeLabel(s)}`} min={0} precision={0} suffix="ml" value={v} onChange={(n) => n !== null && patch(s.id, { ml: n })} style={{ width: 104 }} />
      ),
    },
    {
      title: "Sáp đổ",
      dataIndex: "grams",
      render: (v: number, s) => (
        <InputNumber aria-label={`Sáp đổ ${sizeLabel(s)}`} min={0} precision={0} suffix="g" value={v} onChange={(n) => n !== null && patch(s.id, { grams: n })} style={{ width: 96 }} />
      ),
    },
    {
      title: "Giá gốc",
      dataIndex: "basePrice",
      render: (v: number, s) => (
        <MoneyInput aria-label={`Giá gốc ${sizeLabel(s)}`} value={v} onChange={(n) => n !== null && patch(s.id, { basePrice: n })} style={{ width: 136 }} />
      ),
    },
    {
      title: "Cháy (giờ)",
      dataIndex: "burnHours",
      render: (v: number | undefined, s) => (
        <InputNumber
          aria-label={`Thời gian cháy ${sizeLabel(s)}`}
          min={0}
          precision={0}
          placeholder="Chưa đo"
          value={v}
          onChange={(n) => patch(s.id, { burnHours: n || undefined })}
          style={{ width: 104 }}
        />
      ),
    },
    {
      title: "Đang bán",
      dataIndex: "available",
      align: "center",
      render: (v: boolean, s) => <Switch size="small" checked={v} onChange={(checked) => patch(s.id, { available: checked })} aria-label={`Đang bán ${sizeLabel(s)}`} />,
    },
    {
      key: "actions",
      width: 56,
      render: (_, s) => (
        <Popconfirm title={`Xóa kích thước ${sizeLabel(s)}?`} description="Các hũ đang đổ cỡ này sẽ tự bỏ theo (mã hũ trong Kho vẫn giữ)." okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => remove(s)}>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${sizeLabel(s)}`} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Typography.Text type="secondary" style={{ flex: 1, minWidth: 240 }}>
          Khách chọn cỡ theo dung tích hũ. Sáp đổ (gram) dùng để trừ sáp, tinh dầu, màu. Giá một hũ = giá gốc + phụ thu các lựa chọn. Để trống thời gian cháy nếu xưởng chưa đo.
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={add}>
          Thêm kích thước
        </Button>
      </Flex>
      {/* size middle + ô gọn: vừa khung editor ở 1440px, không phải cuộn ngang mới thấy cột dung tích */}
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={step.sizes}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Chưa có kích thước nào — bấm “Thêm kích thước”. Cỡ mới tạo đang tắt bán, bật lên khi đã đặt giá." }}
      />
    </Flex>
  );
}
