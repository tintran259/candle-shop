// Đọc file .xlsx do BO xuất (zip dạng store, ô chữ inline) để kiểm tra nội dung trong test
const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

function unzip(buf: Buffer) {
  const files = new Map<string, string>();
  let i = 0;
  while (buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8);
    const size = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extra = buf.readUInt16LE(i + 28);
    const name = buf.toString("utf8", i + 30, i + 30 + nameLen);
    const start = i + 30 + nameLen + extra;
    if (method !== 0) throw new Error(`${name}: chỉ đọc được zip không nén`);
    files.set(name, buf.toString("utf8", start, start + size));
    i = start + size;
  }
  return files;
}

// Mỗi trang tính: tên và các dòng (ô trống = ""), số giữ dạng chuỗi
export function readXlsx(buf: Buffer) {
  const files = unzip(buf);
  const names = [...(files.get("xl/workbook.xml") ?? "").matchAll(/<sheet name="([^"]*)"/g)].map((m) => unescape(m[1]));
  return names.map((name, k) => {
    const xml = files.get(`xl/worksheets/sheet${k + 1}.xml`) ?? "";
    const rows = [...xml.matchAll(/<row [^>]*>(.*?)<\/row>/g)].map((r) => {
      const cells: string[] = [];
      for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"[^>]*>(?:<is><t[^>]*>(.*?)<\/t><\/is>|<v>(.*?)<\/v>)<\/c>/g)) {
        const col = [...c[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
        cells[col] = unescape(c[2] ?? c[3] ?? "");
      }
      return Array.from(cells, (v) => v ?? "");
    });
    return { name, rows, xml };
  });
}
