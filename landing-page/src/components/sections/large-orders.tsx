"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/reveal";
import { btnInk, PREFILL_EVENT } from "@/lib/ui";

const makeSchema = (t: (key: "name" | "email" | "message") => string) =>
  z.object({
    name: z.string().trim().min(2, t("name")),
    email: z.email(t("email")),
    message: z.string().trim().min(10, t("message")),
  });

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

const fieldBase =
  "w-full border-0 border-b border-ink bg-transparent px-2.5 text-base tracking-[0.1em] text-ink placeholder:text-ink focus:border-b-2 focus:outline-none aria-invalid:border-red-700";

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: (id: string, errorId: string) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children(id, errorId)}
      <p id={errorId} className="min-h-5 px-2.5 pt-1 text-caption text-red-700 sm:text-sm" aria-live="polite">
        {error}
      </p>
    </div>
  );
}

export function LargeOrders() {
  const t = useTranslations("LargeOrders");
  const tErr = useTranslations("LargeOrders.errors");
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(makeSchema(tErr)), defaultValues: { name: "", email: "", message: "" } });

  // Nhận sản phẩm từ nút "Order now" ở Best Sellers
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const product = (e as CustomEvent<string>).detail;
      setSent(false);
      setValue("message", t("prefill", { product }));
      setTimeout(() => setFocus("message"), 600);
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, [setValue, setFocus, t]);

  const onSubmit = async (values: FormValues) => {
    // Chưa có BE: giả lập gửi yêu cầu
    await new Promise((r) => setTimeout(r, 800));
    console.info("Order inquiry", values);
    setSent(true);
    reset();
  };

  return (
    <section id="large-orders" className="overflow-hidden py-16 lg:pt-[52px] lg:pb-[117px]">
      <div className="relative mx-auto max-w-[1728px] px-4 sm:px-8 lg:min-h-[851px] lg:px-0">
        {/* Ảnh (lật ngang như Figma) */}
        <Reveal className="relative mx-auto aspect-[639/799] w-full max-w-[520px] lg:absolute lg:top-0 lg:left-[7.3%] lg:w-[37%] lg:max-w-[639px]">
          <Image
            src="/images/candle-flower.png"
            alt={t("imageAlt")}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="-scale-x-100 object-cover"
          />
        </Reveal>

        <div className="relative mt-10 flex flex-col items-center lg:mt-0">
          <Reveal className="flex flex-col items-center gap-3 text-center lg:mt-[66px] lg:ml-[44%] lg:w-[48%]">
            <h2 className="font-display text-display-lg tracking-tightish uppercase sm:text-5xl lg:text-[70px] lg:leading-none">
              {t("title")}
            </h2>
            <p className="max-w-[613px] text-body tracking-tightish text-ink-text sm:text-lg lg:text-[22px]">
              {t("text")}
            </p>
          </Reveal>

          <Reveal
            delay={0.15}
            className="relative z-10 mt-8 w-full bg-paper p-6 shadow-float sm:p-10 lg:mt-[55px] lg:ml-[32.6%] lg:w-[60%] lg:max-w-[1039px] lg:p-[100px]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[313px] flex-col items-center justify-center gap-4 text-center"
                  role="status"
                >
                  <span className="flex size-14 items-center justify-center bg-ink text-on-ink">
                    <CheckIcon className="size-7" aria-hidden />
                  </span>
                  <p className="font-display text-display-md tracking-tightish uppercase sm:text-4xl">{t("thanks")}</p>
                  <p className="max-w-sm text-base">{t("thanksText")}</p>
                  <button type="button" onClick={() => setSent(false)} className="cursor-pointer text-sm underline decoration-ink/30 underline-offset-4 transition-colors duration-300 hover:decoration-ink">
                    {t("again")}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  noValidate
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-2 lg:gap-[23px]"
                >
                  <div className="grid gap-2 sm:grid-cols-2 sm:gap-5">
                    <Field label={t("name")} error={errors.name?.message}>
                      {(id, errorId) => (
                        <input
                          id={id}
                          autoComplete="name"
                          placeholder={t("name")}
                          aria-invalid={!!errors.name}
                          aria-describedby={errorId}
                          className={cn(fieldBase, "h-[78px]")}
                          {...register("name")}
                        />
                      )}
                    </Field>
                    <Field label={t("email")} error={errors.email?.message}>
                      {(id, errorId) => (
                        <input
                          id={id}
                          type="email"
                          autoComplete="email"
                          placeholder={t("email")}
                          aria-invalid={!!errors.email}
                          aria-describedby={errorId}
                          className={cn(fieldBase, "h-[78px]")}
                          {...register("email")}
                        />
                      )}
                    </Field>
                  </div>
                  <Field label={t("message")} error={errors.message?.message}>
                    {(id, errorId) => (
                      <textarea
                        id={id}
                        rows={4}
                        placeholder={t("message")}
                        aria-invalid={!!errors.message}
                        aria-describedby={errorId}
                        className={cn(fieldBase, "h-[137px] resize-none py-5")}
                        {...register("message")}
                      />
                    )}
                  </Field>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(btnInk, "mt-4 h-[70px] w-full text-3xl sm:w-[220px] lg:mt-[27px] lg:h-[85px]")}
                  >
                    {isSubmitting ? t("sending") : t("send")}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
