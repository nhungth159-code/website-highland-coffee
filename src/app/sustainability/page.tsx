"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── Animated counter ── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let start = 0;
        const step = Math.ceil(to / 60);
        const tick = setInterval(() => {
          start = Math.min(start + step, to);
          setVal(start);
          if (start >= to) clearInterval(tick);
        }, 16);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Fade-in on scroll ── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const PILLARS = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 22V12m0 0C12 7 7 4 3 6c0 5 3.5 9 9 9zm0 0c0-5 5-8 9-6-1 5-4.5 9-9 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Sustainable Sourcing",
    body: "We partner directly with over 2,400 coffee farming families across the Central Highlands of Vietnam, ensuring fair wages, ethical growing practices, and long-term land stewardship.",
    accent: "#2D5016",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round" />
      </svg>
    ),
    title: "Carbon Commitment",
    body: "By 2030, every Highlands Coffee store will run on 100% renewable energy. We've already reduced per-cup carbon emissions by 38% since 2020 through solar installations and energy-efficient equipment.",
    accent: "#C8820A",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        <path d="M8 6V4a2 2 0 014 0v2M12 6V4a2 2 0 014 0v2" strokeLinecap="round" />
      </svg>
    ),
    title: "Zero-Waste Packaging",
    body: "Our cups, lids, and take-away bags are made from plant-based or recycled materials. We're on track to eliminate all single-use plastics from every store by the end of 2025.",
    accent: "#2D5016",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    ),
    title: "Community Impact",
    body: "The Highlands Foundation has invested ₫120 billion in rural education, clean water access, and vocational training for coffee-growing communities — because great coffee starts with thriving people.",
    accent: "#C8820A",
  },
];

const STATS = [
  { value: 2400, suffix: "+", label: "Farming families partnered", sub: "across the Central Highlands" },
  { value: 38, suffix: "%", label: "Carbon reduction per cup", sub: "since 2020 baseline" },
  { value: 92, suffix: "%", label: "Recyclable packaging", sub: "across all product lines" },
  { value: 120, suffix: "B₫", label: "Community investment", sub: "through the Highlands Foundation" },
];

const PROGRAMS = [
  {
    year: "2019",
    title: "Green Farm Initiative",
    desc: "Launched direct-trade partnerships with 800 farming families in Gia Lai and Đắk Lắk, providing training in organic farming and soil health practices.",
    color: "#2D5016",
  },
  {
    year: "2021",
    title: "Solar-Powered Stores",
    desc: "Retrofitted 120 flagship stores with rooftop solar panels, generating over 4.2 million kWh of clean energy annually and reducing electricity costs passed on to customers.",
    color: "#C8820A",
  },
  {
    year: "2022",
    title: "Cup for a Cup Program",
    desc: "Every reusable cup brought in earns a 10% discount. Since launch, we've diverted 8.6 million disposable cups from landfills and waterways.",
    color: "#2D5016",
  },
  {
    year: "2023",
    title: "Grounds to Garden",
    desc: "Used coffee grounds are collected daily from 300+ stores and converted into compost distributed free to urban gardeners and partner farms — turning waste into soil.",
    color: "#C8820A",
  },
  {
    year: "2024",
    title: "Water Stewardship",
    desc: "Installed water-recycling systems in all new store openings. Our rainwater capture infrastructure in the Central Highlands now supports irrigation for 400 farms during dry season.",
    color: "#2D5016",
  },
];

