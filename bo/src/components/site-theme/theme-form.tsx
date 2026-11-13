import { Col, Flex, Form, Input, Radio, Row, Switch } from "antd";
import { FormSection } from "@/components/form/form-section";
import { BlockFields } from "@/components/site-theme/block-fields";
import { CollectionFields } from "@/components/site-theme/collection-fields";
import { SingleImage } from "@/components/site-theme/single-image";
import { CARE_STEPS, type BlocksTheme, type CareStep } from "@/lib/site-theme/blocks";
import { focusLabels, LIMITS, webAssets, webDefaults, type BaseTheme, type Focus } from "@/lib/site-theme/types";

type Values = {
  announcementOn?: boolean;
  announcement?: string;
  logoLight?: string;
  logoDark?: string;
  image?: string;
  focus?: Focus;
  eyebrow?: string;
  title?: string;
  text?: string;
  cta?: string;
  mark?: string;
  cTitle?: string;
  cHeading?: string;
  cNote?: string;
  cEyebrow?: string;
  productIds?: string[];
} & BlocksTheme;

// Bước điền lẻ (vd chỉ bước 2) để lại chỗ trống trong mảng → lưu thành null, BE từ chối: luôn đủ 3 bước, bước trống là {}; cả 3 trống thì bỏ
const careSteps = (steps?: CareStep[]) =>
  steps?.some((s) => s?.title || s?.text)
    ? Array.from({ length: CARE_STEPS }, (_, i) => ({ ...(steps[i]?.title && { title: steps[i].title }), ...(steps[i]?.text && { text: steps[i].text }) }))
    : undefined;

const toValues = (p: BaseTheme): Values => ({
  announcementOn: p.announcementOn ?? true,
  announcement: p.announcement,
  logoLight: p.logo?.light,
  logoDark: p.logo?.dark,
  ...p.hero,
  cTitle: p.collection?.title,
  cHeading: p.collection?.heading,
  cNote: p.collection?.note,
  cEyebrow: p.collection?.eyebrow,
  productIds: p.collection?.productIds ?? [],
  // Các khối trang chủ: tên trường lồng, giữ nguyên dạng
  story: p.story,
  care: p.care,
  contact: p.contact,
  footer: p.footer,
});
const fromValues = (v: Values, isBase: boolean): BaseTheme => ({
  ...(isBase && { announcementOn: v.announcementOn }),
  announcement: v.announcement || undefined,
  logo: { light: v.logoLight || undefined, dark: v.logoDark || undefined },
  hero: {
    image: v.image || undefined,
    focus: v.focus,
    eyebrow: v.eyebrow || undefined,
    title: v.title?.trim() || undefined,
    text: v.text || undefined,
    cta: v.cta || undefined,
    mark: v.mark || undefined,
  },
  collection: {
    title: v.cTitle || undefined,
    heading: v.cHeading || undefined,
    note: v.cNote || undefined,
    eyebrow: v.cEyebrow || undefined,
    productIds: v.productIds?.length ? v.productIds : undefined,
  },
  story: v.story,
  care: v.care && { ...v.care, steps: careSteps(v.care.steps) },
  contact: v.contact,
  footer: v.footer,
});

type Props = {
  part: BaseTheme;
  // Đang sửa Mặc định (true) hay một concept (false — trường trống lấy của mặc định)
  isBase: boolean;
  // Giá trị dùng khi để trống: của mặc định (concept) hoặc nội dung có sẵn của web
  fallback: BaseTheme;
  onChange: (part: BaseTheme) => void;
};

