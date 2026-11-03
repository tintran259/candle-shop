import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createContext, type CSSProperties } from "react";

export type SortableHandleValue = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners" | "setActivatorNodeRef">;
export const HandleContext = createContext<SortableHandleValue | null>(null);

// Mục kéo được: trả setNodeRef + style cho phần tử bao ngoài, và handle để bọc <SortableHandle value={handle}> cho DragHandle bên trong
export function useSortableItem(id: string, style?: CSSProperties) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return {
    setNodeRef,
    isDragging,
    style: {
      ...style,
      transform: CSS.Translate.toString(transform),
      transition,
      // Đang kéo: nổi lên trên các mục khác, giữ nền riêng của mục (nếu có)
      ...(isDragging ? { position: "relative", zIndex: 2, background: style?.background ?? "#fff", boxShadow: "0 6px 16px rgba(0,0,0,0.12)" } : {}),
    } as CSSProperties,
    handle: { attributes, listeners, setActivatorNodeRef },
  };
}
