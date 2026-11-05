import { WarningOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Typography } from "antd";
import { useMemo } from "react";
import { CostCheck, SuggestButton } from "@/components/craft/margin";
import { FormSection } from "@/components/form/form-section";
import { cleanBuild, type BuildValues } from "@/components/products/product-form";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { needsCost } from "@/lib/costs";
import { depositCheck, depositLoss, needsReview, suggestFullPrice, type PriceCheck } from "@/lib/craft/pricing";
import { describeSelection, maxJars } from "@/lib/craft/selection";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney, formatNumber } from "@/lib/format";
import { toMap } from "@/lib/inventory/stock";
import { buildSize, craftPrice, extrasPrice, productSteps, recipeFromBuild, sizeFromCapacity } from "@/lib/products/build";
import { sizeLabels } from "@/lib/products/labels";
import { defaultShippingFee } from "@/lib/settings/types";

// Tóm tắt nguyên liệu và kiểm tra giá bán trong form sản phẩm
// Tóm tắt giống popup Tự phối: mô tả, giá theo Thủ công, giá vốn, công thức trừ Kho, số cây Kho đủ làm
export function BuildSummary() {
  const form = Form.useFormInstance();
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const map = useMemo(() => toMap(materials), [materials]);
  const values = (Form.useWatch("build", form) ?? {
    selection: {},
    extras: [],
  }) as BuildValues;
  const build = cleanBuild(values);
  const recipe = recipeFromBuild(build, config, map);
  const size = buildSize(build, config);
  const description = describeSelection({ ...config, steps: productSteps(config) }, build.selection);
  const craft = craftPrice(build, config);
  const extra = extrasPrice(build);
  const reference = craft + extra;
  const needs = new Map(recipe.map((r) => [r.materialId, r.quantity]));
  const cost = needsCost(needs, map);
  const n = maxJars(needs, map);
  return (
    <FormSection title="Tóm tắt nguyên liệu" description="Theo giá nhập bình quân và số tồn trong Kho.">
      <Flex vertical gap={8} role="group" aria-label="Tóm tắt nguyên liệu">
        <Typography.Text style={{ fontSize: 13 }}>{description || "Chưa chọn gì."}</Typography.Text>
        {size && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Cỡ trên web: {sizeLabels[sizeFromCapacity(size.ml)]} ({size.ml}ml, {size.grams} g sáp
            {size.burnHours ? `, cháy ~${size.burnHours} giờ` : ""})
          </Typography.Text>
        )}
        {extra > 0 && (
          <>
            <Flex justify="space-between" gap={8}>
              <Typography.Text type="secondary">Giá theo Thủ công</Typography.Text>
              <Typography.Text className="tabular">{formatMoney(craft)}</Typography.Text>
            </Flex>
            <Flex justify="space-between" gap={8}>
              <Typography.Text type="secondary">Phụ kiện khác</Typography.Text>
              <Typography.Text className="tabular">{formatMoney(extra)}</Typography.Text>
            </Flex>
          </>
        )}
        <Flex justify="space-between" gap={8}>
          <Typography.Text type="secondary">{extra > 0 ? "Giá tham khảo" : "Giá theo Thủ công"}</Typography.Text>
          <Flex gap={8} align="center">
            <Typography.Text className="tabular">{formatMoney(reference)}</Typography.Text>
            {reference > 0 && (
              <Button size="small" type="link" style={{ padding: 0, height: "auto" }} onClick={() => form.setFieldsValue({ price: reference, salePrice: null })}>
                Dùng giá này
              </Button>
            )}
          </Flex>
        </Flex>
        <Flex justify="space-between" gap={8}>
          <Typography.Text type="secondary">Giá vốn nguyên liệu</Typography.Text>
          <Typography.Text className="tabular">{formatMoney(cost.cost)}</Typography.Text>
        </Flex>
        {cost.missing.length > 0 && (
          <Typography.Text type="warning" style={{ fontSize: 12 }}>
            Chưa có giá nhập: {cost.missing.map((m) => m.name).join(", ")}
          </Typography.Text>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          Nguyên liệu cho 1 cây (trừ Kho)
        </Typography.Text>
        {recipe.length ? (
          <Flex vertical gap={4} role="list" aria-label="Công thức 1 cây">
            {recipe.map((r) => {
              const m = map.get(r.materialId);
              return (
                <Flex key={r.materialId} role="listitem" justify="space-between" gap={8} style={{ fontSize: 13 }}>
                  <Typography.Text ellipsis style={{ fontSize: 13 }}>
                    {m?.name ?? r.materialId}
                  </Typography.Text>
                  <Typography.Text type={m && m.stock < r.quantity ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    {formatNumber(r.quantity)} / {formatNumber(m?.stock ?? 0)} {m ? unitLabel[m.unit] : ""}
                  </Typography.Text>
                </Flex>
              );
            })}
          </Flex>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Chưa có nguyên liệu theo dõi tồn.
          </Typography.Text>
        )}
        <div className="cfg-jars" data-tone={n === 0 ? "out" : n <= 5 ? "low" : "ok"} role="status">
          {!recipe.length || n === Infinity ? "Không giới hạn số cây" : n === 0 ? "Kho không đủ làm cây nào" : `Kho đủ làm ${formatNumber(n)} cây`}
        </div>
      </Flex>
    </FormSection>
  );
}

// Dưới ô giá: giá thực bán (giá giảm nếu có) so với giá vốn, gợi ý giá theo hệ số và lãi tối thiểu
export function PriceCheckLine() {
  const form = Form.useFormInstance();
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  const { settings } = useSettings();
  const map = useMemo(() => toMap(materials), [materials]);
  const values = (Form.useWatch("build", form) ?? {
    selection: {},
    extras: [],
  }) as BuildValues;
  const price = (Form.useWatch("price", form) as number | undefined) ?? 0;
  const salePrice = Form.useWatch("salePrice", form) as number | null | undefined;
  const recipe = recipeFromBuild(cleanBuild(values), config, map);
  if (!recipe.length) return null;
  const cost = needsCost(new Map(recipe.map((r) => [r.materialId, r.quantity])), map);
  const sell = salePrice || price;
  const check: PriceCheck = {
    price: sell,
    floor: cost.cost,
    missing: cost.missing,
    margin: sell > 0 ? (sell - cost.cost) / sell : null,
  };
  // Khách chỉ cọc rồi không nhận hàng: cọc phải bù được nguyên liệu và phí giao phương thức mặc định (Cài đặt › Phí vận chuyển)
  const pricing = { ...settings, shipping: defaultShippingFee(settings) };
  const deposit = depositCheck(sell, cost.cost, pricing);
  const loss = cost.cost > 0 && sell > 0 && depositLoss(deposit);
  return (
    <div role="group" aria-label="Giá vốn 1 cây" style={{ marginTop: 12 }}>
      <CostCheck c={check} min={settings.minMargin} inline note={salePrice ? "so với giá giảm" : undefined}>
        {cost.cost > 0 && (needsReview(check, settings.minMargin) || loss) && (
          <SuggestButton value={suggestFullPrice(cost.cost, pricing)} current={sell} label="Gợi ý giá bán" onApply={(v) => form.setFieldsValue({ price: v, salePrice: null })} />
        )}
      </CostCheck>
      {cost.cost > 0 && sell > 0 && (
        <Typography.Text type={loss ? "warning" : "secondary"} style={{ display: "block", fontSize: 12, marginTop: 4 }} role="note" aria-label="Khách bỏ cọc">
          {loss && <WarningOutlined aria-hidden style={{ marginInlineEnd: 4 }} />}
          Khách cọc {settings.depositPercent}% rồi không nhận: cọc {formatMoney(deposit.deposit)} − nguyên liệu {formatMoney(deposit.cost)} − ship {formatMoney(deposit.shipping)} (phí giao mặc định) ={" "}
          <strong>{deposit.left < 0 ? `lỗ ${formatMoney(-deposit.left)}` : `còn ${formatMoney(deposit.left)}`}</strong>
          {loss && ` · giá từ ${formatMoney(deposit.minPrice)} thì không lỗ`}
        </Typography.Text>
      )}
    </div>
  );
}
