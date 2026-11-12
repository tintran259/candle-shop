import { Col, Flex, Form, Input, Row, Select, Tag, Typography } from "antd";
import { FormSection } from "@/components/form/form-section";
import { useConcepts } from "@/hooks/use-concepts";
import { useProducts } from "@/hooks/use-products";
import { outOfSeason } from "@/lib/products/concepts";
import { COLLECTION_MAX, LIMITS, webDefaults, type CollectionTheme } from "@/lib/site-theme/types";

type Props = {
  isBase: boolean;
  // Giá trị khi để trống: của Mặc định (giao diện concept) hoặc rỗng (Mặc định)
  fallback?: CollectionTheme;
};

// Khối "Xưởng nến" trong form giao diện: chữ của khối + chọn tối đa 3 mẫu theo thứ tự (docs/pages/site-theme.md#xưởng-nến).
// Mẫu Tạm ẩn không chọn được; mẫu ngoài mùa chọn được (chuẩn bị trước cho dịp lễ) nhưng web chỉ hiện khi tới mùa — thiếu thì web tự bù mẫu nổi bật
export function CollectionFields({ isBase, fallback }: Props) {
  const { products = [] } = useProducts();
  const concepts = useConcepts();
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "mẫu đã xóa";
  const hint = (own: string | undefined, web: string) => own || web;
  const inherit = isBase ? "Để trống = nội dung có sẵn của web" : "Để trống = dùng của Mặc định";
  const pickedHint = isBase
    ? "Không chọn = web tự lấy mẫu nổi bật (rồi mẫu mới)."
    : fallback?.productIds?.length
      ? `Không chọn = dùng mẫu của Mặc định: ${fallback.productIds.map(name).join(", ")}.`
      : "Không chọn = web tự lấy mẫu nổi bật (Mặc định chưa chọn mẫu).";
  const d = webDefaults.collection;

  return (
    <FormSection
      title="Xưởng nến"
      description="Khối mẫu nến dưới hero: 3 mẫu là lưới, hơn 3 mẫu là băng chuyền tự cuộn. Mẫu hết bán / ngoài mùa bị bỏ qua; còn dưới 3 mẫu thì web tự bù mẫu nổi bật cho đủ 3."
    >
      <Form.Item
        name="productIds"
        label={`Mẫu hiện trên trang chủ (tối đa ${COLLECTION_MAX}, theo thứ tự chọn)`}
        tooltip="3 mẫu: lưới 3 thẻ. Hơn 3 mẫu: băng chuyền tự cuộn vô hạn (rê chuột thì dừng)."
        extra={pickedHint}
      >
        <Select
          mode="multiple"
          maxCount={COLLECTION_MAX}
          allowClear
          aria-label="Mẫu Xưởng nến"
          placeholder="Chọn mẫu nến"
          optionFilterProp="search"
          options={products.map((p) => {
            const hidden = p.status !== "active";
            const off = !hidden && outOfSeason(p.conceptIds, concepts.byId);
            return {
              value: p.id,
              search: p.name,
              disabled: hidden,
              label: (
                <Flex gap={6} align="center">
                  {p.name}
                  {p.isFeatured && (
                    <Tag color="gold" style={{ marginInlineEnd: 0, fontSize: 11 }}>
                      Nổi bật
                    </Tag>
                  )}
                  {hidden && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      · Tạm ẩn
                    </Typography.Text>
                  )}
                  {off && (
                    <Typography.Text type="warning" style={{ fontSize: 11 }}>
                      · Ngoài mùa
                    </Typography.Text>
                  )}
                </Flex>
              ),
            };
          })}
        />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="cTitle" label="Tên khối (chữ lớn)" extra={inherit}>
            <Input maxLength={LIMITS.collTitle} showCount placeholder={hint(fallback?.title, d.title)} aria-label="Tên khối Xưởng nến" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="cEyebrow" label="Nhãn trên các thẻ" extra={inherit}>
            <Input maxLength={LIMITS.collEyebrow} showCount placeholder={hint(fallback?.eyebrow, d.eyebrow)} aria-label="Nhãn bộ sưu tập" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="cHeading" label="Câu dẫn" extra={inherit}>
        <Input maxLength={LIMITS.collHeading} showCount placeholder={hint(fallback?.heading, d.heading)} aria-label="Câu dẫn Xưởng nến" />
      </Form.Item>
      <Form.Item name="cNote" label="Ghi chú nhỏ" extra={inherit} style={{ marginBottom: 0 }}>
        <Input maxLength={LIMITS.collNote} showCount placeholder={hint(fallback?.note, d.note)} aria-label="Ghi chú Xưởng nến" />
      </Form.Item>
    </FormSection>
  );
}