const GOALS = [
  { year: "2025", text: "100% plastic-free packaging across all 500+ stores", done: false },
  { year: "2026", text: "Achieve net-zero carbon for all company-owned logistics", done: false },
  { year: "2027", text: "Certify all supplier farms under Rainforest Alliance standards", done: false },
  { year: "2028", text: "Launch Highlands Eco-Store design in 50 pilot locations", done: false },
  { year: "2030", text: "100% renewable energy across the entire store network", done: false },
];

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">

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
      <section className="relative bg-[#1A0D00] overflow-hidden">
        {/* Background texture rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[600, 900, 1200, 1500].map((s) => (
            <div
              key={s}
              className="absolute rounded-full border border-white/[0.03]"
              style={{ width: s, height: s }}
            />
          ))}
        </div>
        {/* Green gradient wash */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#2D5016]/30 to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-[#2D5016]/40 border border-[#2D5016]/60 px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5016] inline-block animate-pulse" />
            <span className="text-[#86c46a] text-xs font-semibold tracking-widest uppercase">Our Commitment to the Planet</span>
          </div>
          <h1
            className="font-bold text-white leading-[1.05] mb-6"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(42px, 7vw, 80px)" }}
          >
            Coffee That
            <br />
            <span className="text-[#86c46a]">Gives Back</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            From the highlands of Gia Lai to the cup in your hand — every decision we make is guided by our promise to protect the land, the people, and the climate that make Vietnamese coffee extraordinary.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#programs" className="inline-flex items-center gap-2 bg-[#2D5016] text-white px-7 py-3.5 text-sm font-semibold tracking-wider hover:bg-[#3a6a1e] transition-colors duration-200">
              Our Programs
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href="#goals" className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-7 py-3.5 text-sm font-semibold tracking-wider hover:border-[#2D5016] hover:text-white transition-all duration-200">
              2030 Goals
            </a>
          </div>
        </div>

        {/* Amber accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C8820A]/40 to-transparent" />
      </section>

      {/* ── Stats ── */}
      <section className="bg-[#2D5016] py-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#2D5016] px-8 py-10 text-center">
              <p
                className="font-bold text-white leading-none mb-2"
                style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(36px, 5vw, 52px)" }}
              >
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-white text-sm font-semibold mb-1">{s.label}</p>
              <p className="text-white/45 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-24 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Four Pillars</p>
            <h2
              className="font-bold text-[#3B1F0A] leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(30px, 4vw, 44px)" }}
            >
              How We Work Toward a Better Future
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PILLARS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 80}>
                <div className="bg-white border border-[#3B1F0A]/6 p-8 hover:shadow-lg transition-shadow duration-300 group h-full">
                  <div
                    className="w-12 h-12 flex items-center justify-center mb-5 transition-colors duration-200"
                    style={{ background: p.accent + "18", color: p.accent }}
                  >
                    {p.icon}
                  </div>
                  <h3
                    className="font-bold text-[#3B1F0A] text-lg mb-3"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-[#3B1F0A]/60 text-sm leading-relaxed">{p.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs timeline ── */}
      <section id="programs" className="py-24 px-6 lg:px-8 bg-[#3B1F0A]">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="mb-16">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Our Initiatives</p>
            <h2
              className="font-bold text-white leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(30px, 4vw, 44px)" }}
            >
              Programs Making
              <br />a Real Difference
            </h2>
          </FadeIn>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[52px] top-0 bottom-0 w-px bg-white/10 hidden md:block" />

            <div className="space-y-10">
              {PROGRAMS.map((prog, i) => (
                <FadeIn key={prog.year} delay={i * 80}>
                  <div className="flex gap-6 md:gap-10 items-start group">
                    {/* Year badge */}
                    <div
                      className="shrink-0 w-[52px] text-center relative z-10"
                    >
                      <span
                        className="inline-block text-xs font-bold px-2 py-1 w-full text-center"
                        style={{ background: prog.color, color: "#fff" }}
                      >
                        {prog.year}
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/8 p-6 flex-1 group-hover:border-white/15 transition-colors duration-200">
                      <h3
                        className="font-bold text-white text-base mb-2"
                        style={{ fontFamily: "var(--font-playfair), serif" }}
                      >
                        {prog.title}
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">{prog.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2030 Goals ── */}
      <section id="goals" className="py-24 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="mb-14">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Roadmap</p>
            <h2
              className="font-bold text-[#3B1F0A] leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(30px, 4vw, 44px)" }}
            >
              Our 2030 Commitments
            </h2>
            <p className="text-[#3B1F0A]/55 mt-4 text-sm leading-relaxed max-w-xl">
              These are not aspirations — they are binding targets reviewed annually by our Sustainability Board and published in our Impact Report.
            </p>
          </FadeIn>

          <div className="space-y-3">
            {GOALS.map((g, i) => (
              <FadeIn key={g.year} delay={i * 60}>
                <div className="flex items-center gap-5 bg-white border border-[#3B1F0A]/6 px-6 py-5 group hover:border-[#2D5016]/30 hover:shadow-sm transition-all duration-200">
                  <span
                    className="shrink-0 text-xs font-bold px-2.5 py-1"
                    style={{ background: "#2D5016", color: "#fff" }}
                  >
                    {g.year}
                  </span>
                  <p className="text-[#3B1F0A]/75 text-sm leading-relaxed flex-1">{g.text}</p>
                  <svg className="shrink-0 text-[#2D5016]/40 group-hover:text-[#2D5016] transition-colors" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="py-20 px-6 lg:px-8 bg-[#2D5016]">
        <div className="max-w-5xl mx-auto text-center">
          <FadeIn>
            <p className="text-white/40 text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">Recognised By</p>
            <h2
              className="font-bold text-white mb-10"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(22px, 3vw, 32px)" }}
            >
              Our Standards &amp; Certifications
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                "Rainforest Alliance Certified",
                "UTZ Sustainable Farming",
                "ISO 14001 Environmental",
                "B Corp Pending 2025",
                "Vietnam Green Label",
              ].map((cert) => (
                <div
                  key={cert}
                  className="bg-white/10 border border-white/15 px-6 py-4 text-sm font-semibold text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200"
                >
                  {cert}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 lg:px-8 bg-[#1A0D00] text-center">
        <FadeIn>
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">Join the Movement</p>
          <h2
            className="font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Every Cup Is a Choice
          </h2>
          <p className="text-white/45 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            When you choose Highlands Coffee, you&apos;re supporting a supply chain that puts farmers, communities, and the environment first. Thank you for being part of this.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-8 py-3.5 text-sm font-semibold tracking-wider hover:bg-[#e09a20] transition-colors duration-200"
            >
              Order a Cup
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 border border-white/20 text-white/65 px-8 py-3.5 text-sm font-semibold tracking-wider hover:border-[#C8820A] hover:text-white transition-all duration-200"
            >
              Join Our Team
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A0D00] border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/25 text-xs">
          © 2026 Highlands Coffee Corporation · Sustainability Report published annually each April.
        </p>
      </footer>

    </div>
  );
}
