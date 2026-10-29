import { SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Flex, Input, Select } from "antd";
import dayjs from "dayjs";
import { defaultOrderFilters, type OrderFilters } from "@/lib/orders/filters";
import { paymentStateMeta, type PaymentState } from "@/lib/orders/labels";

type Props = { filters: OrderFilters; onChange: (f: OrderFilters) => void };

// Hàng lọc phụ dưới tab trạng thái: tìm kiếm, thanh toán, khoảng ngày đặt, sắp xếp
export function OrderToolbar({ filters, onChange }: Props) {
  const set = (patch: Partial<OrderFilters>) => onChange({ ...filters, ...patch });
  const dirty = filters.q || filters.payment || filters.range;

  return (
    <Flex wrap gap={12} align="center">
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: "#6b6b6b" }} />}
        placeholder="Mã đơn, tên khách hoặc số điện thoại…"
        aria-label="Tìm đơn hàng"
        value={filters.q}
        onChange={(e) => set({ q: e.target.value })}
        style={{ flex: "1 1 260px" }}
      />
      <Select<PaymentState>
        allowClear
        placeholder="Thanh toán"
        aria-label="Lọc theo thanh toán"
        value={filters.payment}
        onChange={(payment) => set({ payment })}
        options={(Object.keys(paymentStateMeta) as PaymentState[]).map((k) => ({ value: k, label: paymentStateMeta[k].label }))}
        style={{ flex: "1 1 150px", maxWidth: 220 }}
      />
      <DatePicker.RangePicker
        aria-label="Ngày đặt"
        placeholder={["Đặt từ ngày", "Đến ngày"]}
        format="DD/MM/YYYY"
        value={filters.range ? [dayjs(filters.range[0]), dayjs(filters.range[1])] : null}
        onChange={(v) => set({ range: v?.[0] && v[1] ? [v[0].format("YYYY-MM-DD"), v[1].format("YYYY-MM-DD")] : undefined })}
        presets={[
          { label: "Hôm nay", value: [dayjs(), dayjs()] },
          { label: "7 ngày qua", value: [dayjs().subtract(6, "day"), dayjs()] },
          { label: "Tháng này", value: [dayjs().startOf("month"), dayjs()] },
        ]}
        style={{ flex: "1 1 240px", maxWidth: 300 }}
      />
      <Select<OrderFilters["sort"]>
        aria-label="Sắp xếp"
        value={filters.sort}
        onChange={(sort) => set({ sort })}
        options={[
          { value: "newest", label: "Mới đặt nhất" },
          { value: "ready-soon", label: "Sắp tới hạn làm" },
          { value: "total-desc", label: "Giá trị cao nhất" },
        ]}
        style={{ flex: "1 1 150px", maxWidth: 220 }}
      />
      {dirty && (
        <Button type="link" onClick={() => onChange({ ...defaultOrderFilters, status: filters.status, sort: filters.sort })} style={{ paddingInline: 4 }}>
          Xóa bộ lọc
        </Button>
      )}
    </Flex>
  );
}
