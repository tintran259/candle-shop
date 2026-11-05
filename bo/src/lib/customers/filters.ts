import dayjs from "dayjs";
import { phoneKey, segmentMeta, type CustomerRow, type Segment } from "@/lib/customers/stats";
import { formatMoney } from "@/lib/format";
import { fold } from "@/lib/search";
import { downloadXlsx } from "@/lib/xlsx";

export type CustomerFilters = {
  q: string;
  segment: Segment | "all" | "blocked";
  account: "all" | "account" | "guest";
  tag?: string;
  sort: "recent" | "spent" | "orders" | "newest";
};

export const defaultCustomerFilters: CustomerFilters = { q: "", segment: "all", account: "all", sort: "recent" };

export const sortOptions: { value: CustomerFilters["sort"]; label: string }[] = [
  { value: "recent", label: "Mua gần đây" },
  { value: "spent", label: "Chi nhiều nhất" },
  { value: "orders", label: "Nhiều đơn nhất" },
  { value: "newest", label: "Mới tham gia" },
];

// Tìm theo tên (không dấu), email hoặc từ 3 số điện thoại
export function applyCustomerFilters(rows: CustomerRow[], f: CustomerFilters) {
  const q = fold(f.q.trim());
  const qDigits = phoneKey(f.q);
  return rows
    .filter(({ customer: c, stats }) => {
      if (f.segment === "blocked") return c.blocked;
      return f.segment === "all" || stats.segment === f.segment;
    })
    .filter(({ customer: c }) => f.account === "all" || (f.account === "account") === c.hasAccount)
    .filter(({ customer: c }) => !f.tag || c.tags.includes(f.tag))
    .filter(({ customer: c }) => !q || fold(c.name).includes(q) || fold(c.email).includes(q) || (qDigits.length >= 3 && phoneKey(c.phone).includes(qDigits)))
    .sort((a, b) => {
      if (f.sort === "spent") return b.stats.spent - a.stats.spent;
      if (f.sort === "orders") return b.stats.orderCount - a.stats.orderCount;
      if (f.sort === "newest") return b.customer.createdAt.localeCompare(a.customer.createdAt);
      // Mua gần đây: khách chưa mua xuống cuối
      return (b.stats.lastOrderAt ?? "").localeCompare(a.stats.lastOrderAt ?? "");
    });
}

// Xuất danh sách đang lọc ra Excel
export function exportCustomersXlsx(rows: CustomerRow[]) {
  downloadXlsx(`khach-hang-${dayjs().format("YYYY-MM-DD")}`, [
    {
      name: "Khách hàng",
      columns: [
        { header: "Tên", width: 24 },
        { header: "Số điện thoại", width: 14 },
        { header: "Email", width: 26 },
        { header: "Nhóm", width: 14 },
        { header: "Số đơn", format: "number", width: 9 },
        { header: "Đã chi", format: "money", width: 14 },
        { header: "Đơn gần nhất", format: "date", width: 14 },
        { header: "Tài khoản", width: 11 },
        { header: "Nhận ưu đãi", width: 12 },
        { header: "Nhãn", width: 20 },
        { header: "Ghi chú", width: 30 },
      ],
      rows: rows.map(({ customer: c, stats: s }) => [
        c.name,
        c.phone,
        c.email,
        c.blocked ? "Đã chặn" : segmentMeta[s.segment].label,
        s.orderCount,
        s.spent,
        s.lastOrderAt ? new Date(s.lastOrderAt) : undefined,
        c.hasAccount ? "Có" : "Vãng lai",
        c.newsletter ? "Có" : "Không",
        c.tags.join(", "),
        c.note,
      ]),
    },
  ]);
}

export const spentText = (n: number) => (n ? formatMoney(n) : "—");