// Form một bộ giao diện. Ô ảnh trống: Mặc định hiện ảnh / logo gốc của web, giao diện khác để trống (lấy của Mặc định). Trang mount lại theo key (Mặc định / từng concept) nên form luôn bắt đầu từ dữ liệu đúng
export function ThemeForm({ part, isBase, fallback, onChange }: Props) {
  const [form] = Form.useForm<Values>();
  const hint = (own: string | undefined, web: string) => own || web;
  const inherit = isBase ? "Để trống = nội dung có sẵn của web" : "Để trống = dùng của Mặc định";
  const titleRule = {
    validator: (_: unknown, v?: string) => {
      const lines = (v ?? "").split("\n");
      return lines.length > 2 || lines.some((l) => l.trim().length > LIMITS.titleLine) ? Promise.reject(new Error(`Tối đa 2 dòng, mỗi dòng ${LIMITS.titleLine} ký tự.`)) : Promise.resolve();
    },
  };

  return (
    <Form form={form} layout="vertical" initialValues={toValues(part)} onValuesChange={(_, all) => onChange(fromValues(all, isBase))}>
      <Flex vertical gap={16}>
        <FormSection title="Thanh thông báo" description="Dải chữ nhỏ trên cùng mọi trang.">
          {isBase && (
            <Form.Item name="announcementOn" label="Hiện thanh thông báo" valuePropName="checked">
              <Switch aria-label="Hiện thanh thông báo" />
            </Form.Item>
          )}
          <Form.Item name="announcement" label="Nội dung" extra={inherit} style={{ marginBottom: 0 }}>
            <Input maxLength={LIMITS.announcement} showCount placeholder={hint(fallback.announcement, webDefaults.announcement)} aria-label="Nội dung thanh thông báo" />
          </Form.Item>
        </FormSection>

        <FormSection title="Logo" description="PNG / SVG nền trong suốt, ngang từ 400px. Để trống = logo hiện tại.">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="logoLight" label="Logo sáng (trên ảnh hero tối)">
                <SingleImage
                  label="Logo sáng"
                  maxSide={1200}
                  minWidth={400}
                  backdrop="dark"
                  height={90}
                  emptyText={isBase ? "Logo có sẵn của web" : "Dùng logo của Mặc định"}
                  fallback={isBase ? { src: webAssets.logo, tint: "#f5f2e9" } : undefined}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="logoDark" label="Logo tối (trên nền kem)">
                <SingleImage
                  label="Logo tối"
                  maxSide={1200}
                  minWidth={400}
                  backdrop="light"
                  height={90}
                  emptyText={isBase ? "Logo có sẵn của web" : "Dùng logo của Mặc định"}
                  fallback={isBase ? { src: webAssets.logo, tint: "#876042" } : undefined}
                />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection title="Hero" description="Ảnh lớn đầu trang chủ. Ảnh ngang từ 1600px (tỉ lệ khoảng 3:2), chủ thể lệch phải để chừa chỗ cho chữ bên trái.">
          <Form.Item name="image" label="Ảnh">
            <SingleImage label="Ảnh hero" maxSide={2400} minWidth={1600} emptyText={isBase ? "Ảnh có sẵn của web" : "Dùng ảnh của Mặc định"} fallback={isBase ? { src: webAssets.hero } : undefined} />
          </Form.Item>
          <Form.Item name="focus" label="Điểm lấy nét khi cắt ảnh (điện thoại)" extra="Phần ảnh luôn giữ lại khi màn hình hẹp — chọn phía có chủ thể (hũ nến).">
            <Radio.Group optionType="button" options={(Object.keys(focusLabels) as Focus[]).map((k) => ({ value: k, label: focusLabels[k] }))} />
          </Form.Item>
          <Form.Item name="eyebrow" label="Nhãn nhỏ" extra={inherit}>
            <Input maxLength={LIMITS.eyebrow} showCount placeholder={hint(fallback.hero?.eyebrow, webDefaults.eyebrow)} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề (tối đa 2 dòng)" extra={inherit} rules={[titleRule]}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 2 }} placeholder={hint(fallback.hero?.title, webDefaults.title)} />
          </Form.Item>
          <Form.Item name="text" label="Đoạn giới thiệu" extra={inherit}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={LIMITS.text} showCount placeholder={hint(fallback.hero?.text, webDefaults.text)} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="cta" label="Chữ trên nút" extra={inherit}>
                <Input maxLength={LIMITS.cta} showCount placeholder={hint(fallback.hero?.cta, webDefaults.cta)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="mark" label="Câu lớn dưới ảnh" extra="Hiện một dòng chữ lớn — càng ngắn càng to." style={{ marginBottom: 0 }}>
                <Input maxLength={LIMITS.mark} showCount placeholder={hint(fallback.hero?.mark, webDefaults.mark)} />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <CollectionFields isBase={isBase} fallback={fallback.collection} />

        <BlockFields isBase={isBase} fallback={fallback} />
      </Flex>
    </Form>
  );
}
