"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQ {
  q: string;
  a: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  faqs: FAQ[];
}

const CATEGORIES: Category[] = [
  {
    id: "orders",
    label: "Orders & Delivery",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" />
      </svg>
    ),
    faqs: [
      {
        q: "How do I place an order online?",
        a: "You can order directly through our website by browsing the Menu section, adding items to your cart, and checking out. We accept payment via credit/debit card, MoMo, ZaloPay, and cash on delivery.",
      },
      {
        q: "What is the minimum order value for delivery?",
        a: "The minimum order value for delivery is ₫50,000. Orders below this amount can still be placed for pickup at any of our 500+ stores.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery within inner-city areas takes 25–40 minutes. During peak hours (07:00–09:00 and 11:30–13:30) delivery may take up to 60 minutes. You'll receive real-time tracking via SMS once your order is confirmed.",
      },
      {
        q: "Can I schedule an order in advance?",
        a: "Yes! You can schedule orders up to 7 days in advance. Simply select your preferred date and time during checkout. Scheduled orders can be modified or cancelled up to 2 hours before the scheduled delivery time.",
      },
      {
        q: "What if an item is out of stock?",
        a: "In the rare case an item becomes unavailable after you order, our team will contact you within 10 minutes to offer a substitute or a full refund to your original payment method.",
      },
    ],
  },
  {
    id: "menu",
    label: "Menu & Products",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    faqs: [
      {
        q: "Where does Highlands Coffee source its beans?",
        a: "Our coffee is sourced exclusively from the Central Highlands of Vietnam — primarily Gia Lai, Đắk Lắk, and Lâm Đồng provinces. We work directly with over 2,400 farming families and use a blend of Arabica and Robusta beans, roasted in-house at our facility in Hà Nội.",
      },
      {
        q: "Do you have non-coffee drinks?",
        a: "Absolutely. Our menu includes Vietnamese fruit teas, matcha lattes, fresh milk teas, smoothies, and a selection of seasonal beverages. We also offer sparkling water, juices, and soft drinks.",
      },
      {
        q: "Are your drinks customisable?",
        a: "Yes. You can adjust sugar level (0%, 30%, 50%, 70%, 100%), ice level (no ice, less ice, normal, extra ice), milk type (whole, oat, soy where available), and shot strength. Just let the barista or note it in your online order.",
      },
      {
        q: "Do you offer vegan or allergen-free options?",
        a: "We have several plant-based drink options. Our website and in-store menus clearly mark items containing common allergens (dairy, gluten, nuts, soy). For severe allergies, please speak to a store manager before ordering as our equipment handles multiple ingredients.",
      },
      {
        q: "How often does the menu change?",
        a: "Our core menu stays consistent year-round. We introduce seasonal specials approximately every 3 months, often inspired by Vietnamese festivals and local fruit harvests. Follow us on social media for new launch announcements.",
      },
    ],
  },
  {
    id: "loyalty",
    label: "Loyalty & Promotions",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    faqs: [
      {
        q: "How does the Highlands Rewards programme work?",
        a: "Every ₫10,000 spent earns you 1 Highlands Point. Points accumulate in your account and can be redeemed for free drinks, discounts, and exclusive merchandise. Sign up for free through our app or website.",
      },
      {
        q: "How do I use a promo code?",
        a: "At checkout, enter your promo code in the 'Promo Code' field and click Apply. Valid codes are applied instantly as a discount to your order total. Promo codes cannot be combined with other offers unless stated.",
      },
      {
        q: "Do loyalty points expire?",
        a: "Points are valid for 12 months from the date they are earned. Points will expire if your account has no activity (earning or redeeming) for 12 consecutive months. You'll receive an email reminder 30 days before any points are set to expire.",
      },
      {
        q: "Can I earn points on delivery orders?",
        a: "Yes, points are earned on all orders — in-store, online, and delivery — as long as you are logged into your account at the time of purchase.",
      },
    ],
  },
  {
    id: "stores",
    label: "Stores & Locations",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    faqs: [
      {
        q: "How do I find my nearest Highlands Coffee?",
        a: "Visit our Store Locator page to search by city or district. You can also use the map view to find stores near your current location, including details on opening hours and available facilities.",
      },
      {
        q: "What are your typical opening hours?",
        a: "Most stores open from 06:30 and close between 22:00 and 23:00. Some flagship locations are open until midnight or 24 hours. Hours vary by location — check the Store Locator for exact times.",
      },
      {
        q: "Do all stores have free WiFi?",
        a: "The majority of our stores offer complimentary WiFi. Connect to the 'Highlands Coffee' network and accept the terms. A small number of kiosk-style locations may not have WiFi — the Store Locator indicates which stores have this facility.",
      },
      {
        q: "Are Highlands Coffee stores available for private events?",
        a: "Selected stores with larger seating areas can accommodate private bookings for groups of 15 or more. Contact us at events@highlandscoffee.vn with your preferred location, date, and group size to check availability.",
      },
    ],
  },
  {
    id: "returns",
    label: "Refunds & Complaints",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" />
      </svg>
    ),
    faqs: [
      {
        q: "What should I do if my order is wrong or missing items?",
        a: "Please contact us within 2 hours of receiving your order via our hotline (1800 6567) or through the Contact Us page. Keep your order reference number handy. We'll arrange a replacement or refund within 24 hours.",
      },
      {
        q: "How do I request a refund?",
        a: "Refunds are processed to your original payment method within 3–5 business days. To request one, submit your order ID and the reason via the Contact Us page or call 1800 6567. Cash on delivery refunds are issued as store credit or bank transfer.",
      },
      {
        q: "What if my delivery is very late?",
        a: "If your order is more than 20 minutes past the estimated delivery time and you haven't received an update, please call our hotline. We'll investigate and, where the delay was our fault, offer compensation in the form of loyalty points or a discount on your next order.",
      },
      {
        q: "How do I submit feedback about a store experience?",
        a: "We welcome all feedback — good and constructive. You can submit it through our Contact form, via the feedback cards available in every store, or by emailing care@highlandscoffee.vn. Every submission is reviewed by our regional managers.",
      },
    ],
  },
];

function AccordionItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`border-b border-[#3B1F0A]/8 last:border-0 transition-colors ${isOpen ? "bg-[#FAF6EF]" : "bg-white"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className={`text-sm font-semibold leading-snug transition-colors ${isOpen ? "text-[#C8820A]" : "text-[#3B1F0A] group-hover:text-[#C8820A]"}`}>
          {faq.q}
        </span>
        <span className={`shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-200 ${isOpen ? "border-[#C8820A] bg-[#C8820A] text-white rotate-45" : "border-[#3B1F0A]/20 text-[#3B1F0A]/40"}`}>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-sm text-[#3B1F0A]/60 leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  const [activeCategory, setActiveCategory] = useState("orders");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");

  const current = CATEGORIES.find((c) => c.id === activeCategory)!;

  const displayFaqs = search.trim()
    ? CATEGORIES.flatMap((c) =>
        c.faqs.filter(
          (f) =>
            f.q.toLowerCase().includes(search.toLowerCase()) ||
            f.a.toLowerCase().includes(search.toLowerCase())
        )
      )
    : current.faqs;

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

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
      <section className="bg-[#3B1F0A] pt-16 pb-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">Help Centre</p>
          <h1
            className="font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(34px, 6vw, 60px)" }}
          >
            Frequently Asked
            <br />Questions
          </h1>
          <p className="text-white/45 text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Quick answers to the most common questions about our menu, orders, stores, and more.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpenIndex(0); }}
              className="w-full bg-white/10 border border-white/15 text-white placeholder-white/35 pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#C8820A] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Main ── */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">

        {/* Category sidebar */}
        {!search && (
          <nav className="lg:sticky lg:top-24 bg-white border border-[#3B1F0A]/8 overflow-hidden">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setOpenIndex(0); }}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left text-sm font-medium border-l-2 transition-all duration-150 ${
                  activeCategory === cat.id
                    ? "border-[#C8820A] bg-[#C8820A]/6 text-[#C8820A]"
                    : "border-transparent text-[#3B1F0A]/60 hover:text-[#3B1F0A] hover:bg-[#3B1F0A]/3"
                }`}
              >
                <span className={activeCategory === cat.id ? "text-[#C8820A]" : "text-[#3B1F0A]/35"}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            ))}
          </nav>
        )}

        {/* FAQ list */}
        <div>
          {search ? (
            <p className="text-[#3B1F0A]/45 text-sm mb-5">
              {displayFaqs.length} result{displayFaqs.length !== 1 ? "s" : ""} for &ldquo;<strong className="text-[#3B1F0A]">{search}</strong>&rdquo;
            </p>
          ) : (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[#C8820A]">{current.icon}</span>
              <h2 className="font-bold text-[#3B1F0A] text-xl" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {current.label}
              </h2>
              <span className="text-[#3B1F0A]/30 text-sm">{current.faqs.length} questions</span>
            </div>
          )}

          {displayFaqs.length === 0 ? (
            <div className="bg-white border border-[#3B1F0A]/8 px-8 py-14 text-center">
              <p className="text-[#3B1F0A]/40 text-sm mb-3">No results found for &ldquo;{search}&rdquo;</p>
              <button onClick={() => setSearch("")} className="text-[#C8820A] text-sm underline underline-offset-4">
                Clear search
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#3B1F0A]/8 overflow-hidden">
              {displayFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  faq={faq}
                  isOpen={openIndex === i}
                  onToggle={() => toggle(i)}
                />
              ))}
            </div>
          )}

          {/* Still need help */}
          <div className="mt-8 bg-[#3B1F0A] px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
            <div>
              <p className="text-white font-semibold text-base mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Still need help?
              </p>
              <p className="text-white/45 text-sm">Our support team is a message away.</p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 inline-flex items-center gap-2 bg-[#C8820A] text-white px-6 py-3 text-sm font-semibold tracking-wider hover:bg-[#e09a20] transition-colors duration-200"
            >
              Contact Us
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A0D00] py-8 px-6 text-center mt-8">
        <p className="text-white/25 text-xs">
          © 2026 Highlands Coffee Corporation · Can&apos;t find your answer? Call us on 1800 6567.
        </p>
      </footer>

    </div>
  );
}
