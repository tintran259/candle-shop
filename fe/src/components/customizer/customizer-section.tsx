import { SECTION_PREFIX } from "@/components/customizer/groups";
import type { GroupId } from "@/lib/customizer/types";

// Khung 1 nhóm tùy chỉnh: số thứ tự + tiêu đề + mô tả ngắn + nội dung
export function CustomizerSection({
  id,
  index,
  title,
  hint,
  children,
}: {
  id: GroupId;
  index: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={SECTION_PREFIX + id}
      aria-labelledby={`${SECTION_PREFIX}${id}-title`}
      className="scroll-mt-40 border-b border-linen pb-8 last:border-b-0 last:pb-0"
    >
      <h2 id={`${SECTION_PREFIX}${id}-title`} className="text-xl font-semibold text-bark">
        {index}. {title}
      </h2>
      <p className="mt-1 text-sm text-dark-300">{hint}</p>
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  );
}

// Tiêu đề phụ trong 1 nhóm (vd "Có nắp", "Kích thước")
export function SubHeading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <h3 className="text-base font-semibold text-bark">
      {children}
      {note && <span className="ml-1.5 text-sm font-normal text-dark-300">({note})</span>}
    </h3>
  );
}
