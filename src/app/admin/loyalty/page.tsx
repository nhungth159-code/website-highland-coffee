"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getTransactions, addPurchaseStars, addManualAdjust,
  getRewards, createReward, updateReward, deleteReward, toggleReward,
  getTiers, updateTier,
  getConfig, saveConfig,
  resetProgrammeData,
  calculateStarsForPurchase,
  REWARD_TYPE_LABELS, REWARD_TYPE_AUTO,
} from "@/lib/loyalty";
import type {
  LoyaltyCustomer, StarTransaction, LoyaltyReward, LoyaltyTier, LoyaltyConfig,
  RewardType, TierName,
} from "@/lib/loyalty";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K`
  : n.toString();

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── Theme constants ───────────────────────────────────────────────────────────

const TIER_STYLE: Record<TierName, { text: string; bg: string; border: string; dot: string; badge: string; star: string }> = {
  Bronze: { text: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",    dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-800",  star: "text-amber-500"  },
  Silver: { text: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",    dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-600",  star: "text-slate-400"  },
  Gold:   { text: "text-[#C8820A]",  bg: "bg-[#FFF8EC]", border: "border-[#C8820A]/30", dot: "bg-[#C8820A]",  badge: "bg-[#FFF8EC] text-[#C8820A]",  star: "text-[#C8820A]"  },
};

const TXN_STYLE: Record<string, { label: string; color: string; sign: string }> = {
  earn:   { label: "Earned",   color: "text-emerald-600", sign: "+"  },
  redeem: { label: "Redeemed", color: "text-orange-600",  sign: "−"  },
  adjust: { label: "Adjusted", color: "text-blue-600",    sign: "±"  },
  expire: { label: "Expired",  color: "text-red-500",     sign: "−"  },
};

const REWARD_COLORS: Record<RewardType, string> = {
  discount:      "bg-emerald-50 text-emerald-700",
  free_item:     "bg-blue-50 text-blue-700",
  birthday:      "bg-pink-50 text-pink-700",
  welcome_bonus: "bg-purple-50 text-purple-700",
  double_points: "bg-amber-50 text-amber-700",
  referral:      "bg-teal-50 text-teal-700",
};

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string; desc: string }[] = [
  { value: "discount",      label: "Discount",       desc: "Members redeem stars for money off" },
  { value: "free_item",     label: "Free Item",      desc: "Members redeem stars for a free item" },
  { value: "birthday",      label: "Birthday Treat", desc: "Auto-issued on birthday month" },
  { value: "welcome_bonus", label: "Welcome Bonus",  desc: "Auto-awarded on new member sign-up" },
  { value: "double_points", label: "Double Points",  desc: "Members earn 2× stars on eligible days" },
  { value: "referral",      label: "Referral Bonus", desc: "Stars for successful friend referrals" },
];

const EMPTY_REWARD: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> = {
  name: "", description: "", type: "discount", pointsCost: 500, value: "",
  isActive: true, validFrom: new Date().toISOString().slice(0, 10), validTo: "",
  eligibleTiers: ["Bronze", "Silver", "Gold"],
};

// ── Confirm dialog ────────────────────────────────────────────────────────────

function Confirm({ message, onConfirm, onCancel, confirmLabel = "Delete" }: { message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm p-6 shadow-2xl">
        <p className="text-[#3B1F0A] font-semibold mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2.5 text-sm font-bold hover:bg-red-700 transition-colors">{confirmLabel}</button>
          <button onClick={onCancel}  className="flex-1 border border-[#3B1F0A]/15 text-[#3B1F0A]/60 py-2.5 text-sm font-semibold hover:text-[#3B1F0A] transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Customer add / edit modal ─────────────────────────────────────────────────

function CustomerModal({
  initial,
  onSave,
  onClose,
  serverError,
}: {
  initial: { id?: string; name: string; phone: string; email: string };
  onSave: (data: { id?: string; name: string; phone: string; email: string }) => void;
  onClose: () => void;
  serverError: string;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initial.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^0\d{9}$/.test(form.phone.trim())) e.phone = "Must be 10 digits starting with 0";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeUp .22s ease" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>

        <div className="bg-[#1A0D00] px-7 py-5 flex items-center justify-between">
          <div>
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5">{isEdit ? "Edit Customer" : "New Customer"}</p>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {isEdit ? form.name || "Edit" : "Add a Customer"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="px-7 py-6 space-y-4">
          {serverError && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Full Name *</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nguyễn Thị Lan"
              className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors ${errors.name ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
              Phone Number * <span className="normal-case font-normal">(unique identifier)</span>
            </label>
            <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 0912345678" maxLength={10}
              className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors font-mono tracking-wider ${errors.phone ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Email <span className="normal-case font-normal">(optional)</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="e.g. customer@email.com"
              className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors ${errors.email ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="px-7 py-4 border-t border-[#3B1F0A]/8 flex items-center justify-end gap-3 bg-[#FAF6EF]/60">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#3B1F0A]/15 text-sm font-semibold text-[#3B1F0A]/55 hover:text-[#3B1F0A] transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            {isEdit ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Customer detail panel ─────────────────────────────────────────────────────

function CustomerDetail({
  customer,
  transactions,
  tiers,
  config,
  onUpdate,
  onClose,
}: {
  customer: LoyaltyCustomer;
  transactions: StarTransaction[];
  tiers: LoyaltyTier[];
  config: LoyaltyConfig;
  onUpdate: (customers: LoyaltyCustomer[], transactions: StarTransaction[]) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"view" | "purchase" | "adjust">("view");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [adjustStars, setAdjustStars]   = useState("");
  const [adjustNote, setAdjustNote]     = useState("");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState("");

  const c = TIER_STYLE[customer.tier];
  const tierInfo = tiers.find((t) => t.name === customer.tier);
  const multiplier = tierInfo?.multiplier ?? 1;
  const customerTxns = transactions
    .filter((t) => t.customerId === customer.id)
    .slice(0, 15);

  const previewStars = purchaseAmount
    ? calculateStarsForPurchase(Number(purchaseAmount.replace(/\D/g, "")), multiplier, config.starsPerTenThousand)
    : 0;

  const handlePurchase = () => {
    const amount = Number(purchaseAmount.replace(/\D/g, ""));
    if (!amount || amount < 1000) return;
    setSaving(true);
    const result = addPurchaseStars(customer.id, amount, tiers, config);
    onUpdate(result.customers, result.transactions);
    setSaved(`+${previewStars} ${config.pointsName} added`);
    setPurchaseAmount("");
    setMode("view");
    setSaving(false);
    setTimeout(() => setSaved(""), 3000);
  };

  const handleAdjust = () => {
    const stars = parseInt(adjustStars, 10);
    if (!stars || isNaN(stars)) return;
    setSaving(true);
    const result = addManualAdjust(customer.id, stars, adjustNote, tiers);
    onUpdate(result.customers, result.transactions);
    setSaved(`${stars > 0 ? "+" : ""}${stars} ${config.pointsName} adjusted`);
    setAdjustStars("");
    setAdjustNote("");
    setMode("view");
    setSaving(false);
    setTimeout(() => setSaved(""), 3000);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nextTier = tiers.find((t) => t.minPoints > customer.starsEarned);
  const tierPct  = nextTier
    ? Math.round(((customer.starsEarned - (tierInfo?.minPoints ?? 0)) / (nextTier.minPoints - (tierInfo?.minPoints ?? 0))) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl max-h-[95vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeUp .22s ease" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between shrink-0 border-b ${c.border} ${c.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center text-base font-black ${c.bg} border ${c.border}`}>
              <span className={c.star}>★</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#3B1F0A] text-base">{customer.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 ${c.badge}`}>{customer.tier}</span>
              </div>
              <span className="text-xs text-[#3B1F0A]/50 font-mono">{customer.phone}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Stars stats */}
          <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-[#3B1F0A]/8">
            {[
              { label: "Balance",  value: customer.starsBalance.toLocaleString(), color: c.star },
              { label: "Earned",   value: customer.starsEarned.toLocaleString(),  color: "text-[#3B1F0A]" },
              { label: "Redeemed", value: customer.starsRedeemed.toLocaleString(),color: "text-[#3B1F0A]/50" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
                <p className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tier progress */}
          <div className="px-6 py-4 border-b border-[#3B1F0A]/8">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${c.text}`}>{customer.tier}</span>
              {nextTier
                ? <span className="text-xs text-[#3B1F0A]/40">{(nextTier.minPoints - customer.starsEarned).toLocaleString()} ★ to {nextTier.name}</span>
                : <span className="text-xs text-[#C8820A] font-semibold">Maximum tier reached</span>}
            </div>
            <div className="h-2 bg-[#3B1F0A]/6">
              <div className={`h-full ${c.dot} transition-all`} style={{ width: `${tierPct}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-[#3B1F0A]/35">
              <span>{customer.starsEarned.toLocaleString()} ★ earned</span>
              {nextTier && <span>{nextTier.minPoints.toLocaleString()} ★</span>}
            </div>
          </div>

          {/* Customer info */}
          <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-[#3B1F0A]/8 text-sm">
            {[
              { label: "Total Spend",  value: fmtVND(customer.totalSpend) },
              { label: "Orders",       value: customer.orderCount.toLocaleString() },
              { label: "Member Since", value: customer.joinDate },
              { label: "Last Active",  value: timeAgo(customer.lastActivity) },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">{f.label}</p>
                <p className="font-semibold text-[#3B1F0A] mt-0.5">{f.value}</p>
              </div>
            ))}
            {customer.email && (
              <div className="col-span-2">
                <p className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">Email</p>
                <p className="font-semibold text-[#3B1F0A] mt-0.5">{customer.email}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {saved && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" strokeLinecap="round" /></svg>
              {saved}
            </div>
          )}

          <div className="px-6 py-4 flex gap-2 border-b border-[#3B1F0A]/8">
            <button onClick={() => setMode(mode === "purchase" ? "view" : "purchase")}
              className={`flex-1 py-2 text-xs font-bold border transition-colors ${mode === "purchase" ? "bg-[#C8820A] text-white border-[#C8820A]" : "border-[#3B1F0A]/15 text-[#3B1F0A]/60 hover:border-[#C8820A] hover:text-[#C8820A]"}`}>
              + Add Purchase Stars
            </button>
            <button onClick={() => setMode(mode === "adjust" ? "view" : "adjust")}
              className={`flex-1 py-2 text-xs font-bold border transition-colors ${mode === "adjust" ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "border-[#3B1F0A]/15 text-[#3B1F0A]/60 hover:border-[#3B1F0A] hover:text-[#3B1F0A]"}`}>
              ± Manual Adjust
            </button>
          </div>

          {/* Purchase form */}
          {mode === "purchase" && (
            <div className="px-6 py-4 space-y-3 border-b border-[#3B1F0A]/8 bg-[#FAF6EF]/60">
              <p className="text-xs font-semibold text-[#3B1F0A]/55 uppercase tracking-wider">Record a Purchase</p>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 mb-1">Order Amount (₫)</label>
                <div className="relative">
                  <input
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 450000"
                    className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors pr-8" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">₫</span>
                </div>
              </div>
              {previewStars > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <span className="text-emerald-500">★</span>
                  Customer earns <strong>{previewStars}</strong> {config.pointsName}
                  <span className="text-emerald-600/60 ml-0.5">({multiplier}× {customer.tier} multiplier)</span>
                </div>
              )}
              <button onClick={handlePurchase} disabled={saving || !previewStars}
                className="w-full py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors disabled:opacity-40">
                Confirm & Add {previewStars > 0 ? `${previewStars} ★` : "Stars"}
              </button>
            </div>
          )}

          {/* Adjust form */}
          {mode === "adjust" && (
            <div className="px-6 py-4 space-y-3 border-b border-[#3B1F0A]/8 bg-[#FAF6EF]/60">
              <p className="text-xs font-semibold text-[#3B1F0A]/55 uppercase tracking-wider">Manual Star Adjustment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A]/55 mb-1">Stars <span className="font-normal">(+/−)</span></label>
                  <input value={adjustStars} onChange={(e) => setAdjustStars(e.target.value)}
                    placeholder="e.g. +200 or -100"
                    className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3B1F0A]/55 mb-1">Reason</label>
                  <input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="e.g. Redeemed: Free Drink"
                    className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
                </div>
              </div>
              <button onClick={handleAdjust} disabled={saving || !adjustStars}
                className="w-full py-2.5 bg-[#3B1F0A] text-white text-sm font-bold hover:bg-[#1A0D00] transition-colors disabled:opacity-40">
                Apply Adjustment
              </button>
            </div>
          )}

          {/* Transaction history */}
          <div className="px-6 py-4">
            <p className="text-xs font-bold text-[#3B1F0A]/40 uppercase tracking-wider mb-3">Transaction History</p>
            {customerTxns.length === 0 ? (
              <p className="text-xs text-[#3B1F0A]/30 italic">No transactions recorded.</p>
            ) : (
              <div className="space-y-2">
                {customerTxns.map((t) => {
                  const s = TXN_STYLE[t.type] ?? TXN_STYLE.adjust;
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#3B1F0A]/5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 ${t.type === "earn" ? "bg-emerald-50 text-emerald-600" : t.type === "redeem" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                          {s.label}
                        </span>
                        <span className="text-xs text-[#3B1F0A]/60 truncate max-w-[180px]">{t.description}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-sm font-bold ${s.color}`}>{s.sign}{Math.abs(t.stars)} ★</span>
                        <p className="text-[10px] text-[#3B1F0A]/30">{timeAgo(t.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reward modal ──────────────────────────────────────────────────────────────

function RewardModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> & { id?: string };
  onSave: (data: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initial.id;
  const isAuto = REWARD_TYPE_AUTO[form.type];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));
  const toggleTier = (tier: TierName) =>
    setForm(f => ({ ...f, eligibleTiers: f.eligibleTiers.includes(tier) ? f.eligibleTiers.filter(t => t !== tier) : [...f.eligibleTiers, tier] }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.value.trim()) e.value = "Value description is required";
    if (!form.validFrom) e.validFrom = "Start date required";
    if (form.eligibleTiers.length === 0) e.eligibleTiers = "Select at least one tier";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeUp .22s ease" }}>

        <div className="bg-[#1A0D00] px-7 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5">{isEdit ? "Edit Reward" : "New Reward"}</p>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {isEdit ? form.name || "Edit" : "Create a Reward"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-2">Reward Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {REWARD_TYPE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => set("type", opt.value)}
                  className={`flex items-start gap-2.5 p-3 border-2 text-left transition-all ${form.type === opt.value ? "border-[#C8820A] bg-[#FFF8EC]" : "border-[#3B1F0A]/12 bg-white hover:border-[#3B1F0A]/25"}`}>
                  <span className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${form.type === opt.value ? "border-[#C8820A]" : "border-[#3B1F0A]/30"}`}>
                    {form.type === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#C8820A]" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#3B1F0A]">{opt.label}</p>
                    <p className="text-xs text-[#3B1F0A]/45">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Reward Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Star Cashback"
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors ${errors.name ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Reward Value * <span className="normal-case font-normal">(shown to customer)</span></label>
              <input value={form.value} onChange={e => set("value", e.target.value)} placeholder="e.g. 50,000₫ off or Free drink"
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors ${errors.value ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors resize-none" />
          </div>

          {!isAuto ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Stars Required</label>
                <input type="number" value={form.pointsCost} min={0} onChange={e => set("pointsCost", Number(e.target.value))}
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
              Auto-issued — no star cost required from the customer.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Valid From *</label>
              <input type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)}
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors ${errors.validFrom ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Valid To <span className="normal-case font-normal">(blank = no expiry)</span></label>
              <input type="date" value={form.validTo} onChange={e => set("validTo", e.target.value)}
                className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-2">Eligible Tiers *</label>
            <div className="flex gap-2">
              {(["Bronze", "Silver", "Gold"] as TierName[]).map(tier => {
                const selected = form.eligibleTiers.includes(tier);
                const tc = TIER_STYLE[tier];
                return (
                  <button key={tier} type="button" onClick={() => toggleTier(tier)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 text-sm font-semibold transition-all ${selected ? `${tc.border} ${tc.bg} ${tc.text}` : "border-[#3B1F0A]/12 bg-white text-[#3B1F0A]/40 hover:border-[#3B1F0A]/25"}`}>
                    ★ {tier}
                  </button>
                );
              })}
            </div>
            {errors.eligibleTiers && <p className="text-red-500 text-xs mt-1">{errors.eligibleTiers}</p>}
          </div>

          <button type="button" onClick={() => set("isActive", !form.isActive)}
            className={`flex items-center gap-3 px-4 py-3 border-2 w-full transition-all ${form.isActive ? "border-emerald-400 bg-emerald-50" : "border-[#3B1F0A]/12 bg-white"}`}>
            <span className={`w-9 h-5 rounded-full relative transition-all ${form.isActive ? "bg-emerald-500" : "bg-[#3B1F0A]/20"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isActive ? "left-4" : "left-0.5"}`} />
            </span>
            <span className={`text-sm font-semibold ${form.isActive ? "text-emerald-700" : "text-[#3B1F0A]/45"}`}>{form.isActive ? "Active" : "Paused"}</span>
          </button>
        </div>

        <div className="px-7 py-4 border-t border-[#3B1F0A]/8 flex justify-end gap-3 bg-[#FAF6EF]/60 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#3B1F0A]/15 text-sm font-semibold text-[#3B1F0A]/55 hover:text-[#3B1F0A] transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            {isEdit ? "Save Changes" : "Create Reward"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tier edit modal ───────────────────────────────────────────────────────────

function TierModal({ tier, onSave, onClose }: { tier: LoyaltyTier; onSave: (d: Partial<Omit<LoyaltyTier, "name">>) => void; onClose: () => void }) {
  const [multiplier, setMultiplier] = useState(tier.multiplier);
  const [minPoints, setMinPoints]   = useState(tier.minPoints);
  const [maxPoints, setMaxPoints]   = useState(tier.maxPoints ?? 0);
  const [benefits, setBenefits]     = useState(tier.benefits.join("\n"));
  const c = TIER_STYLE[tier.name];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeUp .22s ease" }}>
        <div className="bg-[#1A0D00] px-7 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className={`text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5 ${c.star}`}>Edit Tier</p>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>{tier.name} Tier</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Min. Stars (Lifetime)</label>
              <input type="number" value={minPoints} min={0} onChange={e => setMinPoints(Number(e.target.value))} disabled={tier.name === "Bronze"}
                className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors disabled:opacity-40" />
            </div>
            {tier.name !== "Gold" && (
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Max. Stars</label>
                <input type="number" value={maxPoints} min={0} onChange={e => setMaxPoints(Number(e.target.value))}
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Stars Multiplier</label>
            <div className="flex items-center gap-3">
              <input type="number" value={multiplier} min={0.5} max={5} step={0.1} onChange={e => setMultiplier(Number(e.target.value))}
                className="w-24 border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
              <span className="text-sm text-[#3B1F0A]/50">× base stars per 10,000₫</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Benefits <span className="normal-case font-normal">(one per line)</span></label>
            <textarea value={benefits} onChange={e => setBenefits(e.target.value)} rows={6}
              className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors resize-none font-mono" />
          </div>
        </div>
        <div className="px-7 py-4 border-t border-[#3B1F0A]/8 flex justify-end gap-3 bg-[#FAF6EF]/60 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#3B1F0A]/15 text-sm font-semibold text-[#3B1F0A]/55 hover:text-[#3B1F0A] transition-colors">Cancel</button>
          <button onClick={() => onSave({ multiplier, minPoints, maxPoints: tier.name === "Gold" ? null : (maxPoints || null), benefits: benefits.split("\n").map(s => s.trim()).filter(Boolean) })}
            className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            Save Tier
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminLoyaltyPage() {
  const [customers,     setCustomers]    = useState<LoyaltyCustomer[]>([]);
  const [transactions,  setTransactions] = useState<StarTransaction[]>([]);
  const [rewards,       setRewards]      = useState<LoyaltyReward[]>([]);
  const [tiers,         setTiers]        = useState<LoyaltyTier[]>([]);
  const [config,        setConfig]       = useState<LoyaltyConfig>({ programName: "Highlands Stars", pointsName: "Stars", starsPerTenThousand: 1, pointsExpiryMonths: 12, minRedemptionPoints: 100, welcomeBonusStars: 100, birthdayBonusStars: 200, referralBonusStars: 200 });
  const [mounted,       setMounted]      = useState(false);
  const [activeTab,     setActiveTab]    = useState<"overview" | "customers" | "rewards" | "settings">("overview");
  const [configDraft,   setConfigDraft]  = useState<LoyaltyConfig | null>(null);
  const [configSaved,   setConfigSaved]  = useState(false);

  // Customer tab state
  const [custSearch,    setCustSearch]   = useState("");
  const [tierFilter,    setTierFilter]   = useState<"All" | TierName>("All");
  const [custModal,     setCustModal]    = useState<{ open: boolean; data: { id?: string; name: string; phone: string; email: string } }>({ open: false, data: { name: "", phone: "", email: "" } });
  const [custError,     setCustError]    = useState("");
  const [custDetail,    setCustDetail]   = useState<LoyaltyCustomer | null>(null);
  const [deleteCustId,  setDeleteCustId] = useState<string | null>(null);

  // Reward tab state
  const [rewardModal,   setRewardModal]  = useState<{ open: boolean; reward: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> & { id?: string } }>({ open: false, reward: EMPTY_REWARD });
  const [rewardSearch,  setRewardSearch] = useState("");
  const [deleteRewId,   setDeleteRewId]  = useState<string | null>(null);

  // Tier tab state
  const [tierModal,     setTierModal]    = useState<{ open: boolean; tier: LoyaltyTier | null }>({ open: false, tier: null });

  // Reset confirmation
  const [resetConfirm, setResetConfirm] = useState(false);

  // ── Derived state — ALL useMemo/useMemo before early return ──

  const totalStarsBalance = useMemo(() => customers.reduce((s, c) => s + c.starsBalance, 0), [customers]);
  const totalSpend        = useMemo(() => customers.reduce((s, c) => s + c.totalSpend, 0), [customers]);

  const tierCounts = useMemo(() => {
    const m: Record<TierName, number> = { Bronze: 0, Silver: 0, Gold: 0 };
    customers.forEach(c => m[c.tier]++);
    return m;
  }, [customers]);

  const customersWithRedemptions = useMemo(() =>
    customers.filter(c => c.starsRedeemed > 0).length, [customers]);

  const redemptionRate = useMemo(() =>
    customers.length > 0 ? Math.round((customersWithRedemptions / customers.length) * 100) : 0,
    [customers, customersWithRedemptions]);

  const thisMonthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  const activeThisMonth = useMemo(() =>
    customers.filter(c => c.lastActivity >= thisMonthStart).length, [customers, thisMonthStart]);

  const monthlyChartData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear(), m = d.getMonth();
      const monthTxns = transactions.filter(t => {
        const td = new Date(t.createdAt);
        return td.getFullYear() === y && td.getMonth() === m;
      });
      const earned   = monthTxns.filter(t => t.type === "earn").reduce((s, t) => s + t.stars, 0);
      const redeemed = Math.abs(monthTxns.filter(t => t.type === "redeem").reduce((s, t) => s + t.stars, 0));
      result.push({ label: d.toLocaleString("default", { month: "short" }), earned, redeemed, isCurrent: i === 0 });
    }
    return result;
  }, [transactions]);

  const maxMonthlyEarned = useMemo(() =>
    Math.max(...monthlyChartData.map(d => d.earned), 1), [monthlyChartData]);

  const recentActivity = useMemo(() =>
    [...transactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8),
    [transactions]);

  const visibleCustomers = useMemo(() => {
    let list = tierFilter === "All" ? customers : customers.filter(c => c.tier === tierFilter);
    if (custSearch.trim()) {
      const q = custSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [customers, tierFilter, custSearch]);

  const visibleRewards = useMemo(() => {
    if (!rewardSearch.trim()) return rewards;
    const q = rewardSearch.toLowerCase();
    return rewards.filter(r => r.name.toLowerCase().includes(q));
  }, [rewards, rewardSearch]);

  const avgOrdersPerCustomer = useMemo(() =>
    customers.length > 0 ? (customers.reduce((s, c) => s + c.orderCount, 0) / customers.length).toFixed(1) : "0",
    [customers]);

  const repeatCustomers = useMemo(() =>
    customers.filter(c => c.orderCount > 1).length, [customers]);

  useEffect(() => {
    setCustomers(getCustomers());
    setTransactions(getTransactions());
    setRewards(getRewards());
    setTiers(getTiers());
    const cfg = getConfig();
    setConfig(cfg);
    setConfigDraft(cfg);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveCustomer = (data: { id?: string; name: string; phone: string; email: string }) => {
    setCustError("");
    if (data.id) {
      const result = updateCustomer(data.id, { name: data.name, phone: data.phone, email: data.email }, customers);
      if (!result.success) { setCustError(result.error); return; }
      setCustomers(result.customers);
    } else {
      const result = createCustomer({ name: data.name, phone: data.phone, email: data.email }, tiers, config);
      if (!result.success) { setCustError(result.error); return; }
      setCustomers(result.customers);
      setTransactions(result.transactions);
    }
    setCustModal({ open: false, data: { name: "", phone: "", email: "" } });
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(deleteCustomer(id));
    setDeleteCustId(null);
    if (custDetail?.id === id) setCustDetail(null);
  };

  const handleUpdateFromDetail = (updatedCustomers: LoyaltyCustomer[], updatedTransactions: StarTransaction[]) => {
    setCustomers(updatedCustomers);
    setTransactions(updatedTransactions);
    const updated = updatedCustomers.find(c => c.id === custDetail?.id);
    if (updated) setCustDetail(updated);
  };

  const handleSaveReward = (data: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> & { id?: string }) => {
    const { id, ...rest } = data;
    setRewards(id ? updateReward(id, rest) : createReward(rest));
    setRewardModal({ open: false, reward: EMPTY_REWARD });
  };

  const handleSaveTier = (name: TierName, data: Partial<Omit<LoyaltyTier, "name">>) => {
    setTiers(updateTier(name, data));
    setTierModal({ open: false, tier: null });
  };

  const handleSaveConfig = () => {
    if (!configDraft) return;
    saveConfig(configDraft);
    setConfig(configDraft);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleResetProgramme = () => {
    const result = resetProgrammeData(tiers);
    setCustomers(result.customers);
    setTransactions(result.transactions);
    setRewards(result.rewards);
    setCustDetail(null);
    setResetConfirm(false);
  };

  const TABS = [
    { key: "overview"   as const, label: "Overview"  },
    { key: "customers"  as const, label: "Customers", count: customers.length },
    { key: "rewards"    as const, label: "Rewards",   count: rewards.length   },
    { key: "settings"   as const, label: "Settings"   },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold tracking-widest" style={{ fontFamily: "var(--font-playfair), serif" }}>HIGHLANDS</p>
            <span className="text-white/20 text-lg">|</span>
            <div className="hidden md:flex items-center gap-3 text-sm flex-wrap">
              <Link href="/admin" className="text-white/50 hover:text-white transition-colors">Orders</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/applications" className="text-white/50 hover:text-white transition-colors">Applications</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/contacts" className="text-white/50 hover:text-white transition-colors">Contacts</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/gift-cards" className="text-white/50 hover:text-white transition-colors">Gift Cards</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors">Promotions</Link>
              <span className="text-white/20">/</span>
              <span className="text-white font-semibold">Loyalty</span>
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
            </div>
          </div>
        </div>
        <button onClick={() => { setCustomers(getCustomers()); setTransactions(getTransactions()); setRewards(getRewards()); }}
          className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </header>

      {/* ── Programme hero ── */}
      <div className="bg-[#1A0D00] px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-1">Loyalty Programme</p>
              <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>{config.programName}</h1>
              <p className="text-white/40 text-sm mt-1">Strengthen customer engagement through structured rewards and reliable tracking.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
              <button onClick={() => { setCustError(""); setCustModal({ open: true, data: { name: "", phone: "", email: "" } }); setActiveTab("customers"); }}
                className="flex items-center gap-2 bg-[#C8820A] text-white px-4 py-2 text-xs font-bold hover:bg-[#C8820A]/80 transition-colors">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                Add Customer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Customers",    value: fmtNum(customers.length),   sub: "registered"       },
              { label: "Active This Month",  value: fmtNum(activeThisMonth),    sub: "had activity"     },
              { label: "Stars Outstanding",  value: fmtNum(totalStarsBalance),  sub: "pending redemption" },
              { label: "Redemption Rate",    value: `${redemptionRate}%`,        sub: "of customers"     },
              { label: "Total Revenue",      value: fmtNum(totalSpend),          sub: "from members"     },
              { label: "Repeat Customers",   value: fmtNum(repeatCustomers),    sub: "2+ orders"        },
            ].map(s => (
              <div key={s.label} className="bg-white/5 px-3 py-3">
                <p className="text-white/35 text-[10px] uppercase tracking-wider font-semibold">{s.label}</p>
                <p className="text-white text-xl font-bold mt-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
                <p className="text-white/25 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-[#3B1F0A]/8 px-6 lg:px-8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.key ? "border-[#C8820A] text-[#3B1F0A]" : "border-transparent text-[#3B1F0A]/45 hover:text-[#3B1F0A]/70"}`}>
              {tab.label}
              {"count" in tab && tab.count !== undefined && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 font-bold ${activeTab === tab.key ? "bg-[#C8820A] text-white" : "bg-[#3B1F0A]/8 text-[#3B1F0A]/50"}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ══════════════════════ OVERVIEW ══════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Stars activity chart */}
            <div className="bg-white border border-[#3B1F0A]/8 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>Stars Activity</h2>
                  <p className="text-xs text-[#3B1F0A]/40 mt-0.5">Monthly stars earned over the last 6 months</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-[#3B1F0A]/40 font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#C8820A]" /> Earned</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#3B1F0A]/20" /> Redeemed</span>
                </div>
              </div>
              <div className="flex items-end gap-3" style={{ height: "112px" }}>
                {monthlyChartData.map(d => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-[#3B1F0A]/50 font-semibold">{d.earned > 0 ? fmtNum(d.earned) : ""}</span>
                    <div className="w-full flex items-end gap-0.5" style={{ height: "80px" }}>
                      <div className={`flex-1 ${d.isCurrent ? "bg-[#C8820A]" : "bg-[#3B1F0A]/15"}`}
                        style={{ height: `${Math.round((d.earned / maxMonthlyEarned) * 100)}%` }} />
                      {d.redeemed > 0 && (
                        <div className="flex-1 bg-[#3B1F0A]/10"
                          style={{ height: `${Math.round((d.redeemed / maxMonthlyEarned) * 100)}%` }} />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold ${d.isCurrent ? "text-[#C8820A]" : "text-[#3B1F0A]/35"}`}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier distribution + Recent activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#3B1F0A]/8 p-6">
                <h2 className="text-base font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Tier Distribution</h2>
                <p className="text-xs text-[#3B1F0A]/40 mb-5">Customer spread across programme tiers</p>
                <div className="space-y-4">
                  {tiers.map(tier => {
                    const count = tierCounts[tier.name];
                    const pct   = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
                    const c     = TIER_STYLE[tier.name];
                    return (
                      <div key={tier.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className={`text-sm font-bold ${c.text}`}>{tier.name}</span>
                            <span className="text-xs text-[#3B1F0A]/40">{tier.minPoints.toLocaleString()}–{tier.maxPoints ? tier.maxPoints.toLocaleString() : "∞"} ★</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-[#3B1F0A]">{count}</span>
                            <span className="text-xs text-[#3B1F0A]/40 ml-1">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-[#3B1F0A]/6"><div className={`h-full ${c.dot}`} style={{ width: `${pct}%` }} /></div>
                        <p className="text-[10px] text-[#3B1F0A]/35 mt-1">{tier.multiplier}× multiplier · {tier.benefits.length} benefits</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-[#3B1F0A]/8 p-6">
                <h2 className="text-base font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Recent Activity</h2>
                <p className="text-xs text-[#3B1F0A]/40 mb-4">Latest star transactions across all customers</p>
                <div className="space-y-2">
                  {recentActivity.map(t => {
                    const cust = customers.find(c => c.id === t.customerId);
                    const s    = TXN_STYLE[t.type] ?? TXN_STYLE.adjust;
                    return (
                      <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-[#3B1F0A]/5 last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === "earn" ? "bg-emerald-500" : t.type === "redeem" ? "bg-orange-400" : "bg-blue-400"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#3B1F0A] truncate">{cust?.name ?? "Unknown"}</p>
                            <p className="text-[10px] text-[#3B1F0A]/40 truncate">{t.description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`text-sm font-bold ${s.color}`}>{s.sign}{Math.abs(t.stars)} ★</p>
                          <p className="text-[10px] text-[#3B1F0A]/30">{timeAgo(t.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance analytics KPIs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Avg. Orders / Customer",  value: avgOrdersPerCustomer, sub: "per customer",         icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",                color: "text-[#C8820A]"   },
                { label: "Repeat Customer Rate",    value: customers.length > 0 ? `${Math.round((repeatCustomers / customers.length) * 100)}%` : "0%", sub: "2+ orders placed", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "text-emerald-600" },
                { label: "Avg. Stars Balance",      value: customers.length > 0 ? Math.round(totalStarsBalance / customers.length).toLocaleString() : "0", sub: `${config.pointsName} per customer`, icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", color: "text-amber-600"   },
                { label: "Redemption Participation",value: `${redemptionRate}%`, sub: "have redeemed rewards",icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", color: "text-blue-600"    },
              ].map(s => (
                <div key={s.label} className="bg-white border border-[#3B1F0A]/8 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-[#3B1F0A]/45 font-medium leading-tight">{s.label}</p>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className={`shrink-0 ${s.color}`}>
                      <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
                  <p className="text-xs text-[#3B1F0A]/35 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════ CUSTOMERS ══════════════════════ */}
        {activeTab === "customers" && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>Customer Management</h2>
                <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
                  {customers.length} customers registered — identified uniquely by phone number.
                </p>
              </div>
              <button onClick={() => { setCustError(""); setCustModal({ open: true, data: { name: "", phone: "", email: "" } }); }}
                className="flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors shrink-0">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                Add Customer
              </button>
            </div>

            {/* Search + tier filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input value={custSearch} onChange={e => setCustSearch(e.target.value)}
                  placeholder="Search by name, phone or email..."
                  className="w-full bg-white border border-[#3B1F0A]/10 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors" />
              </div>
              <div className="flex gap-1">
                {(["All", "Bronze", "Silver", "Gold"] as const).map(tier => (
                  <button key={tier} onClick={() => setTierFilter(tier)}
                    className={`px-3 py-2 text-xs font-semibold border transition-all ${tierFilter === tier ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "bg-white text-[#3B1F0A]/55 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/30"}`}>
                    {tier} {tier !== "All" && <span className="opacity-60">({tierCounts[tier as TierName]})</span>}
                  </button>
                ))}
              </div>
            </div>

            {visibleCustomers.length === 0 ? (
              <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
                <p className="font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {custSearch || tierFilter !== "All" ? "No customers match your filter" : "No customers yet"}
                </p>
                <p className="text-sm text-[#3B1F0A]/40 mb-5">
                  {custSearch || tierFilter !== "All" ? "Try different criteria." : "Add your first customer to get started."}
                </p>
                {!custSearch && tierFilter === "All" && (
                  <button onClick={() => { setCustError(""); setCustModal({ open: true, data: { name: "", phone: "", email: "" } }); }}
                    className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                    Add Customer
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#3B1F0A]/8 overflow-x-auto">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_128px_80px_105px_60px_88px_100px] gap-3 px-5 py-2.5 border-b border-[#3B1F0A]/8 bg-[#FAF6EF]/60 min-w-[760px]">
                  {["Customer", "Phone", "Tier", "Stars", "Orders", "Last Active", ""].map((h, idx) => (
                    <p key={idx} className="text-[10px] font-bold text-[#3B1F0A]/40 uppercase tracking-wider">{h}</p>
                  ))}
                </div>

                {visibleCustomers.map((customer, i) => {
                  const c = TIER_STYLE[customer.tier];
                  return (
                    <div key={customer.id}
                      className={`grid sm:grid-cols-[1fr_128px_80px_105px_60px_88px_100px] gap-3 px-5 py-3.5 items-center hover:bg-[#FAF6EF]/40 transition-colors min-w-[760px] ${i > 0 ? "border-t border-[#3B1F0A]/6" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 flex items-center justify-center text-xs font-black shrink-0 ${c.bg} ${c.text}`}>
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#3B1F0A] truncate">{customer.name}</p>
                          {customer.email && <p className="text-[10px] text-[#3B1F0A]/40 truncate">{customer.email}</p>}
                        </div>
                      </div>
                      <p className="text-xs font-mono text-[#3B1F0A]/65 hidden sm:block tracking-tight">{customer.phone}</p>
                      <span className={`text-[10px] font-bold px-2 py-1 self-center w-fit ${c.badge} hidden sm:inline-block`}>{customer.tier}</span>
                      <div className="hidden sm:block">
                        <p className={`text-sm font-bold ${c.star}`}>{customer.starsBalance.toLocaleString()} ★</p>
                        <p className="text-[10px] text-[#3B1F0A]/35">{customer.starsEarned.toLocaleString()} earned</p>
                      </div>
                      <p className="text-sm text-[#3B1F0A]/60 hidden sm:block">{customer.orderCount}</p>
                      <p className="text-xs text-[#3B1F0A]/45 hidden sm:block leading-tight">{timeAgo(customer.lastActivity)}</p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => setCustDetail(customer)} title="View details"
                          className="w-8 h-8 flex items-center justify-center text-[#3B1F0A]/35 hover:text-[#C8820A] hover:bg-[#C8820A]/8 transition-colors rounded-sm">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button onClick={() => { setCustError(""); setCustModal({ open: true, data: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email } }); }} title="Edit customer"
                          className="w-8 h-8 flex items-center justify-center text-[#3B1F0A]/35 hover:text-[#3B1F0A] hover:bg-[#3B1F0A]/8 transition-colors rounded-sm">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteCustId(customer.id)} title="Delete customer"
                          className="w-8 h-8 flex items-center justify-center text-[#3B1F0A]/25 hover:text-red-500 hover:bg-red-50 transition-colors rounded-sm">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ REWARDS ══════════════════════ */}
        {activeTab === "rewards" && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>Reward Management</h2>
                <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
                  {rewards.filter(r => r.isActive).length} active · {rewards.length} total — configure rewards with validity periods.
                </p>
              </div>
              <button onClick={() => setRewardModal({ open: true, reward: { ...EMPTY_REWARD } })}
                className="flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors shrink-0">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                New Reward
              </button>
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input value={rewardSearch} onChange={e => setRewardSearch(e.target.value)} placeholder="Search rewards..."
                className="w-full bg-white border border-[#3B1F0A]/10 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors" />
            </div>

            {visibleRewards.length === 0 ? (
              <div className="bg-white border border-[#3B1F0A]/8 py-16 text-center">
                <p className="font-bold text-[#3B1F0A] mb-2">No rewards found</p>
                <p className="text-sm text-[#3B1F0A]/40 mb-4">Try different keywords or create a new reward.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleRewards.map(r => {
                  const isAuto = REWARD_TYPE_AUTO[r.type];
                  const [bg, text] = REWARD_COLORS[r.type].split(" ");
                  return (
                    <div key={r.id} className={`bg-white border hover:border-[#3B1F0A]/20 transition-colors flex flex-col ${r.isActive ? "border-[#3B1F0A]/8" : "border-[#3B1F0A]/8 opacity-60"}`}>
                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${REWARD_COLORS[r.type]}`}>{REWARD_TYPE_LABELS[r.type]}</span>
                          {!r.isActive && <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500">Paused</span>}
                        </div>
                        <h3 className="text-sm font-bold text-[#3B1F0A] mb-1">{r.name}</h3>
                        <p className="text-xs text-[#3B1F0A]/45 mb-3 line-clamp-2">{r.description}</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-[#3B1F0A]/40 font-semibold uppercase tracking-wider text-[10px]">Value</span><span className="font-bold text-[#C8820A]">{r.value}</span></div>
                          <div className="flex justify-between"><span className="text-[#3B1F0A]/40 font-semibold uppercase tracking-wider text-[10px]">Stars cost</span><span className="font-semibold">{isAuto ? <span className="text-blue-600 font-bold">Auto</span> : `${r.pointsCost} ★`}</span></div>
                          <div className="flex justify-between"><span className="text-[#3B1F0A]/40 font-semibold uppercase tracking-wider text-[10px]">Redemptions</span><span className="font-bold">{r.redemptionCount.toLocaleString()}</span></div>
                          <div className="flex items-center justify-between"><span className="text-[#3B1F0A]/40 font-semibold uppercase tracking-wider text-[10px]">Valid</span>
                            <span className="text-[#3B1F0A]/60 text-[10px]">{r.validFrom} {r.validTo ? `→ ${r.validTo}` : "→ ongoing"}</span>
                          </div>
                          <div className="flex items-center justify-between"><span className="text-[#3B1F0A]/40 font-semibold uppercase tracking-wider text-[10px]">Tiers</span>
                            <div className="flex gap-1">{r.eligibleTiers.map(t => <span key={t} className={`text-[9px] font-bold px-1.5 py-0.5 ${TIER_STYLE[t].badge}`}>{t[0]}</span>)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[#3B1F0A]/6 px-4 py-3 flex items-center gap-1">
                        <button onClick={() => setRewardModal({ open: true, reward: { id: r.id, name: r.name, description: r.description, type: r.type, pointsCost: r.pointsCost, value: r.value, isActive: r.isActive, validFrom: r.validFrom, validTo: r.validTo, eligibleTiers: r.eligibleTiers } })}
                          className="text-[#3B1F0A]/40 hover:text-[#C8820A] text-xs font-semibold transition-colors px-2 py-1">Edit</button>
                        <button onClick={() => setRewards(toggleReward(r.id))}
                          className={`text-xs font-semibold transition-colors px-2 py-1 ${r.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}>
                          {r.isActive ? "Pause" : "Resume"}
                        </button>
                        <div className="flex-1" />
                        <button onClick={() => setDeleteRewId(r.id)}
                          className="text-[#3B1F0A]/25 hover:text-red-500 text-xs font-semibold transition-colors px-2 py-1">Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ SETTINGS ══════════════════════ */}
        {activeTab === "settings" && configDraft && (
          <>
            <div>
              <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>Programme Settings</h2>
              <p className="text-xs text-[#3B1F0A]/45 mt-0.5">Configure core rules, earning rates, and tier thresholds.</p>
            </div>

            <div className="bg-white border border-[#3B1F0A]/8 p-6 space-y-7">
              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">Programme Identity</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Programme Name", key: "programName" as const, placeholder: "Highlands Stars" },
                    { label: "Points Currency", key: "pointsName"  as const, placeholder: "Stars" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">{f.label}</label>
                      <input value={configDraft[f.key] as string} onChange={e => setConfigDraft(d => d ? { ...d, [f.key]: e.target.value } : d)}
                        placeholder={f.placeholder}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors" />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">Star Earning Rules</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Stars per 10,000₫</label>
                    <div className="relative">
                      <input type="number" value={configDraft.starsPerTenThousand} min={0.1} step={0.1}
                        onChange={e => setConfigDraft(d => d ? { ...d, starsPerTenThousand: Number(e.target.value) } : d)}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">★</span>
                    </div>
                    <p className="text-xs text-[#3B1F0A]/35 mt-1">Multiplied by tier rate</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Points Expiry</label>
                    <div className="relative">
                      <input type="number" value={configDraft.pointsExpiryMonths} min={0}
                        onChange={e => setConfigDraft(d => d ? { ...d, pointsExpiryMonths: Number(e.target.value) } : d)}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors pr-16" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">months</span>
                    </div>
                    <p className="text-xs text-[#3B1F0A]/35 mt-1">0 = never expire</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Min. Redemption</label>
                    <div className="relative">
                      <input type="number" value={configDraft.minRedemptionPoints} min={0}
                        onChange={e => setConfigDraft(d => d ? { ...d, minRedemptionPoints: Number(e.target.value) } : d)}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">★</span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">Automatic Bonuses</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Welcome Bonus",  key: "welcomeBonusStars"  as const, desc: "On sign-up"              },
                    { label: "Birthday Bonus", key: "birthdayBonusStars" as const, desc: "During birthday month"   },
                    { label: "Referral Bonus", key: "referralBonusStars" as const, desc: "Per successful referral" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">{f.label}</label>
                      <div className="relative">
                        <input type="number" value={configDraft[f.key] as number} min={0}
                          onChange={e => setConfigDraft(d => d ? { ...d, [f.key]: Number(e.target.value) } : d)}
                          className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors pr-8" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">★</span>
                      </div>
                      <p className="text-xs text-[#3B1F0A]/35 mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tier thresholds summary */}
              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">Tier Thresholds <span className="font-normal normal-case">(edit in Customers → Tiers)</span></h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {tiers.map(tier => {
                    const c = TIER_STYLE[tier.name];
                    return (
                      <div key={tier.name} className={`px-4 py-3 border ${c.border} ${c.bg}`}>
                        <p className={`text-sm font-bold ${c.text}`}>{tier.name}</p>
                        <p className="text-xs text-[#3B1F0A]/50 mt-0.5">{tier.minPoints.toLocaleString()}–{tier.maxPoints ? tier.maxPoints.toLocaleString() : "∞"} lifetime ★</p>
                        <p className="text-xs text-[#3B1F0A]/50">{tier.multiplier}× multiplier</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex items-center justify-between pt-2">
                {configSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" strokeLinecap="round" /></svg>
                    Settings saved
                  </span>
                )}
                <div className="ml-auto">
                  <button onClick={handleSaveConfig} className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">Save Settings</button>
                </div>
              </div>
            </div>

            {/* Reset Programme Data */}
            <div className="bg-white border border-red-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-red-700">Reset Programme Data</h3>
                  <p className="text-xs text-[#3B1F0A]/50 mt-1 max-w-lg leading-relaxed">
                    Clears all star balances, purchase history, and transaction records for every customer.
                    Customer names and phone numbers are preserved. All tiers reset to Bronze.
                    Reward redemption counts are zeroed. This action cannot be undone.
                  </p>
                </div>
                <button onClick={() => setResetConfirm(true)}
                  className="shrink-0 px-5 py-2.5 border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">
                  Reset All Data
                </button>
              </div>
            </div>

            {/* Tier management moved here for completeness */}
            <div>
              <h2 className="text-xl font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Tier Benefits</h2>
              <p className="text-xs text-[#3B1F0A]/45 mb-4">Configure tier thresholds, multipliers, and member benefits.</p>
              <div className="grid lg:grid-cols-3 gap-4">
                {tiers.map((tier, i) => {
                  const c = TIER_STYLE[tier.name];
                  const count = tierCounts[tier.name];
                  const pct = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
                  const medals = ["🥉", "🥈", "🥇"];
                  return (
                    <div key={tier.name} className={`bg-white border ${c.border} overflow-hidden`}>
                      <div className={`px-5 py-4 ${c.bg} border-b ${c.border} flex items-center justify-between`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-black ${c.text}`} style={{ fontFamily: "var(--font-playfair), serif" }}>{tier.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 ${c.badge}`}>{tier.multiplier}× Stars</span>
                          </div>
                          <p className={`text-xs ${c.text} opacity-60`}>{tier.minPoints.toLocaleString()}–{tier.maxPoints ? tier.maxPoints.toLocaleString() : "∞"} ★ lifetime</p>
                        </div>
                        <button onClick={() => setTierModal({ open: true, tier })} className={`text-xs font-semibold ${c.text} opacity-60 hover:opacity-100 px-2 py-1 border ${c.border}`}>Edit</button>
                      </div>
                      <div className="px-5 py-3 border-b border-[#3B1F0A]/6">
                        <div className="flex items-center justify-between mb-1.5">
                          <div><p className="text-base font-bold text-[#3B1F0A]">{count} <span className="text-xs font-normal text-[#3B1F0A]/40">customers · {pct}%</span></p></div>
                          <span className="text-2xl">{medals[i]}</span>
                        </div>
                        <div className="h-1.5 bg-[#3B1F0A]/6"><div className={`h-full ${c.dot}`} style={{ width: `${pct}%` }} /></div>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold text-[#3B1F0A]/40 uppercase tracking-wider mb-2.5">Benefits</p>
                        <ul className="space-y-1.5">
                          {tier.benefits.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-2 text-xs text-[#3B1F0A]/65">
                              <span className={`mt-0.5 shrink-0 ${c.star}`}>★</span><span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── Reset confirmation ── */}
      {resetConfirm && (
        <Confirm
          message="This will permanently clear all star balances, purchase history, and transaction records. Customer names and phone numbers are kept. This cannot be undone — are you sure?"
          onConfirm={handleResetProgramme}
          onCancel={() => setResetConfirm(false)}
          confirmLabel="Yes, Reset"
        />
      )}

      {/* ── Modals ── */}
      {custModal.open && (
        <CustomerModal
          initial={custModal.data}
          serverError={custError}
          onSave={handleSaveCustomer}
          onClose={() => { setCustModal({ open: false, data: { name: "", phone: "", email: "" } }); setCustError(""); }}
        />
      )}
      {custDetail && (
        <CustomerDetail
          customer={custDetail}
          transactions={transactions}
          tiers={tiers}
          config={config}
          onUpdate={handleUpdateFromDetail}
          onClose={() => setCustDetail(null)}
        />
      )}
      {deleteCustId && (
        <Confirm
          message={`Remove "${customers.find(c => c.id === deleteCustId)?.name}" from the loyalty programme? Their transaction history will be lost.`}
          onConfirm={() => handleDeleteCustomer(deleteCustId)}
          onCancel={() => setDeleteCustId(null)}
        />
      )}
      {rewardModal.open && (
        <RewardModal
          initial={rewardModal.reward}
          onSave={handleSaveReward}
          onClose={() => setRewardModal({ open: false, reward: EMPTY_REWARD })}
        />
      )}
      {deleteRewId && (
        <Confirm
          message={`Delete "${rewards.find(r => r.id === deleteRewId)?.name}"? This cannot be undone.`}
          onConfirm={() => { setRewards(deleteReward(deleteRewId)); setDeleteRewId(null); }}
          onCancel={() => setDeleteRewId(null)}
        />
      )}
      {tierModal.open && tierModal.tier && (
        <TierModal
          tier={tierModal.tier}
          onSave={data => handleSaveTier(tierModal.tier!.name, data)}
          onClose={() => setTierModal({ open: false, tier: null })}
        />
      )}
    </div>
  );
}
