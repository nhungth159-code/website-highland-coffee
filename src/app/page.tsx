"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import CartDrawer, { type CartItem } from "@/components/CartDrawer";
import { getT } from "@/lib/i18n";
import { getPromotions, getPromoStatus } from "@/lib/promotions";
import type { Promotion } from "@/lib/promotions";

const U = "https://images.unsplash.com/photo-";
const P = "https://plus.unsplash.com/premium_photo-";
const q = "?auto=format&fit=crop&w=400&q=80";

// Canonical item data — prices stored as raw VND; display formatted by language
const FEATURED_DATA = [
  { name: "Vietnamese Iced Coffee", price: 35000, img: `${U}1471922597728-92f81bfe2445?auto=format&fit=crop&w=800&q=80` },
  { name: "Peach & Lemongrass Iced Tea", price: 45000, img: `${U}1597481499666-130f8eb2c9cd?auto=format&fit=crop&w=800&q=80` },
  { name: "Highland Cold Brew", price: 55000, img: `${U}1545285179-78da7c2b8f83?auto=format&fit=crop&w=800&q=80` },
] as const;

const MENU_DATA = {
  Coffee: [
    { name: "Vietnamese Iced Coffee", price: 35000, img: `${U}1471922597728-92f81bfe2445${q}` },
    { name: "Milk Coffee",            price: 35000, img: `${U}1595177924779-dbe82554cc24${q}` },
    { name: "Highlands Espresso",     price: 45000, img: `${U}1475241404975-c3ae90fdd9e6${q}` },
    { name: "Cold Brew",              price: 55000, img: `${U}1545285179-78da7c2b8f83${q}` },
  ],
  Tea: [
    { name: "Peach & Lemongrass Iced Tea", price: 45000, img: `${U}1597481499666-130f8eb2c9cd${q}` },
    { name: "Green Milk Tea",              price: 50000, img: `${U}1560148196-df61132466ce${q}` },
    { name: "Black Milk Tea",              price: 55000, img: `${U}1641919089328-5d5063828c4f${q}` },
    { name: "Fresh Kumquat Tea",           price: 40000, img: `${P}1694825174350-cb9f27949883${q}` },
  ],
  Food: [
    { name: "Butter Baguette",   price: 25000, img: `${U}1618111415321-b406d66958de${q}` },
    { name: "Almond Croissant",  price: 45000, img: `${U}1741916540141-f36e29290f28${q}` },
    { name: "Matcha Cheesecake", price: 55000, img: `${U}1533134242443-d4fd215305ad${q}` },
    { name: "Coffee Tiramisu",   price: 60000, img: `${P}1695028378268-38e3432c5cf0${q}` },
  ],
} as const;

type MenuTab = keyof typeof MENU_DATA;

const CITIES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Nha Trang"];

