import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CheckoutResult } from "@/components/checkout/checkout-result";

export const metadata = { robots: { index: false } };

export default async function CheckoutResultPage({
  params,
}: PageProps<"/[locale]/checkout/result">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <CheckoutResult />
    </Suspense>
  );
}
