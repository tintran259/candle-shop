import { useMemo } from "react";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useInventory } from "@/hooks/use-inventory";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { toMap } from "@/lib/inventory/stock";
import { availableMap, heldNeeds } from "@/lib/orders/materials";

// Số giữ tính từ đơn nên không lưu riêng. map: tồn thực tế; available: tồn trừ phần đang giữ
export function useStockHold() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const { config } = useCraftConfig();
  const { materials } = useInventory();
  return useMemo(() => {
    const map = toMap(materials);
    const source = { config, map, products };
    const held = heldNeeds(orders, source);
    return { source, map, held, available: availableMap(map, held) };
  }, [orders, products, config, materials]);
}
