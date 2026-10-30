import { EditOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Row, Switch, Tag, Typography } from "antd";
import { memo } from "react";
import { PriceText, ProductBadges, RatingText } from "@/components/products/product-view";
import type { ProductsApi } from "@/hooks/use-products";
import { aromaTypeColors, aromaTypeLabels, sizeLabels } from "@/lib/products/labels";
import type { Product } from "@/lib/products/types";
import { brand, radius } from "@/theme";

type Props = { items: Product[]; api: ProductsApi; onEdit: (id: string) => void };

// Lưới thẻ sản phẩm — nhìn ảnh để rà nhanh; bấm ảnh hoặc tên để sửa
function ProductGridView({ items, api, onEdit }: Props) {
  return (
    <Row gutter={[16, 16]}>
      {items.map((p) => (
        <Col key={p.id} xs={24} sm={12} lg={8} xxl={6}>
          <article style={{ background: "#fff", borderRadius: radius.card, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
            <button
              type="button"
              onClick={() => onEdit(p.id)}
              aria-label={`Sửa ${p.name}`}
              className="product-cover"
              style={{ aspectRatio: "4 / 3", background: brand.emberLight }}
            >
              {p.images[0] && <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: p.status === "hidden" ? 0.55 : 1 }} />}
              <span style={{ position: "absolute", left: 12, top: 12 }}>
                <ProductBadges product={p} />
              </span>
            </button>

            <Flex vertical gap={8} style={{ padding: 16, flex: 1 }}>
              <Flex justify="space-between" align="flex-start" gap={8}>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {p.name}
                </Typography.Text>
                <RatingText product={p} />
              </Flex>
              <Flex gap={6} align="center" wrap>
                <Tag color={aromaTypeColors[p.aromaType]} style={{ marginInlineEnd: 0 }}>
                  {aromaTypeLabels[p.aromaType]}
                </Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Cỡ {sizeLabels[p.size].toLowerCase()} · {p.sold} đã bán
                </Typography.Text>
              </Flex>
              <div style={{ marginTop: "auto", paddingTop: 4 }}>
                <PriceText product={p} size={16} />
              </div>
            </Flex>

            <Flex align="center" justify="space-between" style={{ padding: "10px 16px", borderTop: "1px solid #f1f1f1" }}>
              <Flex component="label" align="center" gap={8} style={{ cursor: "pointer" }}>
                <Switch
                  size="small"
                  checked={p.status === "active"}
                  onChange={(on) => api.patch([p.id], { status: on ? "active" : "hidden" })}
                  aria-label={`Đang bán: ${p.name}`}
                />
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {p.status === "active" ? "Đang bán" : "Tạm ẩn"}
                </Typography.Text>
              </Flex>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(p.id)}>
                Sửa
              </Button>
            </Flex>
          </article>
        </Col>
      ))}
    </Row>
  );
}

// memo: mở/đóng drawer chỉ đổi ?order= / ?edit= trên URL — bảng giữ nguyên, không render lại
export const ProductGrid = memo(ProductGridView);
