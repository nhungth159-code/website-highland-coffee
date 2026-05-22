"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getGiftCards,
  saveGiftCard,
  topUpGiftCard,
  revokeGiftCard,
  deleteGiftCard,
  generateCode,
} from "@/lib/giftcards";
import type { GiftCard } from "@/lib/giftcards";

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

const TIER_MAP: Record<number, { label: string; color: string; bg: string }> = {
  100000:  { label: "Starter", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  200000:  { label: "Classic", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  500000:  { label: "Premium", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  1000000: { label: "Gold",    color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
};

function getTier(amount: number) {
  return TIER_MAP[amount] ?? { label: "Custom", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" };
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── Issue Card Modal ─────────────────────────────────────────
const DENOMINATIONS = [
  { amount: 100000,  tier: "Starter" },
  { amount: 200000,  tier: "Classic" },
  { amount: 500000,  tier: "Premium" },
  { amount: 1000000, tier: "Gold"    },
];

interface IssueForm {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  sendEmail: boolean;
}

function IssueCardModal({ onClose, onIssued }: { onClose: () => void; onIssued: () => void }) {
  const [form, setForm] = useState<IssueForm>({
    amount: 200000,
    recipientName: "",
    recipientEmail: "",
    senderName: "Highlands Coffee Admin",
    message: "",
    sendEmail: true,
  });
  const [errors, setErrors] = useState<Partial<IssueForm>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const validate = () => {
    const e: Partial<IssueForm> = {};
    if (!form.recipientName.trim()) (e as Record<string, string>).recipientName = "Required";
    if (!form.recipientEmail.trim()) (e as Record<string, string>).recipientEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) (e as Record<string, string>).recipientEmail = "Invalid email";
    if (!form.senderName.trim()) (e as Record<string, string>).senderName = "Required";
    return e;
  };

  const handleIssue = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const code = generateCode();
    const tier = DENOMINATIONS.find((d) => d.amount === form.amount)?.tier ?? "Custom";
    saveGiftCard({
      code,
      amount: form.amount,
      senderName: form.senderName,
      recipientName: form.recipientName,
      recipientEmail: form.recipientEmail,
      message: form.message,
      purchasedAt: new Date().toISOString(),
      balance: form.amount,
    });
    if (form.sendEmail) {
      await fetch("/api/send-giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          senderName: form.senderName,
          amount: form.amount,
          code,
          message: form.message,
          tier,
        }),
      }).catch(() => {});
    }
    setDone(code);
    setLoading(false);
    onIssued();
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#C8820A] tracking-widest uppercase mb-2">Gift Card Issued</p>
          <h3 className="text-2xl font-bold text-[#3B1F0A] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Card Created!
          </h3>
          <div className="bg-[#1A0D00] px-6 py-4 mb-4">
            <p className="text-white/40 text-[10px] tracking-widest uppercase mb-1">Gift Card Code</p>
            <p className="text-2xl font-bold text-[#C8820A] tracking-[0.2em] font-mono">{done}</p>
          </div>
          <p className="text-sm text-[#3B1F0A]/55 mb-6">
            Issued to <strong className="text-[#3B1F0A]">{form.recipientName}</strong> · {fmt(form.amount)}
            {form.sendEmail && " · Email sent"}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-[#3B1F0A] text-white py-3 text-sm font-bold tracking-wide hover:bg-[#1A0D00] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg my-4">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#3B1F0A]/10">
          <h3 className="text-lg font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Issue New Gift Card
          </h3>
          <button onClick={onClose} className="text-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Denomination */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {DENOMINATIONS.map((d) => {
                const t = getTier(d.amount);
                return (
                  <button
                    key={d.amount}
                    onClick={() => setForm((f) => ({ ...f, amount: d.amount }))}
                    className={`py-3 text-center border-2 transition-all ${
                      form.amount === d.amount
                        ? "border-[#C8820A] bg-[#C8820A]/5"
                        : "border-[#3B1F0A]/12 hover:border-[#3B1F0A]/25"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#3B1F0A]">{fmt(d.amount)}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${t.color}`}>{d.tier}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-1.5">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.recipientName}
                onChange={(e) => { setForm((f) => ({ ...f, recipientName: e.target.value })); setErrors((er) => ({ ...er, recipientName: "" })); }}
                placeholder="Nguyễn Thị A"
                className={`w-full border px-3 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${(errors as Record<string,string>).recipientName ? "border-red-400" : "border-[#3B1F0A]/15"}`}
              />
              {(errors as Record<string,string>).recipientName && <p className="text-red-500 text-xs mt-1">{(errors as Record<string,string>).recipientName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-1.5">
                Recipient Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => { setForm((f) => ({ ...f, recipientEmail: e.target.value })); setErrors((er) => ({ ...er, recipientEmail: "" })); }}
                placeholder="recipient@email.com"
                className={`w-full border px-3 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${(errors as Record<string,string>).recipientEmail ? "border-red-400" : "border-[#3B1F0A]/15"}`}
              />
              {(errors as Record<string,string>).recipientEmail && <p className="text-red-500 text-xs mt-1">{(errors as Record<string,string>).recipientEmail}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-1.5">
              Issued By <span className="text-red-500">*</span>
            </label>
            <input
              value={form.senderName}
              onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
              placeholder="Highlands Coffee Admin"
              className="w-full border border-[#3B1F0A]/15 px-3 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-1.5">
              Message <span className="text-[#3B1F0A]/30 font-normal normal-case text-xs">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="A short note for the recipient..."
              className="w-full border border-[#3B1F0A]/15 px-3 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] resize-none transition-colors"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                form.sendEmail ? "bg-[#C8820A] border-[#C8820A]" : "border-[#3B1F0A]/20 group-hover:border-[#C8820A]/50"
              }`}
              onClick={() => setForm((f) => ({ ...f, sendEmail: !f.sendEmail }))}
            >
              {form.sendEmail && (
                <svg width="11" height="11" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-[#3B1F0A]">Send gift card email to recipient</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#3B1F0A]/10 flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#3B1F0A]/55 border border-[#3B1F0A]/15 hover:border-[#3B1F0A]/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleIssue}
            disabled={loading}
            className="flex-1 bg-[#C8820A] text-white py-2.5 text-sm font-bold tracking-wide hover:bg-[#3B1F0A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Issuing...
              </>
            ) : (
              `Issue ${fmt(form.amount)} Card`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Top-Up Modal ─────────────────────────────────────────────
function TopUpModal({ card, onClose, onDone }: { card: GiftCard; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleTopUp = () => {
    const n = parseInt(amount.replace(/\D/g, ""), 10);
    if (!n || n < 1000) { setError("Enter at least 1,000₫"); return; }
    topUpGiftCard(card.code, n);
    onDone();
    onClose();
  };

  const QUICK = [50000, 100000, 200000, 500000];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3B1F0A]/10">
          <h3 className="font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>Top Up Balance</h3>
          <button onClick={onClose} className="text-[#3B1F0A]/40 hover:text-[#3B1F0A]">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-[#FAF6EF] border border-[#3B1F0A]/8 px-4 py-3 text-sm">
            <p className="text-[#3B1F0A]/50 text-xs mb-1">Card</p>
            <p className="font-bold text-[#3B1F0A] font-mono tracking-widest text-sm">{card.code}</p>
            <p className="text-[#3B1F0A]/50 text-xs mt-1.5">Current balance: <span className="font-semibold text-[#3B1F0A]">{fmt(card.balance)}</span></p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">Quick Amounts</label>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => { setAmount(String(q)); setError(""); }}
                  className="py-2 text-xs font-semibold border border-[#3B1F0A]/12 text-[#3B1F0A]/60 hover:border-[#C8820A] hover:text-[#C8820A] transition-all"
                >
                  {fmt(q)}
                </button>
              ))}
            </div>
            <label className="block text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase mb-2">Custom Amount (₫)</label>
            <input
              type="text"
              value={amount ? parseInt(amount.replace(/\D/g, "") || "0").toLocaleString("vi-VN") : ""}
              onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="e.g. 100,000"
              className={`w-full border px-3 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${error ? "border-red-400" : "border-[#3B1F0A]/15"}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#3B1F0A]/10 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-[#3B1F0A]/55 border border-[#3B1F0A]/15 hover:border-[#3B1F0A]/30 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleTopUp}
            className="flex-1 bg-[#C8820A] text-white py-2.5 text-sm font-bold tracking-wide hover:bg-[#3B1F0A] transition-colors"
          >
            Add {amount ? fmt(parseInt(amount || "0")) : "Balance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
type FilterTab = "all" | "active" | "depleted";
type SortKey = "newest" | "oldest" | "balance_high" | "balance_low" | "amount_high";

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showIssue, setShowIssue] = useState(false);
  const [topUpCard, setTopUpCard] = useState<GiftCard | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<Record<string, "sending" | "sent" | "error">>({});

  const load = () => setCards(getGiftCards());

  useEffect(() => {
    load();
    setMounted(true);
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalLoaded    = cards.reduce((s, c) => s + c.amount, 0);
    const totalBalance   = cards.reduce((s, c) => s + c.balance, 0);
    const totalRedeemed  = totalLoaded - totalBalance;
    const activeCount    = cards.filter((c) => c.balance > 0).length;
    const depletedCount  = cards.filter((c) => c.balance === 0).length;
    const redemptionRate = totalLoaded > 0 ? Math.round((totalRedeemed / totalLoaded) * 100) : 0;
    return { totalLoaded, totalBalance, totalRedeemed, activeCount, depletedCount, total: cards.length, redemptionRate };
  }, [cards]);

  // ── Filtered + sorted ──────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...cards];
    if (filter === "active")   list = list.filter((c) => c.balance > 0);
    if (filter === "depleted") list = list.filter((c) => c.balance === 0);
    if (tierFilter !== "all") {
      const amt = parseInt(tierFilter);
      list = list.filter((c) => c.amount === amt);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.recipientName.toLowerCase().includes(q) ||
          c.recipientEmail.toLowerCase().includes(q) ||
          c.senderName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === "newest")       return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
      if (sort === "oldest")       return new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime();
      if (sort === "balance_high") return b.balance - a.balance;
      if (sort === "balance_low")  return a.balance - b.balance;
      if (sort === "amount_high")  return b.amount - a.amount;
      return 0;
    });
    return list;
  }, [cards, filter, tierFilter, search, sort]);

  const handleRevoke = (code: string) => {
    revokeGiftCard(code);
    load();
    setConfirmRevoke(null);
    setExpanded(null);
  };

  const handleDelete = (code: string) => {
    deleteGiftCard(code);
    load();
    setConfirmDelete(null);
    setExpanded(null);
  };

  const handleResend = async (card: GiftCard) => {
    const tier = Object.entries(TIER_MAP).find(([k]) => parseInt(k) === card.amount)?.[1]?.label ?? "Custom";
    setResendStatus((s) => ({ ...s, [card.code]: "sending" }));
    try {
      await fetch("/api/send-giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: card.recipientName,
          recipientEmail: card.recipientEmail,
          senderName: card.senderName,
          amount: card.amount,
          code: card.code,
          message: card.message,
          tier,
        }),
      });
      setResendStatus((s) => ({ ...s, [card.code]: "sent" }));
      setTimeout(() => setResendStatus((s) => { const n = { ...s }; delete n[card.code]; return n; }), 3000);
    } catch {
      setResendStatus((s) => ({ ...s, [card.code]: "error" }));
    }
  };

  if (!mounted) return null;

  const STAT_CARDS = [
    { label: "Total Issued",       value: stats.total,                    sub: "gift cards",           icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { label: "Total Value Loaded", value: fmt(stats.totalLoaded),         sub: "across all cards",     icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0" },
    { label: "Total Redeemed",     value: fmt(stats.totalRedeemed),       sub: `${stats.redemptionRate}% redemption rate`, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" },
    { label: "Outstanding Balance",value: fmt(stats.totalBalance),        sub: `${stats.activeCount} active cards`, icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" },
    { label: "Active / Depleted",  value: `${stats.activeCount} / ${stats.depletedCount}`, sub: "active still hold balance", icon: "M13 10V3L4 14h7v7l9-11h-7" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white transition-colors" title="Back to site">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold tracking-widest" style={{ fontFamily: "var(--font-playfair), serif" }}>
              HIGHLANDS
            </p>
            <span className="text-white/20 text-lg">|</span>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-white/50 hover:text-white transition-colors">Orders</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/applications" className="text-white/50 hover:text-white transition-colors">Applications</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/contacts" className="text-white/50 hover:text-white transition-colors">Contacts</Link>
              <span className="text-white/20">/</span>
              <span className="text-white font-semibold">Gift Cards</span>
              <span className="text-white/20">/</span>
              <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors">Promotions</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/loyalty" className="text-white/50 hover:text-white transition-colors">Loyalty</Link>
              <span className="text-white/20">/</span>
              <div className="relative group">
                <span className="flex items-center gap-1 text-white/50 hover:text-white transition-colors cursor-default select-none">
                  Report
                  <svg width="8" height="4" fill="currentColor" viewBox="0 0 8 4"><path d="M0 0l4 4 4-4H0z"/></svg>
                </span>
                <div className="absolute top-full left-0 pt-1.5 hidden group-hover:block z-[60]">
                  <div className="bg-[#1A0D00] border border-white/10 shadow-2xl py-1 min-w-[160px]">
                    <Link href="/admin/reports" className="block px-4 py-2 text-xs text-white/55 hover:text-white hover:bg-white/5 transition-colors">Dashboard</Link>
                    <Link href="/admin/reports/interactive" className="block px-4 py-2 text-xs text-white/55 hover:text-white hover:bg-white/5 transition-colors">Interactive Explorer</Link>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowIssue(true)}
            className="flex items-center gap-2 bg-[#C8820A] text-white px-4 py-2 text-xs font-bold tracking-wide hover:bg-[#D4960F] transition-colors"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Issue Card
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ── Page title ── */}
        <div>
          <h1 className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Gift Cards
          </h1>
          <p className="text-sm text-[#3B1F0A]/45 mt-0.5">
            Issue, track, and manage digital gift cards and customer balances.
          </p>
        </div>

        {/* ── Stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="bg-white border border-[#3B1F0A]/8 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-[#3B1F0A]/45 font-medium leading-tight">{s.label}</p>
                <svg width="15" height="15" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xl font-bold text-[#3B1F0A] leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {s.value}
              </p>
              <p className="text-xs text-[#3B1F0A]/35 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, recipient, sender..."
              className="w-full bg-white border border-[#3B1F0A]/10 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1">
            {(["all", "active", "depleted"] as FilterTab[]).map((t) => {
              const count = t === "all" ? cards.length : t === "active" ? stats.activeCount : stats.depletedCount;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-2 text-xs font-semibold capitalize transition-all border ${
                    filter === t
                      ? "bg-[#3B1F0A] text-white border-[#3B1F0A]"
                      : "bg-white text-[#3B1F0A]/55 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/30"
                  }`}
                >
                  {t} <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-white border border-[#3B1F0A]/10 px-3 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors"
          >
            <option value="all">All Tiers</option>
            {Object.entries(TIER_MAP).map(([amt, t]) => (
              <option key={amt} value={amt}>{t.label} – {fmt(parseInt(amt))}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-white border border-[#3B1F0A]/10 px-3 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="balance_high">Highest Balance</option>
            <option value="balance_low">Lowest Balance</option>
            <option value="amount_high">Highest Value</option>
          </select>
        </div>

        {/* ── Cards list ─────────────────────────────────────── */}
        {visible.length === 0 ? (
          <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#3B1F0A]/5 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="13" rx="2" />
                <path d="M12 7V20M8 7c0-2 1.5-3 2.5-3s2.5 1.5 2.5 3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {search || filter !== "all" || tierFilter !== "all" ? "No cards match your filters" : "No gift cards yet"}
            </p>
            <p className="text-sm text-[#3B1F0A]/40 mb-4">
              {search || filter !== "all" || tierFilter !== "all" ? "Try adjusting your search or filters." : "Issue your first card or wait for customers to purchase."}
            </p>
            {!search && filter === "all" && tierFilter === "all" && (
              <button
                onClick={() => setShowIssue(true)}
                className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors"
              >
                Issue First Card
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((card) => {
              const tier = getTier(card.amount);
              const redeemed = card.amount - card.balance;
              const pct = card.amount > 0 ? Math.round((card.balance / card.amount) * 100) : 0;
              const isActive = card.balance > 0;
              const isExpanded = expanded === card.code;

              return (
                <div key={card.code} className="bg-white border border-[#3B1F0A]/8 overflow-hidden">

                  {/* Row */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAF6EF]/60 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : card.code)}
                  >
                    {/* Code + tier */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-[#3B1F0A] font-mono tracking-widest text-sm">{card.code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${tier.bg} ${tier.color}`}>{tier.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                          {isActive ? "Active" : "Depleted"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1 text-xs text-[#3B1F0A]/45">
                        <span>To: {card.recipientName}</span>
                        <span>·</span>
                        <span>{card.recipientEmail}</span>
                        <span>·</span>
                        <span>{timeAgo(card.purchasedAt)}</span>
                      </div>
                    </div>

                    {/* Balance bar */}
                    <div className="hidden md:block w-32 shrink-0">
                      <div className="flex justify-between text-[10px] text-[#3B1F0A]/40 mb-1">
                        <span>{fmt(card.balance)} left</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#3B1F0A]/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct > 50 ? "#16a34a" : pct > 20 ? "#C8820A" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-bold text-[#3B1F0A]">{fmt(card.amount)}</p>
                      {redeemed > 0 && (
                        <p className="text-xs text-[#3B1F0A]/40 mt-0.5">{fmt(redeemed)} used</p>
                      )}
                    </div>

                    <svg
                      className={`shrink-0 text-[#3B1F0A]/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-[#3B1F0A]/8 px-5 py-5 bg-[#FAF6EF]/40 space-y-5">

                      {/* Two-column info + balance visual */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                        {/* Card details */}
                        <div>
                          <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">Card Details</p>
                          <div className="space-y-2 text-sm">
                            {[
                              { label: "Code",      value: <span className="font-mono tracking-wider font-bold">{card.code}</span> },
                              { label: "Tier",      value: <span className={`font-bold ${tier.color}`}>{tier.label}</span> },
                              { label: "Issued",    value: new Date(card.purchasedAt).toLocaleString("vi-VN") },
                              { label: "From",      value: card.senderName },
                            ].map((f) => (
                              <div key={f.label} className="flex justify-between gap-2">
                                <span className="text-[#3B1F0A]/40 shrink-0">{f.label}</span>
                                <span className="text-[#3B1F0A] text-right">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recipient */}
                        <div>
                          <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">Recipient</p>
                          <div className="space-y-2 text-sm">
                            {[
                              { label: "Name",    value: card.recipientName },
                              { label: "Email",   value: card.recipientEmail },
                              { label: "Message", value: card.message || <span className="italic text-[#3B1F0A]/30">No message</span> },
                            ].map((f) => (
                              <div key={f.label} className="flex justify-between gap-2">
                                <span className="text-[#3B1F0A]/40 shrink-0">{f.label}</span>
                                <span className="text-[#3B1F0A] text-right truncate max-w-[180px]">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Balance breakdown */}
                        <div>
                          <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">Balance</p>
                          <div className="bg-white border border-[#3B1F0A]/8 px-4 py-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#3B1F0A]/50">Original value</span>
                              <span className="font-bold text-[#3B1F0A]">{fmt(card.amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[#3B1F0A]/50">Redeemed</span>
                              <span className="font-semibold text-red-500">−{fmt(redeemed)}</span>
                            </div>
                            <div className="border-t border-[#3B1F0A]/8 pt-2 flex justify-between text-sm font-bold">
                              <span className="text-[#3B1F0A]">Remaining</span>
                              <span className={isActive ? "text-green-600" : "text-slate-400"}>{fmt(card.balance)}</span>
                            </div>
                            <div className="h-2 bg-[#3B1F0A]/6 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: pct > 50 ? "#16a34a" : pct > 20 ? "#C8820A" : "#ef4444",
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-[#3B1F0A]/35 text-right">{pct}% remaining</p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-[#3B1F0A]/8">
                        <button
                          onClick={() => setTopUpCard(card)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#C8820A] text-white hover:bg-[#3B1F0A] transition-colors"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                          </svg>
                          Top Up
                        </button>

                        <button
                          onClick={() => handleResend(card)}
                          disabled={resendStatus[card.code] === "sending"}
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border transition-colors ${
                            resendStatus[card.code] === "sent"
                              ? "border-green-300 bg-green-50 text-green-700"
                              : resendStatus[card.code] === "error"
                              ? "border-red-300 bg-red-50 text-red-600"
                              : "border-[#3B1F0A]/15 text-[#3B1F0A]/65 hover:border-[#3B1F0A]/35 bg-white"
                          }`}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {resendStatus[card.code] === "sending" ? "Sending..." : resendStatus[card.code] === "sent" ? "Email Sent!" : resendStatus[card.code] === "error" ? "Failed" : "Resend Email"}
                        </button>

                        {isActive && (
                          confirmRevoke === card.code ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#3B1F0A]/50">Revoke this card?</span>
                              <button onClick={() => handleRevoke(card.code)} className="px-3 py-2 text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">
                                Yes, Revoke
                              </button>
                              <button onClick={() => setConfirmRevoke(null)} className="px-3 py-2 text-xs font-semibold border border-[#3B1F0A]/15 text-[#3B1F0A]/55 hover:border-[#3B1F0A]/30 transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRevoke(card.code)}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-orange-200 text-orange-600 hover:bg-orange-50 bg-white transition-colors"
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" strokeLinecap="round" />
                              </svg>
                              Revoke Balance
                            </button>
                          )
                        )}

                        <div className="ml-auto">
                          {confirmDelete === card.code ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#3B1F0A]/50">Delete permanently?</span>
                              <button onClick={() => handleDelete(card.code)} className="px-3 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors">
                                Delete
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="px-3 py-2 text-xs font-semibold border border-[#3B1F0A]/15 text-[#3B1F0A]/55 hover:border-[#3B1F0A]/30 transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(card.code)}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 bg-white transition-colors"
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {visible.length > 0 && (
          <p className="text-xs text-[#3B1F0A]/35 text-center pb-4">
            Showing {visible.length} of {cards.length} gift cards
          </p>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {showIssue && (
        <IssueCardModal
          onClose={() => setShowIssue(false)}
          onIssued={load}
        />
      )}

      {topUpCard && (
        <TopUpModal
          card={topUpCard}
          onClose={() => setTopUpCard(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
