import { useMemo } from "react";
import { useOrders } from "@/hooks/use-orders";
import { useSettings } from "@/hooks/use-settings";
import { dayLoad, productionLoad, suggestReadyDate } from "@/lib/capacity";

// Số cây xưởng đã nhận theo ngày làm xong (trừ đơn đang sửa) + công suất trong Cài đặt › Xưởng
export function useWorkshop(excludeId?: string) {
  const { orders } = useOrders();
  const { settings } = useSettings();
  const load = useMemo(() => productionLoad(orders, excludeId), [orders, excludeId]);
  const opts = { capacity: settings.dailyCapacity, leadDays: settings.leadDays };
  return {
    load,
    ...opts,
    at: (date: string, adding = 0) => dayLoad(load, date, opts.capacity, adding),
    suggest: (candles: number) => suggestReadyDate(load, candles, opts),
  };
}

export type Workshop = ReturnType<typeof useWorkshop>;
