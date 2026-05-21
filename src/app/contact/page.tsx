"use client";

import { useState } from "react";
import Link from "next/link";
import { saveContact } from "@/lib/contacts";

const SUBJECTS = [
  "General Enquiry",
  "Customer Feedback",
  "Order Issue",
  "Franchise & Partnership",
  "Press & Media",
  "Careers",
  "Sustainability",
  "Other",
];

const CHANNELS = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.08 2.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Hotline",
    value: "1800 6567",
    sub: "Mon – Sun · 07:00 – 22:00",
    href: "tel:18006567",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email",
    value: "hello@highlandscoffee.vn",
    sub: "Reply within 1 business day",
    href: "mailto:hello@highlandscoffee.vn",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: "Head Office",
    value: "Tòa nhà Vietcombank, 198 Trần Quang Khải, Hà Nội",
    sub: "Mon – Fri · 08:30 – 17:30",
    href: "https://maps.google.com/?q=198+Tran+Quang+Khai+Hanoi",
  },
];

const DEPARTMENTS = [
  { name: "Customer Care", email: "care@highlandscoffee.vn", desc: "Order issues, store feedback, product questions" },
  { name: "Press & Media", email: "press@highlandscoffee.vn", desc: "Interview requests, brand assets, news enquiries" },
  { name: "Partnerships", email: "partners@highlandscoffee.vn", desc: "Franchise, B2B supply, co-branding opportunities" },
  { name: "Sustainability", email: "green@highlandscoffee.vn", desc: "ESG enquiries, NGO collaborations, reporting" },
];

