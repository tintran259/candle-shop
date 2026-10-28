import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("Announcement");

  return (
    <div className="flex items-center justify-center bg-ink px-6 py-3 text-center text-sm text-white">
      {t("freeShipping")}
    </div>
  );
}
