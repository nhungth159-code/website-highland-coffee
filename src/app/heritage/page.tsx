"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const translate = direction === "left" ? "translateX(-32px)" : direction === "right" ? "translateX(32px)" : "translateY(28px)";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0)" : translate,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const TIMELINE = [
  {
    year: "1857",
    title: "Coffee Arrives in Vietnam",
    body: "French missionaries introduce Coffea arabica seedlings to the fertile highlands of central Vietnam. Planted in the red basalt soils of Cầu Đất and the foggy plateaus of Đà Lạt, the first harvests reveal a flavour unlike any coffee grown elsewhere — complex, earthy, with a lingering sweetness.",
    side: "left",
  },
  {
    year: "1975",
    title: "Robusta Takes Root",
    body: "Post-reunification Vietnam begins scaling coffee cultivation in Đắk Lắk province. The Robusta variety thrives at lower elevations, producing a bold, high-caffeine bean that becomes the backbone of the traditional Vietnamese drip style — phin-brewed, strong, and served with sweetened condensed milk.",
    side: "right",
  },
  {
    year: "1990s",
    title: "The Coffee Culture Blooms",
    body: "As Vietnam's economy opens up, a vibrant café culture spreads from Hà Nội to Sài Gòn. Sidewalk plastic-stool cafés give way to multi-storey gathering spaces. Coffee becomes more than a drink — it becomes the social fabric of modern Vietnamese life: where deals are struck, love stories begin, and afternoons disappear.",
    side: "left",
  },
  {
    year: "1999",
    title: "Highlands Coffee Is Founded",
    body: "David Thái opens the first Highlands Coffee store on Đinh Tiên Hoàng Street, Hà Nội, with a clear vision: to celebrate Vietnamese coffee on its own terms — not imitate Western chains, but build something rooted in the highlands, the people, and the ritual of the phin filter. The amber-brown logo is hand-sketched on a napkin.",
    side: "right",
  },
  {
    year: "2002",
    title: "The Phin Reimagined",
    body: "Highlands Coffee introduces its signature slow-drip phin service in-store, paired with an ice-blended Cà Phê Sữa Đá — a fusion of tradition and modernity that sells out on its first day. The recipe becomes the best-selling drink in the brand's history and defines an entire generation's taste memory.",
    side: "left",
  },
  {
    year: "2008",
    title: "Expanding South",
    body: "The brand opens its 50th store, crossing into Hồ Chí Minh City with its first location on Lý Tự Trọng. The southern market responds warmly. By year end, Highlands Coffee has become the first homegrown Vietnamese café brand to operate at national scale.",
    side: "right",
  },
  {
    year: "2012",
    title: "Jollibee Group Partnership",
    body: "The Jollibee Foods Corporation acquires a major stake in Highlands Coffee, bringing international operational expertise while preserving the brand's Vietnamese soul. The partnership accelerates store rollout across all major cities and begins the journey towards a 500+ store network.",
    side: "left",
  },
  {
    year: "2019",
    title: "Green Farm Initiative",
    body: "Highlands Coffee launches its direct-trade programme with 800 farming families in Gia Lai and Đắk Lắk — paying above-market prices, funding soil health training, and introducing rainwater irrigation systems. The programme marks the brand's formal commitment to a sustainable supply chain.",
    side: "right",
  },
  {
    year: "2024",
    title: "500 Stores & Beyond",
    body: "Highlands Coffee crosses the milestone of 500 stores nationwide — from Lào Cai in the north to Cà Mau at the southernmost tip of Vietnam. Each store still brews from the same volcanic highland beans, still uses the phin, still believes that the best cup of coffee is the one shared with someone you love.",
    side: "left",
  },
];

