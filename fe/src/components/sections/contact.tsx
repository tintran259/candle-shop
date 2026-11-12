// Gửi lời nhắn (bố cục Figma 2:11 "Nhận tin"): ảnh 590×600 bên trái; phải — tiêu đề lớn, câu dẫn, mô tả, form liên hệ gạch chân.
// id="contact": chân trang "Hỗ trợ › Liên hệ" dẫn tới đây. Lời nhắn vào BO › Bán hàng › Liên hệ (docs/pages/messages.md)
import { contact } from "@/content/home";
import { Container, Photo } from "@/components/ui/primitives";
import { ContactForm } from "@/components/sections/contact-form";
import { API_URL } from "@/lib/shop";

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="pt-4 pb-20 md:pt-2.5 md:pb-[70px]">
      <Container>
        <div className="grid gap-12 md:grid-cols-[590fr_146fr_576fr] md:gap-0">
          <Photo photo={contact.photo} sizes="(min-width: 768px) 41vw, 100vw" className="order-2 aspect-[590/600] md:order-none" parallax={7} />
          <div className="order-1 md:order-none md:col-start-3 md:pt-[26px]">
            <h2 id="contact-title" data-reveal="lines" className="display text-[clamp(56px,6vw,86px)] leading-[1.06] tracking-[0.08em] text-wine uppercase">
              {contact.title.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <p data-reveal="lines" className="display mt-12 text-[clamp(28px,2.4vw,34px)] text-ink md:mt-[61px]">
              {contact.heading}
            </p>
            <p data-reveal="fade" className="mt-6 max-w-[480px] pl-1 text-[13px] leading-[22px] text-muted">
              {contact.text}
            </p>
            {/* Trình duyệt gửi thẳng tới BE (CORS có FRONTEND_URL) để BE giới hạn theo IP từng khách; dữ liệu giả thì không gửi */}
            <ContactForm endpoint={process.env.SHOP_MOCK === "1" ? null : `${API_URL}/shop/messages`} />
          </div>
        </div>
      </Container>
    </section>
  );
}
