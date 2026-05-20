"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const IMG = "https://images.unsplash.com/photo-";
const q = "?auto=format&fit=crop&w=400&q=80";

const MENU = {
  Coffee: [
    {
      name: "Cà Phê Sữa Đá",
      desc: "Vietnam's iconic iced coffee — rich Robusta with velvety condensed milk over hand-chipped ice.",
      price: "35,000₫",
      img: `${IMG}jODz47eM1w8${q}`,
    },
    {
      name: "Bạc Xỉu",
      desc: "Mild espresso with a generous pour of sweetened milk — light, smooth, and endlessly comforting.",
      price: "35,000₫",
      img: `${IMG}hJJAyrscf_A${q}`,
    },
    {
      name: "Highlands Espresso",
      desc: "Double-shot espresso from single-origin Arabica grown at 1,500m in Cầu Đất, Đà Lạt.",
      price: "45,000₫",
      img: `${IMG}BnrKDRn5sjg${q}`,
    },
    {
      name: "Cold Brew",
      desc: "18-hour cold-steeped highland beans — silky, low-acid, with a naturally sweet finish.",
      price: "55,000₫",
      img: `${IMG}8yxIau08-58${q}`,
    },
  ],
  Tea: [
    {
      name: "Trà Đào Cam Sả",
      desc: "Sun-ripened peaches, fresh orange slices, and fragrant lemongrass in a golden iced tea.",
      price: "45,000₫",
      img: `${IMG}FnTWsBohkdo${q}`,
    },
    {
      name: "Trà Xanh Sữa",
      desc: "Matcha milk tea with hand-blended Da Lat green tea and a hint of toasted rice.",
      price: "50,000₫",
      img: `${IMG}rW_EmeV7dEU${q}`,
    },
    {
      name: "Hồng Trà Sữa",
      desc: "Black milk tea with creamy foam topping — warm, bold, and perfectly sweet.",
      price: "55,000₫",
      img: `${IMG}dXRRaiF_b_U${q}`,
    },
    {
      name: "Trà Tắc Tươi",
      desc: "Fresh-squeezed kumquat with premium jasmine tea — bright, tangy, and refreshing.",
      price: "40,000₫",
      img: `${IMG}hyDjDI9d6wQ${q}`,
    },
  ],
  Food: [
    {
      name: "Bánh Mì Bơ",
      desc: "Toasted Vietnamese baguette with cultured butter and fleur de sel — a simple morning ritual.",
      price: "25,000₫",
      img: `${IMG}wRU27yGfSLQ${q}`,
    },
    {
      name: "Croissant Hạnh Nhân",
      desc: "Flaky almond croissant baked fresh each morning, filled with house-made frangipane.",
      price: "45,000₫",
      img: `${IMG}ZV1acMlN9T0${q}`,
    },
    {
      name: "Bánh Phô Mai Matcha",
      desc: "Green tea cheesecake on a toasted sesame crust — soft, fragrant, and lightly bitter.",
      price: "55,000₫",
      img: `${IMG}LGNxQzYmeUk${q}`,
    },
    {
      name: "Tiramisu Cà Phê",
      desc: "House tiramisu soaked in Highland Cold Brew, dusted with premium Vietnamese cacao.",
      price: "60,000₫",
      img: `${IMG}BfJk5g7JCz4${q}`,
    },
  ],
} as const;

type MenuTab = keyof typeof MENU;

const NAV_LINKS = [
  { label: "Menu", href: "#menu" },
  { label: "Locations", href: "#locations" },
  { label: "Promotions", href: "#promotions" },
];

const FEATURED = [
  {
    name: "Cà Phê Sữa Đá",
    desc: "Vietnam's iconic iced coffee — rich Robusta with velvety condensed milk over hand-chipped ice.",
    price: "35,000₫",
    tag: "Classic",
    img: `${IMG}jODz47eM1w8?auto=format&fit=crop&w=800&q=80`,
  },
  {
    name: "Trà Đào Cam Sả",
    desc: "Sun-ripened peaches, orange slices, and fragrant lemongrass in a golden iced tea.",
    price: "45,000₫",
    tag: "Bestseller",
    img: `${IMG}FnTWsBohkdo?auto=format&fit=crop&w=800&q=80`,
  },
  {
    name: "Highland Cold Brew",
    desc: "Single-origin Arabica from Cầu Đất farm, cold-steeped 18 hours for unmatched silky depth.",
    price: "55,000₫",
    tag: "Premium",
    img: `${IMG}8yxIau08-58?auto=format&fit=crop&w=800&q=80`,
  },
];

