import { HolderOutlined } from "@ant-design/icons";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type Announcements, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "antd";
import { useContext, type ReactNode } from "react";
import { HandleContext, type SortableHandleValue } from "@/hooks/use-sortable-item";

// Kéo thả sắp xếp danh sách dọc, dùng chung cho Danh mục và các bước Thủ công.
// Chỉ kéo từ tay nắm (chuột/chạm) hoặc bàn phím: Space nhấc, mũi tên di chuyển, Space đặt, Esc hủy.

type Props = { ids: string[]; name: (id: string) => string; onMove: (id: string, to: string) => void; children: ReactNode };

export function SortableList({ ids, name, onMove, children }: Props) {
  const sensors = useSensors(
    // Nhích 4px mới tính là kéo — bấm nhầm tay nắm không đổi thứ tự
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const label = (id: string | number) => name(String(id));
  const position = (id: string | number) => ids.indexOf(String(id)) + 1;
  // Đọc cho trình đọc màn hình khi kéo bằng bàn phím
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Đã nhấc ${label(active.id)}, đang ở vị trí ${position(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${label(active.id)} sang vị trí ${position(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `Đã đặt ${label(active.id)} ở vị trí ${position(over.id)}.` : undefined),
    onDragCancel: ({ active }) => `Đã hủy kéo ${label(active.id)}.`,
  };
  const end = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={end}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: "Nhấn Space hoặc Enter để nhấc lên, dùng mũi tên lên xuống để di chuyển, nhấn Space hoặc Enter lần nữa để đặt, Esc để hủy." },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// Bọc mục kéo được để DragHandle bên trong lấy listeners của mục đó
export function SortableHandle({ value, children }: { value: SortableHandleValue; children: ReactNode }) {
  return <HandleContext.Provider value={value}>{children}</HandleContext.Provider>;
}

export function DragHandle({ name }: { name: string }) {
  const handle = useContext(HandleContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      ref={handle?.setActivatorNodeRef}
      {...handle?.attributes}
      {...handle?.listeners}
      aria-label={`Kéo để sắp xếp ${name}`}
      style={{ cursor: "grab", touchAction: "none", flexShrink: 0 }}
    />
  );
}
