import { useMemo } from "react";
import { createTaxonomy } from "@/hooks/use-taxonomy";
import { REMOTE } from "@/lib/data-mode";
import { defaultCategories, UNCATEGORIZED } from "@/lib/products/categories";

// Danh mục: /api/admin/categories (docs/api.md#danh-mục)
const useCategoryStore = createTaxonomy("bo-categories-v1", "/admin/categories", REMOTE ? [] : defaultCategories, UNCATEGORIZED);

export function useCategories() {
  const t = useCategoryStore();
  return useMemo(() => ({ ...t, categories: t.items }), [t]);
}

export type CategoriesApi = ReturnType<typeof useCategories>;
