import { TriangleAlertIcon } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/lib/format";
import { topProducts } from "@/lib/mock";

const LOW_STOCK = 10;

export function TopProducts() {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Sản phẩm bán chạy</CardTitle>
        <CardDescription>Theo số lượng bán, 30 ngày qua</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {topProducts.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-4 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
              <Image src={p.image} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{p.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {formatNumber(p.sold)} đã bán
                  {p.stock < LOW_STOCK && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">
                      <TriangleAlertIcon className="size-3" aria-hidden />
                      Còn {p.stock}
                    </span>
                  )}
                </span>
              </div>
              <span className="font-semibold tabular-nums">{formatMoney(p.revenue)}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
