"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-14 rounded-full border-brand-200 bg-[#fdfbf7] px-6 text-base focus-visible:border-peanut focus-visible:ring-peanut/30";

export function FormField({
  label,
  error,
  children,
  aside,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between text-base text-ink">
        {label}
        {aside}
      </span>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 text-sm text-rose"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn(inputClass, "pr-14", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        className="absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-dark-300 hover:text-ink"
      >
        {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  );
}
