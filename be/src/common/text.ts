// Chuỗi dùng chung: bỏ dấu tiếng Việt, tạo id dạng slug, so khóa số điện thoại

// "Nước Hoa Đặc Biệt" → "nuoc hoa dac biet"
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

// "Nước Hoa" → "nuoc-hoa"
export const slugify = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// id slug không trùng: thêm -2, -3… khi đã có
export function uniqueSlug(base: string, taken: Set<string>, fallback = 'muc') {
  const root = slugify(base) || fallback;
  let id = root;
  for (let i = 2; taken.has(id); i++) id = `${root}-${i}`;
  return id;
}

// So số điện thoại theo chữ số (bỏ khoảng trắng, dấu chấm)
export const phoneKey = (s: string) => s.replace(/\D/g, '');
