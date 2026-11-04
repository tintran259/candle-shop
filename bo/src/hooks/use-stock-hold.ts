import { useMemo } from "react";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { toMap } from "@/lib/inventory/stock";
import { availableMap, heldNeeds } from "@/lib/orders/materials";

// Số giữ tính từ đơn nên không lưu riêng. map: tồn thực tế; available: tồn trừ phần đang giữ.
// excludeId: đơn đang sửa — phần nó đang giữ được tính là còn dùng được cho chính nó
export function useStockHold(excludeId?: string) {
  const { orders } = useOrders();
  const { products } = useProducts();
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  return useMemo(() => {
    const map = toMap(materials);
    const source = { config, map, products };
    const held = heldNeeds(excludeId ? orders.filter((o) => o.id !== excludeId) : orders, source);
    return { source, map, held, available: availableMap(map, held) };
  }, [orders, products, config, materials, excludeId]);
}
