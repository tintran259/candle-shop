// Khung chung mọi trang: liên kết bỏ qua (Tab đầu tiên), thanh điều hướng, nội dung, chân trang, nút về đầu trang; bọc bộ điều phối hiệu ứng cuộn.
// overHero: trang có hero tối ở đầu (trang chủ) — thanh điều hướng trong suốt tới hết hero
import { BackToTop } from "@/components/back-to-top";
import { MotionRoot } from "@/components/motion-root";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getChrome } from "@/lib/home";

export async function SiteShell({ children, overHero = false }: { children: React.ReactNode; overHero?: boolean }) {
  // Thanh thông báo + logo từ BO › Giao diện web (lỗi BE thì nội dung có sẵn)
  const chrome = await getChrome();
  return (
    <MotionRoot>
      <a href="#main" className="sr-only z-[60] bg-night px-4 py-3 text-[12px] text-linen focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader overHero={overHero} chrome={chrome} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter logo={chrome.logo.dark} />
      <BackToTop />
    </MotionRoot>
  );
}
