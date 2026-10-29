"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ContainerGroup } from "@/components/customizer/container-group";
import { CustomizationProgress } from "@/components/customizer/customization-progress";
import { DecorationGroup } from "@/components/customizer/decoration-group";
import { FragranceGroup } from "@/components/customizer/fragrance-group";
import { groupIdsInOrder, scrollToGroup, SECTION_PREFIX } from "@/components/customizer/groups";
import { MobileOrderBar } from "@/components/customizer/mobile-order-bar";
import { PersonalizationGroup } from "@/components/customizer/personalization-group";
import { SummaryPanel } from "@/components/customizer/summary-panel";
import { WaxGroup } from "@/components/customizer/wax-group";
import { ColorGroup, WickGroup } from "@/components/customizer/wick-color-groups";
import { ContactHelp } from "@/components/layout/contact-shop";
import { Button } from "@/components/ui/button";
import { useActiveSection } from "@/hooks/use-active-section";
import { useCandleCustomizer } from "@/hooks/use-candle-customizer";
import { useShopConfig } from "@/hooks/use-shop-config";
import { decodeConfiguration } from "@/lib/customizer/snapshot";
import type { CandleConfiguration, GroupId } from "@/lib/customizer/types";
import type { ShopConfig } from "@/lib/shop-config";
import { useCartStore } from "@/stores/cart-store";

// Tải cấu hình xưởng (nguyên liệu, giá) rồi mới dựng trình tùy chỉnh
export function CandleCustomizer() {
  const t = useTranslations("Customizer");
  const { data, isError, refetch } = useShopConfig();
  const params = useSearchParams();
  const [restored] = useState(() => decodeConfiguration(params.get("config")));

  if (isError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg text-bark">{t("errors.loadFailed")}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t("retry")}
        </Button>
        <ContactHelp className="w-full text-left" />
      </div>
    );
  }
  if (!data) {
    return (
      <div aria-busy className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[70vh] animate-pulse rounded-xl bg-brand-50" />
        <div className="hidden h-[70vh] animate-pulse rounded-xl bg-brand-50 lg:block" />
      </div>
    );
  }
  return <Workspace config={data} restored={restored} />;
}

function Workspace({ config, restored }: { config: ShopConfig; restored: CandleConfiguration | null }) {
  const t = useTranslations("Customizer");
  const tProduct = useTranslations("Product");
  const catalog = config.customizer;
  const customizer = useCandleCustomizer(catalog, restored, t("itemName"));
  const setCartOpen = useCartStore((s) => s.setOpen);
  const active = useActiveSection(groupIdsInOrder, SECTION_PREFIX);
  const withIssues = new Set<GroupId>(customizer.issues.map((i) => i.group));
  const groupProps = { customizer, catalog };

  const handleAdd = () => {
    const result = customizer.addToCart();
    if (result.ok) {
      toast.success(t("added", { count: result.quantity }), {
        action: { label: tProduct("viewCart"), onClick: () => setCartOpen(true) },
      });
    } else if (result.reason === "invalid") {
      toast.error(t("fixFirst", { count: customizer.issues.length }));
      scrollToGroup(customizer.issues[0].group);
    } else if (result.reason === "stock") {
      toast.error(t("errors.stock"));
    }
  };

  const handleSave = async () => {
    const url = customizer.shareUrl();
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("saved"));
    } catch {
      toast.message(t("savedNoClipboard"));
    }
  };

  return (
    <div className="pb-24 lg:pb-0">
      {restored && <p className="mb-6 rounded-lg bg-brand-50 px-4 py-3 text-sm text-bark">{t("restored")}</p>}
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <CustomizationProgress active={active} withIssues={withIssues} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-8 rounded-xl border border-linen bg-white p-5 sm:p-7">
            <ContainerGroup {...groupProps} />
            <WaxGroup {...groupProps} />
            <FragranceGroup {...groupProps} />
            <WickGroup {...groupProps} />
            <ColorGroup {...groupProps} />
            <DecorationGroup {...groupProps} />
            <PersonalizationGroup {...groupProps} />
          </div>
        </div>

        <aside
          id="customize-summary"
          className="scroll-mt-32 lg:sticky lg:top-[151px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <SummaryPanel
            {...groupProps}
            withIssues={withIssues}
            leadTime={config.production.leadTimeDays}
            onAdd={handleAdd}
            onSave={handleSave}
          />
        </aside>
      </div>

      <MobileOrderBar
        total={customizer.price.unit * customizer.quantity}
        disabled={!customizer.canAdd}
        onAdd={handleAdd}
        onReview={() => document.getElementById("customize-summary")?.scrollIntoView({ behavior: "smooth" })}
      />
    </div>
  );
}
