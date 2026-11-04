import { Checkbox, Flex, InputNumber, Select, Typography } from "antd";
import { MoneyInput } from "@/components/money-input";
import { purchaseUnits, type LotPrice, type Purchase } from "@/lib/costs";
import type { Unit } from "@/lib/craft/types";

// Tiền lô nhập: tổng đã trả cho cả lô, hoặc tick "Không mất tiền" (hàng tặng, mẫu thử). Dùng được trong Form.Item
export function LotPriceInput({ value, onChange, status, label = "Tổng tiền lô" }: { value?: LotPrice; onChange?: (v: LotPrice) => void; status?: "error"; label?: string }) {
  return (
    <Flex gap={8} align="center" wrap style={{ flex: "1 1 260px" }}>
      <MoneyInput
        aria-label={label}
        placeholder={value?.free ? "Không mất tiền" : "Tổng tiền đã trả"}
        disabled={value?.free}
        status={status}
        value={value?.free ? null : (value?.total ?? null)}
        onChange={(total) => onChange?.({ ...value, total: total ?? null })}
        style={{ flex: "1 1 160px", width: "auto" }}
      />
      <Checkbox checked={!!value?.free} onChange={(e) => onChange?.({ ...value, free: e.target.checked })}>
        Không mất tiền
      </Checkbox>
    </Flex>
  );
}

// Một lần mua: "Mua 5 kg giá 300.000 ₫" — nơi dùng tự chia ra giá mỗi đơn vị Kho
export function PurchaseInput({ unit, value, onChange }: { unit: Unit; value?: Purchase; onChange?: (v: Purchase) => void }) {
  const set = (patch: Partial<Purchase>) => onChange?.({ unit: purchaseUnits[unit][0].value, ...value, ...patch });
  return (
    <Flex gap={8} align="center" wrap>
      <Typography.Text>Mua</Typography.Text>
      <InputNumber min={0} aria-label="Lượng mua" value={value?.qty ?? null} onChange={(qty) => set({ qty })} style={{ width: 96 }} />
      <Select aria-label="Đơn vị mua" value={value?.unit} onChange={(u) => set({ unit: u })} options={purchaseUnits[unit].map((u) => ({ value: u.value, label: u.label }))} style={{ width: 84 }} />
      <Typography.Text>giá</Typography.Text>
      <MoneyInput aria-label="Giá mua" placeholder="Chưa có giá" value={value?.price ?? null} onChange={(price) => set({ price: price ?? null })} style={{ width: 170 }} />
    </Flex>
  );
}