const CITIES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Nha Trang"];

const FOOTER_COLS = [
  { heading: "Menu", links: ["Coffee", "Tea & More", "Food & Snacks", "Seasonal Specials"] },
  { heading: "Company", links: ["About Us", "Careers", "Sustainability", "Press"] },
  { heading: "Support", links: ["Find a Store", "FAQs", "Gift Cards", "Contact Us"] },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<MenuTab>("Coffee");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="bg-[#FAF6EF]"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF6EF]/96 backdrop-blur-md border-b border-[#3B1F0A]/8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.18em] text-[#3B1F0A] select-none"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            HIGHLANDS
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-[#3B1F0A]/65 hover:text-[#C8820A] transition-colors duration-200 tracking-wide"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button className="bg-[#C8820A] text-white text-sm font-semibold tracking-wider px-6 py-2.5 hover:bg-[#3B1F0A] transition-colors duration-200">
              Order Now
            </button>
          </div>

          <button
            className="md:hidden text-[#3B1F0A] p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#FAF6EF] border-t border-[#3B1F0A]/10 px-6 py-5 flex flex-col gap-5">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-[#3B1F0A]"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <button className="bg-[#C8820A] text-white text-sm font-semibold tracking-wider py-3 w-full mt-1">
              Order Now
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-[#1A0D00] flex items-center overflow-hidden pt-16">
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[700px] h-[700px] rounded-full border border-[#C8820A]/8" />
          <div className="absolute w-[520px] h-[520px] rounded-full border border-[#C8820A]/12" />
          <div className="absolute w-[340px] h-[340px] rounded-full border border-[#C8820A]/18" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-[#C8820A]/25" />
        </div>

        {/* Large background letterform */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block select-none pointer-events-none leading-none text-[#FAF6EF]/[0.04] text-[240px] font-bold tracking-tighter"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          COFFEE
        </div>

        {/* Warm gradient vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,#3B1F0A40_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#1A0D00] to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <div className="animate-fade-up flex items-center gap-3 mb-8">
              <div className="w-10 h-px bg-[#C8820A]" />
              <span className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase">
                Since 1999 · Vietnam
              </span>
            </div>

            <h1
              className="animate-fade-up-delay-1 text-6xl sm:text-7xl md:text-[90px] font-bold text-[#FAF6EF] leading-[0.93] tracking-tight mb-8"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Taste the
              <br />
              <em className="not-italic text-[#C8820A]">Highlands</em>
            </h1>

            <p className="animate-fade-up-delay-2 text-[#FAF6EF]/65 text-lg md:text-xl max-w-lg leading-relaxed mb-12">
              From the misty plateaus of Đà Lạt to your cup — every sip carries
              the story of Vietnam&apos;s finest highland coffee heritage.
            </p>

            <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4">
              <a
                href="#menu"
                className="inline-flex items-center justify-center gap-3 bg-[#C8820A] text-white px-8 py-4 text-sm font-semibold tracking-wider hover:bg-[#FAF6EF] hover:text-[#1A0D00] transition-all duration-200 group"
              >
                Explore Menu
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="group-hover:translate-x-1 transition-transform duration-200"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="#locations"
                className="inline-flex items-center justify-center gap-3 border border-[#FAF6EF]/25 text-[#FAF6EF] px-8 py-4 text-sm font-semibold tracking-wider hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200"
              >
                Find a Store
              </a>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-[#C8820A]/60" />
        </div>
      </section>

      {/* ─── FEATURED DRINKS ─────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">
                Handcrafted Selections
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-[#3B1F0A] leading-tight"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                This Season&apos;s
                <br />
                Favourites
              </h2>
            </div>
            <a
              href="#menu"
              className="text-sm font-semibold text-[#C8820A] hover:text-[#3B1F0A] transition-colors flex items-center gap-2 self-start md:self-auto"
            >
              View full menu
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {FEATURED.map((drink) => (
              <div key={drink.name} className="group cursor-pointer">
                <div className="h-72 relative overflow-hidden mb-6">
                  <Image
                    src={drink.img}
                    alt={drink.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold tracking-[0.2em] uppercase px-3 py-1.5">
                    {drink.tag}
                  </span>
                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="text-xl font-bold text-[#3B1F0A] mb-2"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      {drink.name}
                    </h3>
                    <p className="text-[#3B1F0A]/55 text-sm leading-relaxed">{drink.desc}</p>
                  </div>
                  <span className="text-[#C8820A] font-bold text-sm shrink-0 mt-0.5">{drink.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRAND STORY ─────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#3B1F0A] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image placeholder */}
            <div className="relative">
              <div
                className="aspect-[4/5] relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(200,130,10,0.25) 0%, #1A0D00 50%, rgba(45,80,22,0.35) 100%)",
                }}
              >
                {/* Inner decorative content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-28 h-28 rounded-full border border-[#C8820A]/30 flex items-center justify-center">
                    <svg
                      width="48"
                      height="48"
                      fill="none"
                      stroke="#C8820A"
                      strokeWidth="1"
                      viewBox="0 0 24 24"
                      opacity="0.5"
                    >
                      <path
                        d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[#C8820A]/35 text-[11px] tracking-[0.35em] uppercase font-semibold">
                    Đà Lạt · 1,500m
                  </span>
                </div>
                {/* Texture overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(200,130,10,0.1),transparent_60%)]" />
              </div>

              {/* Floating stat card */}
              <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-[#C8820A] p-6 w-44 shadow-2xl">
                <div
                  className="text-4xl font-bold text-white"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  25+
                </div>
                <div className="text-white/80 text-xs font-semibold tracking-wide mt-1 uppercase">
                  Years of craft
                </div>
              </div>

              {/* Decorative line */}
              <div className="absolute -top-6 -left-4 lg:-left-8 w-px h-24 bg-gradient-to-b from-[#C8820A]/60 to-transparent" />
            </div>

            {/* Text */}
            <div className="text-[#FAF6EF] lg:pl-8">
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">
                Our Story
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold leading-tight mb-8"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Born in the
                <br />
                Mist of the
                <br />
                <em className="not-italic text-[#C8820A]">Highlands</em>
              </h2>
              <div className="w-12 h-px bg-[#C8820A] mb-8" />
              <p className="text-[#FAF6EF]/65 leading-[1.85] mb-6 text-[15px]">
                In 1999, we opened our first store in Hà Nội with a single belief: that
                Vietnam&apos;s remarkable coffee deserved the world stage it had long been denied.
                Our beans are sourced from the volcanic red soils of Cầu Đất and Di Linh —
                altitudes above 1,500 metres where cool air and rich earth conspire to create
                extraordinary depth of flavour.
              </p>
              <p className="text-[#FAF6EF]/65 leading-[1.85] mb-10 text-[15px]">
                Today, Highlands Coffee is woven into the daily rhythm of Vietnamese life — a
                gathering place, a workspace, a moment of warmth in a busy city. Over 500 stores.
                One unbroken promise.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-3 text-[#C8820A] text-sm font-semibold tracking-wider group hover:gap-5 transition-all duration-200"
              >
                Discover our heritage
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROMOTIONS BANNER ───────────────────────────────── */}
      <section id="promotions" className="bg-[#C8820A] py-12 lg:py-14 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
          <div className="text-center lg:text-left">
            <p className="text-white/65 text-[11px] font-semibold tracking-[0.35em] uppercase mb-2">
              Limited Time Offer
            </p>
            <p
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Buy 2, Get 1 Free
            </p>
            <p className="text-white/75 text-sm mt-2 leading-relaxed">
              On all iced drinks every weekday 2–5 pm. Dine-in only at participating stores.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <span className="text-white/65 text-sm hidden lg:block">Valid through 31 May 2026</span>
            <button className="bg-white text-[#C8820A] font-bold px-8 py-3.5 text-sm tracking-wider hover:bg-[#3B1F0A] hover:text-white transition-all duration-200">
              Claim Offer
            </button>
          </div>
        </div>
      </section>

      {/* ─── MENU PREVIEW ────────────────────────────────────── */}
      <section id="menu" className="py-24 lg:py-32 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">
              What We Serve
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold text-[#3B1F0A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Our Menu
            </h2>
          </div>

          {/* Tab bar */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex border border-[#3B1F0A]/12 p-1 gap-0.5 bg-white/40">
              {(Object.keys(MENU) as MenuTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-2.5 text-sm font-semibold tracking-wider transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-[#3B1F0A] text-white"
                      : "text-[#3B1F0A]/55 hover:text-[#3B1F0A]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#3B1F0A]/10">
            {MENU[activeTab].map((item, i) => (
              <div
                key={i}
                className="bg-[#FAF6EF] p-6 lg:p-8 flex items-center gap-5 hover:bg-white transition-colors duration-200 group"
              >
                <div className="relative w-16 h-16 shrink-0 overflow-hidden">
                  <Image
                    src={item.img}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-lg font-bold text-[#3B1F0A] mb-1"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {item.name}
                  </h4>
                  <p className="text-[#3B1F0A]/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[#C8820A] font-bold text-sm whitespace-nowrap">{item.price}</div>
                  <button className="mt-2 text-xs text-[#3B1F0A]/40 hover:text-[#C8820A] font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200">
                    Add +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="#"
              className="inline-flex items-center gap-3 border border-[#3B1F0A] text-[#3B1F0A] px-10 py-4 text-sm font-semibold tracking-wider hover:bg-[#3B1F0A] hover:text-white transition-all duration-200"
            >
              See Full Menu
            </a>
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS ───────────────────────────────────────── */}
      <section id="locations" className="py-24 lg:py-32 px-6 lg:px-8 bg-[#2D5016]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/45 text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">
            Find Us Nationwide
          </p>
          <h2
            className="font-bold text-white leading-none mb-4"
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(72px, 12vw, 130px)",
            }}
          >
            500<span className="text-[#C8820A]">+</span>
          </h2>
          <p className="text-white/65 text-xl mb-3">Stores across Vietnam</p>
          <p className="text-white/45 text-sm max-w-lg mx-auto mb-12 leading-relaxed">
            From Hà Nội to Hồ Chí Minh City, Đà Nẵng to Cần Thơ — there&apos;s always a Highlands
            nearby when you need a moment to breathe.
          </p>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-14">
            {CITIES.map((city) => (
              <span key={city} className="flex items-center gap-2.5 text-white/55 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8820A] inline-block shrink-0" />
                {city}
              </span>
            ))}
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-3 bg-[#C8820A] text-white px-10 py-4 text-sm font-semibold tracking-wider hover:bg-white hover:text-[#2D5016] transition-all duration-200"
          >
            Find a Store Near You
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-[#1A0D00] text-[#FAF6EF]/55 py-16 lg:py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            {/* Brand column */}
            <div>
              <div
                className="text-2xl font-bold text-[#FAF6EF] tracking-[0.18em] mb-5"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                HIGHLANDS
              </div>
              <p className="text-sm leading-[1.8] mb-7">
                Vietnam&apos;s favourite coffee experience, rooted in the highlands and served with
                heart since 1999.
              </p>
              <div className="flex gap-3">
                {[
                  {
                    label: "Facebook",
                    d: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                  },
                  {
                    label: "Instagram",
                    d: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z",
                  },
                  {
                    label: "YouTube",
                    d: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="w-9 h-9 border border-[#FAF6EF]/12 flex items-center justify-center hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200"
                  >
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path d={s.d} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <h5 className="text-[#FAF6EF] font-semibold text-[11px] tracking-[0.3em] uppercase mb-5">
                  {col.heading}
                </h5>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-[#C8820A] transition-colors duration-200">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#FAF6EF]/8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-5">
            <p className="text-[11px] text-[#FAF6EF]/35">
              © 2026 Highlands Coffee Corporation. All rights reserved.
            </p>
            <div className="flex gap-3">
              {(
                [
                  {
                    store: "App Store",
                    icon: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z",
                    fill: true,
                  },
                  {
                    store: "Google Play",
                    icon: "M3.18 23.76c.29.16.61.24.95.24.31 0 .6-.07.87-.2l10.76-6.13-2.34-2.34-10.24 8.43zM.29 1.23C.11 1.53 0 1.9 0 2.33v19.34c0 .43.11.8.29 1.1l.06.06 10.83-10.83v-.26L.35 1.17l-.06.06zm18.43 11.08l-2.71-1.55-2.35 2.34 2.35 2.35 2.73-1.56c.78-.44.78-1.14-.02-1.58zM4.13.24L14.89 6.37 12.55 8.7 2.31.27c.29-.12.6-.19.92-.19.33 0 .65.06.9.16z",
                    fill: true,
                  },
                ] as { store: string; icon: string; fill: boolean }[]
              ).map(({ store, icon, fill }) => (
                <a
                  key={store}
                  href="#"
                  className="flex items-center gap-2.5 border border-[#FAF6EF]/12 px-4 py-2.5 text-xs font-medium hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill={fill ? "currentColor" : "none"}
                    stroke={fill ? "none" : "currentColor"}
                    strokeWidth="1.5"
                  >
                    <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {store}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
