import { Flex, Form, Tag, Typography } from "antd";
import type { ProductFormValues } from "@/components/products/product-form";
import { PriceText, ProductBadges, ProductThumb } from "@/components/products/product-view";
import { aromaLevelLabels, aromaTypeColors, aromaTypeLabels, sizeLabels } from "@/lib/products/labels";
import { radius } from "@/theme";

// Thẻ xem trước đầu drawer — giống cách sản phẩm hiện trên web, cập nhật theo từng thay đổi
export function ProductPreview() {
  const form = Form.useFormInstance<ProductFormValues>();
  const v = Form.useWatch([], { form, preserve: true }) as ProductFormValues | undefined;
  if (!v) return null;
  const status = v.active ? "active" : "hidden";

  return (
    <section aria-label="Xem trước" style={{ background: "#fff", borderRadius: radius.card, padding: 20 }}>
      <Flex gap={16} align="center">
        <ProductThumb product={{ images: v.images ?? [], status }} size={88} />
        <Flex vertical gap={6} style={{ minWidth: 0, flex: 1 }}>
          <ProductBadges product={{ isNew: v.isNew, isFeatured: v.isFeatured, status }} />
          <Typography.Title level={4} ellipsis style={{ margin: 0 }}>
            {v.name?.trim() || "Sản phẩm mới"}
          </Typography.Title>
          <Flex gap={6} align="center" wrap>
            <Tag color={aromaTypeColors[v.aromaType]} style={{ marginInlineEnd: 0 }}>
              {aromaTypeLabels[v.aromaType]}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Cỡ {sizeLabels[v.size].toLowerCase()} · Hương {aromaLevelLabels[v.aromaLevel].toLowerCase()}
              {v.burnTime ? ` · ~${v.burnTime} giờ` : ""}
            </Typography.Text>
          </Flex>
        </Flex>
        <div style={{ flexShrink: 0 }}>
          <PriceText product={{ price: v.price ?? 0, salePrice: v.salePrice ?? undefined }} size={20} />
        </div>
      </Flex>
    </section>
  );
}
