import { useMemo } from "react";
import { api } from "@/lib/api";
import { uploadImages } from "@/lib/craft/image";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { compact, DEFAULT_THEME, defaultTheme, type SiteTheme, type ThemeContent } from "@/lib/site-theme/types";

// Giao diện web: /api/admin/site-themes (docs/api.md#giao-diện-web). Danh sách, mỗi giao diện có bản nháp + bản đã đăng; BE trả cả danh sách sau mỗi thao tác
const PATH = "/admin/site-themes";
const store = createLocalStore<SiteTheme[]>("bo-site-themes-v1", [defaultTheme()], undefined, () => api<SiteTheme[]>("GET", PATH));
const replaceAll = (saved: SiteTheme[]) => () => saved;
const update = (id: string, change: (t: SiteTheme) => Partial<SiteTheme>) => store.get().map((t) => (t.id === id ? { ...t, ...change(t), updatedAt: new Date().toISOString() } : t));

// Tải ảnh mới chọn (data URL) lên kho ảnh trước khi lưu; trả nội dung đã thay đường dẫn ảnh
async function withUploadedImages(content: ThemeContent): Promise<ThemeContent> {
  const next = structuredClone(compact(content));
  const slots: { get: () => string | undefined; set: (v: string) => void }[] = [];
  if (next.hero?.image) slots.push({ get: () => next.hero!.image, set: (v) => (next.hero!.image = v) });
  for (const k of ["light", "dark"] as const) if (next.logo?.[k]) slots.push({ get: () => next.logo![k], set: (v) => (next.logo![k] = v) });
  // Ảnh các khối trang chủ (Câu chuyện, Nghệ thuật đốt nến, Gửi lời nhắn, chân trang)
  for (const k of ["story", "care", "contact", "footer"] as const) {
    const block = next[k];
    if (block?.image) slots.push({ get: () => block.image, set: (v) => (block.image = v) });
  }
  const uploaded = await uploadImages(
    slots.map((s) => s.get()!),
    "site",
  );
  slots.forEach((s, i) => s.set(uploaded[i]));
  return next;
}

// Mặc định không gắn concept; giao diện khác không có công tắc thông báo (như BE)
const clean = (id: string, c: ThemeContent): ThemeContent => {
  const { announcementOn, conceptIds, ...part } = c;
  return id === DEFAULT_THEME ? { ...part, ...(announcementOn !== undefined && { announcementOn }) } : { ...part, conceptIds: conceptIds ?? [] };
};

const newId = () => `theme-${Math.random().toString(36).slice(2, 10)}`;

const create = (name: string) => {
  const id = newId();
  const now = new Date().toISOString();
  store.sync([...store.get(), { id, name: name.trim(), isDefault: false, published: null, draft: null, publishedAt: null, updatedAt: now }], async () =>
    replaceAll(await api<SiteTheme[]>("POST", PATH, { id, name: name.trim() })),
  );
  return id;
};

const rename = (id: string, name: string) =>
  store.sync(
    update(id, () => ({ name: name.trim() })),
    async () => replaceAll(await api<SiteTheme[]>("PATCH", `${PATH}/${id}`, { name: name.trim() })),
  );

const remove = (id: string) =>
  store.sync(
    store.get().filter((t) => t.id !== id),
    async () => replaceAll(await api<SiteTheme[]>("DELETE", `${PATH}/${id}`)),
  );

const saveDraft = async (id: string, content: ThemeContent) => {
  const draft = clean(id, await withUploadedImages(content));
  store.sync(
    update(id, () => ({ draft })),
    async () => replaceAll(await api<SiteTheme[]>("PUT", `${PATH}/${id}/draft`, draft)),
  );
};

const publish = async (id: string, content: ThemeContent) => {
  const published = clean(id, await withUploadedImages(content));
  store.sync(
    update(id, () => ({ published, draft: null, publishedAt: new Date().toISOString() })),
    async () => replaceAll(await api<SiteTheme[]>("POST", `${PATH}/${id}/publish`, published)),
  );
};

const discardDraft = (id: string) =>
  store.sync(
    update(id, () => ({ draft: null })),
    async () => replaceAll(await api<SiteTheme[]>("DELETE", `${PATH}/${id}/draft`)),
  );

// Gỡ khỏi web: bản đã đăng thành bản nháp (nếu chưa có nháp)
const unpublish = (id: string) =>
  store.sync(
    update(id, (t) => ({ published: null, draft: t.draft ?? t.published, publishedAt: null })),
    async () => replaceAll(await api<SiteTheme[]>("POST", `${PATH}/${id}/unpublish`)),
  );

export function useSiteThemes() {
  const { data, loading } = useLocalStore(store);
  return useMemo(() => {
    // Luôn có Mặc định ở đầu (kho cũ / vừa xóa dữ liệu)
    const items = data.some((t) => t.isDefault) ? data : [defaultTheme(), ...data];
    const byId = new Map(items.map((t) => [t.id, t]));
    return { items, byId, base: byId.get(DEFAULT_THEME)!, loading, create, rename, remove, saveDraft, publish, discardDraft, unpublish };
  }, [data, loading]);
}
