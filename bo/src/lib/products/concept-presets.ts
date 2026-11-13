// Concept dịp lễ thường có — trang Concept › "Thêm concept lễ" tạo nhanh, kèm thời gian bán gợi ý của mùa sắp tới (giờ VN, sửa lại được):
// Noel 01/12 → 26/12, Valentine 01/02 → 14/02, Tết (âm lịch) 30 ngày trước mùng 1 → mùng 7.
// Bỏ qua concept đã có (trùng id hoặc trùng tên)
import type { Concept } from "@/lib/products/concepts";
import { todayVN } from "@/lib/products/concepts";

// Mùng 1 Tết (dương lịch) — thêm năm khi gần hết bảng
const TET = ["2027-02-06", "2028-01-26", "2029-02-13", "2030-02-03", "2031-01-23", "2032-02-11", "2033-01-31", "2034-02-19", "2035-02-08"];

const addDays = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

// Mùa hằng năm (tháng-ngày): năm nay nếu chưa hết mùa, không thì năm sau
function yearly(start: string, end: string, today: string) {
  const year = Number(today.slice(0, 4));
  const y = today <= `${year}-${end}` ? year : year + 1;
  return { startsOn: `${y}-${start}`, endsOn: `${y}-${end}` };
}

function tet(today: string) {
  const day = TET.find((d) => today <= addDays(d, 6));
  return day ? { startsOn: addDays(day, -30), endsOn: addDays(day, 6) } : {};
}

export function conceptPresets(today = todayVN()): Concept[] {
  return [
    { id: "noel", name: { vi: "Noel", en: "Christmas" }, color: "red", hidden: false, ...yearly("12-01", "12-26", today) },
    { id: "tet", name: { vi: "Tết", en: "Lunar New Year" }, color: "gold", hidden: false, ...tet(today) },
    { id: "valentine", name: { vi: "Valentine", en: "Valentine's Day" }, color: "magenta", hidden: false, ...yearly("02-01", "02-14", today) },
  ];
}

const norm = (s: string) => s.trim().toLocaleLowerCase("vi");

// Concept lễ chưa có trong danh sách hiện tại
export function missingPresets(existing: Concept[], today = todayVN()) {
  return conceptPresets(today).filter((p) => !existing.some((c) => c.id === p.id || norm(c.name.vi) === norm(p.name.vi)));
}
