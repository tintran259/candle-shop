import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: `${t("register.title")} — 2510 Scented Candle`, robots: { index: false } };
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
