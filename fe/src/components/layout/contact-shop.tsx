"use client";

import { MailIcon, MessageCircleIcon, MessagesSquareIcon, PhoneIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useShopConfig } from "@/hooks/use-shop-config";
import { pick, type ShopContact } from "@/lib/shop-config";
import { cn } from "@/lib/utils";

function channels(contact: ShopContact) {
  return [
    { key: "zalo", href: contact.zalo, icon: MessageCircleIcon, value: contact.phone, external: true },
    { key: "messenger", href: contact.messenger, icon: MessagesSquareIcon, value: "2510 Scented Candle", external: true },
    { key: "phone", href: `tel:${contact.phone.replace(/\s/g, "")}`, icon: PhoneIcon, value: contact.phone, external: false },
    { key: "email", href: `mailto:${contact.email}`, icon: MailIcon, value: contact.email, external: false },
  ] as const;
}

// Nút liên hệ nổi ở góc màn hình — mở danh sách kênh chat/gọi với shop
export function ContactShopButton() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const { data } = useShopConfig();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!data) return null;

  return (
    <div ref={ref} data-contact-fab className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            id="contact-shop-panel"
            role="dialog"
            aria-label={t("title")}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-brand-100 bg-cream-light p-5 shadow-xl"
          >
            <p className="text-lg font-semibold text-ink">{t("title")}</p>
            <p className="mt-1 text-sm text-dark-300">{t("subtitle")}</p>
            <ChannelList contact={data.contact} />
            <p className="mt-4 text-xs text-dark-300">
              {t("hours")}: {pick(data.contact.hours, locale)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="contact-shop-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 cursor-pointer items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white shadow-lg transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-dark-500"
      >
        {open ? <XIcon className="size-5" aria-hidden /> : <MessageCircleIcon className="size-5" aria-hidden />}
        <span>{t("button")}</span>
      </button>
    </div>
  );
}

function ChannelList({ contact, compact }: { contact: ShopContact; compact?: boolean }) {
  const t = useTranslations("Contact");
  return (
    <ul className={cn("mt-4 grid gap-2", compact && "mt-3 sm:grid-cols-2")}>
      {channels(contact).map(({ key, href, icon: Icon, value, external }) => (
        <li key={key}>
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2.5 transition-colors hover:border-peanut"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-ink">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-ink">{t(`channels.${key}`)}</span>
              <span className="truncate text-xs text-dark-300">{value}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// Khối "Cần shop hỗ trợ?" đặt trong trang (checkout, Thủ công, chi tiết sản phẩm)
export function ContactHelp({ className }: { className?: string }) {
  const t = useTranslations("Contact");
  const { data } = useShopConfig();
  if (!data) return null;
  return (
    <div className={cn("rounded-2xl border border-brand-100 bg-cream-light p-5", className)}>
      <p className="text-lg font-semibold text-ink">{t("helpTitle")}</p>
      <p className="mt-1 text-sm text-dark-300">{t("helpText")}</p>
      <ChannelList contact={data.contact} compact />
    </div>
  );
}
