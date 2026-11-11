// Trang chủ (bố cục Figma "Ember & Earth"): Hero → Cam kết → Bộ sưu tập → Câu chuyện → Cách đốt nến → Lời nhắn → Nhận tin
import { SiteShell } from "@/components/site-shell";
import { Hero } from "@/components/sections/hero";
import { Promises } from "@/components/sections/promises";
import { Collection } from "@/components/sections/collection";
import { Story } from "@/components/sections/story";
import { Care } from "@/components/sections/care";
import { Reminder } from "@/components/sections/reminder";
import { Newsletter } from "@/components/sections/newsletter";

export default function HomePage() {
  return (
    <SiteShell overHero>
      <Hero />
      <Promises />
      <Collection />
      <Story />
      <Care />
      <Reminder />
      <Newsletter />
    </SiteShell>
  );
}
