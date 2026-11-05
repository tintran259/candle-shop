import { Form, type FormInstance } from "antd";
import { CostCheck, SuggestButton } from "@/components/craft/margin";
import { type OptionFormValues } from "@/components/craft/option-form";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { MoneyInput } from "@/components/money-input";
import { sizeLabel } from "@/lib/craft/groups";
import { needsReview, optionCheck, suggestPrice, suggestUnitPrice } from "@/lib/craft/pricing";
import { formatMoney } from "@/lib/format";
import { amountBasis } from "@/lib/craft/steps";
import type { ShopSettings } from "@/lib/settings/types";

type Props = {
  form: FormInstance<OptionFormValues>;
  isVessel: boolean;
  // Giá theo lượng (sáp, màu, hương): mỗi 100 g / mỗi ml
  basis: ReturnType<typeof amountBasis>;
  perLabel?: string | false | null;
  priceLabel: string;
  price?: number | null;
  // Ví dụ giá theo lượng ở cỡ hũ nhỏ nhất đang bán
  sample: { jar: string; grams: number; amount: number } | null;
  priceCheck: ReturnType<typeof optionCheck> | null;
  pricing: Pick<ShopSettings, "minMargin" | "priceMarkup">;
  setDirty: (d: boolean) => void;
};

// Khối Giá & bán của lựa chọn: giá / phụ thu, so với giá vốn, gợi ý giá, đang bán
export function PriceFields({ form, isVessel, basis, perLabel, priceLabel, price, sample, priceCheck, pricing, setDirty }: Props) {
  return (
    <FormSection
      title="Giá & bán"
      description={
        isVessel
          ? "Giá hũ ở cỡ nhỏ nhất. Mỗi cỡ cộng phụ thu cỡ riêng ở phần Loại hũ & kích thước bên dưới."
          : basis
            ? `Khách trả = lượng dùng cho hũ đã chọn × giá này, làm tròn tới 100 ₫. Chọn nhiều thì chia theo % lượng.${
                sample
                  ? ` Vd ${sample.jar} (${sample.grams} g sáp): ${sample.amount.toLocaleString("vi-VN")} ${basis.unit} × ${formatMoney(Math.round(price ?? 0))}/${perLabel} = ${formatMoney(Math.round((sample.amount * Math.round(price ?? 0)) / basis.per / 100) * 100)}.`
                  : ""
              }`
            : "Phụ thu được cộng vào giá hũ."
      }
    >
      <Form.Item
        name="price"
        label={priceLabel}
        extra={
          priceCheck && (
            <div role="group" aria-label="Giá vốn lựa chọn">
              <CostCheck
                c={priceCheck}
                min={pricing.minMargin}
                inline
                note={priceCheck.floor > 0 && priceCheck.size ? `cỡ ${sizeLabel(priceCheck.size)}` : undefined}
                free={priceCheck.isDefault ? "Tính trong giá hũ" : undefined}
              >
                {priceCheck.floor > 0 && needsReview(priceCheck, pricing.minMargin) && (
                  <SuggestButton
                    // Giá theo lượng: gợi ý giá mỗi 100 g / mỗi ml. Phụ thu: giá gợi ý − phần khách đã trả thêm ngoài phụ thu
                    value={basis ? suggestUnitPrice(priceCheck.floor, pricing) : Math.max(0, suggestPrice(priceCheck.floor, pricing) - (priceCheck.price - Math.round(price ?? 0)))}
                    current={Math.round(price ?? 0)}
                    label={basis ? "Gợi ý giá bán" : "Gợi ý phụ thu"}
                    onApply={(n) => {
                      form.setFieldValue("price", n);
                      setDirty(true);
                    }}
                  />
                )}
              </CostCheck>
            </div>
          )
        }
      >
        <MoneyInput aria-label={priceLabel} />
      </Form.Item>
      <SwitchField name="available" label="Đang bán" description="Tắt để tạm ẩn với khách dù vẫn còn hàng." last />
    </FormSection>
  );
}
