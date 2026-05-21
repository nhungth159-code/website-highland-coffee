"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Scroll-reveal helper ──────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const translate =
    direction === "left"  ? "translateX(-36px)" :
    direction === "right" ? "translateX(36px)"  :
    direction === "none"  ? "none"              : "translateY(30px)";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : translate,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────
const STATS = [
  { value: "1999",  label: "Year Founded",        sub: "Hà Nội, Vietnam" },
  { value: "500+",  label: "Stores Nationwide",   sub: "From Hà Nội to Cà Mau" },
  { value: "25+",   label: "Years of Excellence", sub: "And still growing" },
  { value: "50M+",  label: "Cups Served",         sub: "Every single year" },
];

const VALUES = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M12 6v6l4 2" strokeLinecap="round" />
      </svg>
    ),
    title: "Rooted in Vietnam",
    body: "Every bean we source traces back to the highlands of Đắk Lắk and Đà Lạt. We celebrate Vietnamese coffee culture — not imitate others. Our identity is the red soil, the mountain mist, and the patient ritual of the phin filter.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    ),
    title: "People First",
    body: "From the farmers who grow our coffee to the baristas who serve it and the customers who linger over it — every decision we make centres on people. We invest in training, fair wages, and community programmes across every city we call home.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Uncompromising Quality",
    body: "Our roasting team tastes over 200 cups a week to maintain consistency. Every espresso shot is timed. Every phin is weighed. Quality is not a talking point — it is a daily discipline that shapes every cup we hand across the counter.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945" />
        <path d="M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064" />
        <path d="M15 20.488V18a2 2 0 012-2h3.064" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    title: "Built to Last",
    body: "Highlands Coffee is a long-term project, not a trend. We plant trees, reduce single-use plastics, and partner with highland farmers on multi-year contracts that give them stability to invest in their land and their families.",
  },
];

const MILESTONES = [
  { year: "1999", event: "First store opens on Đinh Tiên Hoàng, Hà Nội", detail: "Founder David Thái opens the doors with just 12 seats and a hand-written menu." },
  { year: "2002", event: "Cà Phê Sữa Đá Blended launches", detail: "The ice-blended signature sells out on day one and never leaves the menu." },
  { year: "2008", event: "50th store — first in Hồ Chí Minh City", detail: "Highlands becomes the first homegrown café brand to operate at national scale." },
  { year: "2012", event: "Jollibee Foods acquires majority stake", detail: "Strategic partnership funds rapid expansion across Vietnam's tier-2 cities." },
  { year: "2016", event: "100th store milestone", detail: "Celebrations held in all six regions. A cup of coffee for every customer, nationwide." },
  { year: "2019", event: "20th Anniversary — 'Back to the Highlands' campaign", detail: "Multi-city events reconnect customers with the origin story and the farmers." },
  { year: "2022", event: "Sustainability roadmap launched", detail: "Commitment to 50% recycled packaging and direct farmer partnership by 2026." },
  { year: "2024", event: "500+ stores across Vietnam", detail: "From Lào Cai to Cà Mau — a cup of Highlands Coffee within reach of every Vietnamese." },
];

const TEAM = [
  {
    name: "David Thái",
    role: "Founder & Chairman",
    bio: "Visionary entrepreneur who built Highlands Coffee from a single 12-seat café into Vietnam's most beloved coffee brand.",
    initials: "DT",
    color: "#3B1F0A",
  },
  {
    name: "Nguyễn Minh Tâm",
    role: "Chief Executive Officer",
    bio: "25 years in F&B. Led the brand through its most ambitious expansion phase and the launch of the sustainability programme.",
    initials: "MT",
    color: "#C8820A",
  },
  {
    name: "Lê Thanh Hương",
    role: "Chief Brand Officer",
    bio: "The creative force behind every campaign. Passionate about authentic Vietnamese storytelling and the art of slow coffee.",
    initials: "TH",
    color: "#2D5016",
  },
  {
    name: "Trần Quốc Bảo",
    role: "Head of Coffee Excellence",
    bio: "SCA-certified Q Grader. Oversees sourcing from 300+ farm partners across Đắk Lắk, Đà Lạt, and Sơn La.",
    initials: "QB",
    color: "#1A0D00",
  },
];

