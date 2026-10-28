import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: `${t("login.title")} — 2510 Scented Candle`, robots: { index: false } };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Form đọc ?redirect= từ URL → cần Suspense
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
