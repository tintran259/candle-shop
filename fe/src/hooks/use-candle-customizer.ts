"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import { defaultConfiguration, findById } from "@/lib/customizer/options";
import { priceBreakdown } from "@/lib/customizer/pricing";
import { configKey, encodeConfiguration, maxQuantity, snapshot } from "@/lib/customizer/snapshot";
import type { CandleConfiguration, CustomizerCatalog, Intensity } from "@/lib/customizer/types";
import { validateConfiguration } from "@/lib/customizer/validation";
import { useCartStore } from "@/stores/cart-store";

type Personal = CandleConfiguration["personalization"];

type Action =
  | { type: "set"; patch: Partial<CandleConfiguration> }
  | { type: "toggleFragrance"; id: string; catalog: CustomizerCatalog }
  | { type: "fragranceWeight"; id: string; weight: number }
  | { type: "personal"; patch: Partial<Personal> };

function reducer(state: CandleConfiguration, action: Action): CandleConfiguration {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "personal":
      return { ...state, personalization: { ...state.personalization, ...action.patch } };
    case "fragranceWeight":
      return {
        ...state,
        fragrances: state.fragrances.map((f) => (f.id === action.id ? { ...f, weight: action.weight } : f)),
      };
    case "toggleFragrance": {
      const { catalog, id } = action;
      const option = findById(catalog.fragrances, id);
      const selected = state.fragrances.some((f) => f.id === id);
      const defaultIntensity: Intensity | null = catalog.intensity ? "medium" : null;
      if (option?.unscented) return { ...state, fragrances: [{ id, weight: 50 }], intensity: null };
      if (selected) {
        return state.fragrances.length > 1 ? { ...state, fragrances: state.fragrances.filter((f) => f.id !== id) } : state;
      }
      const scented = state.fragrances.filter((f) => !findById(catalog.fragrances, f.id)?.unscented);
      // Chỉ cho 1 mùi, hoặc đã đủ số mùi tối đa → thay mùi cuối cùng
      const kept = catalog.maxFragrances <= 1 ? [] : scented.slice(0, catalog.maxFragrances - 1);
      return { ...state, fragrances: [...kept, { id, weight: 50 }], intensity: state.intensity ?? defaultIntensity };
    }
  }
}

export type AddResult = { ok: true; quantity: number } | { ok: false; reason: "invalid" | "stock" | "busy" };

/**
 * Nguồn dữ liệu duy nhất của trang Thủ công: lựa chọn + số lượng.
 * Lỗi hợp lệ, giá ước tính, số lượng tối đa đều tính trực tiếp từ lựa chọn.
 */
export function useCandleCustomizer(catalog: CustomizerCatalog, initial: CandleConfiguration | null, itemName: string) {
  const [config, dispatch] = useReducer(reducer, initial, (init) => init ?? defaultConfiguration(catalog));
  const [quantity, setQuantity] = useReducer((_: number, next: number) => Math.max(1, Math.round(next)), 1);
  const addCraft = useCartStore((s) => s.addCraft);
  const busy = useRef(false);

  const issues = useMemo(() => validateConfiguration(config, catalog), [config, catalog]);
  const price = useMemo(() => priceBreakdown(config, catalog), [config, catalog]);
  const maxQty = useMemo(() => maxQuantity(config, catalog), [config, catalog]);
  const qty = Math.min(quantity, Math.max(maxQty, 1));
  const outOfStock = maxQty < 1;
  const canAdd = issues.length === 0 && !outOfStock;

  const set = useCallback((patch: Partial<CandleConfiguration>) => dispatch({ type: "set", patch }), []);
  const setPersonal = useCallback((patch: Partial<Personal>) => dispatch({ type: "personal", patch }), []);
  const toggleFragrance = useCallback((id: string) => dispatch({ type: "toggleFragrance", id, catalog }), [catalog]);
  const setFragranceWeight = useCallback(
    (id: string, weight: number) => dispatch({ type: "fragranceWeight", id, weight }),
    [],
  );

  // Thêm vào giỏ hiện có (zustand). BE kiểm tra lại cấu hình & giá khi tạo đơn.
  const addToCart = (): AddResult => {
    if (busy.current) return { ok: false, reason: "busy" };
    if (issues.length) return { ok: false, reason: "invalid" };
    if (outOfStock) return { ok: false, reason: "stock" };
    busy.current = true;
    try {
      addCraft({ id: configKey(config), name: itemName, price: price.unit / 100, craft: snapshot(config, catalog) }, qty);
      setQuantity(1);
      return { ok: true, quantity: qty };
    } finally {
      busy.current = false;
    }
  };

  // "Lưu cấu hình": link chứa cấu hình để mở lại/chia sẻ — chưa lưu theo tài khoản
  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("config", encodeConfiguration(config));
    return url.toString();
  };

  return {
    config,
    quantity: qty,
    setQuantity,
    maxQuantity: maxQty,
    issues,
    price,
    canAdd,
    outOfStock,
    set,
    setPersonal,
    toggleFragrance,
    setFragranceWeight,
    addToCart,
    shareUrl,
  };
}

export type CandleCustomizer = ReturnType<typeof useCandleCustomizer>;
