"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCheckoutStore, type Contact } from "@/stores/checkout-store";

const fields = ["name", "email", "phone", "address", "city"] as const;

export function ContactCard({ highlight }: { highlight?: boolean }) {
  const t = useTranslations("Checkout");
  const contact = useCheckoutStore((s) => s.contact);
  const setContact = useCheckoutStore((s) => s.setContact);
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const showForm = editing || !contact;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-ink">{t("contact")}</h2>
        {contact && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="cursor-pointer text-xl text-ink hover:text-peanut"
          >
            {t("edit")}
          </button>
        )}
      </div>

      <div
        className={cn(
          "mt-6 rounded-2xl border bg-[#fdfbf7] p-6 transition-colors",
          highlight && showForm ? "border-rose" : "border-brand-100",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ContactForm
                defaultValues={
                  contact ??
                  (user && {
                    name: user.name,
                    email: user.email,
                    phone: user.phone ?? "",
                    address: "",
                    city: "",
                  })
                }
                onCancel={contact ? () => setEditing(false) : undefined}
                onSave={(value) => {
                  setContact(value);
                  setEditing(false);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p className="text-sm text-dark-300">{t("recipient")}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{contact!.name}</p>
              <dl className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-brand-100">
                <ContactField label={t("address")} value={contact!.address} />
                <ContactField label={t("phone")} value={contact!.phone} sub={contact!.email} />
                <ContactField label={t("city")} value={contact!.city} />
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ContactField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-lg text-ink">{label}</dt>
      <dd className="text-sm leading-[1.8] break-words text-dark-300">
        {value}
        {sub && <span className="block">{sub}</span>}
      </dd>
    </div>
  );
}

function ContactForm({
  defaultValues,
  onSave,
  onCancel,
}: {
  defaultValues: Contact | null;
  onSave: (value: Contact) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("Checkout");
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t("errors.name")),
        email: z.email(t("errors.email")),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9\s().-]{8,15}$/, t("errors.phone")),
        address: z.string().trim().min(5, t("errors.address")),
        city: z.string().trim().min(2, t("errors.city")),
      }),
    [t],
  );

  const form = useForm<Contact>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { name: "", email: "", phone: "", address: "", city: "" },
  });

  const labels: Record<(typeof fields)[number], string> = {
    name: t("recipient"),
    email: t("email"),
    phone: t("phone"),
    address: t("address"),
    city: t("city"),
  };

  return (
    <form onSubmit={form.handleSubmit(onSave)} noValidate className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const error = form.formState.errors[field]?.message;
        return (
          <label
            key={field}
            className={cn("flex flex-col gap-1.5", (field === "name" || field === "address") && "sm:col-span-2")}
          >
            <span className="text-sm text-dark-300">{labels[field]}</span>
            <Input
              type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
              autoComplete={
                { name: "name", email: "email", phone: "tel", address: "street-address", city: "address-level2" }[field]
              }
              placeholder={t(`placeholders.${field}`)}
              aria-invalid={!!error}
              className="h-12 rounded-xl border-brand-200 bg-white px-4 text-base"
              {...form.register(field)}
            />
            {error && <span className="text-sm text-rose">{error}</span>}
          </label>
        );
      })}
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="h-auto rounded-full px-5 py-3 text-base">
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" variant="ink" size="pill" className="px-8">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
