import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Flex, Form, Grid, Input, Modal, Popconfirm, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { CategoriesSkeleton } from "@/components/skeletons";
import { useConcepts } from "@/hooks/use-concepts";
import { useSiteThemes } from "@/hooks/use-site-themes";
import { seasonOf } from "@/lib/products/concepts";
import { scheduleLines, themeState } from "@/lib/site-theme/schedule";
import { heldConcepts, LIMITS, liveTheme, type SiteTheme } from "@/lib/site-theme/types";
import { useTitle } from "@/lib/use-title";

// Cài đặt › Giao diện web (docs/pages/site-theme.md): danh sách giao diện — Mặc định + giao diện theo concept (dịp lễ).
// Bấm tên để mở trang chi tiết sửa thông báo / logo / hero; mỗi giao diện lưu nháp và đăng riêng
export function SiteThemesPage() {
  useTitle("Giao diện web");
  const { message } = App.useApp();
  const navigate = useNavigate();
  const themes = useSiteThemes();
  const concepts = useConcepts();
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm<{ name: string }>();
  const screens = Grid.useBreakpoint();

  if (themes.loading || concepts.loading) return <CategoriesSkeleton />;

  const live = liveTheme(themes.items, concepts.items);
  const add = ({ name }: { name: string }) => {
    const id = themes.create(name);
    setAdding(false);
    navigate(`/settings/site-theme/${id}`);
  };

  const conceptTags = (t: SiteTheme) => {
    if (t.isDefault)
      return (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Khi không có dịp nào
        </Typography.Text>
      );
    const ids = [...heldConcepts(t)].filter((id) => concepts.byId.has(id));
    if (!ids.length) return <Typography.Text type="warning">Chưa gắn concept</Typography.Text>;
    return (
      <Flex gap={4} wrap>
        {ids.map((id) => {
          const c = concepts.byId.get(id)!;
          return (
            <Tag key={id} color={c.color} style={{ marginInlineEnd: 0 }}>
              {c.name.vi}
              {c.hidden ? " · đang ẩn" : seasonOf(c) === "ended" ? " · đã kết thúc" : ""}
            </Tag>
          );
        })}
      </Flex>
    );
  };

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-end" wrap gap={16}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Giao diện web
          </Typography.Title>
          <Typography.Text type="secondary">
            Thanh thông báo, logo và hero của trang chủ. Thêm giao diện cho từng dịp (Noel, Tết…) và gắn concept — web tự dùng khi concept đang trong mùa, hết mùa quay về Mặc định.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => (form.resetFields(), setAdding(true))}>
          Thêm giao diện
        </Button>
      </Flex>

      <Alert
        type="info"
        showIcon
        message={live ? `Web đang sử dụng giao diện "${live.theme.name}" (concept ${live.concept.name.vi} đang trong mùa).` : `Web đang sử dụng giao diện "${themes.base.name}".`}
      />

      <Card styles={{ body: { padding: 12 } }}>
        <Table<SiteTheme>
          rowKey="id"
          dataSource={themes.items}
          pagination={false}
          columns={[
            {
              title: "Giao diện",
              key: "name",
              render: (_, t) => (
                <Flex vertical gap={2}>
                  <Flex gap={6} align="center" wrap>
                    <Link to={`/settings/site-theme/${t.id}`} style={{ fontWeight: 600 }}>
                      {t.name}
                    </Link>
                  </Flex>
                  {!screens.md && conceptTags(t)}
                </Flex>
              ),
            },
            { title: "Dùng cho concept", key: "concepts", responsive: ["md"], render: (_, t) => conceptTags(t) },
            {
              title: "Trạng thái",
              key: "status",
              render: (_, t) => {
                const s = themeState(t, themes.items, concepts.items);
                return (
                  <Tag color={s.color} style={{ marginInlineEnd: 0 }}>
                    {s.label}
                  </Tag>
                );
              },
            },
            {
              title: "Thời gian áp dụng",
              key: "schedule",
              responsive: ["sm"],
              render: (_, t) => {
                const lines = scheduleLines(t, concepts.byId);
                if (!lines.length) return <Typography.Text type="secondary">—</Typography.Text>;
                return (
                  <Flex vertical>
                    {lines.map((l) => (
                      <Typography.Text key={l} type={l === "Hết mùa" ? "secondary" : undefined} style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                        {l}
                      </Typography.Text>
                    ))}
                  </Flex>
                );
              },
            },
            {
              title: "",
              key: "actions",
              // Điện thoại: xóa ở trang chi tiết
              responsive: ["md"],
              width: 56,
              render: (_, t) =>
                !t.isDefault && (
                  <Popconfirm
                    title={`Xóa giao diện "${t.name}"?`}
                    description={t.published ? "Giao diện đang đăng — web sẽ không dùng nữa." : undefined}
                    okText="Xóa"
                    okButtonProps={{ danger: true }}
                    cancelText="Hủy"
                    onConfirm={() => (themes.remove(t.id), message.success("Đã xóa giao diện"))}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${t.name}`} />
                  </Popconfirm>
                ),
            },
          ]}
        />
      </Card>

      <Modal open={adding} title="Thêm giao diện" okText="Thêm và sửa" cancelText="Hủy" onCancel={() => setAdding(false)} onOk={() => form.submit()} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={add} requiredMark={false}>
          <Form.Item
            name="name"
            label="Tên giao diện"
            extra="Ví dụ: Giáng sinh 2026, Tết Bính Ngọ. Chọn concept áp dụng ở trang chi tiết."
            rules={[{ required: true, whitespace: true, message: "Nhập tên giao diện." }]}
            style={{ marginBottom: 0 }}
          >
            <Input maxLength={LIMITS.name} autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
