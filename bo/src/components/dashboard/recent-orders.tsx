import Link from "next/link";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatMoney } from "@/lib/format";
import { recentOrders, type OrderStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";

// Màu trạng thái luôn đi kèm chữ, không dùng màu đơn thuần
export const orderStatus: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  paid: { label: "Đã thanh toán", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  shipping: { label: "Đang giao", className: "bg-violet-50 text-violet-800 ring-violet-200" },
  completed: { label: "Hoàn tất", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  cancelled: { label: "Đã hủy", className: "bg-stone-100 text-stone-600 ring-stone-200" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = orderStatus[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", s.className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}

export function RecentOrders() {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Đơn hàng gần đây</CardTitle>
        <CardDescription>{recentOrders.length} đơn mới nhất</CardDescription>
        <CardAction>
          <Link href="/orders" className="text-sm font-medium text-ember underline-offset-4 hover:underline">
            Xem tất cả
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead className="hidden md:table-cell">Thời gian</TableHead>
              <TableHead className="hidden sm:table-cell">Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Tổng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((o) => (
              <TableRow key={o.code}>
                <TableCell className="font-medium tabular-nums">{o.code}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{o.customer}</span>
                    <span className="text-xs text-muted-foreground">{o.items} sản phẩm</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                  {formatDateTime(o.createdAt)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{o.payment}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatMoney(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
