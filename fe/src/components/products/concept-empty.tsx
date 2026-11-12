"use client";
// Concept (dịp lễ) đang chọn nhưng chưa có mẫu nào bán:
// - chưa tới ngày bắt đầu → đếm ngược tới 00:00 (giờ VN) ngày mở bán, hết giờ thì tải lại trang để hiện mẫu;
// - đang trong mùa / không đặt ngày → báo chưa có mẫu.
// Cả hai kèm nút Liên hệ (Zalo theo SĐT ở BO › Cài đặt) — web không có giỏ hàng, khách hỏi / đặt trước qua liên hệ
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { conceptEmpty as t } from "@/content/home";
import { formatDay, isUpcoming, type ShopConcept } from "@/lib/shop";
import { ContactButton } from "@/components/products/contact-button";

const parts = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86_400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
};

function Countdown({ startsOn }: { startsOn: string }) {
  const router = useRouter();
  // null tới khi chạy trên trình duyệt (giờ máy chủ và máy khách khác nhau — tránh lệch khi hydrate)
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.parse(`${startsOn}T00:00:00+07:00`);
    let done = false;
    const tick = () => {
      const ms = target - Date.now();
      setLeft(ms);
      if (ms <= 0 && !done) {
        done = true;
        router.refresh();
      }
    };
    const frame = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [startsOn, router]);

  const values = left === null ? null : parts(left);
  return (
    <div role="timer" aria-live="off" className="mt-8 grid grid-cols-4 gap-2 sm:gap-4">
      {t.units.map((unit, i) => (
        <div key={unit} className="border border-rule px-2 py-4 text-center sm:py-6">
          <span className="display block text-[clamp(32px,6vw,56px)] leading-none text-wine [font-variant-numeric:lining-nums_tabular-nums]">{values ? String(values[i]).padStart(2, "0") : "--"}</span>
          <span className="mt-2 block text-[10px] tracking-[0.14em] text-muted uppercase">{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function ConceptEmpty({ concept, contactUrl }: { concept: ShopConcept; contactUrl: string | null }) {
  const upcoming = isUpcoming(concept);
  return (
    <section aria-live="polite" className="mx-auto mt-12 max-w-2xl border-t border-rule py-14 text-center md:mt-16 md:py-20">
      <p className="eyebrow">{upcoming ? t.upcomingEyebrow : t.emptyEyebrow}</p>
      <h2 className="display mt-4 text-[clamp(30px,3.6vw,44px)] text-ink">{upcoming ? t.upcomingTitle(concept.name) : t.emptyTitle(concept.name)}</h2>
      {upcoming && concept.startsOn ? (
        <>
          <Countdown startsOn={concept.startsOn} />
          <p className="mt-6 text-[13px] text-muted">{t.opensOn(formatDay(concept.startsOn), concept.endsOn ? formatDay(concept.endsOn) : null)}</p>
        </>
      ) : (
        <p className="mx-auto mt-5 max-w-md text-[14px] leading-6 text-muted">{t.emptyText}</p>
      )}
      {contactUrl && (
        <div className="mx-auto mt-10 max-w-sm">
          <ContactButton href={contactUrl} product={concept.name} variant="solid" />
          <p className="mt-3 text-[12px] text-muted">{upcoming ? t.preorderHint : t.customHint}</p>
        </div>
      )}
    </section>
  );
}