// ── Page ──────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="bg-[#FAF6EF]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#3B1F0A] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <span className="text-white font-bold tracking-[0.25em] text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
              HIGHLANDS
            </span>
            <span className="text-white/35 text-[11px] tracking-[0.2em] uppercase">Coffee</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {[
              { label: "Our Story",  href: "#story" },
              { label: "Values",     href: "#values" },
              { label: "Milestones", href: "#milestones" },
              { label: "Team",       href: "#team" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-white/55 hover:text-white transition-colors">{l.label}</a>
            ))}
          </nav>
          <Link href="/" className="text-white/55 hover:text-white text-sm transition-colors ml-6 hidden sm:block">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative bg-[#1A0D00] overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {[500, 800, 1100, 1400].map((s) => (
            <div key={s} className="absolute rounded-full border border-[#C8820A]/[0.05]"
              style={{ width: s, height: s, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>

        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-28 text-center">
          <FadeIn direction="none">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.45em] uppercase mb-6">
              About Highlands Coffee
            </p>
          </FadeIn>
          <FadeIn delay={120}>
            <h1
              className="font-bold text-white leading-[1.1] mb-7"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(42px, 8vw, 88px)" }}
            >
              Born in the Highlands.
              <br />
              <span className="text-[#C8820A]">Brewed for Vietnam.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={220}>
            <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Since 1999, we have built more than a coffee brand. We built a ritual, a community, and
              a celebration of everything that makes Vietnamese coffee extraordinary.
            </p>
          </FadeIn>
          <FadeIn delay={320}>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="#story"
                className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-7 py-3.5 text-sm font-bold tracking-wide hover:bg-white hover:text-[#3B1F0A] transition-all">
                Our Story
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <Link href="/careers"
                className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-7 py-3.5 text-sm font-semibold hover:border-white hover:text-white transition-all">
                Join Our Team
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Amber bottom edge */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#C8820A] to-transparent opacity-60" />
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="bg-[#3B1F0A]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 80} className="bg-[#3B1F0A] px-8 py-8 text-center">
              <p
                className="text-[#C8820A] font-bold mb-1"
                style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 5vw, 48px)" }}
              >
                {s.value}
              </p>
              <p className="text-white font-semibold text-sm tracking-wide">{s.label}</p>
              <p className="text-white/35 text-xs mt-1">{s.sub}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────── */}
      <section id="story" className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Visual */}
            <FadeIn direction="left" className="relative">
              <div
                className="aspect-[4/5] w-full relative overflow-hidden"
                style={{ background: "linear-gradient(145deg, #3B1F0A 0%, #6B3A1F 50%, #C8820A 100%)" }}
              >
                {/* Geometric coffee illustration */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  {[200, 160, 120, 80].map((s) => (
                    <div key={s} className="absolute rounded-full border border-white"
                      style={{ width: s, height: s }} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="120" height="120" fill="none" stroke="white" strokeWidth="1" viewBox="0 0 24 24" className="opacity-30">
                    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" />
                    <path d="M6 1v3M10 1v3M14 1v3" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Year badge */}
                <div className="absolute bottom-0 left-0 bg-[#C8820A] px-8 py-5">
                  <p className="text-white/60 text-[10px] tracking-widest uppercase mb-0.5">Founded</p>
                  <p className="text-white font-bold text-3xl" style={{ fontFamily: "var(--font-playfair), serif" }}>1999</p>
                </div>

                {/* Accent line */}
                <div className="absolute top-0 right-0 w-1 h-full bg-[#C8820A]/30" />
              </div>

              {/* Floating quote card */}
              <div className="absolute -bottom-6 -right-6 bg-white shadow-xl px-6 py-5 max-w-xs hidden lg:block">
                <p className="text-[#3B1F0A] text-sm font-semibold leading-relaxed" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  "Not an imitation. Not a trend. A celebration of Vietnam."
                </p>
                <p className="text-[#C8820A] text-xs font-semibold mt-2">— David Thái, Founder</p>
              </div>
            </FadeIn>

            {/* Text */}
            <FadeIn direction="right" delay={100}>
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Our Story</p>
              <h2
                className="font-bold text-[#3B1F0A] leading-tight mb-6"
                style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
              >
                A single café.
                <br />A national ritual.
              </h2>
              <div className="space-y-4 text-[#3B1F0A]/70 leading-relaxed text-[15px]">
                <p>
                  In 1999, David Thái opened Highlands Coffee's first store on Đinh Tiên Hoàng Street in Hà Nội with a conviction:
                  Vietnam had the world's finest coffee, grown in its own backyard, and it deserved a home-grown brand
                  to showcase it with pride.
                </p>
                <p>
                  The early days were modest — twelve seats, a hand-written menu, and a queue that stretched out the door
                  before 7am. Customers didn't come just for the coffee. They came for the feeling: warm, familiar,
                  unmistakably Vietnamese.
                </p>
                <p>
                  Twenty-five years later, Highlands Coffee operates more than 500 stores from Lào Cai to Cà Mau,
                  employs over 10,000 people, and serves upwards of 50 million cups a year. But the founding conviction
                  has never wavered — every cup begins in the highlands.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/heritage"
                  className="inline-flex items-center gap-2 bg-[#3B1F0A] text-white px-6 py-3 text-sm font-bold tracking-wide hover:bg-[#C8820A] transition-colors">
                  Full Heritage Story
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/sustainability"
                  className="inline-flex items-center gap-2 border border-[#3B1F0A]/20 text-[#3B1F0A]/65 px-6 py-3 text-sm font-semibold hover:border-[#3B1F0A] hover:text-[#3B1F0A] transition-all">
                  Sustainability
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────── */}
      <section id="values" className="bg-[#1A0D00] py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">What We Stand For</p>
            <h2
              className="font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Our Core Values
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5">
            {VALUES.map((v, i) => (
              <FadeIn key={v.title} delay={i * 100} className="bg-[#1A0D00] p-8 lg:p-10 group hover:bg-[#3B1F0A]/40 transition-colors duration-300">
                <div className="w-12 h-12 border border-[#C8820A]/30 flex items-center justify-center text-[#C8820A] mb-5 group-hover:bg-[#C8820A]/10 transition-colors">
                  {v.icon}
                </div>
                <h3
                  className="font-bold text-white text-xl mb-3"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {v.title}
                </h3>
                <p className="text-white/45 leading-relaxed text-[14px]">{v.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Milestones ────────────────────────────────────────── */}
      <section id="milestones" className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">25 Years in the Making</p>
            <h2
              className="font-bold text-[#3B1F0A]"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Key Milestones
            </h2>
          </FadeIn>

          <div className="relative">
            {/* Centre line */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-[#3B1F0A]/12 hidden sm:block" />

            <div className="space-y-0">
              {MILESTONES.map((m, i) => (
                <FadeIn key={m.year} delay={i * 60} className="relative flex gap-6 sm:gap-8 group">
                  {/* Year */}
                  <div className="shrink-0 w-[88px] text-right hidden sm:block pt-6">
                    <span
                      className="font-bold text-[#C8820A] text-lg"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      {m.year}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="relative shrink-0 hidden sm:flex flex-col items-center pt-6">
                    <div className="w-3 h-3 rounded-full bg-[#C8820A] border-2 border-[#FAF6EF] relative z-10 mt-1.5 group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 border-b border-[#3B1F0A]/8 pb-8 pt-6">
                    <p className="text-[#C8820A] text-xs font-bold tracking-widest uppercase mb-1 sm:hidden">{m.year}</p>
                    <h3 className="font-bold text-[#3B1F0A] mb-1.5 text-base" style={{ fontFamily: "var(--font-playfair), serif" }}>
                      {m.event}
                    </h3>
                    <p className="text-[#3B1F0A]/50 text-sm leading-relaxed">{m.detail}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coffee Origin ─────────────────────────────────────── */}
      <section className="bg-[#2D5016] py-24 px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">From Farm to Cup</p>
              <h2
                className="font-bold text-white leading-tight mb-6"
                style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
              >
                Every bean has
                <br />an address.
              </h2>
              <div className="space-y-4 text-white/60 leading-relaxed text-[15px]">
                <p>
                  We source directly from over 300 farm partners across Đắk Lắk, Đà Lạt, and Sơn La.
                  Our Head of Coffee Excellence — an SCA-certified Q Grader — visits each partner farm
                  twice a year to assess crop health, drying methods, and flavour profiles.
                </p>
                <p>
                  Our signature blend combines Robusta from the fertile lowlands of Đắk Lắk — bold, earthy,
                  high-caffeine — with Arabica from the cool mist of Cầu Đất at 1,500 metres above sea level,
                  which adds a floral brightness that distinguishes Highlands Coffee from every other cup.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: "300+", label: "Farm Partners" },
                  { value: "1,500m", label: "Max Altitude" },
                  { value: "100%", label: "Vietnamese Origin" },
                ].map((s) => (
                  <div key={s.label} className="border border-white/15 px-4 py-4 text-center">
                    <p className="font-bold text-[#C8820A] text-xl" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
                    <p className="text-white/45 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={150}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { region: "Đắk Lắk",  role: "Robusta heartland",    elevation: "500–800m",   note: "Bold, rich, intense" },
                  { region: "Đà Lạt",   role: "Arabica highlands",    elevation: "1,200–1,600m", note: "Floral, bright, complex" },
                  { region: "Sơn La",   role: "Emerging origin",      elevation: "800–1,200m",  note: "Fruity, nuanced" },
                  { region: "Lâm Đồng", role: "Specialty micro-lots", elevation: "1,400–1,700m", note: "Rare, experimental" },
                ].map((r, i) => (
                  <FadeIn key={r.region} delay={i * 80}
                    className="bg-white/10 border border-white/10 p-5 hover:bg-white/15 transition-colors">
                    <p className="font-bold text-white text-sm mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>{r.region}</p>
                    <p className="text-[#C8820A] text-[11px] font-semibold mb-2">{r.role}</p>
                    <p className="text-white/40 text-xs">{r.elevation}</p>
                    <p className="text-white/55 text-xs mt-1 italic">{r.note}</p>
                  </FadeIn>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Leadership Team ────────────────────────────────────── */}
      <section id="team" className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">The People Behind the Brand</p>
            <h2
              className="font-bold text-[#3B1F0A]"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Leadership Team
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((person, i) => (
              <FadeIn key={person.name} delay={i * 80}>
                <div className="group">
                  {/* Avatar */}
                  <div
                    className="w-full aspect-square flex items-center justify-center mb-4 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${person.color} 0%, ${person.color}cc 100%)` }}
                  >
                    <span
                      className="text-white/20 font-bold select-none"
                      style={{ fontFamily: "var(--font-playfair), serif", fontSize: 80 }}
                    >
                      {person.initials}
                    </span>
                    {/* Subtle grid */}
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 30px, white 30px, white 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, white 30px, white 31px)" }} />
                  </div>
                  <h3 className="font-bold text-[#3B1F0A] text-base mb-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {person.name}
                  </h3>
                  <p className="text-[#C8820A] text-xs font-semibold tracking-wide uppercase mb-2">{person.role}</p>
                  <p className="text-[#3B1F0A]/50 text-sm leading-relaxed">{person.bio}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Press / Awards ────────────────────────────────────── */}
      <section className="bg-[#3B1F0A] py-16 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">Recognition</p>
            <h2
              className="font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px, 3vw, 36px)" }}
            >
              Awards & Milestones
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/8">
            {[
              { award: "Vietnam's Most Trusted Brand", body: "Nielsen Vietnam", year: "2019–2024" },
              { award: "#1 Coffee Chain", body: "Vietnam F&B Report", year: "2020–2024" },
              { award: "Top Employer", body: "Great Place to Work® Vietnam", year: "2022, 2023" },
            ].map((a, i) => (
              <FadeIn key={a.award} delay={i * 100} className="bg-[#3B1F0A] px-8 py-8 text-center">
                <div className="w-10 h-10 border border-[#C8820A]/30 flex items-center justify-center mx-auto mb-4">
                  <svg width="18" height="18" fill="none" stroke="#C8820A" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="font-bold text-white text-sm mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>{a.award}</p>
                <p className="text-white/40 text-xs">{a.body}</p>
                <p className="text-[#C8820A] text-xs font-semibold mt-1">{a.year}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 lg:px-8 bg-[#FAF6EF] relative overflow-hidden">
        {/* Background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[400, 600, 800].map((s) => (
            <div key={s} className="absolute rounded-full border border-[#3B1F0A]/5"
              style={{ width: s, height: s }} />
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <FadeIn>
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Become Part of the Story</p>
            <h2
              className="font-bold text-[#3B1F0A] mb-5"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 48px)" }}
            >
              We're always looking
              <br />for great people.
            </h2>
            <p className="text-[#3B1F0A]/55 text-base leading-relaxed mb-8 max-w-lg mx-auto">
              From baristas to brand strategists, engineers to agronomists — Highlands Coffee grows when
              its people grow. See what's open, or send us an open application.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/careers"
                className="inline-flex items-center gap-2 bg-[#3B1F0A] text-white px-8 py-3.5 text-sm font-bold tracking-wide hover:bg-[#C8820A] transition-colors">
                View Open Roles
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/contact"
                className="inline-flex items-center gap-2 border border-[#3B1F0A]/20 text-[#3B1F0A]/65 px-8 py-3.5 text-sm font-semibold hover:border-[#3B1F0A] hover:text-[#3B1F0A] transition-all">
                Get in Touch
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer strip ──────────────────────────────────────── */}
      <div className="bg-[#1A0D00] py-6 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">© 2026 Highlands Coffee Corporation. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            {[
              { label: "Heritage", href: "/heritage" },
              { label: "Sustainability", href: "/sustainability" },
              { label: "Careers", href: "/careers" },
              { label: "Stores", href: "/stores" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white/60 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
