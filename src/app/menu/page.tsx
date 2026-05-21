"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import CartDrawer, { type CartItem } from "@/components/CartDrawer";

const U = "https://images.unsplash.com/photo-";
const P = "https://plus.unsplash.com/premium_photo-";
const q = "?auto=format&fit=crop&w=400&q=80";

// ── Menu data ────────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: "coffee",
    label: "Coffee",
    tagline: "Sourced from the highlands, roasted in-house",
    items: [
      { name: "Vietnamese Iced Coffee", desc: "Vietnam's iconic iced coffee — rich Robusta with velvety condensed milk over hand-chipped ice.", price: "35,000₫", tag: "Classic", img: `${U}1664515726011-121bb3114f0f${q}` },
      { name: "Milk Coffee", desc: "Mild espresso with a generous pour of sweetened milk — light, smooth, and endlessly comforting.", price: "35,000₫", tag: "Bestseller", img: `${U}1595177924779-dbe82554cc24${q}` },
      { name: "Highlands Espresso", desc: "Double-shot espresso from single-origin Arabica grown at 1,500m in Cầu Đất, Đà Lạt.", price: "45,000₫", tag: "Signature", img: `${U}1755602693920-0742987a3476${q}` },
      { name: "Cold Brew", desc: "18-hour cold-steeped highland beans — silky, low-acid, with a naturally sweet finish.", price: "55,000₫", tag: "Premium", img: `${U}1545285179-78da7c2b8f83${q}` },
      { name: "Da Lat Cappuccino", desc: "Velvety micro-foam over a double Arabica shot — balance of bold and silk.", price: "55,000₫", tag: null, img: `${U}1720214931419-7cb11ee42c59${q}` },
      { name: "Salt Coffee", desc: "Robusta espresso crowned with a salted whipped cream cloud — sweet, salty, addictive.", price: "50,000₫", tag: "New", img: `${U}1719953107038-da34352e407e${q}` },
      { name: "Americano", desc: "Two shots of highland espresso diluted with hot water — clean, pure, unapologetic.", price: "45,000₫", tag: null, img: `${U}1551231581-41c3f990e8a7${q}` },
      { name: "Egg Coffee Latte", desc: "Hanoi's legendary egg coffee — sweet whipped egg yolk on strong Robusta espresso.", price: "60,000₫", tag: "Heritage", img: `${U}1503481766315-7a586b20f66d${q}` },
    ],
  },
  {
    id: "tea",
    label: "Tea & More",
    tagline: "Fresh-brewed teas and chilled fruit infusions",
    items: [
      { name: "Peach & Lemongrass Iced Tea", desc: "Sun-ripened peaches, fresh orange slices, and fragrant lemongrass in a golden iced tea.", price: "45,000₫", tag: "Bestseller", img: `${U}1597481499666-130f8eb2c9cd${q}` },
      { name: "Green Milk Tea", desc: "Matcha milk tea with hand-blended Đà Lạt green tea and a hint of toasted rice.", price: "50,000₫", tag: "Popular", img: `${U}1560148196-df61132466ce${q}` },
      { name: "Black Milk Tea", desc: "Black milk tea with creamy foam topping — warm, bold, and perfectly sweet.", price: "55,000₫", tag: null, img: `${U}1641919089328-5d5063828c4f${q}` },
      { name: "Fresh Kumquat Tea", desc: "Fresh-squeezed kumquat with premium jasmine tea — bright, tangy, and refreshing.", price: "40,000₫", tag: null, img: `${P}1694825174350-cb9f27949883${q}` },
      { name: "Golden Lotus Tea", desc: "Lotus blossom tea steeped overnight in cold water — delicate, floral, and deeply Vietnamese.", price: "55,000₫", tag: "Signature", img: `${U}1501841580093-a258b1937efe${q}` },
      { name: "Salted Lemon Soda", desc: "Salted lemon soda with a sharp citrus kick — the perfect antidote to a Saigon afternoon.", price: "35,000₫", tag: "Refreshing", img: `${U}1592099759599-24b131b8e824${q}` },
      { name: "Avocado Smoothie", desc: "Creamy Đắk Lắk avocado blended with coconut milk and condensed milk over crushed ice.", price: "60,000₫", tag: "New", img: `${U}1557753478-d111aef068be${q}` },
      { name: "Watermelon Juice", desc: "Cold-pressed watermelon with fresh lime and a pinch of sea salt — hydrating and vivid.", price: "45,000₫", tag: null, img: `${U}1683166263544-e754e85c3e7c${q}` },
    ],
  },
  {
    id: "food",
    label: "Food & Snacks",
    tagline: "Baked fresh each morning, crafted for the Vietnamese palate",
    items: [
      { name: "Butter Baguette", desc: "Toasted Vietnamese baguette with cultured butter and fleur de sel — a simple morning ritual.", price: "25,000₫", tag: "Classic", img: `${U}1647169953827-a7c85f324caf${q}` },
      { name: "Almond Croissant", desc: "Flaky almond croissant baked fresh each morning, filled with house-made frangipane.", price: "45,000₫", tag: "Bestseller", img: `${U}1741916540141-f36e29290f28${q}` },
      { name: "Matcha Cheesecake", desc: "Green tea cheesecake on a toasted sesame crust — soft, fragrant, and lightly bitter.", price: "55,000₫", tag: "Signature", img: `${P}1694599324074-d5479407e7c7${q}` },
      { name: "Coffee Tiramisu", desc: "House tiramisu soaked in Highlands Cold Brew, dusted with premium Vietnamese cacao.", price: "60,000₫", tag: "Premium", img: `${U}1746888151121-1002113ed286${q}` },
      { name: "Salted Egg Sandwich", desc: "Toasted sourdough with salted egg yolk mayo, pickled vegetables, and fresh coriander.", price: "55,000₫", tag: "New", img: `${U}1528736235302-52922df5c122${q}` },
      { name: "Coffee Flan", desc: "Silky Vietnamese coffee custard with a dark caramel base — smooth, trembling, and perfect.", price: "40,000₫", tag: "Heritage", img: `${P}1714115034655-5dba95d04360${q}` },
      { name: "Yogurt Granola", desc: "House granola with local honey, Đà Lạt strawberries, and thick plain yoghurt.", price: "50,000₫", tag: null, img: `${U}1725883691833-97103ecd582a${q}` },
      { name: "Strawberry Mousse Cake", desc: "Light strawberry mousse cake layered with vanilla sponge and fresh Đà Lạt berries.", price: "65,000₫", tag: null, img: `${U}1551879400-111a9087cd86${q}` },
    ],
  },
  {
    id: "seasonal",
    label: "Seasonal Specials",
    tagline: "Limited offerings inspired by Vietnam's harvests and festivals",
    items: [
      { name: "Lychee Cold Brew", desc: "Cold brew infused with Bắc Giang lychee syrup and a squeeze of fresh lime — only in summer.", price: "65,000₫", tag: "Limited", img: `${U}1664515725366-e8328e9dc834${q}` },
      { name: "Chrysanthemum Honey Tea", desc: "Dried chrysanthemum flowers steeped with Mekong honey and ginger — a warm autumn ritual.", price: "55,000₫", tag: "Autumn", img: `${U}1514733670139-4d87a1941d55${q}` },
      { name: "Cinnamon Ginger Latte", desc: "Spiced latte with freshly ground Quảng Nam cinnamon and young ginger — warming and aromatic.", price: "60,000₫", tag: "Winter", img: `${U}1643316408393-9328a1e973ed${q}` },
      { name: "Pomelo Blossom Latte", desc: "Creamy latte perfumed with fresh pomelo blossom water — extraordinarily fragrant and fleeting.", price: "65,000₫", tag: "Spring", img: `${U}1759259639667-af32680c21a4${q}` },
      { name: "Hawthorn Berry Cold Brew", desc: "Wild hawthorn berry cold brew with a hit of sparkling water — tart, rosy, and completely unique.", price: "60,000₫", tag: "Limited", img: `${U}1499638673689-79a0b5115d87${q}` },
      { name: "Mooncake Festival Latte", desc: "Mid-Autumn Festival special — lotus seed paste latte with salted egg yolk foam topping.", price: "75,000₫", tag: "Festival", img: `${U}1426174840074-541ae41efdb9${q}` },
      { name: "Durian Espresso", desc: "Durian-infused espresso blend for the brave — pungent, creamy, fiercely addictive.", price: "70,000₫", tag: "Bold", img: `${U}1471922597728-92f81bfe2445${q}` },
      { name: "Cat Chu Mango Smoothie", desc: "Seasonal Cát Chu mango smoothie with coconut cream and toasted black sesame — pure tropics.", price: "65,000₫", tag: "Summer", img: `${U}1623065422902-30a2d299bbe4${q}` },
    ],
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const TAG_COLORS: Record<string, string> = {
  Classic:    "bg-stone-100 text-stone-600",
  Bestseller: "bg-[#C8820A]/15 text-[#C8820A]",
  Signature:  "bg-[#3B1F0A]/10 text-[#3B1F0A]",
  Premium:    "bg-amber-50 text-amber-700",
  Popular:    "bg-orange-50 text-orange-700",
  New:        "bg-emerald-50 text-emerald-700",
  Heritage:   "bg-[#2D5016]/10 text-[#2D5016]",
  Refreshing: "bg-cyan-50 text-cyan-700",
  Limited:    "bg-red-50 text-red-600",
  Autumn:     "bg-orange-50 text-orange-700",
  Winter:     "bg-blue-50 text-blue-700",
  Spring:     "bg-pink-50 text-pink-600",
  Summer:     "bg-yellow-50 text-yellow-700",
  Festival:   "bg-purple-50 text-purple-700",
  Bold:       "bg-red-50 text-red-700",
};

export default function MenuPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("coffee");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Load cart from localStorage on mount (shared with homepage)
  useEffect(() => {
    try {
      const raw: CartItem[] = JSON.parse(localStorage.getItem("highlands_cart") || "[]");
      if (raw.length > 0) setCart(raw);
    } catch {}
  }, []);

  // Sync if another tab / the homepage updates the cart
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

  const addToCart = (name: string, price: string, img: string) => {
    const priceNum = parseInt(price.replace(/[^0-9]/g, ""), 10);
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.name === name);
      const next =
        idx >= 0
          ? prev.map((i) => (i.name === name ? { ...i, quantity: i.quantity + 1 } : i))
          : [...prev, { name, price: priceNum, img, quantity: 1 }];
      localStorage.setItem("highlands_cart", JSON.stringify(next));
      return next;
    });
  };

  const updateCart = (name: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((i) => (i.name === name ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
      localStorage.setItem("highlands_cart", JSON.stringify(next));
      return next;
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Highlight nav on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id as SectionId);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Handle URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SectionId;
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        setActiveSection(hash);
      }, 100);
    }
  }, []);

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#3B1F0A] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <span className="text-white font-bold tracking-[0.25em] text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
              HIGHLANDS
            </span>
            <span className="text-white/35 text-[11px] tracking-[0.2em] uppercase">Coffee</span>
          </Link>
          <Link href="/" className="text-white/55 hover:text-white text-sm transition-colors hidden sm:block">
            ← Back to Home
          </Link>
          {/* Cart button in navbar */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-[#C8820A] hover:bg-[#FAF6EF] hover:text-[#3B1F0A] text-white text-sm font-semibold px-4 py-2 transition-colors"
            aria-label="Open cart"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-[#C8820A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bg-[#3B1F0A] pt-14 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">What We Serve</p>
          <h1
            className="font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(36px, 6vw, 64px)" }}
          >
            Our Full Menu
          </h1>
          <p className="text-white/45 text-base max-w-lg leading-relaxed">
            Every item crafted with highland-sourced ingredients and a respect for Vietnamese flavour traditions.
          </p>
        </div>
      </div>

      {/* ── Sticky section nav ── */}
      <nav className="sticky top-16 z-30 bg-[#1A0D00] border-b border-white/5 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="flex min-w-max">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                  activeSection === s.id
                    ? "border-[#C8820A] text-[#C8820A]"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Sections ── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-20">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className="scroll-mt-32"
          >
            {/* Section header */}
            <div className="flex items-end justify-between gap-4 mb-8 pb-5 border-b border-[#3B1F0A]/10">
              <div>
                <h2
                  className="font-bold text-[#3B1F0A] leading-tight"
                  style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px, 3vw, 36px)" }}
                >
                  {section.label}
                </h2>
                <p className="text-[#3B1F0A]/45 text-sm mt-1">{section.tagline}</p>
              </div>
              <span className="shrink-0 text-[#3B1F0A]/25 text-sm">{section.items.length} items</span>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.items.map((item) => {
                const cartItem = cart.find((c) => c.name === item.name);
                const qty = cartItem?.quantity ?? 0;

                return (
                  <div
                    key={item.name}
                    className="bg-white border border-[#3B1F0A]/6 hover:border-[#C8820A]/30 hover:shadow-md transition-all duration-200 group flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden bg-[#3B1F0A]/5">
                      <Image
                        src={item.img}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      {item.tag && (
                        <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 ${TAG_COLORS[item.tag] ?? "bg-stone-100 text-stone-600"}`}>
                          {item.tag}
                        </span>
                      )}
                      {/* Quantity badge on image */}
                      {qty > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#C8820A] text-white text-[11px] font-bold flex items-center justify-center shadow">
                          {qty}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3
                        className="font-bold text-[#3B1F0A] text-[15px] mb-1.5 leading-snug"
                        style={{ fontFamily: "var(--font-playfair), serif" }}
                      >
                        {item.name}
                      </h3>
                      <p className="text-[#3B1F0A]/50 text-xs leading-relaxed flex-1 mb-4">
                        {item.desc}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-auto">
                        <span className="text-[#C8820A] font-bold text-sm">{item.price}</span>
                        {qty > 0 ? (
                          /* Quantity stepper — shown when item is already in cart */
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCart(item.name, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-[#3B1F0A]/8 hover:bg-[#3B1F0A] hover:text-white text-[#3B1F0A] font-bold text-base transition-colors"
                              aria-label="Remove one"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-[#3B1F0A]">{qty}</span>
                            <button
                              onClick={() => addToCart(item.name, item.price, item.img)}
                              className="w-7 h-7 flex items-center justify-center bg-[#C8820A] hover:bg-[#3B1F0A] text-white font-bold text-base transition-colors"
                              aria-label="Add one more"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          /* Add to Cart button — shown when item is not in cart */
                          <button
                            onClick={() => addToCart(item.name, item.price, item.img)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#3B1F0A] text-white hover:bg-[#C8820A] transition-colors duration-200"
                          >
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#1A0D00] py-10 px-6 text-center mt-8">
        <p className="text-white/25 text-xs">
          © 2026 Highlands Coffee Corporation · Menu prices and availability may vary by location.
        </p>
      </footer>

      {/* ── Floating Go to Cart button ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 bg-[#3B1F0A] text-white px-5 py-3.5 shadow-2xl hover:bg-[#C8820A] transition-colors duration-200 group"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-bold tracking-wide">Go to Cart</span>
            <span className="bg-[#C8820A] group-hover:bg-[#3B1F0A] group-hover:border group-hover:border-white/30 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-colors">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          </button>
        </div>
      )}

      {/* ── Cart Drawer ── */}
      <CartDrawer
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdate={updateCart}
        onClearCart={() => { setCart([]); localStorage.removeItem("highlands_cart"); }}
      />
    </div>
  );
}