const SOCIAL = [
  { label: "Facebook", d: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
  { label: "Instagram", d: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z" },
  { label: "YouTube", d: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<MenuTab>("Coffee");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  const t = getT("en");

  const refreshPromos = () => {
    setActivePromos(getPromotions().filter((p) => getPromoStatus(p) === "active"));
  };

  // Load cart and active promos from localStorage on mount
  useEffect(() => {
    try {
      const raw: CartItem[] = JSON.parse(localStorage.getItem("highlands_cart") || "[]");
      if (raw.length > 0) setCart(raw);
    } catch {}
    refreshPromos();

    // Re-sync when admin changes promo dates in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "highlands_promotions") refreshPromos();
    };
    window.addEventListener("storage", onStorage);

    // Re-check every 60 s so date-based transitions appear without a page reload
    const ticker = setInterval(refreshPromos, 60_000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(ticker);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sync = () => {
      try {
        const raw: CartItem[] = JSON.parse(localStorage.getItem("highlands_cart") || "[]");
        setCart(raw);
      } catch {}
    };
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const addToCart = (name: string, price: number, img: string) => {
    setCart((prev) => {
      const next = prev.find((i) => i.name === name)
        ? prev.map((i) => i.name === name ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { name, price, img, quantity: 1 }];
      localStorage.setItem("highlands_cart", JSON.stringify(next));
      return next;
    });
    setCartOpen(true);
  };

  const updateCart = (name: string, delta: number) => {
    setCart((prev) => {
      const next = prev.map((i) => i.name === name ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0);
      localStorage.setItem("highlands_cart", JSON.stringify(next));
      return next;
    });
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const fp = (vnd: number) => `${vnd.toLocaleString("vi-VN")}₫`;

  return (
    <div className="bg-[#FAF6EF]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ─── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF6EF]/96 backdrop-blur-md border-b border-[#3B1F0A]/8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-[0.18em] text-[#3B1F0A] select-none" style={{ fontFamily: "var(--font-playfair), serif" }}>
            HIGHLANDS
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: t.nav.menu, href: "/menu" },
              { label: t.nav.locations, href: "#locations" },
              { label: t.nav.promotions, href: "#promotions" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-[#3B1F0A]/65 hover:text-[#C8820A] transition-colors duration-200 tracking-wide">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setCartOpen(true)} className="relative p-2 text-[#3B1F0A]/60 hover:text-[#3B1F0A] transition-colors" aria-label="Open cart">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C8820A] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <Link href="/track" className="flex items-center gap-1.5 text-sm font-medium text-[#3B1F0A]/60 hover:text-[#C8820A] transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              {t.nav.myOrders}
            </Link>
            <button onClick={() => setCartOpen(true)} className="bg-[#C8820A] text-white text-sm font-semibold tracking-wider px-6 py-2.5 hover:bg-[#3B1F0A] transition-colors duration-200">
              {t.nav.orderNow}
            </button>
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-1">
            <button onClick={() => setCartOpen(true)} className="relative p-1.5 text-[#3B1F0A]/60 hover:text-[#3B1F0A] transition-colors" aria-label="Open cart">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#C8820A] text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <Link href="/track" className="p-1.5 text-[#3B1F0A]/60 hover:text-[#C8820A] transition-colors" aria-label="My Orders">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
            </Link>
            <button className="text-[#3B1F0A] p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#FAF6EF] border-t border-[#3B1F0A]/10 px-6 py-5 flex flex-col gap-5">
            {[{ label: t.nav.menu, href: "/menu" }, { label: t.nav.locations, href: "#locations" }, { label: t.nav.promotions, href: "#promotions" }].map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-[#3B1F0A]" onClick={() => setMobileOpen(false)}>{l.label}</a>
            ))}
            <button onClick={() => { setCartOpen(true); setMobileOpen(false); }} className="bg-[#C8820A] text-white text-sm font-semibold tracking-wider py-3 w-full mt-1">
              {t.nav.orderNow}
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-[#1A0D00] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="w-[700px] h-[700px] rounded-full border border-[#C8820A]/8" />
          <div className="absolute w-[520px] h-[520px] rounded-full border border-[#C8820A]/12" />
          <div className="absolute w-[340px] h-[340px] rounded-full border border-[#C8820A]/18" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-[#C8820A]/25" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block select-none pointer-events-none leading-none text-[#FAF6EF]/[0.04] text-[240px] font-bold tracking-tighter" style={{ fontFamily: "var(--font-playfair), serif" }}>
          COFFEE
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,#3B1F0A40_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#1A0D00] to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <div className="animate-fade-up flex items-center gap-3 mb-8">
              <div className="w-10 h-px bg-[#C8820A]" />
              <span className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase">{t.hero.since}</span>
            </div>
            <h1 className="animate-fade-up-delay-1 text-6xl sm:text-7xl md:text-[90px] font-bold text-[#FAF6EF] leading-[0.93] tracking-tight mb-8" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {t.hero.line1}
              <br />
              <em className="not-italic text-[#C8820A]">{t.hero.line2}</em>
            </h1>
            <p className="animate-fade-up-delay-2 text-[#FAF6EF]/65 text-lg md:text-xl max-w-lg leading-relaxed mb-12">{t.hero.sub}</p>
            <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4">
              <a href="#menu" className="inline-flex items-center justify-center gap-3 bg-[#C8820A] text-white px-8 py-4 text-sm font-semibold tracking-wider hover:bg-[#FAF6EF] hover:text-[#1A0D00] transition-all duration-200 group">
                {t.hero.ctaMenu}
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform duration-200">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <Link href="/stores" className="inline-flex items-center justify-center gap-3 border border-[#FAF6EF]/25 text-[#FAF6EF] px-8 py-4 text-sm font-semibold tracking-wider hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200">
                {t.hero.ctaStore}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-[#C8820A]/60" />
        </div>
      </section>

      {/* ─── FEATURED DRINKS ─────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">{t.featured.eyebrow}</p>
              <h2 className="text-4xl md:text-5xl font-bold text-[#3B1F0A] leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {t.featured.heading1}
                <br />
                {t.featured.heading2}
              </h2>
            </div>
            <a href="#menu" className="text-sm font-semibold text-[#C8820A] hover:text-[#3B1F0A] transition-colors flex items-center gap-2 self-start md:self-auto">
              {t.featured.viewMenu}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {FEATURED_DATA.map((drink, i) => {
              const td = t.featured.items[i];
              return (
                <div key={drink.name} className="group cursor-pointer">
                  <div className="h-72 relative overflow-hidden mb-6">
                    <Image src={drink.img} alt={td.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold tracking-[0.2em] uppercase px-3 py-1.5">{td.tag}</span>
                    <button onClick={() => addToCart(drink.name, drink.price, drink.img)} className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-colors">
                        <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>{td.name}</h3>
                      <p className="text-[#3B1F0A]/55 text-sm leading-relaxed">{td.desc}</p>
                    </div>
                    <span className="text-[#C8820A] font-bold text-sm shrink-0 mt-0.5">{fp(drink.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BRAND STORY ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#3B1F0A] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="relative">
              <div className="aspect-[4/5] relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(200,130,10,0.25) 0%, #1A0D00 50%, rgba(45,80,22,0.35) 100%)" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-28 h-28 rounded-full border border-[#C8820A]/30 flex items-center justify-center">
                    <svg width="48" height="48" fill="none" stroke="#C8820A" strokeWidth="1" viewBox="0 0 24 24" opacity="0.5">
                      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[#C8820A]/35 text-[11px] tracking-[0.35em] uppercase font-semibold">Đà Lạt · 1,500m</span>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(200,130,10,0.1),transparent_60%)]" />
              </div>
              <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-[#C8820A] p-6 w-44 shadow-2xl">
                <div className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), serif" }}>25+</div>
                <div className="text-white/80 text-xs font-semibold tracking-wide mt-1 uppercase">{t.story.yearsLabel}</div>
              </div>
              <div className="absolute -top-6 -left-4 lg:-left-8 w-px h-24 bg-gradient-to-b from-[#C8820A]/60 to-transparent" />
            </div>

            <div className="text-[#FAF6EF] lg:pl-8">
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">{t.story.eyebrow}</p>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {t.story.line1}<br />{t.story.line2}<br /><em className="not-italic text-[#C8820A]">{t.story.line3}</em>
              </h2>
              <div className="w-12 h-px bg-[#C8820A] mb-8" />
              <p className="text-[#FAF6EF]/65 leading-[1.85] mb-6 text-[15px]">{t.story.p1}</p>
              <p className="text-[#FAF6EF]/65 leading-[1.85] mb-10 text-[15px]">{t.story.p2}</p>
              <Link href="/heritage" className="inline-flex items-center gap-3 text-[#C8820A] text-sm font-semibold tracking-wider group hover:gap-5 transition-all duration-200">
                {t.story.cta}
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROMOTIONS BANNER ───────────────────────────────────────────── */}
      {activePromos.length > 0 && (
      <section id="promotions" className="bg-[#C8820A] py-12 lg:py-14 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/65 text-[11px] font-semibold tracking-[0.35em] uppercase mb-6 text-center lg:text-left">
            {t.promo.eyebrow}
          </p>
          {activePromos.length === 1 ? (
            /* Single promo — full-width banner layout */
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
              <div className="text-center lg:text-left">
                <p className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), serif" }}>{activePromos[0].name}</p>
                <p className="text-white/75 text-sm mt-2 leading-relaxed">
                  {activePromos[0].description || `Use code ${activePromos[0].code} at checkout. Valid through ${activePromos[0].endDate.split("-").reverse().join("/")}.`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <button onClick={() => { setSelectedPromo(activePromos[0]); setPromoOpen(true); }}
                  className="bg-white text-[#C8820A] font-bold px-8 py-3.5 text-sm tracking-wider hover:bg-[#3B1F0A] hover:text-white transition-all duration-200">
                  {t.promo.cta}
                </button>
              </div>
            </div>
          ) : (
            /* Multiple promos — card grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePromos.map((p) => (
                <div key={p.id} className="bg-white/12 backdrop-blur-sm border border-white/20 p-5 flex flex-col gap-3">
                  <div>
                    <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>{p.name}</p>
                    <p className="text-white/70 text-xs mt-1 leading-relaxed line-clamp-2">
                      {p.description || `Valid through ${p.endDate.split("-").reverse().join("/")}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="font-mono font-bold text-white tracking-widest text-sm bg-white/15 px-2.5 py-1">{p.code}</span>
                    <button onClick={() => { setSelectedPromo(p); setPromoOpen(true); }}
                      className="text-xs font-bold text-white/80 hover:text-white underline underline-offset-2 transition-colors">
                      {t.promo.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ─── MENU PREVIEW ────────────────────────────────────────────────── */}
      <section id="menu" className="py-24 lg:py-32 px-6 lg:px-8 bg-[#FAF6EF]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">{t.menuSec.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>{t.menuSec.heading}</h2>
          </div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex border border-[#3B1F0A]/12 p-1 gap-0.5 bg-white/40">
              {(Object.keys(MENU_DATA) as MenuTab[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2.5 text-sm font-semibold tracking-wider transition-all duration-200 touch-manipulation ${activeTab === tab ? "bg-[#3B1F0A] text-white" : "text-[#3B1F0A]/55 hover:text-[#3B1F0A] active:text-[#3B1F0A]"}`}>
                  {t.menuSec[tab]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#3B1F0A]/10">
            {MENU_DATA[activeTab].map((item, i) => {
              const ti = t.menuItems[activeTab][i];
              return (
                <div key={item.name} className="bg-[#FAF6EF] p-6 lg:p-8 flex items-center gap-5 hover:bg-white transition-colors duration-200 group">
                  <div className="relative w-16 h-16 shrink-0 overflow-hidden">
                    <Image src={item.img} alt={ti.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>{ti.name}</h4>
                    <p className="text-[#3B1F0A]/50 text-sm leading-relaxed">{ti.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[#C8820A] font-bold text-sm whitespace-nowrap">{fp(item.price)}</div>
                    <button onClick={() => addToCart(item.name, item.price, item.img)} className="mt-2 text-xs text-[#3B1F0A]/40 hover:text-[#C8820A] font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200">
                      {t.menuSec.addBtn}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/menu" className="inline-flex items-center gap-3 border border-[#3B1F0A] text-[#3B1F0A] px-10 py-4 text-sm font-semibold tracking-wider hover:bg-[#3B1F0A] hover:text-white transition-all duration-200">
              {t.menuSec.seeAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS ───────────────────────────────────────────────────── */}
      <section id="locations" className="py-24 lg:py-32 px-6 lg:px-8 bg-[#2D5016]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/45 text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">{t.locations.eyebrow}</p>
          <h2 className="font-bold text-white leading-none mb-4" style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(72px, 12vw, 130px)" }}>
            500<span className="text-[#C8820A]">+</span>
          </h2>
          <p className="text-white/65 text-xl mb-3">{t.locations.stores}</p>
          <p className="text-white/45 text-sm max-w-lg mx-auto mb-12 leading-relaxed">{t.locations.text}</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-14">
            {CITIES.map((city) => (
              <span key={city} className="flex items-center gap-2.5 text-white/55 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8820A] inline-block shrink-0" />
                {city}
              </span>
            ))}
          </div>
          <Link href="/stores" className="inline-flex items-center gap-3 bg-[#C8820A] text-white px-10 py-4 text-sm font-semibold tracking-wider hover:bg-white hover:text-[#2D5016] transition-all duration-200">
            {t.locations.cta}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── GIFT CARDS ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-[#1A0D00] overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute w-[900px] h-[900px] rounded-full border border-[#C8820A]/[0.03] -top-1/3 -right-1/4" />
          <div className="absolute w-[600px] h-[600px] rounded-full border border-[#C8820A]/[0.05] top-1/4 right-0" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

            {/* Copy */}
            <div>
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-5">Highlands Gift Cards</p>
              <h2
                className="text-4xl md:text-5xl font-bold text-[#FAF6EF] leading-tight mb-6"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Give the Gift<br />
                <em className="not-italic text-[#C8820A]">of Great Coffee</em>
              </h2>
              <p className="text-[#FAF6EF]/55 text-base leading-relaxed mb-8">
                The perfect present for any occasion. Highlands Gift Cards are redeemable at all 500+ stores nationwide — no expiry date, no hidden fees.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "From 100,000₫ to 1,000,000₫",
                  "Valid in-store & online · Never expires",
                  "Delivered instantly to the recipient",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#FAF6EF]/65 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#C8820A]/20 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" fill="none" stroke="#C8820A" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Link href="/gift-cards" className="inline-flex items-center justify-center gap-3 bg-[#C8820A] text-white px-8 py-4 text-sm font-semibold tracking-wider hover:bg-[#FAF6EF] hover:text-[#1A0D00] transition-all duration-200 group">
                  Buy a Gift Card
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform duration-200">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/gift-cards" className="text-[#FAF6EF]/40 hover:text-[#C8820A] text-sm font-medium transition-colors flex items-center gap-1.5">
                  Check balance
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Card fan visual */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[360px]">
                {/* Card back — green */}
                <div
                  className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden aspect-[1.586/1]"
                  style={{
                    background: "linear-gradient(135deg, #2D5016 0%, #1A3009 100%)",
                    transform: "rotate(8deg) translateY(8px)",
                    zIndex: 1,
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    {[100, 180, 260].map((s) => (
                      <div key={s} className="absolute rounded-full border border-white"
                        style={{ width: s, height: s, top: "50%", left: "60%", transform: "translate(-50%,-50%)" }} />
                    ))}
                  </div>
                </div>

                {/* Card middle — amber */}
                <div
                  className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden aspect-[1.586/1]"
                  style={{
                    background: "linear-gradient(135deg, #C8820A 0%, #8B5A05 100%)",
                    transform: "rotate(3deg) translateY(4px)",
                    zIndex: 2,
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    {[100, 180, 260].map((s) => (
                      <div key={s} className="absolute rounded-full border border-white"
                        style={{ width: s, height: s, top: "50%", left: "60%", transform: "translate(-50%,-50%)" }} />
                    ))}
                  </div>
                </div>

                {/* Card front — dark brown with full content */}
                <div
                  className="relative rounded-2xl shadow-2xl overflow-hidden aspect-[1.586/1]"
                  style={{ background: "linear-gradient(135deg, #1A0D00 0%, #3B1F0A 100%)", zIndex: 3 }}
                >
                  <div className="absolute inset-0 opacity-10">
                    {[100, 180, 260, 340].map((s) => (
                      <div key={s} className="absolute rounded-full border border-white"
                        style={{ width: s, height: s, top: "50%", left: "60%", transform: "translate(-50%,-50%)" }} />
                    ))}
                  </div>
                  <svg className="absolute right-4 bottom-4 opacity-10" width="80" height="80" fill="none" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
                    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" />
                    <path d="M6 1v3M10 1v3M14 1v3" strokeLinecap="round" />
                  </svg>
                  <div className="relative z-10 flex flex-col justify-between h-full p-7">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold tracking-[0.2em] text-white" style={{ fontSize: 16 }}>HIGHLANDS</p>
                        <p className="tracking-widest uppercase font-medium" style={{ color: "#C8820A", fontSize: 9, marginTop: 2 }}>Coffee · Gift Card</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white" style={{ fontFamily: "var(--font-playfair), serif", fontSize: 26 }}>200,000₫</p>
                        <p className="text-white/50 uppercase tracking-widest" style={{ fontSize: 8 }}>Classic</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/55 font-medium mb-1" style={{ fontSize: 11 }}>For Your Loved One</p>
                      <p className="font-mono tracking-[0.2em] text-white/30" style={{ fontSize: 10 }}>████ ████ ████ ████</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Denomination strip */}
          <div className="mt-16 pt-14 border-t border-[#FAF6EF]/6 flex flex-wrap items-center justify-center gap-4">
            <p className="text-[#FAF6EF]/25 text-[11px] font-semibold tracking-[0.3em] uppercase w-full text-center mb-1">Available denominations</p>
            {[
              { label: "100,000₫", tier: "Starter" },
              { label: "200,000₫", tier: "Classic" },
              { label: "500,000₫", tier: "Premium" },
              { label: "1,000,000₫", tier: "Gold" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2.5 bg-[#FAF6EF]/5 border border-[#FAF6EF]/10 px-5 py-2.5 hover:border-[#C8820A]/40 transition-colors">
                <span className="text-[#C8820A] font-bold text-sm">{c.label}</span>
                <span className="text-[#FAF6EF]/30 text-[10px] tracking-wider uppercase">{c.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CartDrawer
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdate={updateCart}
        onClearCart={() => { setCart([]); localStorage.removeItem("highlands_cart"); }}
      />

      {/* ─── PROMO MODAL ─────────────────────────────────────────────────── */}
      {promoOpen && selectedPromo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPromoOpen(false)} />
          <div className="relative bg-[#FAF6EF] w-full max-w-sm shadow-2xl overflow-hidden">
            <button onClick={() => setPromoOpen(false)} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
            <div className="bg-[#C8820A] px-6 pt-6 pb-7 text-white">
              <p className="text-[10px] font-semibold tracking-[0.35em] uppercase opacity-70 mb-1">{t.modal.eyebrow}</p>
              <h3 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>{selectedPromo.name}</h3>
              <p className="text-white/70 text-sm mt-1.5">
                Valid through {selectedPromo.endDate.split("-").reverse().join("/")}
                {selectedPromo.maxUses > 0 ? ` · ${selectedPromo.maxUses - selectedPromo.usedCount} uses remaining` : ""}
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-[#3B1F0A]/60 mb-5">
                {t.modal.instructionBefore}<strong className="text-[#3B1F0A]">{t.modal.instructionBold}</strong>{t.modal.instructionAfter}
              </p>
              <div className="border-2 border-dashed border-[#C8820A]/40 bg-[#C8820A]/5 px-5 py-4 flex items-center justify-between mb-1">
                <span className="text-2xl font-bold tracking-[0.15em] text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>{selectedPromo.code}</span>
                <button onClick={() => copyPromoCode(selectedPromo.code)} className={`text-sm font-bold px-3 py-1.5 transition-all ${copied ? "text-green-600 bg-green-50" : "text-[#C8820A] hover:text-[#3B1F0A]"}`}>
                  {copied ? t.modal.copied : t.modal.copy}
                </button>
              </div>
              <p className="text-xs text-[#3B1F0A]/30 mb-6">
                {selectedPromo.type === "percent" && `Saves ${selectedPromo.value}% on your order subtotal`}
                {selectedPromo.type === "fixed" && `Saves ${selectedPromo.value.toLocaleString("vi-VN")}₫ on your order`}
                {selectedPromo.type === "bogo" && `Buy ${selectedPromo.bogoDetails?.buyQty ?? 1}, get ${selectedPromo.bogoDetails?.getQty ?? 1} free`}
                {selectedPromo.type === "free_delivery" && "Waives delivery fee on your order"}
                {selectedPromo.minPurchase > 0 && ` · Min. order ${selectedPromo.minPurchase.toLocaleString("vi-VN")}₫`}
              </p>
              <button onClick={() => { setPromoOpen(false); setCartOpen(true); }} className="w-full bg-[#C8820A] text-white py-3.5 font-bold tracking-wider text-sm hover:bg-[#3B1F0A] transition-colors">
                {t.modal.orderBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#1A0D00] text-[#FAF6EF]/55 py-16 lg:py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            <div>
              <div className="text-2xl font-bold text-[#FAF6EF] tracking-[0.18em] mb-5" style={{ fontFamily: "var(--font-playfair), serif" }}>HIGHLANDS</div>
              <p className="text-sm leading-[1.8] mb-7">{t.footer.tagline}</p>
              <div className="flex gap-3">
                {SOCIAL.map((s) => (
                  <a key={s.label} href="#" aria-label={s.label} className="w-9 h-9 border border-[#FAF6EF]/12 flex items-center justify-center hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d={s.d} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {t.footer.cols.map((col) => (
              <div key={col.heading}>
                <h5 className="text-[#FAF6EF] font-semibold text-[11px] tracking-[0.3em] uppercase mb-5">{col.heading}</h5>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm hover:text-[#C8820A] transition-colors duration-200">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[#FAF6EF]/8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-5">
            <p className="text-[11px] text-[#FAF6EF]/35">{t.footer.copyright}</p>
            <div className="flex gap-3">
              {[
                { store: "App Store", icon: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" },
                { store: "Google Play", icon: "M3.18 23.76c.29.16.61.24.95.24.31 0 .6-.07.87-.2l10.76-6.13-2.34-2.34-10.24 8.43zM.29 1.23C.11 1.53 0 1.9 0 2.33v19.34c0 .43.11.8.29 1.1l.06.06 10.83-10.83v-.26L.35 1.17l-.06.06zm18.43 11.08l-2.71-1.55-2.35 2.34 2.35 2.35 2.73-1.56c.78-.44.78-1.14-.02-1.58zM4.13.24L14.89 6.37 12.55 8.7 2.31.27c.29-.12.6-.19.92-.19.33 0 .65.06.9.16z" },
              ].map(({ store, icon }) => (
                <a key={store} href="#" className="flex items-center gap-2.5 border border-[#FAF6EF]/12 px-4 py-2.5 text-xs font-medium hover:border-[#C8820A] hover:text-[#C8820A] transition-all duration-200">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d={icon} /></svg>
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
