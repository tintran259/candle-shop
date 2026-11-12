import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { Alert, App, Button, Col, Flex, Popconfirm, Result, Row, Select, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { SitePreview } from "@/components/site-theme/site-preview";
import { ThemeForm } from "@/components/site-theme/theme-form";
import { SettingsSkeleton } from "@/components/skeletons";
import { useConcepts } from "@/hooks/use-concepts";
import { useSiteThemes } from "@/hooks/use-site-themes";
import { uploadError } from "@/lib/craft/image";
import { seasonLabels, seasonOf } from "@/lib/products/concepts";
import { scheduleText, themeState } from "@/lib/site-theme/schedule";
import { compact, heldConcepts, LIMITS, merged, type BaseTheme, type ThemeContent } from "@/lib/site-theme/types";
import { useTitle } from "@/lib/use-title";

const same = (a: ThemeContent, b: ThemeContent) => JSON.stringify(compact(a)) === JSON.stringify(compact(b));

// Chi tiết một giao diện web (docs/pages/site-theme.md): tên, concept áp dụng (trừ Mặc định), thanh thông báo, logo, hero + xem trước.
// Sửa ở bản nháp của riêng giao diện này, bấm "Lưu và đăng" mới lên web
export function SiteThemePage() {
  const { id = "" } = useParams();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const themes = useSiteThemes();
  const concepts = useConcepts();
  const theme = themes.byId.get(id);
  useTitle(theme ? `Giao diện: ${theme.name}` : "Giao diện web");
  // Thay đổi chưa lưu (null = đang khớp bản đã lưu)
  const [edited, setEdited] = useState<ThemeContent | null>(null);
  // Tăng sau khi lưu / bỏ nháp để form nạp lại (đường dẫn ảnh đổi từ ảnh tạm sang ảnh trên kho ảnh)
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);

  if (themes.loading || concepts.loading) return <SettingsSkeleton />;
  if (!theme)
    return (
      <Result
        status="404"
        title="Không tìm thấy giao diện"
        subTitle="Giao diện này đã bị xóa hoặc đường dẫn không đúng."
        extra={
          <Link to="/settings/site-theme">
            <Button type="primary">Về danh sách giao diện</Button>
          </Link>
        }
      />
    );

  const source: ThemeContent = theme.draft ?? theme.published ?? {};
  const data = edited ?? source;
  const dirty = !!edited && !same(edited, source);
  const base = themes.base.published ?? {};
  const conceptIds = (data.conceptIds ?? []).filter((c) => concepts.byId.has(c));
  // Concept đã thuộc giao diện khác: không chọn được
  // Thời gian giao diện tự lên web (theo mùa của các concept đã chọn). Chưa tới thời gian / không lên web: hỏi lại trước khi đăng
  const plan = theme.isDefault ? null : scheduleText(conceptIds, concepts.byId);
  const notice = plan && !plan.now ? (plan.off ? plan.text : `${plan.text} Trước đó web vẫn dùng Mặc định.`) : null;
  const owner = new Map(themes.items.filter((t) => t.id !== theme.id).flatMap((t) => [...heldConcepts(t)].map((c) => [c, t.name] as const)));

  const change = (next: ThemeContent) => setEdited(next);
  const setPart = (p: BaseTheme) => change({ ...p, ...(!theme.isDefault && { conceptIds: data.conceptIds ?? [] }) });

  const run = async (kind: "draft" | "publish") => {
    setSaving(kind);
    try {
      // Bỏ concept đã xóa
      const clean = { ...data, ...(!theme.isDefault && { conceptIds }) };
      await (kind === "draft" ? themes.saveDraft(theme.id, clean) : themes.publish(theme.id, clean));
      setEdited(null);
      setVersion((v) => v + 1);
      message.success(
        kind === "draft"
          ? "Đã lưu nháp"
          : plan?.off
            ? "Đã đăng — giao diện chưa lên web"
            : notice
              ? "Đã đăng — giao diện đang chờ tới thời gian áp dụng"
              : "Đã đăng giao diện lên web",
      );
    } catch (e) {
      message.error(uploadError(e));
    } finally {
      setSaving(null);
    }
  };
  const publish = () => (notice ? modal.confirm({ title: "Đăng giao diện?", content: notice, okText: "Vẫn đăng", cancelText: "Hủy", onOk: () => run("publish") }) : run("publish"));
  const reload = () => (setEdited(null), setVersion((v) => v + 1));

  const s = themeState(theme, themes.items, concepts.items);
  const status = dirty
    ? "Có thay đổi chưa lưu"
    : theme.draft
      ? "Bản nháp chưa đăng lên web"
      : theme.publishedAt
        ? `Cập nhật lúc ${dayjs(theme.publishedAt).format("HH:mm DD/MM/YYYY")}`
        : theme.isDefault
          ? "Chưa cấu hình — web đang dùng nội dung có sẵn"
          : "Chưa có nội dung";

  return (
    <Flex vertical gap={16}>
      <Link to="/settings/site-theme" aria-label="Về danh sách giao diện" style={{ alignSelf: "flex-start" }}>
        <ArrowLeftOutlined /> Giao diện web
      </Link>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Flex gap={8} align="center" wrap>
            <Typography.Title
              level={3}
              style={{ margin: 0 }}
              editable={
                theme.isDefault ? false : { tooltip: "Đổi tên", maxLength: LIMITS.name, triggerType: ["icon"], onChange: (v) => v.trim() && v.trim() !== theme.name && themes.rename(theme.id, v) }
              }
            >
              {theme.name}
            </Typography.Title>
            <Tag color={s.color}>{s.label}</Tag>
          </Flex>
          <Typography.Text type="secondary">
            {theme.isDefault ? "Dùng khi không có dịp nào. Ô để trống = nội dung có sẵn của web." : "Chỉ cần điền phần muốn khác Mặc định — ô để trống lấy của Mặc định (bản đã đăng)."}
          </Typography.Text>
        </div>
        <Flex gap={8} align="center" wrap>
          <Typography.Text type={dirty || theme.draft ? "warning" : "secondary"} style={{ fontSize: 13 }}>
            {status}
          </Typography.Text>
          {!theme.isDefault && theme.published && !dirty && (
            <Popconfirm
              title="Gỡ giao diện khỏi web?"
              description="Web quay về Mặc định trong mùa của concept này. Nội dung giữ lại làm bản nháp."
              okText="Gỡ khỏi web"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => (themes.unpublish(theme.id), reload())}
            >
              <Button danger>Gỡ khỏi web</Button>
            </Popconfirm>
          )}
          {theme.draft && !dirty && (
            <Popconfirm
              title="Bỏ bản nháp?"
              description={theme.published ? "Quay về bản đang dùng trên web." : "Xóa nội dung chưa đăng."}
              okText="Bỏ nháp"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => (themes.discardDraft(theme.id), reload())}
            >
              <Button>Bỏ nháp</Button>
            </Popconfirm>
          )}
          {!theme.isDefault && (
            <Popconfirm
              title={`Xóa giao diện "${theme.name}"?`}
              description={theme.published ? "Giao diện đang đăng — web sẽ không dùng nữa." : undefined}
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => (themes.remove(theme.id), message.success("Đã xóa giao diện"), navigate("/settings/site-theme"))}
            >
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa giao diện" />
            </Popconfirm>
          )}
          {dirty && <Button onClick={reload}>Hủy thay đổi</Button>}
          <Button disabled={!dirty} loading={saving === "draft"} onClick={() => run("draft")}>
            Lưu nháp
          </Button>
          <Button type="primary" disabled={!dirty && !theme.draft} loading={saving === "publish"} onClick={publish}>
            Lưu và đăng lên web
          </Button>
        </Flex>
      </Flex>

      {!theme.isDefault && (
        <Flex vertical gap={8} style={{ background: "#fff", borderRadius: 12, padding: 20 }}>
          <Typography.Text strong>Dùng cho concept</Typography.Text>
          <Select
            mode="multiple"
            aria-label="Dùng cho concept"
            placeholder="Chọn concept (dịp lễ)"
            value={conceptIds}
            onChange={(v: string[]) => change({ ...data, conceptIds: v })}
            optionFilterProp="search"
            options={concepts.items.map((c) => {
              const taken = owner.get(c.id);
              const season = seasonLabels[seasonOf(c)];
              return {
                value: c.id,
                search: c.name.vi,
                disabled: !!taken,
                label: (
                  <Flex gap={6} align="center">
                    {c.name.vi}
                    <Tag color={season.color} style={{ marginInlineEnd: 0, fontSize: 11 }}>
                      {c.hidden ? "Đang ẩn" : season.label}
                    </Tag>
                    {taken && (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        · thuộc "{taken}"
                      </Typography.Text>
                    )}
                  </Flex>
                ),
              };
            })}
          />
          {plan && <Alert type={plan.off ? "warning" : plan.now ? "success" : "info"} showIcon message={plan.text} />}
        </Flex>
      )}
      {!theme.isDefault && !themes.base.published && (
        <Alert
          type="warning"
          showIcon
          message="Mặc định chưa đăng — ô để trống ở đây sẽ lấy nội dung có sẵn của web."
          action={
            <Button size="small" onClick={() => navigate(`/settings/site-theme/${themes.base.id}`)}>
              Mở Mặc định
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ThemeForm key={`${theme.id}-${version}`} part={data} isBase={theme.isDefault} fallback={theme.isDefault ? {} : base} onChange={setPart} />
        </Col>
        <Col xs={24} xl={10}>
          <div style={{ position: "sticky", top: 80, background: "#fff", borderRadius: 12, padding: 20 }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Xem trước trang chủ
            </Typography.Title>
            <SitePreview theme={theme.isDefault ? merged(data) : merged(base, data)} />
          </div>
        </Col>
      </Row>
    </Flex>
  );
}
