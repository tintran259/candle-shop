"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const makeSchema = (invalidEmail: string) =>
  z.object({ email: z.email(invalidEmail) });

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function NewsletterDialog() {
  const t = useTranslations("Newsletter");
  const tFooter = useTranslations("Footer");
  const [open, setOpen] = useState(false);
  const schema = useMemo(() => makeSchema(t("invalidEmail")), [t]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  // TODO: gọi POST /api/newsletter khi BE sẵn sàng
  const onSubmit = async ({ email }: FormValues) => {
    await new Promise((r) => setTimeout(r, 500));
    toast.success(t("success", { email }));
    form.reset();
    setOpen(false);
  };

  const error = form.formState.errors.email?.message;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline-light" size="pill" className="min-w-[115px] bg-transparent" />}
      >
        {tFooter("signUp")}
      </DialogTrigger>
      <DialogContent className="bg-cream sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{t("title")}</DialogTitle>
          <DialogDescription className="text-dark-300">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
          <Input
            type="email"
            placeholder={t("placeholder")}
            aria-invalid={!!error}
            className="h-12 rounded-full bg-white px-5 text-base"
            {...form.register("email")}
          />
          {error && <p className="px-2 text-sm text-rose">{error}</p>}
          <Button
            type="submit"
            variant="ink"
            size="pill"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
