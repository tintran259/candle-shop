"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { CustomizerSection } from "@/components/customizer/customizer-section";
import { IssueMessage } from "@/components/customizer/issue-message";
import { OptionCard } from "@/components/customizer/option-card";
import { useOptionMeta, type GroupProps } from "@/components/customizer/use-option-meta";
import type { TextField } from "@/lib/customizer/types";
import { issuesFor } from "@/lib/customizer/validation";

type TextKey = "labelText" | "recipientName" | "giftMessage";

// Nhóm 7: cá nhân hóa — không bắt buộc, chỉ hiện các mục BO đang bật
export function PersonalizationGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, setPersonal, issues } = customizer;
  const p = catalog.personalization;
  const giftBox = p.giftBox;

  return (
    <CustomizerSection id="personalization" index={7} title={t("groups.personalization")} hint={t("hints.personalization")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["labelText", "recipientName"] as const).map((key) =>
          p[key].enabled ? <TextInput key={key} field={key} config={p[key]} customizer={customizer} price={meta.price} /> : null,
        )}
        {p.giftMessage.enabled && (
          <TextInput field="giftMessage" config={p.giftMessage} customizer={customizer} price={meta.price} multiline />
        )}
      </div>

      {giftBox?.enabled && (
        <div className="sm:max-w-sm">
          <OptionCard
            multi
            layout="row"
            title={t("personal.giftBox")}
            subtitle={t("personal.giftBoxHint")}
            price={meta.price(giftBox.priceDelta)}
            selected={config.personalization.giftBox}
            disabled={!config.personalization.giftBox && (!giftBox.available || giftBox.stock <= 0)}
            badge={!giftBox.available || giftBox.stock <= 0 ? t("option.soldOut") : undefined}
            onSelect={() => setPersonal({ giftBox: !config.personalization.giftBox })}
          />
        </div>
      )}
      <IssueMessage issues={issuesFor(issues, "giftBox")} />
    </CustomizerSection>
  );
}

function TextInput({
  field,
  config,
  customizer,
  price,
  multiline,
}: {
  field: TextKey;
  config: TextField;
  customizer: GroupProps["customizer"];
  price: (amount: number) => string;
  multiline?: boolean;
}) {
  const t = useTranslations("Customizer.personal");
  const id = useId();
  const value = customizer.config.personalization[field];
  const fieldIssues = issuesFor(customizer.issues, field);
  const common = {
    id,
    value,
    // Cho gõ quá 1 chút để thấy cảnh báo, BE vẫn chặn theo maxLength
    maxLength: config.maxLength + 10,
    placeholder: t(`${field}Placeholder`),
    "aria-invalid": fieldIssues.length > 0,
    "aria-describedby": `${id}-count`,
    className:
      "w-full rounded-lg border border-linen bg-white px-3 text-base text-bark outline-none placeholder:text-dark-50 focus:border-umber aria-invalid:border-rose",
  };

  return (
    <div className={multiline ? "flex flex-col gap-1.5 sm:col-span-2" : "flex flex-col gap-1.5"}>
      <label htmlFor={id} className="flex justify-between gap-2 text-sm font-medium text-bark">
        {t(field)}
        {config.priceDelta > 0 && <span className="font-normal text-dark-300">{price(config.priceDelta)}</span>}
      </label>
      {multiline ? (
        <textarea
          {...common}
          rows={3}
          onChange={(e) => customizer.setPersonal({ [field]: e.target.value })}
          className={`${common.className} resize-none py-2.5`}
        />
      ) : (
        <input {...common} onChange={(e) => customizer.setPersonal({ [field]: e.target.value })} className={`${common.className} h-11`} />
      )}
      <span id={`${id}-count`} className="text-right text-xs text-dark-300 tabular-nums">
        {value.length}/{config.maxLength}
      </span>
      <IssueMessage issues={fieldIssues} />
    </div>
  );
}
