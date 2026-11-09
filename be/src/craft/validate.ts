// Kiểm tra cấu trúc cấu hình Thủ công (hợp đồng dữ liệu ở bo/src/lib/craft/types.ts, docs/craft-builder.md).
// Chỉ chặn dữ liệu hỏng — quy tắc giá, tồn kho, lượng tiêu hao do BO và web tính
type J = Record<string, unknown>;

const KINDS = ['vessel', 'cards', 'swatches', 'blend', 'inputs'];
const isObj = (v: unknown): v is J => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const money = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const named = (v: unknown) => isObj(v) && text(v.vi) && typeof v.en === 'string';

// Trùng id trong một danh sách
const dupId = (list: J[]) => {
  const ids = list.map((x) => String(x.id));
  return ids.find((id, i) => ids.indexOf(id) !== i);
};

function checkOption(o: unknown, where: string, vessel: boolean): string | null {
  if (!isObj(o) || !text(o.id, 60)) return `${where}: lựa chọn thiếu id.`;
  const at = `${where} › ${String(o.id)}`;
  if (!named(o.name)) return `${at}: thiếu tên.`;
  if (!money(o.priceDelta)) return `${at}: phụ thu phải là số ≥ 0.`;
  if (o.unitPrice !== undefined && !money(o.unitPrice)) return `${at}: giá theo lượng phải là số ≥ 0.`;
  if (typeof o.available !== 'boolean') return `${at}: thiếu trạng thái đang bán.`;
  if (!vessel) return null;
  if (!Array.isArray(o.sizes) || !o.sizes.length) return `${at}: hũ cần ít nhất một cỡ.`;
  const sizes = o.sizes as J[];
  if (sizes.some((s) => !isObj(s) || !text(s.id, 60) || !(Number(s.ml) > 0) || !(Number(s.grams) > 0) || !money(s.priceDelta))) return `${at}: cỡ hũ cần id, dung tích, lượng sáp và phụ thu.`;
  if (dupId(sizes)) return `${at}: cỡ ${String(dupId(sizes))} bị trùng.`;
  return null;
}

function checkStep(s: unknown, i: number): string | null {
  if (!isObj(s) || !text(s.id, 60)) return `Bước ${i + 1} thiếu id.`;
  const at = `Bước ${String(s.id)}`;
  if (!KINDS.includes(s.kind as string)) return `${at}: kiểu bước không hợp lệ.`;
  if (!named(s.title)) return `${at}: thiếu tên bước.`;
  if (typeof s.enabled !== 'boolean' || typeof s.required !== 'boolean') return `${at}: thiếu bật / bắt buộc.`;
  if (s.kind === 'inputs') {
    if (!Array.isArray(s.fields) || !Array.isArray(s.addons)) return `${at}: thiếu ô nhập / tuỳ chọn thêm.`;
    const fields = s.fields as J[];
    const addons = s.addons as J[];
    if (fields.some((f) => !isObj(f) || !text(f.id, 60) || !named(f.label) || !money(f.priceDelta) || !(Number(f.maxLength) > 0))) return `${at}: ô nhập cần id, nhãn, số ký tự tối đa, phụ thu.`;
    if (addons.some((a) => !isObj(a) || !text(a.id, 60) || !named(a.name) || !money(a.priceDelta))) return `${at}: tuỳ chọn thêm cần id, tên, phụ thu.`;
    if (dupId(fields) || dupId(addons)) return `${at}: id ô nhập / tuỳ chọn thêm bị trùng.`;
    return null;
  }
  if (!Array.isArray(s.options)) return `${at}: thiếu danh sách lựa chọn.`;
  for (const o of s.options) {
    const err = checkOption(o, at, s.kind === 'vessel');
    if (err) return err;
  }
  if (dupId(s.options as J[])) return `${at}: lựa chọn ${String(dupId(s.options as J[]))} bị trùng id.`;
  return null;
}

// null = hợp lệ
export function craftError(c: unknown): string | null {
  if (!isObj(c)) return 'Cấu hình phải là một đối tượng.';
  if (c.version !== 1) return 'Phiên bản cấu hình không hỗ trợ (cần version 1).';
  if (c.currency !== 'VND') return 'Tiền tệ phải là VND.';
  if (!Array.isArray(c.steps)) return 'Thiếu danh sách bước.';
  for (const [i, s] of c.steps.entries()) {
    const err = checkStep(s, i);
    if (err) return err;
  }
  const dup = dupId(c.steps as J[]);
  return dup ? `Bước ${String(dup)} bị trùng id.` : null;
}

// Mọi nguyên liệu cấu hình đang trỏ tới (lựa chọn, cỡ hũ, nắp, ô nhập, tuỳ chọn thêm)
export function materialIds(c: unknown, out = new Set<string>()) {
  if (Array.isArray(c)) for (const x of c) materialIds(x, out);
  else if (isObj(c))
    for (const [k, v] of Object.entries(c)) {
      if ((k === 'materialId' || k === 'lidMaterialId') && typeof v === 'string' && v) out.add(v);
      else materialIds(v, out);
    }
  return out;
}
