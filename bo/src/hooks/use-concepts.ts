import { createTaxonomy } from "@/hooks/use-taxonomy";
import { forgetConcept } from "@/hooks/use-products";
import { REMOTE } from "@/lib/data-mode";
import { defaultConcepts } from "@/lib/products/concepts";

// Concept (dịp lễ): /api/admin/concepts (docs/api.md#concept). Xóa concept thì gỡ khỏi các sản phẩm ngay trên giao diện (BE tự gỡ)
export const useConcepts = createTaxonomy("bo-concepts-v1", "/admin/concepts", REMOTE ? [] : defaultConcepts, "Concept đã xóa", forgetConcept);

export type ConceptsApi = ReturnType<typeof useConcepts>;
