import { Col, Form, Input, Row, Switch } from "antd";
import { FormSection } from "@/components/form/form-section";
import { SingleImage } from "@/components/site-theme/single-image";
import { BLOCK_LIMITS as L, blockDefaults as D, lineRule, type BlockKey, type BlocksTheme } from "@/lib/site-theme/blocks";

type Props = {
  isBase: boolean;
  // Giá trị khi để trống: của Mặc định (giao diện concept) hoặc rỗng (Mặc định)
  fallback: BlocksTheme;
};

// Các khối trang chủ trong form Giao diện web: Câu chuyện, Nghệ thuật đốt nến, Gửi lời nhắn (công tắc ẩn / hiện), chân trang.
// Tên trường lồng (["story", "title"]) — form lưu thẳng thành { story: {...} }. Ô trống: Mặc định dùng nội dung có sẵn, giao diện khác dùng của Mặc định
export function BlockFields({ isBase, fallback }: Props) {
  const inherit = isBase ? "Để trống = nội dung có sẵn của web" : "Để trống = dùng của Mặc định";
  const hint = <K extends BlockKey>(block: K, key: string) => {
    const own = (fallback[block] as Record<string, unknown> | undefined)?.[key];
    return (typeof own === "string" && own) || String((D[block] as Record<string, unknown>)[key] ?? "");
  };

  // Công tắc "Hiện khối này" lưu hidden (đảo ngược); giao diện concept chưa bật / tắt thì theo Mặc định
  const visible = (block: "story" | "care" | "contact") => (
    <Form.Item
      name={[block, "hidden"]}
      label="Hiện khối này trên trang chủ"
      valuePropName="checked"
      getValueProps={(v?: boolean) => ({ checked: !(v ?? fallback[block]?.hidden ?? false) })}
      normalize={(checked: boolean) => !checked}
    >
      <Switch aria-label={`Hiện khối ${{ story: "Câu chuyện", care: "Nghệ thuật đốt nến", contact: "Gửi lời nhắn" }[block]}`} />
    </Form.Item>
  );
  const image = (block: BlockKey, label: string, minWidth: number) => (
    <Form.Item name={[block, "image"]} label="Ảnh">
      <SingleImage
        label={`Ảnh ${label}`}
        maxSide={2000}
        minWidth={minWidth}
        emptyText={isBase ? "Ảnh có sẵn của web" : "Dùng ảnh của Mặc định"}
        fallback={isBase ? { src: D[block].image } : undefined}
      />
    </Form.Item>
  );
  const text = (block: BlockKey, key: string, label: string, max: number) => (
    <Form.Item name={[block, key]} label={label} extra={inherit}>
      <Input maxLength={max} showCount placeholder={hint(block, key)} aria-label={`${label} — ${block}`} />
    </Form.Item>
  );
  const lines = (block: BlockKey, key: string, label: string, rule: readonly [number, number], rows = 2) => (
    <Form.Item name={[block, key]} label={`${label} (tối đa ${rule[0]} dòng)`} extra={inherit} rules={[lineRule(rule)]}>
      <Input.TextArea autoSize={{ minRows: rows, maxRows: rule[0] + 1 }} placeholder={hint(block, key)} aria-label={`${label} — ${block}`} />
    </Form.Item>
  );

  return (
    <>
      <FormSection title="Câu chuyện" description="Khối giới thiệu shop: ảnh tĩnh vật bên trái, tên khối lớn, câu dẫn, đoạn văn bên phải.">
        {visible("story")}
        {image("story", "Câu chuyện", 1200)}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            {text("story", "eyebrow", "Nhãn nhỏ", L.story.eyebrow)}
          </Col>
          <Col xs={24} md={12}>
            {text("story", "kicker", "Dòng phụ", L.story.kicker)}
          </Col>
          <Col xs={24} md={12}>
            {lines("story", "title", "Tên khối", L.story.title)}
          </Col>
          <Col xs={24} md={12}>
            {lines("story", "heading", "Câu dẫn", L.story.heading)}
          </Col>
        </Row>
        {lines("story", "body", "Đoạn văn — mỗi dòng một đoạn", L.story.body, 3)}
        {text("story", "cta", "Chữ liên kết", L.story.cta)}
      </FormSection>

      <FormSection title="Nghệ thuật đốt nến" description="3 bước chăm nến đánh số và ảnh bên phải.">
        {visible("care")}
        {image("care", "Nghệ thuật đốt nến", 900)}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            {lines("care", "title", "Tên khối", L.care.title)}
          </Col>
          <Col xs={24} md={12}>
            {text("care", "link", "Liên kết nhỏ", L.care.link)}
          </Col>
        </Row>
        {D.care.steps.map((d, i) => (
          <Row gutter={16} key={i}>
            <Col xs={24} md={8}>
              <Form.Item name={["care", "steps", i, "title"]} label={`Bước ${i + 1}`}>
                <Input maxLength={L.care.stepTitle} placeholder={fallback.care?.steps?.[i]?.title || d.title} aria-label={`Tên bước ${i + 1}`} />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item name={["care", "steps", i, "text"]} label={`Mô tả bước ${i + 1}`}>
                <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} maxLength={L.care.stepText} placeholder={fallback.care?.steps?.[i]?.text || d.text} aria-label={`Mô tả bước ${i + 1}`} />
              </Form.Item>
            </Col>
          </Row>
        ))}
      </FormSection>

      <FormSection title="Gửi lời nhắn" description="Khối form liên hệ cuối trang chủ. Ẩn khối thì liên kết Hỗ trợ › Liên hệ ở chân trang không còn chỗ tới.">
        {visible("contact")}
        {image("contact", "Gửi lời nhắn", 900)}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            {lines("contact", "title", "Tên khối", L.contact.title)}
          </Col>
          <Col xs={24} md={12}>
            {text("contact", "heading", "Câu dẫn", L.contact.heading)}
          </Col>
        </Row>
        <Form.Item name={["contact", "text"]} label="Mô tả" extra={inherit}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={L.contact.text} showCount placeholder={hint("contact", "text")} aria-label="Mô tả — contact" />
        </Form.Item>
      </FormSection>

      <FormSection title="Chân trang" description="Ảnh bên phải và câu khẩu hiệu dưới logo, ở cuối mọi trang.">
        {image("footer", "chân trang", 900)}
        {text("footer", "tagline", "Khẩu hiệu", L.footer.tagline)}
      </FormSection>
    </>
  );
}
