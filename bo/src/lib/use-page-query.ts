import { useEffect } from "react";
import { useSearchParams } from "react-router";

export const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_LIMIT = 10;

const toInt = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

// Phân trang lưu trên URL (?page=2&limit=20): tải lại trang, gửi link hay bấm Back đều giữ đúng trang.
// Các tham số khác trên URL (vd ?order=, ?tab=) được giữ nguyên.
// total: tổng số dòng (khi dữ liệu đã tải xong) — để sửa URL khi page vượt quá trang cuối.
export function usePageQuery(total?: number) {
  const [params, setParams] = useSearchParams();
  const rawLimit = toInt(params.get("limit"));
  const limit = (PAGE_SIZES as readonly number[]).includes(rawLimit) ? rawLimit : DEFAULT_LIMIT;
  const requested = Math.max(1, toInt(params.get("page")) || 1);
  const page = total === undefined ? requested : Math.min(requested, Math.max(1, Math.ceil(total / limit)));

  // Luôn hiện page/limit trên URL (và sửa giá trị sai) — thay thế lịch sử, không tạo bước Back mới
  const normalized = params.get("page") === String(page) && params.get("limit") === String(limit);
  useEffect(() => {
    if (normalized) return;
    setParams(
      (p) => {
        p.set("page", String(page));
        p.set("limit", String(limit));
        return p;
      },
      { replace: true },
    );
  }, [normalized, page, limit, setParams]);

  // extra: các tham số khác cần đổi cùng lúc (vd đổi tab thì về trang 1) — gộp vào một lần cập nhật URL
  const go = (nextPage: number, nextLimit = limit, extra?: Record<string, string | null>) =>
    setParams(
      (p) => {
        p.set("page", String(nextPage));
        p.set("limit", String(nextLimit));
        for (const [k, v] of Object.entries(extra ?? {})) {
          if (v === null) p.delete(k);
          else p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );

  // Cắt danh sách theo trang; trang vượt quá thì lùi về trang cuối
  const paginate = <T,>(items: T[]) => {
    const pages = Math.max(1, Math.ceil(items.length / limit));
    const current = Math.min(page, pages);
    return { current, pageItems: items.slice((current - 1) * limit, current * limit) };
  };

  // Props cho Table/Pagination của antd. Đổi số dòng mỗi trang thì quay về trang 1
  const paginationProps = (total: number, unit = "mục") => ({
    current: Math.min(page, Math.max(1, Math.ceil(total / limit))),
    pageSize: limit,
    total,
    showSizeChanger: true,
    pageSizeOptions: PAGE_SIZES.map(String),
    hideOnSinglePage: false,
    showTotal: (t: number, [from, to]: [number, number]) => `${from}–${to} / ${t} ${unit}`,
    onChange: (p: number, size: number) => go(size !== limit ? 1 : p, size),
  });

  return { page, limit, go, paginate, paginationProps, resetPage: () => go(1) };
}
