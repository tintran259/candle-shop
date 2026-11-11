// Trang chủ (bố cục Figma "Ember & Earth"): Thông báo + điều hướng → Hero → Cam kết → Bộ sưu tập → Câu chuyện → Cách đốt nến → Lời nhắn → Nhận tin → Chân trang
import { BackToTop } from "@/components/back-to-top";
import { MotionRoot } from "@/components/motion-root";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/sections/hero";
import { Promises } from "@/components/sections/promises";
import { Collection } from "@/components/sections/collection";
import { Story } from "@/components/sections/story";
import { Care } from "@/components/sections/care";
import { Reminder } from "@/components/sections/reminder";
import { Newsletter } from "@/components/sections/newsletter";

export default function HomePage() {
  return (
    <MotionRoot>
      <a href="#main" className="sr-only z-[60] bg-night px-4 py-3 text-[12px] text-linen focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Promises />
        <Collection />
        <Story />
        <Care />
        <Reminder />
        <Newsletter />
      </main>
      <SiteFooter />
      <BackToTop />
    </MotionRoot>
  );
}
