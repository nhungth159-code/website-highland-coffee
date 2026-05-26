"use client";

import { useState } from "react";
import Link from "next/link";
import type { LoyaltyCustomer } from "@/lib/loyalty";

type Step = "lookup" | "register" | "found" | "success";

const TIER_STYLE = {
  Bronze: { badge: "bg-amber-100 text-amber-800 border-amber-300", star: "text-amber-500", bar: "bg-amber-400", next: 1000 },
  Silver: { badge: "bg-slate-100 text-slate-700 border-slate-300", star: "text-slate-400", bar: "bg-slate-400", next: 5000 },
  Gold:   { badge: "bg-[#FFF8EC] text-[#C8820A] border-[#C8820A]/40", star: "text-[#C8820A]", bar: "bg-[#C8820A]", next: null },
};

const TIER_BENEFITS = {
  Bronze: ["1 star per 10,000₫ spent", "100 stars welcome bonus", "Birthday treat every year"],
  Silver: ["1.5× stars per 10,000₫ spent", "Free drink size upgrade once/month", "All Bronze benefits"],
  Gold:   ["2× stars per 10,000₫ spent", "Unlimited free size upgrades", "Exclusive Gold menu access", "All Silver benefits"],
};

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{3})/, "$1 **** $3");
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function MemberCard({ customer, isNew }: { customer: LoyaltyCustomer; isNew?: boolean }) {
  const t = TIER_STYLE[customer.tier];
  const progress =
    customer.tier === "Bronze"
      ? Math.min((customer.starsEarned / 1000) * 100, 100)
      : customer.tier === "Silver"
      ? Math.min(((customer.starsEarned - 1000) / 4000) * 100, 100)
      : 100;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card */}
      <div className="relative bg-[#1A0D00] rounded-2xl overflow-hidden shadow-2xl">
        {/* Background rings */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-[#C8820A]/10" />
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full border border-[#C8820A]/15" />

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[#C8820A] text-[10px] font-semibold tracking-[0.35em] uppercase">Highlands Stars</p>
              <p className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: "Georgia, serif" }}>
                {customer.name}
              </p>
              <p className="text-white/40 text-xs mt-0.5">{maskPhone(customer.phone)}</p>
            </div>
            <span className={`border text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase ${t.badge}`}>
              {customer.tier}
            </span>
          </div>

          <div className="flex items-end gap-2 mb-5">
            <StarIcon className={`w-7 h-7 ${t.star}`} />
            <p className="text-4xl font-bold text-white leading-none">{customer.starsBalance.toLocaleString()}</p>
            <p className="text-white/40 text-sm pb-0.5">stars</p>
          </div>

          {/* Progress bar */}
          {customer.tier !== "Gold" && (
            <div className="mb-5">
              <div className="flex justify-between text-[10px] text-white/35 mb-1.5">
                <span>{customer.starsEarned.toLocaleString()} stars earned</span>
                <span>{t.next?.toLocaleString()} for {customer.tier === "Bronze" ? "Silver" : "Gold"}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${t.bar}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-white/30 border-t border-white/8 pt-4">
            <span>Member since {new Date(customer.joinDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
            <span className="font-mono text-[10px]">{customer.id.slice(0, 12).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {isNew && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg text-center">
          <p className="text-emerald-700 text-sm font-semibold">Welcome! 100 bonus stars added.</p>
          <p className="text-emerald-600 text-xs mt-0.5">Show this card at any Highlands store to earn more stars.</p>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-5 bg-white border border-[#3B1F0A]/8 rounded-xl p-4">
        <p className="text-[10px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">{customer.tier} Benefits</p>
        <ul className="space-y-2">
          {TIER_BENEFITS[customer.tier].map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-[#3B1F0A]/70">
              <StarIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${t.star}`} />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const [step, setStep] = useState<Step>("lookup");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/register-membership?phone=${encodeURIComponent(phone.trim())}`);
      const data: { found: boolean; customer?: LoyaltyCustomer } = await res.json();
      if (data.found && data.customer) {
        setCustomer(data.customer);
        setStep("found");
      } else {
        setStep("register");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim(), email: email.trim() }),
      });
      const data: { success?: boolean; customer?: LoyaltyCustomer; error?: string } = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
        setStep("success");
      } else {
        setError(data.error ?? "Registration failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="bg-[#3B1F0A] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-[0.18em] text-white" style={{ fontFamily: "Georgia, serif" }}>
          HIGHLANDS
        </Link>
        <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">← Back to Home</Link>
      </nav>

      {/* Hero */}
      <div className="bg-[#1A0D00] px-6 py-16 text-center relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#C8820A]/6 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-[#C8820A]/10 pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <StarIcon className="w-5 h-5 text-[#C8820A]" />
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase">Highlands Stars</p>
            <StarIcon className="w-5 h-5 text-[#C8820A]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "Georgia, serif" }}>
            Earn Stars,<br />
            <span className="text-[#C8820A]">Unlock Rewards</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Join free with your phone number. Earn stars on every purchase and climb from Bronze to Gold.
          </p>
        </div>
      </div>

      {/* Tier overview strip */}
      <div className="bg-[#3B1F0A] px-6 py-5">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {(["Bronze", "Silver", "Gold"] as const).map((tier) => {
            const t = TIER_STYLE[tier];
            return (
              <div key={tier} className="text-center">
                <StarIcon className={`w-5 h-5 mx-auto mb-1.5 ${t.star}`} />
                <p className={`text-[11px] font-bold tracking-widest uppercase ${t.badge.split(" ").find(c => c.startsWith("text-")) ?? "text-white"}`}>{tier}</p>
                <p className="text-white/30 text-[10px] mt-0.5">
                  {tier === "Bronze" ? "0–999" : tier === "Silver" ? "1K–4.9K" : "5K+"} stars
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-6 py-12">

        {/* Step: Lookup */}
        {step === "lookup" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "Georgia, serif" }}>
                Check or Join
              </h2>
              <p className="text-[#3B1F0A]/50 text-sm">Enter your phone number to check if you&apos;re already a member, or to sign up.</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0912 345 678"
                  required
                  className="w-full border border-[#3B1F0A]/15 bg-white px-4 py-3 text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors text-base"
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-[#C8820A] text-white font-semibold py-3.5 hover:bg-[#3B1F0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Checking…
                  </>
                ) : "Check Membership"}
              </button>
            </form>

            {/* Perks preview */}
            <div className="mt-10 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "⭐", title: "Earn Stars", sub: "1 star per 10K₫" },
                { icon: "🎁", title: "Free Rewards", sub: "Redeem at any store" },
                { icon: "🎂", title: "Birthday Treat", sub: "Free drink every year" },
              ].map((p) => (
                <div key={p.title} className="bg-white border border-[#3B1F0A]/8 px-3 py-4">
                  <p className="text-2xl mb-1.5">{p.icon}</p>
                  <p className="text-[11px] font-semibold text-[#3B1F0A]">{p.title}</p>
                  <p className="text-[10px] text-[#3B1F0A]/40 mt-0.5">{p.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Register */}
        {step === "register" && (
          <div>
            <button
              onClick={() => { setStep("lookup"); setError(""); }}
              className="flex items-center gap-1.5 text-sm text-[#3B1F0A]/45 hover:text-[#3B1F0A] mb-6 transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>

            <div className="mb-8">
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.3em] uppercase mb-1">New Member</p>
              <h2 className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>
                Join Highlands Stars
              </h2>
              <p className="text-[#3B1F0A]/50 text-sm mt-1">
                Registering <span className="font-semibold text-[#3B1F0A]">{phone}</span> — get 100 welcome stars instantly.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full border border-[#3B1F0A]/15 bg-white px-4 py-3 text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">
                  Email <span className="text-[#3B1F0A]/25 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[#3B1F0A]/15 bg-white px-4 py-3 text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors"
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-[#C8820A] text-white font-semibold py-3.5 hover:bg-[#3B1F0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    <StarIcon className="w-4 h-4" />
                    Join & Claim 100 Stars
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-[#3B1F0A]/30 leading-relaxed">
                By joining you agree to receive membership communications from Highlands Coffee.
              </p>
            </form>
          </div>
        )}

        {/* Step: Found existing member */}
        {step === "found" && customer && (
          <div>
            <div className="text-center mb-6">
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.3em] uppercase mb-1">Welcome Back</p>
              <h2 className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>
                Your Membership Card
              </h2>
            </div>
            <MemberCard customer={customer} />
            <div className="mt-6 text-center">
              <button
                onClick={() => { setStep("lookup"); setPhone(""); setCustomer(null); }}
                className="text-sm text-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-colors"
              >
                Look up a different number
              </button>
            </div>
          </div>
        )}

        {/* Step: Newly registered */}
        {step === "success" && customer && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.3em] uppercase mb-1">You&apos;re In!</p>
              <h2 className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "Georgia, serif" }}>
                Welcome to Highlands Stars
              </h2>
            </div>
            <MemberCard customer={customer} isNew />
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#3B1F0A] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#C8820A] transition-colors"
              >
                Start Ordering
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
