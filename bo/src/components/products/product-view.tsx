import { StarFilled, WarningOutlined } from "@ant-design/icons";
import { Avatar, Flex, Tag, Tooltip, Typography } from "antd";
import { belowCost, type PriceCheck } from "@/lib/craft/pricing";
import { discountPercent } from "@/lib/products/labels";
import type { Product } from "@/lib/products/types";
import { formatMoney } from "@/lib/format";
import { brand } from "@/theme";

// Giá bán; đang giảm thì hiện giá giảm + giá gốc gạch ngang + % giảm
export function PriceText({ product, size = 14 }: { product: Pick<Product, "price" | "salePrice">; size?: number }) {
  const off = discountPercent(product);
  if (!off) {
    return (
      <Typography.Text strong className="tabular" style={{ fontSize: size }}>
        {formatMoney(product.price)}
      </Typography.Text>
    );
  }
  return (
    <Flex vertical align="flex-start" gap={2}>
      <Flex align="center" gap={6}>
        <Typography.Text strong className="tabular" style={{ fontSize: size, color: brand.emberDark }}>
          {formatMoney(product.salePrice!)}
        </Typography.Text>
        <Tag color="volcano" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: "18px" }}>
          -{off}%
        </Tag>
      </Flex>
      <Typography.Text type="secondary" delete className="tabular" style={{ fontSize: 12 }}>
        {formatMoney(product.price)}
      </Typography.Text>
    </Flex>
  );
}

// Dưới giá: sản phẩm đang bán thấp hơn giá vốn (đỏ) hoặc lãi dưới mức tối thiểu (cam), theo giá nhập hiện tại trong Kho
export function PriceFlag({ check }: { check?: PriceCheck }) {
  if (!check) return null;
  const below = belowCost(check);
  return (
    <Tooltip title={`Giá vốn công thức hiện tại ${formatMoney(check.floor)}, đang bán ${formatMoney(check.price)}. Mở sản phẩm để xem gợi ý giá.`}>
      <Tag color={below ? "error" : "warning"} icon={<WarningOutlined />} style={{ marginInlineEnd: 0, marginTop: 4, width: "fit-content" }}>
        {below ? `Thấp hơn vốn ${formatMoney(check.floor - check.price)}` : `Lãi thấp ${Math.round((check.margin ?? 0) * 100)}%`}
      </Tag>
    </Tooltip>
  );
}

export function ProductThumb({ product, size = 48 }: { product: Pick<Product, "images" | "status">; size?: number }) {
  return (
    <Avatar
      shape="square"
      size={size}
      src={product.images[0]}
      alt=""
      style={{ borderRadius: 12, flexShrink: 0, background: brand.emberLight, opacity: product.status === "hidden" ? 0.55 : 1 }}
    />
  );
}

// Nhãn Mới / Nổi bật / Tạm ẩn — luôn có chữ, không chỉ màu
export function ProductBadges({ product }: { product: Pick<Product, "isNew" | "isFeatured" | "status"> }) {
  return (
    <Flex gap={4} wrap>
      {product.status === "hidden" && <Tag style={{ marginInlineEnd: 0 }}>Tạm ẩn</Tag>}
      {product.isNew && (
        <Tag color={brand.ember} style={{ marginInlineEnd: 0 }}>
          Mới
        </Tag>
      )}
      {product.isFeatured && (
        <Tag icon={<StarFilled />} color="gold" style={{ marginInlineEnd: 0 }}>
          Nổi bật
        </Tag>
      )}
    </Flex>
  );
}

// Sản phẩm chưa có công thức thì đơn không giữ và không trừ Kho
export function RecipeTag({ product }: { product: Pick<Product, "recipe"> }) {
  return product.recipe?.length ? null : (
    <Tag color="warning" style={{ marginInlineEnd: 0 }}>
      Chưa có công thức
    </Tag>
  );
}

export function RatingText({ product }: { product: Pick<Product, "rating" | "reviewCount"> }) {
  return (
    <Typography.Text className="tabular" style={{ whiteSpace: "nowrap" }}>
      <StarFilled style={{ color: "#faad14", marginRight: 4 }} aria-hidden />
      {product.rating.toFixed(1)}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {" "}
        ({product.reviewCount})
      </Typography.Text>
    </Typography.Text>
  );
}
