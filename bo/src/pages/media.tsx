import { DeleteOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Empty, Flex, Image, Input, Popconfirm, Segmented, Skeleton, Statistic, Switch, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MediaCard } from "@/components/media/media-card";
import { api, ApiError } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { folderLabels, formatBytes, type MediaFolder, type MediaImage } from "@/lib/media";
import { fold } from "@/lib/search";
import { useTitle } from "@/lib/use-title";

type Filter = "all" | MediaFolder;

// Cài đặt › Kho ảnh (docs/pages/media.md): mọi ảnh trên Cloudinary (thư mục candle2510/), lọc thư mục, tìm theo tên,
// biết ảnh đang dùng ở đâu; chọn ảnh không dùng để xóa (BE kiểm tra lại, ảnh đang dùng thì từ chối)
export function MediaPage() {
  useTitle("Kho ảnh");
  const { message } = App.useApp();
  const [items, setItems] = useState<MediaImage[] | null>(null);
  const [error, setError] = useState<{ status: number; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [onlyUnused, setOnlyUnused] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(
    () =>
      api<MediaImage[]>("GET", "/admin/media").then(
        (list) => (setItems(list), setError(null)),
        (e: unknown) => setError({ status: e instanceof ApiError ? e.status : 0, text: e instanceof Error ? e.message : "Không tải được kho ảnh." }),
      ),
    [],
  );
  const load = () => {
    setLoading(true);
    void fetchAll().finally(() => setLoading(false));
  };
  useEffect(() => {
    if (REMOTE) void fetchAll();
  }, [fetchAll]);

  const all = useMemo(() => items ?? [], [items]);
  const unused = all.filter((i) => !i.usedIn.length);
  const shown = useMemo(() => {
    const q = fold(query.trim());
    return all.filter((i) => (filter === "all" || i.folder === filter) && (!onlyUnused || !i.usedIn.length) && (!q || fold(`${i.name} ${i.usedIn.join(" ")}`).includes(q)));
  }, [all, filter, onlyUnused, query]);
  const shownUnused = shown.filter((i) => !i.usedIn.length);
  const counts = (f: Filter) => (f === "all" ? all.length : all.filter((i) => i.folder === f).length);

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const remove = async () => {
    const ids = [...selected];
    setDeleting(true);
    try {
      const { deleted } = await api<{ deleted: string[] }>("POST", "/admin/media/delete", { publicIds: ids });
      message.success(`Đã xóa ${deleted.length} ảnh khỏi Cloudinary.`);
      setItems((list) => list?.filter((i) => !deleted.includes(i.publicId)) ?? null);
      setSelected(new Set());
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không xóa được ảnh.");
      void load();
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <Flex justify="space-between" align="flex-end" wrap gap={16}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Kho ảnh
        </Typography.Title>
        <Typography.Text type="secondary">Mọi ảnh đã tải lên Cloudinary: xem ảnh đang dùng ở đâu, dọn ảnh không còn dùng cho nhẹ kho.</Typography.Text>
      </div>
      {REMOTE && (
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
          Tải lại
        </Button>
      )}
    </Flex>
  );

  if (!REMOTE)
    return (
      <Flex vertical gap={16}>
        {header}
        <Alert type="info" showIcon message="Kho ảnh chỉ có khi BO dùng BE (đang chạy chế độ dữ liệu trên trình duyệt)." />
      </Flex>
    );

  if (error)
    return (
      <Flex vertical gap={16}>
        {header}
        <Alert
          type={error.status === 503 ? "info" : "error"}
          showIcon
          message={error.status === 503 ? "Chưa cấu hình kho ảnh (Cloudinary)" : error.text}
          description={error.status === 503 ? "Ảnh đang lưu tạm trong DB. Cấu hình CLOUDINARY_* cho BE theo docs/backend.md#kho-ảnh-cloudinary." : undefined}
        />
      </Flex>
    );

  return (
    <Flex vertical gap={16}>
      {header}

      <div className="media-stats">
        <Card size="small">
          <Statistic title="Tổng ảnh" value={all.length} loading={!items} />
        </Card>
        <Card size="small">
          <Statistic title="Dung lượng" value={formatBytes(all.reduce((s, i) => s + i.bytes, 0))} loading={!items} />
        </Card>
        <Card size="small">
          <Statistic title="Ảnh không dùng" value={unused.length} suffix={unused.length ? <span className="media-stat-sub">({formatBytes(unused.reduce((s, i) => s + i.bytes, 0))})</span> : undefined} loading={!items} />
        </Card>
      </div>

      <Card styles={{ body: { padding: 12 } }}>
        <Flex vertical gap={12}>
          <div className="media-filter">
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={(["all", "products", "craft", "orders", "site", "misc"] as const).map((f) => ({ value: f, label: `${f === "all" ? "Tất cả" : folderLabels[f]} (${counts(f)})` }))}
            />
          </div>
          <Flex gap={12} wrap align="center">
            <Input allowClear prefix={<SearchOutlined />} placeholder="Tên ảnh hoặc nơi dùng" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: "1 1 220px", maxWidth: 360 }} />
            <Flex gap={8} align="center">
              <Switch size="small" checked={onlyUnused} onChange={setOnlyUnused} id="media-unused" />
              <label htmlFor="media-unused">Chỉ ảnh không dùng</label>
            </Flex>
            <Flex gap={8} align="center" wrap style={{ marginLeft: "auto" }}>
              {shownUnused.length > 0 && (
                <Button onClick={() => setSelected(selected.size === shownUnused.length ? new Set() : new Set(shownUnused.map((i) => i.publicId)))}>
                  {selected.size === shownUnused.length ? "Bỏ chọn" : `Chọn ${shownUnused.length} ảnh không dùng`}
                </Button>
              )}
              <Popconfirm
                title={`Xóa ${selected.size} ảnh khỏi Cloudinary?`}
                description="Ảnh không còn dùng ở đâu. Xóa rồi không khôi phục được."
                okText="Xóa"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                onConfirm={remove}
                disabled={!selected.size}
              >
                <Button danger icon={<DeleteOutlined />} disabled={!selected.size} loading={deleting}>
                  Xóa {selected.size || ""} ảnh
                </Button>
              </Popconfirm>
            </Flex>
          </Flex>

          {!items ? (
            <div className="media-grid">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton.Node key={i} active style={{ width: "100%", height: 220 }} />
              ))}
            </div>
          ) : shown.length ? (
            <Image.PreviewGroup>
              <div className="media-grid">
                {shown.map((img) => (
                  <MediaCard key={img.publicId} img={img} selected={selected.has(img.publicId)} onSelect={(on) => toggle(img.publicId, on)} />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <Empty description={all.length ? "Không có ảnh khớp bộ lọc." : "Chưa có ảnh nào trên Cloudinary."} />
          )}
        </Flex>
      </Card>
    </Flex>
  );
}
