"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

const ease = [0.22, 1, 0.36, 1] as const;

/** Khung chung cho trang đăng nhập / đăng ký: ảnh bên trái, form bên phải */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("Auth");
  const demo = !process.env.NEXT_PUBLIC_API_URL;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pt-8 pb-20 md:px-10 lg:grid-cols-[1fr_520px] lg:gap-20 lg:pt-10 lg:pb-[120px] xl:px-20">
      <motion.div
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease }}
        className="relative hidden min-h-[640px] overflow-hidden rounded-2xl lg:block"
      >
        <Image
          src="/brand/hero-2510-stone.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,18,0)_45%,rgba(12,13,18,0.55)_100%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
          className="absolute inset-x-10 bottom-10 text-white"
        >
          <p className="max-w-[420px] text-[32px] leading-[1.3] font-semibold">{t("panelQuote")}</p>
          <p className="mt-3 text-lg tracking-caption text-brand-50">{t("panelCaption")}</p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
        className="flex flex-col justify-center"
      >
        <h1 className="text-[32px] leading-[1.3] font-semibold text-ink md:text-[40px]">{title}</h1>
        <p className="mt-3 text-lg text-dark-300">{subtitle}</p>
        {demo && (
          <p className="mt-6 rounded-xl border border-dashed border-peanut bg-brand-50/60 px-4 py-3 text-sm text-dark-500">
            {t("demoNotice")}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  );
}
