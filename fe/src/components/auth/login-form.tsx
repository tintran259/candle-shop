"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField, inputClass, PasswordInput } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthError, login, safeRedirect } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("errors.email")),
        password: z.string().min(1, t("errors.passwordRequired")),
        remember: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: Values) => {
    setFormError(null);
    try {
      const user = await login(values);
      setUser(user);
      toast.success(t("login.success", { name: user.name }));
      router.replace(safeRedirect(params.get("redirect")));
    } catch (e) {
      setFormError(t(`errors.${e instanceof AuthError ? e.code : "UNKNOWN"}`));
    }
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {formError && (
          <p role="alert" className="rounded-xl bg-rose/10 px-5 py-3 text-sm text-rose">
            {formError}
          </p>
        )}
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
        <FormField label={t("fields.password")} error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder={t("placeholders.password")}
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </FormField>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-base text-ink">
            <Controller
              control={form.control}
              name="remember"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c === true)}
                  className="rounded-[3px] border-dark-50 data-checked:border-ink data-checked:bg-ink"
                />
              )}
            />
            {t("login.remember")}
          </label>
          <button
            type="button"
            onClick={() => toast.info(t("login.forgotSoon"))}
            className="cursor-pointer text-base text-dark-300 underline-offset-4 hover:text-ink hover:underline"
          >
            {t("login.forgot")}
          </button>
        </div>

        <Button type="submit" variant="ink" size="pill-lg" disabled={isSubmitting} className="mt-4 h-14">
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>

        <p className="text-center text-base text-dark-300">
          {t("login.noAccount")}{" "}
          <Link
            href={{ pathname: "/register", query: params.get("redirect") ? { redirect: params.get("redirect")! } : {} }}
            className="font-semibold text-ink underline-offset-4 hover:underline"
          >
            {t("login.toRegister")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
