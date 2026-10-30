import { InputNumber, type InputNumberProps } from "antd";

const groupDigits = (v?: string | number) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Ô nhập tiền VNĐ: số nguyên, phân cách hàng nghìn bằng dấu chấm, bước 5.000đ.
// Dùng được trực tiếp trong Form.Item (nhận value/onChange).
export function MoneyInput(props: Omit<InputNumberProps<number>, "formatter" | "parser" | "precision">) {
  return (
    <InputNumber<number>
      min={0}
      step={5000}
      precision={0}
      suffix="₫"
      formatter={groupDigits}
      // Xóa trắng ô thì giữ trống (không ép về 0) — nếu ép, ô hiện "0" và số gõ tiếp bị chèn trước nó (400.000 → 4.200.000)
      parser={(v) => {
        const digits = (v ?? "").replace(/\D/g, "");
        return (digits === "" ? "" : Number(digits)) as number;
      }}
      style={{ width: "100%" }}
      {...props}
    />
  );
}
