/** Bỏ dấu + chữ thường để "nuoc hoa" khớp "Nước hoa" */
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

/** Mọi từ trong query đều phải xuất hiện trong chuỗi */
export const matches = (haystack: string, query: string) => {
  const h = normalize(haystack);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => h.includes(word));
};

const RECENT_KEY = "scandleted-recent-searches";

export function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecent(query: string) {
  const q = query.trim();
  if (!q) return;
  try {
    const next = [q, ...readRecent().filter((r) => normalize(r) !== normalize(q))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage bị chặn (chế độ riêng tư) → bỏ qua
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // bỏ qua
  }
}
