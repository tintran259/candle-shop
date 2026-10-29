import {
  AmphoraIcon,
  FlameIcon,
  Flower2Icon,
  LayersIcon,
  PaletteIcon,
  PenLineIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import type { GroupId } from "@/lib/customizer/types";

// 7 nhóm tùy chỉnh theo thứ tự hiển thị (thanh tiến trình, menu trái, các mục)
export const customizerGroups: { id: GroupId; icon: LucideIcon }[] = [
  { id: "container", icon: AmphoraIcon },
  { id: "wax", icon: LayersIcon },
  { id: "fragrance", icon: Flower2Icon },
  { id: "wick", icon: FlameIcon },
  { id: "color", icon: PaletteIcon },
  { id: "decoration", icon: SparklesIcon },
  { id: "personalization", icon: PenLineIcon },
];

export const groupIdsInOrder = customizerGroups.map((g) => g.id);

export const SECTION_PREFIX = "customize-";

export function scrollToGroup(id: GroupId) {
  document.getElementById(SECTION_PREFIX + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
