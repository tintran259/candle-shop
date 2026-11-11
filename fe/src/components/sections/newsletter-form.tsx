"use client";
// Ô email gạch chân: đường kẻ chuyển đỏ rượu vang khi đang nhập, báo lỗi ngay dưới ô.
// Chưa có API đăng ký nhận tin — email hợp lệ thì hiện thông báo newsletter.pending. TODO: nối BE khi có endpoint
import { useState } from "react";
import { newsletter } from "@/content/home";
import { cx } from "@/components/ui/primitives";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setError(newsletter.invalid);
    setError("");
    setDone(true);
  };

  return (
    <form noValidate onSubmit={submit} data-reveal="fade" className="mt-16 pl-1 md:mt-[65px]">
      <div className="relative flex items-end gap-6">
        <label htmlFor="newsletter-email" className="sr-only">
          {newsletter.placeholder}
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={newsletter.placeholder}
          aria-invalid={!!error}
          aria-describedby="newsletter-note"
          className="peer min-w-0 flex-1 bg-transparent pb-4 focus-visible:outline-none text-[11px] tracking-[0.06em] text-ink outline-none placeholder:text-muted"
        />
        <button type="submit" className="group -mr-1 shrink-0 px-1 pt-3 pb-4 text-[11px] whitespace-nowrap text-wine">
          {newsletter.submit}
          <span aria-hidden className="ml-2 inline-block transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            ↗
          </span>
        </button>
        <span className="absolute inset-x-0 bottom-0 h-[0.6px] bg-field" />
        <span className={cx("absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-wine transition-transform duration-500 peer-focus:scale-x-100", error && "scale-x-100")} />
      </div>
      <div id="newsletter-note" role="status" className="mt-[25px] text-[10px] leading-[18px] text-muted">
        {error ? <p className="text-wine">{error}</p> : done ? <p className="text-wine">{newsletter.pending}</p> : newsletter.consent.map((c) => <p key={c}>{c}</p>)}
      </div>
    </form>
  );
}
