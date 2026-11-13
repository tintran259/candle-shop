// Trang chủ (bố cục Figma "Ember & Earth"): Hero → Cam kết → Bộ sưu tập → Câu chuyện → Cách đốt nến → Lời nhắn → Gửi lời nhắn
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { OG_BASE, OG_IMAGE, SITE_DESCRIPTION } from "@/lib/site";
import { Hero } from "@/components/sections/hero";
import { Promises } from "@/components/sections/promises";
import { Collection } from "@/components/sections/collection";
import { Story } from "@/components/sections/story";
import { Care } from "@/components/sections/care";
import { Reminder } from "@/components/sections/reminder";
import { Contact } from "@/components/sections/contact";
import { collectionText, featuredCards, getHome, heroContent } from "@/lib/home";
import { careContent, contactContent, effectKind, storyContent } from "@/lib/blocks";

// Trang chủ: thêm og:url (layout không đặt vì dùng chung mọi trang); tiêu đề, mô tả, ảnh chia sẻ lấy của layout
export const metadata: Metadata = { openGraph: { ...OG_BASE, title: "2510 Candle — Nến thơm thủ công", description: SITE_DESCRIPTION, url: "/", images: [OG_IMAGE] } };

// Dựng lại tối đa mỗi 60 giây — BO đăng giao diện mới / concept vào mùa thì web đổi theo
export const revalidate = 60;

// Hero + Xưởng nến đọc từ BE (GET /shop/home, lưu đệm 60 giây); BE lỗi thì nội dung có sẵn
export default async function HomePage() {
  const home = await getHome();
  const story = storyContent(home?.theme.story);
  const care = careContent(home?.theme.care);
  const contact = contactContent(home?.theme.contact);
  return (
    <SiteShell overHero>
      <Hero content={heroContent(home?.theme.hero)} effect={effectKind(home?.theme.effect)} />
      <Promises />
      <Collection cards={featuredCards(home)} text={collectionText(home?.theme.collection)} />
      {!story.hidden && <Story content={story} />}
      {!care.hidden && <Care content={care} />}
      <Reminder />
      {!contact.hidden && <Contact content={contact} />}
    </SiteShell>
  );
}
