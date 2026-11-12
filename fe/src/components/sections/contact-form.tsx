"use client";
// Form "Gửi lời nhắn": ô gạch chân (đường kẻ chuyển đỏ rượu vang khi đang nhập / có lỗi), lỗi ngay dưới từng ô.
// Gửi thẳng tới BE (POST /api/shop/messages, docs/pages/messages.md) — kiểm tra giống BE; endpoint null (dữ liệu giả) thì chỉ báo thành công.
// Ô "website" ẩn là bẫy bot. BE trên Render có thể đang khởi động → chờ tối đa 60 giây
import { useState } from "react";
import { contact } from "@/content/home";
import { cx } from "@/components/ui/primitives";

const PHONE = /^[\d\s+.()-]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 1000;
type Field = "name" | "phone" | "email" | "message";
type Values = Record<Field, string>;
const empty: Values = { name: "", phone: "", email: "", message: "" };

const check = (v: Values): Partial<Record<Field, string>> => ({
  ...(!v.name.trim() && { name: contact.errors.name }),
  ...(!PHONE.test(v.phone.trim()) && { phone: contact.errors.phone }),
  ...(v.email.trim() && !EMAIL.test(v.email.trim()) && { email: contact.errors.email }),
  ...(!v.message.trim() && { message: contact.errors.message }),
});

function Line({ field, error, children }: { field: Field; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`contact-${field}`} className="sr-only">
        {contact.fields[field]}
      </label>
      <div className="relative">
        {children}
        <span className="absolute inset-x-0 bottom-0 h-[0.6px] bg-field" />
        <span className={cx("absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-wine transition-transform duration-500 peer-focus:scale-x-100", error && "scale-x-100")} />
      </div>
      {error && (
        <p id={`contact-${field}-error`} className="mt-2 text-[10px] text-wine">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm({ endpoint }: { endpoint: string | null }) {
  const [values, setValues] = useState<Values>(empty);
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [failMessage, setFailMessage] = useState<string>(contact.failed);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((x) => ({ ...x, [field]: undefined }));
    if (state === "done" || state === "failed") setState("idle");
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "sending") return;
    const found = check(values);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) return document.getElementById(`contact-${first}`)?.focus();
    if (!endpoint) return (setValues(empty), setState("done"));
    setState("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: trap || undefined }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        setValues(empty);
        return setState("done");
      }
      // 400: dữ liệu BE không nhận; 429: gửi quá nhiều — BE trả câu tiếng Việt
      const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
      setFailMessage((res.status === 400 || res.status === 429) && message ? message : contact.failed);
    } catch {
      setFailMessage(contact.failed);
    }
    setState("failed");
  };

  const input = "peer w-full bg-transparent pb-4 text-[12px] tracking-[0.04em] text-ink outline-none placeholder:text-muted focus-visible:outline-none";
  const describedBy = (f: Field) => (errors[f] ? `contact-${f}-error` : undefined);

  return (
    <form noValidate onSubmit={submit} data-reveal="fade" className="mt-14 pl-1 md:mt-[52px]" aria-busy={state === "sending"}>
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Line field="name" error={errors.name}>
          <input
            id="contact-name"
            autoComplete="name"
            maxLength={60}
            value={values.name}
            onChange={set("name")}
            placeholder={contact.fields.name}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
            className={input}
          />
        </Line>
        <Line field="phone" error={errors.phone}>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={values.phone}
            onChange={set("phone")}
            placeholder={contact.fields.phone}
            aria-invalid={!!errors.phone}
            aria-describedby={describedBy("phone")}
            className={input}
          />
        </Line>
      </div>
      <div className="mt-7">
        <Line field="email" error={errors.email}>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={values.email}
            onChange={set("email")}
            placeholder={contact.fields.email}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            className={input}
          />
        </Line>
      </div>
      <div className="mt-7">
        <Line field="message" error={errors.message}>
          <textarea
            id="contact-message"
            rows={3}
            maxLength={MAX}
            value={values.message}
            onChange={set("message")}
            placeholder={contact.fields.message}
            aria-invalid={!!errors.message}
            aria-describedby={describedBy("message")}
            className={cx(input, "block resize-none leading-[20px]")}
          />
        </Line>
        {values.message.length > MAX - 100 && <p className="mt-1 text-right text-[10px] text-muted">{`${values.message.length}/${MAX}`}</p>}
      </div>
      {/* Bẫy bot: ẩn khỏi người dùng và trình đọc màn hình */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden value={trap} onChange={(e) => setTrap(e.target.value)} className="absolute -left-[9999px] h-px w-px opacity-0" />

      <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div role="status" className="max-w-[340px] text-[10px] leading-[18px] text-muted">
          {state === "done" ? (
            <p className="text-wine">{contact.done}</p>
          ) : state === "failed" ? (
            <p className="text-wine">{failMessage}</p>
          ) : state === "sending" ? (
            <p>{contact.sending}</p>
          ) : (
            <p>{contact.note}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={state === "sending"}
          className="group shrink-0 border-[0.6px] border-wine px-6 py-3.5 text-[11px] tracking-[0.07em] text-wine uppercase transition-colors duration-300 hover:bg-wine hover:text-cream disabled:opacity-50"
        >
          {contact.submit}
          <span aria-hidden className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            ↗
          </span>
        </button>
      </div>
    </form>
  );
}
