"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField, inputClass, PasswordInput } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthError, register, safeRedirect } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const strengthLevels = ["weak", "fair", "good", "strong"] as const;

/** 0–4 điểm: độ dài, chữ hoa+thường, số, ký tự đặc biệt */
function passwordScore(pw: string) {
  if (!pw) return 0;
  let score = pw.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
  return Math.max(score, 1);
}

export function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, t("errors.name")),
          email: z.email(t("errors.email")),
          phone: z
            .string()
            .trim()
            .refine((v) => !v || /^\+?[0-9\s().-]{8,15}$/.test(v), t("errors.phone")),
          password: z.string().min(8, t("errors.passwordMin")),
          confirmPassword: z.string(),
          terms: z.boolean().refine(Boolean, t("errors.terms")),
        })
        .refine((v) => v.password === v.confirmPassword, {
          path: ["confirmPassword"],
          message: t("errors.passwordMatch"),
        }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", terms: false },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const score = passwordScore(password);

  const onSubmit = async ({ name, email, phone, password }: Values) => {
    setFormError(null);
    try {
      const user = await register({ name, email, phone: phone || undefined, password });
      setUser(user);
      toast.success(t("register.success", { name: user.name }));
      router.replace(safeRedirect(params.get("redirect")));
    } catch (e) {
      const code = e instanceof AuthError ? e.code : "UNKNOWN";
      if (code === "EMAIL_TAKEN") form.setError("email", { message: t("errors.EMAIL_TAKEN") });
      else setFormError(t(`errors.${code}`));
    }
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthShell title={t("register.title")} subtitle={t("register.subtitle")}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {formError && (
          <p role="alert" className="rounded-xl bg-rose/10 px-5 py-3 text-sm text-rose">
            {formError}
          </p>
        )}
        <FormField label={t("fields.name")} error={errors.name?.message}>
          <Input
            autoComplete="name"
            placeholder={t("placeholders.name")}
            aria-invalid={!!errors.name}
            className={inputClass}
            {...form.register("name")}
          />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={t("fields.email")} error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder={t("placeholders.email")}
              aria-invalid={!!errors.email}
              className={inputClass}
              {...form.register("email")}
            />
          </FormField>
          <FormField label={t("fields.phone")} error={errors.phone?.message}>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder={t("placeholders.phone")}
              aria-invalid={!!errors.phone}
              className={inputClass}
              {...form.register("phone")}
            />
          </FormField>
        </div>
        <FormField label={t("fields.password")} error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder={t("placeholders.password")}
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </FormField>
        {password && (
          <div className="-mt-2 flex items-center gap-3 px-2" aria-live="polite">
            <div className="flex flex-1 gap-1.5" aria-label={t("strength.label")}>
              {[1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 flex-1 rounded-full bg-brand-100"
                  animate={{
                    backgroundColor:
                      i <= score
                        ? ["#e97171", "#cead95", "#c9a489", "#0c0d12"][score - 1]
                        : "#e9dbd0",
                  }}
                />
              ))}
            </div>
            <span className={cn("w-20 text-right text-sm", score <= 1 ? "text-rose" : "text-dark-300")}>
              {t(`strength.${strengthLevels[score - 1]}`)}
            </span>
          </div>
        )}
        <FormField label={t("fields.confirmPassword")} error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder={t("placeholders.confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 text-base text-ink">
            <Controller
              control={form.control}
              name="terms"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c === true)}
                  aria-invalid={!!errors.terms}
                  className="mt-1 rounded-[3px] border-dark-50 data-checked:border-ink data-checked:bg-ink"
                />
              )}
            />
            <span>
              {t.rich("register.terms", {
                link: (chunks) => (
                  <Link href="/terms" className="font-semibold underline underline-offset-4">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {errors.terms && <span className="px-7 text-sm text-rose">{errors.terms.message}</span>}
        </div>

        <Button type="submit" variant="ink" size="pill-lg" disabled={isSubmitting} className="mt-4 h-14">
          {isSubmitting ? t("register.submitting") : t("register.submit")}
        </Button>

        <p className="text-center text-base text-dark-300">
          {t("register.haveAccount")}{" "}
          <Link
            href={{ pathname: "/login", query: params.get("redirect") ? { redirect: params.get("redirect")! } : {} }}
            className="font-semibold text-ink underline-offset-4 hover:underline"
          >
            {t("register.toLogin")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
