"use client";
// Ô chọn tự dựng (thay <select> — danh sách của <select> do trình duyệt vẽ, không đổi kiểu được): nút gạch chân + mũi tên,
// bấm mở danh sách nền kem, mục đang chọn màu rượu vang có dấu ✓. Bàn phím (mẫu combobox — focus luôn ở nút, mục đang trỏ báo qua aria-activedescendant):
// ↑ ↓ mở / di chuyển, Home / End, Enter / Space chọn, Esc / Tab đóng; bấm ra ngoài thì đóng
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/components/ui/primitives";

type Option<T> = { value: T; label: string };

export function SortSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, options.indexOf(current)));
    setOpen(true);
  };
  const pick = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    button.current?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={root} className="relative flex items-center gap-3 text-[11px]">
      <span id={`${id}-label`} className="text-muted">
        {label}
      </span>
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={cx("group flex min-w-[150px] items-center justify-between gap-4 border-b py-1.5 text-ink transition-colors duration-300", open ? "border-wine" : "border-field hover:border-ink")}
      >
        <span id={`${id}-value`}>{current.label}</span>
        <svg aria-hidden viewBox="0 0 12 12" className={cx("size-2.5 transition-transform duration-300", open && "rotate-180")}>
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      <ul
        id={`${id}-list`}
        role="listbox"
        aria-labelledby={`${id}-label`}
        className={cx(
          "absolute top-full right-0 z-20 mt-2 min-w-[210px] origin-top-right border border-rule bg-cream py-2 shadow-[0_18px_40px_-18px_rgb(40_39_32/0.35)] transition-[opacity,translate,visibility] duration-300",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0",
        )}
      >
        {options.map((o, i) => (
          <li
            key={o.value}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={o.value === value}
            onPointerEnter={() => setActive(i)}
            onClick={() => pick(i)}
            className={cx(
              "flex cursor-pointer items-center justify-between gap-6 px-4 py-2.5 text-[12px] transition-colors duration-200",
              o.value === value ? "text-wine" : "text-ink",
              open && i === active && "bg-rule/25",
            )}
          >
            {o.label}
            <span aria-hidden className={cx("text-[11px]", o.value !== value && "invisible")}>
              ✓
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
