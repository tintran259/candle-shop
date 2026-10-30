import { SearchOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Segmented, Select } from "antd";
import { defaultCustomerFilters, sortOptions, type CustomerFilters } from "@/lib/customers/filters";
import { segmentMeta, segmentOrder } from "@/lib/customers/stats";

type Props = {
  filters: CustomerFilters;
  onChange: (f: CustomerFilters) => void;
  count: (s: CustomerFilters["segment"]) => number;
  tags: string[];
};

// Hàng 1: nhóm khách. Hàng 2: tìm + lọc tài khoản/nhãn + sắp xếp
export function CustomerToolbar({ filters, onChange, count, tags }: Props) {
  const segments: CustomerFilters["segment"][] = ["all", ...segmentOrder, "blocked"];
  const label = (s: CustomerFilters["segment"]) => (s === "all" ? "Tất cả" : s === "blocked" ? "Đã chặn" : segmentMeta[s].label);
  const dirty = filters.q || filters.account !== "all" || filters.tag;

  return (
    <Flex vertical gap={12}>
      <Segmented<CustomerFilters["segment"]>
        value={filters.segment}
        onChange={(segment) => onChange({ ...filters, segment })}
        aria-label="Nhóm khách"
        options={segments.map((s) => ({ value: s, label: `${label(s)} · ${count(s)}` }))}
        style={{ maxWidth: "100%", overflowX: "auto", width: "fit-content" }}
      />
      <Flex wrap gap={12} align="center">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: "#6b6b6b" }} />}
          placeholder="Tên, email hoặc số điện thoại…"
          aria-label="Tìm khách hàng"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          style={{ flex: "1 1 260px" }}
        />
        <Select<CustomerFilters["account"]>
          aria-label="Loại tài khoản"
          value={filters.account}
          onChange={(account) => onChange({ ...filters, account })}
          options={[
            { value: "all", label: "Mọi loại khách" },
            { value: "account", label: "Có tài khoản" },
            { value: "guest", label: "Vãng lai" },
          ]}
          style={{ flex: "0 1 160px", minWidth: 140 }}
        />
        <Select<string>
          aria-label="Nhãn"
          allowClear
          placeholder="Nhãn"
          value={filters.tag}
          onChange={(tag) => onChange({ ...filters, tag })}
          options={tags.map((t) => ({ value: t, label: t }))}
          style={{ flex: "0 1 170px", minWidth: 130 }}
        />
        <Select<CustomerFilters["sort"]>
          aria-label="Sắp xếp"
          value={filters.sort}
          onChange={(sort) => onChange({ ...filters, sort })}
          options={sortOptions}
          style={{ flex: "0 1 160px", minWidth: 140 }}
        />
        {dirty && (
          <Button type="link" onClick={() => onChange({ ...defaultCustomerFilters, segment: filters.segment, sort: filters.sort })} style={{ paddingInline: 4 }}>
            Xóa lọc
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
