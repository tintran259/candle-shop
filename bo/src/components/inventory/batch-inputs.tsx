import { Flex, Segmented, Typography } from "antd";
import { MoneyInput } from "@/components/money-input";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney, formatNumber } from "@/lib/format";
import type { BatchLine, BatchPrice } from "@/lib/inventory/production";

// Giá mẻ sản xuất: theo tiền nguyên liệu tiêu tốn (auto), hoặc tự nhập tổng chi phí. Dùng được trong Form.Item.
// missing: nguyên liệu chưa có giá nhập — chưa tính được giá theo nguyên liệu
export function BatchPriceInput({ value, onChange, auto, missing }: { value?: BatchPrice; onChange?: (v: BatchPrice) => void; auto?: number; missing?: string[] }) {
  return (
    <Flex vertical gap={8}>
      <Segmented<"auto" | "manual">
        value={value?.manual ? "manual" : "auto"}
        onChange={(v) => onChange?.({ ...value, manual: v === "manual" })}
        options={[
          { value: "auto", label: "Theo giá nguyên liệu" },
          { value: "manual", label: "Tự nhập" },
        ]}
      />
      {value?.manual ? (
        <MoneyInput aria-label="Tổng chi phí mẻ" placeholder="Tổng chi phí cả mẻ" value={value.total ?? null} onChange={(total) => onChange?.({ ...value, total: total ?? null })} />
      ) : missing?.length ? (
        <Typography.Text type="warning" style={{ fontSize: 13 }}>
          Chưa có giá nhập: {missing.join(", ")} — chọn Tự nhập, hoặc đặt giá trong Kho.
        </Typography.Text>
      ) : (
        auto !== undefined && (
          <Typography.Text type="secondary" className="tabular" style={{ fontSize: 13 }}>
            Tiền nguyên liệu tiêu tốn: {formatMoney(auto)}
          </Typography.Text>
        )
      )}
    </Flex>
  );
}

// Nguyên liệu một mẻ cần: lượng cần, số đang có; thiếu thì đỏ
export function BatchNeeds({ lines }: { lines: BatchLine[] }) {
  if (!lines.length) return null;
  return (
    <Flex vertical gap={4} role="list" aria-label="Nguyên liệu cần cho mẻ" style={{ background: "#fff", borderRadius: 8, padding: "8px 12px" }}>
      {lines.map(({ material, need, short }) => (
        <Flex key={material.id} role="listitem" justify="space-between" gap={8} wrap>
          <Typography.Text style={{ fontSize: 13 }}>{material.name}</Typography.Text>
          <Typography.Text type={short ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13 }}>
            trừ {formatNumber(need)} {unitLabel[material.unit]} · {short ? "chỉ còn" : "còn"} {formatNumber(material.stock)}
          </Typography.Text>
        </Flex>
      ))}
    </Flex>
  );
}