const VALUES = [
  {
    title: "Rooted in the Highlands",
    body: "Every bean we roast begins its journey in the highlands above 1,200 metres — where volcanic soil, cool mist, and altitude produce a natural complexity no lowland farm can replicate.",
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 22V12m0 0C12 7 7 4 3 6c0 5 3.5 9 9 9zm0 0c0-5 5-8 9-6-1 5-4.5 9-9 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "The Art of the Phin",
    body: "The Vietnamese phin filter is patience made tangible. Four minutes of slow drip, no pressure, no shortcuts. This is how Highlands Coffee has always brewed — and always will.",
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    title: "People Before Profit",
    body: "We have invested over ₫120 billion in the farming communities whose land and labour make our coffee possible. A fair supply chain is not charity — it is the only sustainable way to do business.",
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Vietnamese, Always",
    body: "We never set out to be a Vietnamese Starbucks. We set out to be something far more interesting: a Vietnamese coffee brand that stands for Vietnamese coffee — its history, its character, its people.",
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const REGIONS = [
  { name: "Cầu Đất, Đà Lạt", alt: "1,500m+", note: "Arabica · Floral, bright acidity" },
  { name: "Di Linh Plateau", alt: "1,200m", note: "Arabica · Stone fruit, mild body" },
  { name: "Buôn Ma Thuột", alt: "800m", note: "Robusta · Bold, chocolate, low acid" },
  { name: "Gia Lai Province", alt: "750m", note: "Robusta · Earthy, full-bodied" },
  { name: "Đắk Nông Highlands", alt: "700m", note: "Robusta · Smoky, deep caramel" },
];

export default function HeritagePage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#1A0D00]/95 backdrop-blur-sm">
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
      <section className="relative bg-[#1A0D00] min-h-[90vh] flex items-end overflow-hidden">
        {/* Layered background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[500, 800, 1100, 1400, 1700].map((s) => (
            <div key={s} className="absolute rounded-full border border-[#C8820A]/[0.04]" style={{ width: s, height: s }} />
          ))}
        </div>
        {/* Warm gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3B1F0A]/60 via-transparent to-[#2D5016]/20 pointer-events-none" />
        {/* Large decorative year */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-white/[0.03] font-bold select-none pointer-events-none leading-none hidden lg:block"
          style={{ fontFamily: "var(--font-playfair), serif", fontSize: "28vw" }}
        >
          1999
        </div>

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 pb-20 pt-32">
          <FadeIn>
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.45em] uppercase mb-6">
              Est. 1999 · Hà Nội, Vietnam
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1
              className="font-bold text-white leading-[1.0] mb-8"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(48px, 9vw, 100px)" }}
            >
              Born in the
              <br />
              <span className="text-[#C8820A]">Highlands.</span>
              <br />
              Brewed for
              <br />
              Vietnam.
            </h1>
          </FadeIn>
          <FadeIn delay={180}>
            <p className="text-white/45 text-lg max-w-xl leading-relaxed">
              A quarter-century of coffee, community, and an unbroken belief that
              Vietnamese beans deserve the world stage they were always meant for.
            </p>
          </FadeIn>
          {/* Scroll cue */}
          <div className="flex items-center gap-4 mt-14">
            <div className="h-px w-12 bg-[#C8820A]/50" />
            <span className="text-white/30 text-xs tracking-widest uppercase">Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ── Opening statement ── */}
      <section className="bg-[#3B1F0A] py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <blockquote
              className="font-bold text-white leading-snug"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px, 4vw, 40px)" }}
            >
              "We didn't build a coffee chain. We built a home — for the farmers who grow the beans,
              the baristas who brew them, and the millions of Vietnamese who begin every morning
              with a cup that tastes like belonging."
            </blockquote>
            <p className="text-[#C8820A] text-sm font-semibold mt-6 tracking-wider">
              — David Thái, Founder
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Origin of the bean ── */}
      <section className="py-24 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            {/* Decorative map placeholder */}
            <div className="relative bg-[#2D5016] aspect-[4/5] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Stylised topographic rings */}
                {[60, 120, 180, 240, 300].map((s) => (
                  <div key={s} className="absolute rounded-full border border-white/10" style={{ width: s, height: s }} />
                ))}
                <div className="text-center relative z-10">
                  <p className="text-white/30 text-[10px] tracking-widest uppercase mb-3">Growing regions</p>
                  <svg width="32" height="32" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto opacity-50">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              {/* Region pins */}
              {[
                { top: "18%", left: "42%", label: "Đà Lạt" },
                { top: "32%", left: "55%", label: "Di Linh" },
                { top: "28%", left: "28%", label: "Buôn Ma Thuột" },
                { top: "20%", left: "20%", label: "Gia Lai" },
                { top: "40%", left: "38%", label: "Đắk Nông" },
              ].map((p) => (
                <div key={p.label} className="absolute flex items-center gap-1.5" style={{ top: p.top, left: p.left }}>
                  <span className="w-2 h-2 rounded-full bg-[#C8820A] shrink-0 ring-2 ring-[#C8820A]/30" />
                  <span className="text-white/60 text-[10px] whitespace-nowrap">{p.label}</span>
                </div>
              ))}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A0D00]/80 to-transparent p-6">
                <p className="text-white/40 text-xs">Central Highlands · Vietnam</p>
                <p className="text-white font-semibold text-sm">700m – 1,500m elevation</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={100}>
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">
              The Terroir
            </p>
            <h2
              className="font-bold text-[#3B1F0A] leading-tight mb-6"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Where Altitude Becomes
              <br />Flavour
            </h2>
            <p className="text-[#3B1F0A]/60 leading-relaxed mb-6 text-[15px]">
              The volcanic red basalt soil of Vietnam's central highlands — formed by ancient eruptions and enriched by millennia of forest decay — creates a growing environment that cannot be replicated. Minerals drawn up through deep root systems deposit themselves directly into the cherry. Cool nights at altitude slow the ripening process, concentrating sugars. Morning mist provides natural humidity without requiring irrigation.
            </p>
            <p className="text-[#3B1F0A]/60 leading-relaxed mb-10 text-[15px]">
              The result is a bean with layered complexity: the brightness of high-altitude Arabica from Cầu Đất, the dense body of Đắk Lắk Robusta, and the floral brightness of Di Linh's fog-grown harvest. Highlands Coffee blends these profiles with precision — and guards the recipes fiercely.
            </p>
            <div className="border-t border-[#3B1F0A]/10 pt-8 space-y-3">
              {REGIONS.map((r) => (
                <div key={r.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8820A] shrink-0" />
                    <span className="text-[#3B1F0A] text-sm font-medium">{r.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#3B1F0A]/40 text-xs">{r.alt} · </span>
                    <span className="text-[#3B1F0A]/55 text-xs">{r.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-24 px-6 lg:px-8 bg-[#3B1F0A]">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Our Story</p>
            <h2
              className="font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              A Century in the Making
            </h2>
          </FadeIn>

          {/* Vertical timeline */}
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-white/8 hidden md:block" />

            <div className="space-y-12">
              {TIMELINE.map((item, i) => (
                <FadeIn key={item.year} delay={i * 60} direction={item.side === "left" ? "left" : "right"}>
                  <div className={`flex flex-col md:flex-row items-start gap-0 md:gap-8 ${item.side === "right" ? "md:flex-row-reverse" : ""}`}>
                    {/* Content block */}
                    <div className="flex-1 bg-white/5 border border-white/8 p-6 hover:border-[#C8820A]/30 hover:bg-white/8 transition-all duration-300 group">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-xs font-bold px-2.5 py-1 text-white"
                          style={{ background: "#C8820A" }}
                        >
                          {item.year}
                        </span>
                        <h3
                          className="font-bold text-white text-base group-hover:text-[#C8820A] transition-colors"
                          style={{ fontFamily: "var(--font-playfair), serif" }}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
                    </div>

                    {/* Centre dot */}
                    <div className="hidden md:flex w-4 shrink-0 justify-center pt-6">
                      <div className="w-3 h-3 rounded-full bg-[#C8820A] ring-4 ring-[#C8820A]/20 shrink-0" />
                    </div>

                    {/* Spacer for opposite side */}
                    <div className="flex-1 hidden md:block" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Core values ── */}
      <section className="py-24 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">What We Stand For</p>
            <h2
              className="font-bold text-[#3B1F0A]"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              The Values Behind Every Cup
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <FadeIn key={v.title} delay={i * 80}>
                <div className="bg-white border border-[#3B1F0A]/6 p-8 hover:shadow-lg transition-shadow duration-300 group h-full">
                  <div className="w-11 h-11 flex items-center justify-center bg-[#C8820A]/10 text-[#C8820A] mb-5 group-hover:bg-[#C8820A] group-hover:text-white transition-colors duration-300">
                    {v.icon}
                  </div>
                  <h3
                    className="font-bold text-[#3B1F0A] text-lg mb-3"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-[#3B1F0A]/55 text-sm leading-relaxed">{v.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Numbers ── */}
      <section className="bg-[#C8820A] py-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/20">
          {[
            { n: "1999", label: "Year Founded", sub: "Hà Nội, Vietnam" },
            { n: "500+", label: "Stores Nationwide", sub: "North to South" },
            { n: "25+", label: "Years of Heritage", sub: "And counting" },
            { n: "2,400+", label: "Partner Farmers", sub: "Central Highlands" },
          ].map((s) => (
            <div key={s.label} className="bg-[#C8820A] px-8 py-10 text-center">
              <p
                className="font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(30px, 4vw, 48px)" }}
              >
                {s.n}
              </p>
              <p className="text-white font-semibold text-sm mb-1">{s.label}</p>
              <p className="text-white/55 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="bg-[#1A0D00] py-24 px-6 lg:px-8 text-center">
        <FadeIn>
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">Continue the Story</p>
          <h2
            className="font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Every Cup Carries
            <br />This History
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-base leading-relaxed mb-10">
            When you hold a Highlands Coffee, you hold 25 years of craft, a farming family's harvest,
            and the quiet pride of a nation that turned humble beans into something extraordinary.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-8 py-3.5 text-sm font-semibold tracking-wider hover:bg-[#e09a20] transition-colors"
            >
              Order a Cup
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/sustainability"
              className="inline-flex items-center gap-2 border border-white/20 text-white/65 px-8 py-3.5 text-sm font-semibold tracking-wider hover:border-[#C8820A] hover:text-white transition-all"
            >
              Our Sustainability Story
            </Link>
          </div>
        </FadeIn>
      </section>

      <footer className="bg-[#1A0D00] border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/20 text-xs">
          © 2026 Highlands Coffee Corporation · Rooted in Vietnam since 1999.
        </p>
      </footer>
    </div>
  );
}
