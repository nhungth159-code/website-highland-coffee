"use client";

import { useState } from "react";
import Link from "next/link";
import { saveGiftCard, findGiftCard, generateCode } from "@/lib/giftcards";

// ── Card denominations ────────────────────────────────────────
const CARDS = [
  {
    amount: 100000,
    label: "100,000₫",
    tier: "Starter",
    desc: "Perfect for a morning ritual",
    from: "#3B1F0A",
    to: "#6B3A1F",
    accent: "#C8820A",
  },
  {
    amount: 200000,
    label: "200,000₫",
    tier: "Classic",
    desc: "A week of great coffee",
    from: "#1A0D00",
    to: "#3B1F0A",
    accent: "#D4960F",
  },
  {
    amount: 500000,
    label: "500,000₫",
    tier: "Premium",
    desc: "The gift they'll remember",
    from: "#C8820A",
    to: "#8B5A05",
    accent: "#FAF6EF",
  },
  {
    amount: 1000000,
    label: "1,000,000₫",
    tier: "Gold",
    desc: "For the true coffee lover",
    from: "#2D5016",
    to: "#1A3009",
    accent: "#C8820A",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Choose Amount",
    desc: "Pick a denomination that fits your budget — from a single morning cup to a month of favourites.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Personalise",
    desc: "Add the recipient's name, a heartfelt message, and your name so they know who to thank.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Send & Enjoy",
    desc: "A unique code is generated instantly. Share it with your recipient — redeemable at any Highlands store or when paying for an online order.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

type Step = "select" | "personalise" | "pay" | "success";

interface FormData {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
}

// ── GiftCard visual component ─────────────────────────────────
function CardPreview({
  card,
  recipientName,
  senderName,
  size = "lg",
}: {
  card: (typeof CARDS)[number];
  recipientName?: string;
  senderName?: string;
  size?: "sm" | "lg";
}) {
  const isLg = size === "lg";
  return (
    <div
      className={`relative overflow-hidden ${isLg ? "rounded-2xl w-full aspect-[1.586/1]" : "rounded-xl w-full aspect-[1.586/1]"} shadow-2xl`}
      style={{ background: `linear-gradient(135deg, ${card.from} 0%, ${card.to} 100%)` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        {[120, 200, 280, 360].map((s) => (
          <div
            key={s}
            className="absolute rounded-full border border-white"
            style={{ width: s, height: s, top: "50%", left: "60%", transform: "translate(-50%, -50%)" }}
          />
        ))}
      </div>

      {/* Coffee icon watermark */}
      <svg
        className="absolute right-4 bottom-4 opacity-10"
        width={isLg ? 80 : 50}
        height={isLg ? 80 : 50}
        fill="none"
        stroke="white"
        strokeWidth="1"
        viewBox="0 0 24 24"
      >
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" />
        <path d="M6 1v3M10 1v3M14 1v3" strokeLinecap="round" />
      </svg>

      {/* Content */}
      <div className={`relative z-10 flex flex-col justify-between h-full ${isLg ? "p-7" : "p-4"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p
              className="font-bold tracking-[0.2em] text-white"
              style={{ fontSize: isLg ? 18 : 12 }}
            >
              HIGHLANDS
            </p>
            <p
              className="tracking-widest uppercase font-medium"
              style={{ color: card.accent, fontSize: isLg ? 10 : 7, marginTop: 2 }}
            >
              Coffee · Gift Card
            </p>
          </div>
          <div className="text-right">
            <p
              className="font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), serif", fontSize: isLg ? 28 : 18 }}
            >
              {card.label}
            </p>
            <p className="text-white/50 uppercase tracking-widest" style={{ fontSize: isLg ? 9 : 6 }}>
              {card.tier}
            </p>
          </div>
        </div>

        <div>
          {recipientName && (
            <p className="text-white/70 font-medium mb-0.5 truncate" style={{ fontSize: isLg ? 12 : 8 }}>
              For {recipientName}
            </p>
          )}
          <p
            className="font-mono tracking-[0.25em] text-white/40"
            style={{ fontSize: isLg ? 11 : 7 }}
          >
            ████ ████ ████ ████
          </p>
          {senderName && (
            <p className="text-white/40 mt-1" style={{ fontSize: isLg ? 10 : 7 }}>
              From {senderName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function GiftCardsPage() {
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<(typeof CARDS)[number]>(CARDS[1]);
  const [form, setForm] = useState<FormData>({ recipientName: "", recipientEmail: "", senderName: "", message: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [generatedCode, setGeneratedCode] = useState("");
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceResult, setBalanceResult] = useState<{ found: boolean; balance?: number; amount?: number; recipientName?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [payMethod, setPayMethod] = useState<"card" | "momo" | "zalopay" | "vnpay">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const validatePersonalise = () => {
    const e: Partial<FormData> = {};
    if (!form.recipientName.trim()) e.recipientName = "Recipient name is required.";
    if (!form.recipientEmail.trim()) e.recipientEmail = "Recipient email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) e.recipientEmail = "Please enter a valid email.";
    if (!form.senderName.trim()) e.senderName = "Your name is required.";
    return e;
  };

  const handlePersonaliseNext = () => {
    const e = validatePersonalise();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep("pay");
  };

  const handlePurchase = async () => {
    const code = generateCode();
    setGeneratedCode(code);
    saveGiftCard({
      code,
      amount: selected.amount,
      senderName: form.senderName,
      recipientName: form.recipientName,
      recipientEmail: form.recipientEmail,
      message: form.message,
      purchasedAt: new Date().toISOString(),
      balance: selected.amount,
    });
    setStep("success");
    // Fire-and-forget — email failure doesn't block the success screen
    fetch("/api/send-giftcard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientName: form.recipientName,
        recipientEmail: form.recipientEmail,
        senderName: form.senderName,
        amount: selected.amount,
        code,
        message: form.message,
        tier: selected.tier,
      }),
    }).catch(() => {});
  };

  const handleCheckBalance = () => {
    if (!balanceInput.trim()) return;
    const card = findGiftCard(balanceInput.trim());
    if (!card) {
      setBalanceResult({ found: false });
    } else {
      setBalanceResult({ found: true, balance: card.balance, amount: card.amount, recipientName: card.recipientName });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((er) => ({ ...er, [key]: "" }));
    },
  });

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) digits = digits.slice(0, 2) + "/" + digits.slice(2);
    setExpiry(digits);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  };

  const PAY_METHODS = [
    { id: "card" as const, label: "Credit / Debit Card" },
    { id: "momo" as const, label: "MoMo" },
    { id: "zalopay" as const, label: "ZaloPay" },
    { id: "vnpay" as const, label: "VNPay" },
  ];

  const EWALLET_INSTRUCTIONS: Record<"momo" | "zalopay" | "vnpay", React.ReactNode> = {
    momo: (
      <div className="space-y-2">
        <p className="text-sm text-[#3B1F0A]/65">Open the <strong className="text-[#ae2070]">MoMo app</strong> and transfer to:</p>
        <div className="bg-[#FAF6EF] border border-[#ae2070]/20 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-[#3B1F0A]/50">MoMo number</span><span className="font-bold text-[#3B1F0A] tracking-wider">0901 234 567</span></div>
          <div className="flex justify-between"><span className="text-[#3B1F0A]/50">Account name</span><span className="font-bold text-[#3B1F0A]">HIGHLANDS COFFEE</span></div>
          <div className="flex justify-between"><span className="text-[#3B1F0A]/50">Amount</span><span className="font-bold text-[#C8820A]">{selected.label}</span></div>
        </div>
        <p className="text-xs text-[#3B1F0A]/40">After transferring, click Confirm below to complete your purchase.</p>
      </div>
    ),
    zalopay: (
      <div className="space-y-2">
        <p className="text-sm text-[#3B1F0A]/65">Open <strong className="text-[#0068ff]">ZaloPay</strong> and send to:</p>
        <div className="bg-[#FAF6EF] border border-[#0068ff]/20 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-[#3B1F0A]/50">ZaloPay ID</span><span className="font-bold text-[#3B1F0A]">highlands.coffee</span></div>
          <div className="flex justify-between"><span className="text-[#3B1F0A]/50">Amount</span><span className="font-bold text-[#C8820A]">{selected.label}</span></div>
        </div>
        <p className="text-xs text-[#3B1F0A]/40">After transferring, click Confirm below to complete your purchase.</p>
      </div>
    ),
    vnpay: (
      <div className="space-y-2">
        <p className="text-sm text-[#3B1F0A]/65">A <strong className="text-[#0a4eaf]">VNPay QR code</strong> will appear on the next screen. Scan with any banking app that supports VNPay.</p>
        <p className="text-xs text-[#0a4eaf]/70">Supported: Vietcombank, Techcombank, MB, VPBank, and 40+ others.</p>
        <p className="text-xs text-[#3B1F0A]/40">Click Confirm below to generate your QR code.</p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

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
      <section className="bg-[#1A0D00] pt-16 pb-20 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none">
          {[600, 900, 1200].map((s) => (
            <div key={s} className="absolute rounded-full border border-[#C8820A]/[0.04]"
              style={{ width: s, height: s, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.4em] uppercase mb-5">
            Highlands Gift Cards
          </p>
          <h1
            className="font-bold text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(38px, 7vw, 72px)" }}
          >
            The Perfect Gift
            <br />
            <span className="text-[#C8820A]">for Every Coffee Lover</span>
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">
            Give the warmth of a great cup. Highlands Gift Cards are redeemable at all 500+ stores nationwide and online — no expiry, no fuss.
          </p>
        </div>
      </section>

      {/* ── Progress bar (steps 1-3) ── */}
      {step !== "success" && (
        <div className="bg-[#3B1F0A] px-6 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-0">
            {(["select", "personalise", "pay"] as Step[]).map((s, i) => {
              const labels = ["Select Amount", "Personalise", "Payment"];
              const stepOrder: Step[] = ["select", "personalise", "pay"];
              const current = stepOrder.indexOf(step);
              const isActive = stepOrder.indexOf(s) <= current;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${isActive ? "bg-[#C8820A] text-white" : "bg-white/10 text-white/30"}`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block transition-colors ${isActive ? "text-white" : "text-white/30"}`}>
                      {labels[i]}
                    </span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-px mx-3 transition-colors ${current > i ? "bg-[#C8820A]/60" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* ══ STEP 1: SELECT ══════════════════════════════════════════ */}
        {step === "select" && (
          <div>
            <h2 className="text-2xl font-bold text-[#3B1F0A] mb-2 text-center" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Choose a Value
            </h2>
            <p className="text-[#3B1F0A]/45 text-sm text-center mb-10">Select the denomination that suits the occasion.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {CARDS.map((card) => (
                <button
                  key={card.amount}
                  onClick={() => setSelected(card)}
                  className={`relative text-left transition-all duration-200 group ${selected.amount === card.amount ? "ring-2 ring-[#C8820A] ring-offset-2 ring-offset-[#FAF6EF]" : "hover:ring-1 hover:ring-[#C8820A]/40 hover:ring-offset-2 hover:ring-offset-[#FAF6EF]"}`}
                >
                  <CardPreview card={card} size="sm" />
                  <div className="mt-3 px-1">
                    <p className="font-bold text-[#3B1F0A] text-sm">{card.label}
                      <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded`} style={{ background: card.from + "20", color: card.from }}>
                        {card.tier}
                      </span>
                    </p>
                    <p className="text-[#3B1F0A]/45 text-xs mt-0.5">{card.desc}</p>
                  </div>
                  {selected.amount === card.amount && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#C8820A] rounded-full flex items-center justify-center shadow">
                      <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setStep("personalise")}
                className="flex items-center gap-3 bg-[#C8820A] text-white px-10 py-4 text-sm font-bold tracking-wider hover:bg-[#3B1F0A] transition-colors"
              >
                Continue with {selected.label}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: PERSONALISE ═════════════════════════════════════ */}
        {step === "personalise" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Personalise Your Card
              </h2>
              <p className="text-[#3B1F0A]/45 text-sm mb-8">Add a personal touch to make it memorable.</p>

              <div className="bg-white border border-[#3B1F0A]/8 p-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                      Recipient&apos;s Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nguyễn Văn A"
                      {...field("recipientName")}
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none transition-colors ${errors.recipientName ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"}`}
                    />
                    {errors.recipientName && <p className="mt-1 text-xs text-red-500">{errors.recipientName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                      Recipient&apos;s Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="recipient@email.com"
                      {...field("recipientEmail")}
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none transition-colors ${errors.recipientEmail ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"}`}
                    />
                    {errors.recipientEmail && <p className="mt-1 text-xs text-red-500">{errors.recipientEmail}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    {...field("senderName")}
                    className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none transition-colors ${errors.senderName ? "border-red-400 bg-red-50" : "border-[#3B1F0A]/15 focus:border-[#C8820A]"}`}
                  />
                  {errors.senderName && <p className="mt-1 text-xs text-red-500">{errors.senderName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">
                    Personal Message <span className="text-[#3B1F0A]/30 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write something warm… e.g. 'Wishing you mornings filled with great coffee!'"
                    {...field("message")}
                    className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none focus:border-[#C8820A] resize-none transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep("select")}
                    className="px-6 py-3 text-sm font-semibold text-[#3B1F0A]/60 border border-[#3B1F0A]/15 hover:border-[#3B1F0A]/30 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePersonaliseNext}
                    className="flex-1 bg-[#C8820A] text-white py-3 text-sm font-bold tracking-wider hover:bg-[#3B1F0A] transition-colors"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            </div>

            {/* Card preview */}
            <div className="lg:sticky lg:top-28">
              <p className="text-[10px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">Card Preview</p>
              <CardPreview
                card={selected}
                recipientName={form.recipientName || "Recipient"}
                senderName={form.senderName || "You"}
              />
              <div className="mt-4 bg-white border border-[#3B1F0A]/8 px-5 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#3B1F0A]/50">Card value</span>
                  <span className="font-bold text-[#3B1F0A]">{selected.label}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#3B1F0A]/8">
                  <span className="text-[#3B1F0A]/50">You pay</span>
                  <span className="font-bold text-[#C8820A]">{selected.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 3: PAYMENT ═════════════════════════════════════════ */}
        {step === "pay" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Payment
              </h2>
              <p className="text-[#3B1F0A]/45 text-sm mb-8">Complete your purchase securely.</p>

              <div className="bg-white border border-[#3B1F0A]/8 p-7 space-y-5">
                {/* Payment method pills */}
                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-3">Payment Method</label>
                  <div className="flex flex-wrap gap-2">
                    {PAY_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className="px-4 py-2 text-xs font-semibold border transition-all"
                        style={{
                          borderColor: payMethod === m.id ? "#C8820A" : "rgba(59,31,10,0.15)",
                          color: payMethod === m.id ? "#C8820A" : "rgba(59,31,10,0.55)",
                          background: payMethod === m.id ? "rgba(200,130,10,0.05)" : "transparent",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card form — only when card is selected */}
                {payMethod === "card" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none focus:border-[#C8820A] transition-colors font-mono tracking-wider"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">Expiry</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none focus:border-[#C8820A] transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">CVV</label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none focus:border-[#C8820A] transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="As printed on the card"
                        className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none focus:border-[#C8820A] transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-[#FAF6EF] border border-[#3B1F0A]/10 p-5">
                    {EWALLET_INSTRUCTIONS[payMethod]}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep("personalise")}
                    className="px-6 py-3 text-sm font-semibold text-[#3B1F0A]/60 border border-[#3B1F0A]/15 hover:border-[#3B1F0A]/30 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePurchase}
                    className="flex-1 bg-[#C8820A] text-white py-3 text-sm font-bold tracking-wider hover:bg-[#3B1F0A] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                    </svg>
                    Pay {selected.label}
                  </button>
                </div>

                <p className="text-xs text-[#3B1F0A]/30 text-center">
                  🔒 Payments are processed securely. We never store your card details.
                </p>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:sticky lg:top-28 space-y-4">
              <p className="text-[10px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase">Order Summary</p>
              <CardPreview card={selected} recipientName={form.recipientName} senderName={form.senderName} />
              <div className="bg-white border border-[#3B1F0A]/8 px-5 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#3B1F0A]/50">To</span>
                  <span className="font-medium text-[#3B1F0A]">{form.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3B1F0A]/50">From</span>
                  <span className="font-medium text-[#3B1F0A]">{form.senderName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#3B1F0A]/8">
                  <span className="text-[#3B1F0A]/50">Total</span>
                  <span className="font-bold text-[#C8820A] text-base">{selected.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SUCCESS ═════════════════════════════════════════════════ */}
        {step === "success" && (
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Gift Card Sent!
            </h2>
            <p className="text-[#3B1F0A]/55 text-sm mb-8 leading-relaxed">
              Your {selected.label} gift card for <strong className="text-[#3B1F0A]">{form.recipientName}</strong> has been created.
              Share the code below with them — redeemable at any Highlands store or at checkout when ordering online.
            </p>

            <div className="mb-8">
              <CardPreview card={selected} recipientName={form.recipientName} senderName={form.senderName} />
            </div>

            {/* Code display */}
            <div className="bg-[#3B1F0A] px-6 py-5 mb-6">
              <p className="text-white/40 text-[10px] tracking-widest uppercase mb-2">Gift Card Code</p>
              <p
                className="text-3xl font-bold text-[#C8820A] tracking-[0.2em] mb-3"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {generatedCode}
              </p>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-2 bg-[#C8820A]/20 text-[#C8820A] text-xs font-semibold px-4 py-2 hover:bg-[#C8820A]/30 transition-colors"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {form.message && (
              <div className="bg-[#C8820A]/8 border border-[#C8820A]/20 px-5 py-4 mb-6 text-left">
                <p className="text-[10px] font-semibold text-[#C8820A] tracking-widest uppercase mb-1">Your Message</p>
                <p className="text-sm text-[#3B1F0A]/70 italic">&ldquo;{form.message}&rdquo;</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setStep("select"); setForm({ recipientName: "", recipientEmail: "", senderName: "", message: "" }); setGeneratedCode(""); }}
                className="px-8 py-3 text-sm font-bold tracking-wider bg-[#C8820A] text-white hover:bg-[#3B1F0A] transition-colors"
              >
                Buy Another Card
              </button>
              <Link href="/" className="px-8 py-3 text-sm font-semibold text-[#3B1F0A]/60 border border-[#3B1F0A]/15 hover:border-[#3B1F0A]/30 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── How It Works ── */}
      {step === "select" && (
        <section className="bg-[#3B1F0A] py-20 px-6 lg:px-8 mt-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">Simple & Instant</p>
              <h2 className="font-bold text-white text-3xl" style={{ fontFamily: "var(--font-playfair), serif" }}>
                How It Works
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-14 h-14 bg-[#C8820A]/15 text-[#C8820A] flex items-center justify-center mx-auto mb-5">
                    {s.icon}
                  </div>
                  <p className="text-[#C8820A]/50 text-xs font-bold tracking-widest mb-2">{s.n}</p>
                  <h3 className="font-bold text-white text-lg mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {s.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Balance Checker ── */}
      {step === "select" && (
        <section className="py-20 px-6 lg:px-8 bg-[#FAF6EF]">
          <div className="max-w-md mx-auto text-center">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">Already Have a Card?</p>
            <h2 className="font-bold text-[#3B1F0A] text-2xl mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Check Your Balance
            </h2>
            <p className="text-[#3B1F0A]/45 text-sm mb-7">Enter your gift card code to see the remaining balance.</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={balanceInput}
                onChange={(e) => { setBalanceInput(e.target.value.toUpperCase()); setBalanceResult(null); }}
                placeholder="HGC-XXXX-XXXX"
                className="flex-1 border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 focus:outline-none focus:border-[#C8820A] transition-colors font-mono tracking-wider uppercase"
              />
              <button
                onClick={handleCheckBalance}
                className="bg-[#3B1F0A] text-white px-5 py-3 text-sm font-bold hover:bg-[#C8820A] transition-colors"
              >
                Check
              </button>
            </div>

            {balanceResult && (
              <div className={`mt-4 px-5 py-4 border text-left ${balanceResult.found ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                {balanceResult.found ? (
                  <>
                    <p className="text-green-700 text-sm font-semibold mb-1">✓ Valid Gift Card</p>
                    <p className="text-green-600 text-xs">Recipient: {balanceResult.recipientName}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-green-700/70">Remaining Balance</span>
                      <span className="font-bold text-green-700">{balanceResult.balance?.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between text-sm mt-0.5">
                      <span className="text-green-700/70">Original Value</span>
                      <span className="text-green-700">{balanceResult.amount?.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </>
                ) : (
                  <p className="text-red-600 text-sm">Card not found. Please check the code and try again.</p>
                )}
              </div>
            )}

            <p className="text-[#3B1F0A]/30 text-xs mt-4">
              Gift cards have no expiry date and are redeemable at all 500+ Highlands stores or online at checkout.
            </p>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-[#1A0D00] py-8 px-6 text-center">
        <p className="text-white/25 text-xs">
          © 2026 Highlands Coffee Corporation · Gift cards are non-refundable and cannot be exchanged for cash.
        </p>
      </footer>
    </div>
  );
}