type FormState = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [state, setState] = useState<FormState>("idle");
  const [refId, setRefId] = useState("");

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.email.trim()) e.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email.";
    if (!form.subject) e.subject = "Please choose a subject.";
    if (!form.message.trim()) e.message = "Please write your message.";
    else if (form.message.trim().length < 20) e.message = "Message must be at least 20 characters.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setState("sending");

    const id = "CTT-" + Date.now().toString(36).toUpperCase();
    setRefId(id);

    saveContact({
      id,
      refId: id,
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      submittedAt: new Date().toISOString(),
      status: "new",
    });

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, subject: form.subject, refId: id }),
    }).catch(() => {});

    setState("success");
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="min-h-screen bg-[#FAF6EF]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#3B1F0A] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <span className="text-white font-bold tracking-[0.25em] text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
              HIGHLANDS
            </span>
            <span className="text-white/35 text-[11px] tracking-[0.2em] uppercase">Coffee</span>
          </Link>
          <Link href="/" className="text-white/55 hover:text-white text-sm transition-colors hidden sm:block">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#3B1F0A] pt-16 pb-20 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#C8820A]/8 to-transparent pointer-events-none hidden lg:block" />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Get In Touch</p>
          <h1
            className="font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(36px, 6vw, 64px)" }}
          >
            We'd Love to
            <br />Hear From You
          </h1>
          <p className="text-white/45 text-base max-w-lg leading-relaxed">
            Whether you have a question about your order, a partnership idea, or just want to say hello — our team is here and happy to help.
          </p>
        </div>
      </section>

      {/* ── Contact channels ── */}
      <section className="bg-[#C8820A] px-6 lg:px-8 py-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20">
          {CHANNELS.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target={ch.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-start gap-4 px-6 py-7 hover:bg-white/10 transition-colors duration-200 group"
            >
              <span className="text-white/80 group-hover:text-white transition-colors mt-0.5 shrink-0">
                {ch.icon}
              </span>
              <div>
                <p className="text-white/55 text-[10px] font-semibold tracking-widest uppercase mb-1">{ch.label}</p>
                <p className="text-white font-semibold text-[15px] leading-snug mb-1">{ch.value}</p>
                <p className="text-white/55 text-xs">{ch.sub}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Main: Form + Departments ── */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">

          {/* Form */}
          <div className="bg-white border border-[#3B1F0A]/8 p-8 lg:p-10">
            {state === "success" ? (
              <div className="flex flex-col items-center text-center py-12">
                <div className="w-16 h-16 bg-[#2D5016]/10 flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" stroke="#2D5016" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2
                  className="font-bold text-[#3B1F0A] text-2xl mb-3"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Message Sent!
                </h2>
                <p className="text-[#3B1F0A]/55 text-sm leading-relaxed max-w-sm mb-3">
                  Thanks for reaching out, <strong className="text-[#3B1F0A]">{form.name}</strong>. A confirmation email has been sent to <strong className="text-[#3B1F0A]">{form.email}</strong>.
                </p>
                <p className="text-[#3B1F0A]/40 text-xs mb-8">
                  Reference: <span className="font-mono font-semibold text-[#3B1F0A]/70">{refId}</span>
                </p>
                <button
                  onClick={() => { setState("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="text-[#C8820A] text-sm font-semibold underline underline-offset-4 hover:text-[#3B1F0A] transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2
                  className="font-bold text-[#3B1F0A] text-2xl mb-1"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Send Us a Message
                </h2>
                <p className="text-[#3B1F0A]/45 text-sm mb-8">All fields are required.</p>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        {...field("name")}
                        className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none transition-colors ${errors.name ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"}`}
                      />
                      {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...field("email")}
                        className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none transition-colors ${errors.email ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"}`}
                      />
                      {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        {...field("subject")}
                        className={`w-full appearance-none border px-4 py-3 text-sm text-[#3B1F0A] focus:outline-none transition-colors bg-white ${errors.subject ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"} ${!form.subject ? "text-[#3B1F0A]/40" : ""}`}
                      >
                        <option value="" disabled>Select a topic…</option>
                        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3B1F0A]/40 pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {errors.subject && <p className="mt-1.5 text-xs text-red-500">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Tell us how we can help…"
                      {...field("message")}
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none transition-colors resize-none ${errors.message ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"}`}
                    />
                    <div className="flex items-start justify-between mt-1.5">
                      {errors.message
                        ? <p className="text-xs text-red-500">{errors.message}</p>
                        : <span />}
                      <span className={`text-xs ml-auto ${form.message.length > 500 ? "text-red-400" : "text-[#3B1F0A]/30"}`}>
                        {form.message.length}/500
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="w-full bg-[#3B1F0A] text-white py-4 text-sm font-semibold tracking-wider hover:bg-[#C8820A] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {state === "sending" ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Department contacts */}
            <div>
              <h3
                className="font-bold text-[#3B1F0A] text-lg mb-5"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Contact by Department
              </h3>
              <div className="space-y-3">
                {DEPARTMENTS.map((d) => (
                  <div key={d.name} className="bg-white border border-[#3B1F0A]/8 px-5 py-4 hover:border-[#C8820A]/40 hover:shadow-sm transition-all duration-200 group">
                    <p className="text-[#3B1F0A] font-semibold text-sm mb-0.5">{d.name}</p>
                    <p className="text-[#3B1F0A]/45 text-xs mb-2 leading-snug">{d.desc}</p>
                    <a
                      href={`mailto:${d.email}`}
                      className="text-[#C8820A] text-xs font-medium hover:underline underline-offset-4"
                    >
                      {d.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Business hours */}
            <div className="bg-[#3B1F0A] px-6 py-6">
              <h3
                className="font-bold text-white text-base mb-4"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Support Hours
              </h3>
              <div className="space-y-2.5">
                {[
                  { day: "Monday – Friday", time: "08:00 – 22:00" },
                  { day: "Saturday", time: "09:00 – 21:00" },
                  { day: "Sunday & Holidays", time: "09:00 – 18:00" },
                ].map((row) => (
                  <div key={row.day} className="flex justify-between text-sm">
                    <span className="text-white/50">{row.day}</span>
                    <span className="text-white font-medium">{row.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-white/10">
                <p className="text-white/40 text-xs leading-relaxed">
                  For urgent store-related issues, call our hotline at{" "}
                  <a href="tel:18006567" className="text-[#C8820A] font-semibold">1800 6567</a>{" "}
                  — available 7 days a week.
                </p>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white border border-[#3B1F0A]/8 px-6 py-5">
              <p className="text-[#3B1F0A]/50 text-xs font-semibold tracking-widest uppercase mb-4">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { label: "Facebook", d: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                  { label: "Instagram", d: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z" },
                  { label: "TikTok", d: "M9 12a4 4 0 104 4V4a5 5 0 005 5" },
                  { label: "YouTube", d: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="w-9 h-9 border border-[#3B1F0A]/12 flex items-center justify-center text-[#3B1F0A]/40 hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d={s.d} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A0D00] py-8 px-6 text-center">
        <p className="text-white/25 text-xs">
          © 2026 Highlands Coffee Corporation · We aim to respond to all enquiries within one business day.
        </p>
      </footer>

    </div>
  );
}
