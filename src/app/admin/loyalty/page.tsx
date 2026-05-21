"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getRewards, createReward, updateReward, deleteReward, toggleReward,
  getTiers, updateTier,
  getConfig, saveConfig,
  REWARD_TYPE_LABELS, REWARD_TYPE_AUTO,
} from "@/lib/loyalty";
import type { LoyaltyReward, LoyaltyTier, LoyaltyConfig, RewardType, TierName } from "@/lib/loyalty";

// ── Statics ───────────────────────────────────────────────────────────────────

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K`
  : n.toString();

const MONTHLY_DATA = [
  { month: "Dec", label: "Dec '25", redemptions: 18200, newMembers: 48000 },
  { month: "Jan", label: "Jan '26", redemptions: 21400, newMembers: 52000 },
  { month: "Feb", label: "Feb '26", redemptions: 19800, newMembers: 45000 },
  { month: "Mar", label: "Mar '26", redemptions: 24100, newMembers: 61000 },
  { month: "Apr", label: "Apr '26", redemptions: 26300, newMembers: 67000 },
  { month: "May", label: "May '26", redemptions: 22800, newMembers: 54000 },
];
const MAX_REDEMPTIONS = Math.max(...MONTHLY_DATA.map((d) => d.redemptions));

const TIER_COLORS: Record<TierName, { text: string; bg: string; border: string; dot: string; badge: string; star: string }> = {
  Bronze: { text: "text-amber-700",  bg: "bg-amber-50",    border: "border-amber-200",    dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-800",  star: "text-amber-500"  },
  Silver: { text: "text-slate-600",  bg: "bg-slate-50",    border: "border-slate-200",    dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-600",  star: "text-slate-400"  },
  Gold:   { text: "text-[#C8820A]",  bg: "bg-[#FFF8EC]",   border: "border-[#C8820A]/30", dot: "bg-[#C8820A]",  badge: "bg-[#FFF8EC] text-[#C8820A]",  star: "text-[#C8820A]"  },
};

const REWARD_TYPE_COLORS: Record<RewardType, string> = {
  points_cashback: "bg-emerald-50 text-emerald-700",
  free_item:       "bg-blue-50 text-blue-700",
  birthday:        "bg-pink-50 text-pink-700",
  welcome_bonus:   "bg-purple-50 text-purple-700",
  double_points:   "bg-amber-50 text-amber-700",
  referral:        "bg-teal-50 text-teal-700",
};

const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  points_cashback: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  free_item:       "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
  birthday:        "M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M9 6H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2",
  welcome_bonus:   "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  double_points:   "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  referral:        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
};

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string; desc: string }[] = [
  { value: "points_cashback", label: "Points Cashback",  desc: "Members redeem stars for money off" },
  { value: "free_item",       label: "Free Item",        desc: "Members redeem stars for a free item" },
  { value: "birthday",        label: "Birthday Treat",   desc: "Auto-issued on member birthday month" },
  { value: "welcome_bonus",   label: "Welcome Bonus",    desc: "Auto-awarded on new member sign-up" },
  { value: "double_points",   label: "Double Points",    desc: "Members earn 2× stars on qualifying days" },
  { value: "referral",        label: "Referral Bonus",   desc: "Stars for successful friend referrals" },
];

const EMPTY_REWARD: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> = {
  name: "",
  description: "",
  type: "points_cashback",
  pointsCost: 500,
  value: "",
  isActive: true,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: "",
  eligibleTiers: ["Bronze", "Silver", "Gold"],
};

// ── Confirm dialog ────────────────────────────────────────────────────────────

function Confirm({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm p-6 shadow-2xl">
        <p className="text-[#3B1F0A] font-semibold mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2.5 text-sm font-bold hover:bg-red-700 transition-colors">Delete</button>
          <button onClick={onCancel} className="flex-1 border border-[#3B1F0A]/15 text-[#3B1F0A]/60 py-2.5 text-sm font-semibold hover:text-[#3B1F0A] transition-colors">Cancel</button>
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

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleTier = (tier: TierName) =>
    setForm((f) => ({
      ...f,
      eligibleTiers: f.eligibleTiers.includes(tier)
        ? f.eligibleTiers.filter((t) => t !== tier)
        : [...f.eligibleTiers, tier],
    }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.value.trim()) e.value = "Reward value description is required";
    if (!form.validFrom) e.validFrom = "Start date required";
    if (form.validTo && form.validFrom && form.validTo < form.validFrom) e.validTo = "End must be after start";
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
        style={{ animation: "fadeUp .25s ease" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

        <div className="bg-[#1A0D00] px-7 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5">
              {isEdit ? "Edit Reward" : "New Reward"}
            </p>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {isEdit ? form.name || "Edit" : "Create a Reward"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-2">Reward Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {REWARD_TYPE_OPTIONS.map((opt) => (
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

          {/* Name + Value */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Reward Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Star Cashback"
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.name ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
                Reward Value * <span className="normal-case font-normal">(shown to customer)</span>
              </label>
              <input value={form.value} onChange={(e) => set("value", e.target.value)}
                placeholder="e.g. 50,000₫ off or Free standard drink"
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.value ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={2} placeholder="Explain how this reward works..."
              className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors resize-none" />
          </div>

          {/* Stars cost (redeemable only) */}
          {!isAuto && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Stars Required</label>
                <input type="number" value={form.pointsCost} min={0}
                  onChange={(e) => set("pointsCost", Number(e.target.value))}
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
                <p className="text-xs text-[#3B1F0A]/35 mt-1">0 = no cost</p>
              </div>
            </div>
          )}
          {isAuto && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200">
              <svg width="14" height="14" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs text-blue-700 font-medium">This reward is automatically issued — no star cost to members.</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Valid From *</label>
              <input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)}
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.validFrom ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
                Valid To <span className="normal-case font-normal">(blank = no expiry)</span>
              </label>
              <input type="date" value={form.validTo} onChange={(e) => set("validTo", e.target.value)}
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.validTo ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.validTo && <p className="text-red-500 text-xs mt-1">{errors.validTo}</p>}
            </div>
          </div>

          {/* Eligible tiers */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-2">Eligible Tiers *</label>
            <div className="flex gap-2 flex-wrap">
              {(["Bronze", "Silver", "Gold"] as TierName[]).map((tier) => {
                const selected = form.eligibleTiers.includes(tier);
                const c = TIER_COLORS[tier];
                return (
                  <button key={tier} type="button" onClick={() => toggleTier(tier)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 text-sm font-semibold transition-all ${selected ? `${c.border} ${c.bg} ${c.text}` : "border-[#3B1F0A]/12 bg-white text-[#3B1F0A]/40 hover:border-[#3B1F0A]/25"}`}>
                    ★ {tier}
                  </button>
                );
              })}
            </div>
            {errors.eligibleTiers && <p className="text-red-500 text-xs mt-1">{errors.eligibleTiers}</p>}
          </div>

          {/* Active toggle */}
          <button type="button" onClick={() => set("isActive", !form.isActive)}
            className={`flex items-center gap-3 px-4 py-3 border-2 w-full transition-all ${form.isActive ? "border-emerald-400 bg-emerald-50" : "border-[#3B1F0A]/12 bg-white"}`}>
            <span className={`w-9 h-5 rounded-full transition-all relative ${form.isActive ? "bg-emerald-500" : "bg-[#3B1F0A]/20"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isActive ? "left-4" : "left-0.5"}`} />
            </span>
            <span className={`text-sm font-semibold ${form.isActive ? "text-emerald-700" : "text-[#3B1F0A]/45"}`}>
              {form.isActive ? "Active" : "Paused"}
            </span>
          </button>
        </div>

        <div className="px-7 py-4 border-t border-[#3B1F0A]/8 flex items-center justify-end gap-3 bg-[#FAF6EF]/60 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#3B1F0A]/15 text-sm font-semibold text-[#3B1F0A]/55 hover:text-[#3B1F0A] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            {isEdit ? "Save Changes" : "Create Reward"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tier edit modal ───────────────────────────────────────────────────────────

function TierModal({
  tier,
  onSave,
  onClose,
}: {
  tier: LoyaltyTier;
  onSave: (data: Partial<Omit<LoyaltyTier, "name" | "memberCount">>) => void;
  onClose: () => void;
}) {
  const [multiplier, setMultiplier] = useState(tier.multiplier);
  const [minPoints, setMinPoints] = useState(tier.minPoints);
  const [maxPoints, setMaxPoints] = useState(tier.maxPoints ?? 0);
  const [benefits, setBenefits] = useState(tier.benefits.join("\n"));
  const c = TIER_COLORS[tier.name];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    onSave({
      multiplier,
      minPoints,
      maxPoints: tier.name === "Gold" ? null : (maxPoints || null),
      benefits: benefits.split("\n").map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeUp .25s ease" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

        <div className="bg-[#1A0D00] px-7 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className={`text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5 ${c.star}`}>Edit Tier</p>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {tier.name} Tier
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Min. Stars</label>
              <input type="number" value={minPoints} min={0}
                onChange={(e) => setMinPoints(Number(e.target.value))}
                disabled={tier.name === "Bronze"}
                className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors disabled:opacity-40" />
            </div>
            {tier.name !== "Gold" && (
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Max. Stars</label>
                <input type="number" value={maxPoints} min={0}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Points Multiplier</label>
            <div className="flex items-center gap-3">
              <input type="number" value={multiplier} min={0.5} max={5} step={0.1}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-24 border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
              <span className="text-sm text-[#3B1F0A]/50">× base stars per 10,000₫</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
              Benefits <span className="normal-case font-normal">(one per line)</span>
            </label>
            <textarea value={benefits} onChange={(e) => setBenefits(e.target.value)}
              rows={7}
              className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors resize-none font-mono" />
          </div>
        </div>

        <div className="px-7 py-4 border-t border-[#3B1F0A]/8 flex items-center justify-end gap-3 bg-[#FAF6EF]/60 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#3B1F0A]/15 text-sm font-semibold text-[#3B1F0A]/55 hover:text-[#3B1F0A] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            Save Tier
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminLoyaltyPage() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [config, setConfig] = useState<LoyaltyConfig>({
    programName: "Highlands Stars",
    pointsName: "Stars",
    pointsPerThousandVND: 1,
    pointsExpiryMonths: 12,
    minRedemptionPoints: 100,
    birthdayBonusPoints: 200,
    welcomeBonusPoints: 100,
    referralBonusPoints: 200,
  });
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rewards" | "tiers" | "settings">("overview");
  const [rewardModal, setRewardModal] = useState<{
    open: boolean;
    reward: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> & { id?: string };
  }>({ open: false, reward: EMPTY_REWARD });
  const [tierModal, setTierModal] = useState<{ open: boolean; tier: LoyaltyTier | null }>({ open: false, tier: null });
  const [deleteRewardId, setDeleteRewardId] = useState<string | null>(null);
  const [rewardSearch, setRewardSearch] = useState("");
  const [configDraft, setConfigDraft] = useState<LoyaltyConfig | null>(null);
  const [configSaved, setConfigSaved] = useState(false);

  // All hooks before early return
  const totalMembers = useMemo(() => tiers.reduce((s, t) => s + t.memberCount, 0), [tiers]);
  const totalRedemptions = useMemo(() => rewards.reduce((s, r) => s + r.redemptionCount, 0), [rewards]);
  const activeRewards = useMemo(() => rewards.filter((r) => r.isActive), [rewards]);
  const visibleRewards = useMemo(() => {
    if (!rewardSearch.trim()) return rewards;
    const q = rewardSearch.toLowerCase();
    return rewards.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [rewards, rewardSearch]);

  useEffect(() => {
    setRewards(getRewards());
    setTiers(getTiers());
    const cfg = getConfig();
    setConfig(cfg);
    setConfigDraft(cfg);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreateReward = () => setRewardModal({ open: true, reward: { ...EMPTY_REWARD } });

  const openEditReward = (r: LoyaltyReward) =>
    setRewardModal({
      open: true,
      reward: {
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        pointsCost: r.pointsCost,
        value: r.value,
        isActive: r.isActive,
        validFrom: r.validFrom,
        validTo: r.validTo,
        eligibleTiers: r.eligibleTiers,
      },
    });

  const handleSaveReward = (data: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount"> & { id?: string }) => {
    const { id, ...rest } = data;
    setRewards(id ? updateReward(id, rest) : createReward(rest));
    setRewardModal({ open: false, reward: EMPTY_REWARD });
  };

  const handleSaveTier = (name: TierName, data: Partial<Omit<LoyaltyTier, "name" | "memberCount">>) => {
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

  const setConfigField = <K extends keyof LoyaltyConfig>(k: K, v: LoyaltyConfig[K]) =>
    setConfigDraft((d) => (d ? { ...d, [k]: v } : d));

  const activeMembers = Math.round(totalMembers * 0.256);

  const TABS = [
    { key: "overview"  as const, label: "Overview"  },
    { key: "rewards"   as const, label: "Rewards",  count: rewards.length },
    { key: "tiers"     as const, label: "Tiers"     },
    { key: "settings"  as const, label: "Settings"  },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-white/50 hover:text-white transition-colors" title="Back">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold tracking-widest" style={{ fontFamily: "var(--font-playfair), serif" }}>HIGHLANDS</p>
            <span className="text-white/20 text-lg">|</span>
            <div className="flex items-center gap-3 text-sm flex-wrap">
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
            </div>
          </div>
        </div>
        <button
          onClick={() => { setRewards(getRewards()); setTiers(getTiers()); }}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-1">Loyalty Programme</p>
              <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {config.programName}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                Empower administrators to design, track, and optimise customer rewards.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
              <button onClick={openCreateReward}
                className="flex items-center gap-2 bg-[#C8820A] text-white px-4 py-2 text-xs font-bold hover:bg-[#C8820A]/80 transition-colors">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                New Reward
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Members",     value: fmtNum(totalMembers),    sub: "enrolled"            },
              { label: "Monthly Active",    value: fmtNum(activeMembers),   sub: "this month"          },
              { label: "Stars Outstanding", value: "45.3M",                  sub: "pending redemption"  },
              { label: "Redemption Rate",   value: "62%",                    sub: "of active members"   },
              { label: "Total Redemptions", value: fmtNum(totalRedemptions), sub: "all time"            },
              { label: "Retention Boost",   value: "+34%",                   sub: "vs non-members"      },
            ].map((s) => (
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
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.key ? "border-[#C8820A] text-[#3B1F0A]" : "border-transparent text-[#3B1F0A]/45 hover:text-[#3B1F0A]/70"}`}>
              {tab.label}
              {"count" in tab && tab.count !== undefined && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 font-bold ${activeTab === tab.key ? "bg-[#C8820A] text-white" : "bg-[#3B1F0A]/8 text-[#3B1F0A]/50"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ═══════════════════════ OVERVIEW ═══════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Monthly chart */}
            <div className="bg-white border border-[#3B1F0A]/8 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    Monthly Redemptions
                  </h2>
                  <p className="text-xs text-[#3B1F0A]/40 mt-0.5">Reward redemptions over the last 6 months</p>
                </div>
                <span className="text-[10px] font-bold text-[#3B1F0A]/40 uppercase tracking-wider">Dec 2025 – May 2026</span>
              </div>
              <div className="flex items-end gap-3" style={{ height: "120px" }}>
                {MONTHLY_DATA.map((d, i) => {
                  const pct = Math.round((d.redemptions / MAX_REDEMPTIONS) * 100);
                  const isCurrent = i === MONTHLY_DATA.length - 1;
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] text-[#3B1F0A]/50 font-semibold">
                        {d.redemptions >= 1000 ? `${(d.redemptions / 1000).toFixed(0)}K` : d.redemptions}
                      </span>
                      <div className={`w-full transition-all ${isCurrent ? "bg-[#C8820A]" : "bg-[#3B1F0A]/15 hover:bg-[#3B1F0A]/25"}`}
                        style={{ height: `${pct}%` }} />
                      <span className={`text-[10px] font-semibold ${isCurrent ? "text-[#C8820A]" : "text-[#3B1F0A]/35"}`}>
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tier distribution + Top rewards */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#3B1F0A]/8 p-6">
                <h2 className="text-base font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Tier Distribution
                </h2>
                <p className="text-xs text-[#3B1F0A]/40 mb-5">Member spread across programme tiers</p>
                <div className="space-y-4">
                  {tiers.map((tier) => {
                    const pct = totalMembers > 0 ? Math.round((tier.memberCount / totalMembers) * 100) : 0;
                    const c = TIER_COLORS[tier.name];
                    return (
                      <div key={tier.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className={`text-sm font-bold ${c.text}`}>{tier.name}</span>
                            <span className="text-xs text-[#3B1F0A]/40">
                              {tier.minPoints.toLocaleString()} – {tier.maxPoints ? tier.maxPoints.toLocaleString() : "∞"} ★
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-[#3B1F0A]">{fmtNum(tier.memberCount)}</span>
                            <span className="text-xs text-[#3B1F0A]/40 ml-1">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-[#3B1F0A]/6">
                          <div className={`h-full ${c.dot} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-[#3B1F0A]/35 mt-1">
                          {tier.multiplier}× stars · {tier.benefits.length} benefits
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-[#3B1F0A]/6 flex items-center justify-between">
                  <span className="text-xs text-[#3B1F0A]/50 font-semibold">Total members</span>
                  <span className="text-sm font-bold text-[#3B1F0A]">{fmtNum(totalMembers)}</span>
                </div>
              </div>

              <div className="bg-white border border-[#3B1F0A]/8 p-6">
                <h2 className="text-base font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Top Rewards
                </h2>
                <p className="text-xs text-[#3B1F0A]/40 mb-5">Most redeemed rewards by customers</p>
                <div className="space-y-3">
                  {[...rewards]
                    .sort((a, b) => b.redemptionCount - a.redemptionCount)
                    .slice(0, 5)
                    .map((r, i) => {
                      const maxCount = Math.max(...rewards.map((r) => r.redemptionCount));
                      const pct = maxCount > 0 ? Math.round((r.redemptionCount / maxCount) * 100) : 0;
                      return (
                        <div key={r.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#3B1F0A]/25 w-4 text-right shrink-0">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-[#3B1F0A] truncate">{r.name}</span>
                              <span className="text-xs font-bold text-[#3B1F0A] ml-2 shrink-0">{fmtNum(r.redemptionCount)}</span>
                            </div>
                            <div className="h-1.5 bg-[#3B1F0A]/6">
                              <div className="h-full bg-[#C8820A]/60 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Engagement KPIs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Avg. Orders / Member", value: "4.2",  sub: "per year",                     icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",                              color: "text-[#C8820A]"   },
                { label: "Repeat Purchase Rate", value: "78%",  sub: "members vs 41% non-members",   icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "text-emerald-600" },
                { label: "Avg. Stars Balance",   value: "312",  sub: "stars per active member",      icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", color: "text-amber-600"   },
                { label: "Churn Reduction",       value: "−21%", sub: "vs non-loyalty customers",   icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",                                          color: "text-blue-600"    },
              ].map((s) => (
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

        {/* ═══════════════════════ REWARDS ═══════════════════════ */}
        {activeTab === "rewards" && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Rewards
                </h2>
                <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
                  {activeRewards.length} active · {rewards.length} total — configure types, star costs, and tier eligibility.
                </p>
              </div>
              <button onClick={openCreateReward}
                className="flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors shrink-0">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                New Reward
              </button>
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input type="text" value={rewardSearch} onChange={(e) => setRewardSearch(e.target.value)}
                placeholder="Search rewards..."
                className="w-full bg-white border border-[#3B1F0A]/10 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors" />
            </div>

            {visibleRewards.length === 0 ? (
              <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
                <p className="font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {rewardSearch ? "No rewards match your search" : "No rewards yet"}
                </p>
                <p className="text-sm text-[#3B1F0A]/40 mb-5">
                  {rewardSearch ? "Try different keywords." : "Create your first reward to get started."}
                </p>
                {!rewardSearch && (
                  <button onClick={openCreateReward}
                    className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                    Create Reward
                  </button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleRewards.map((r) => {
                  const isAuto = REWARD_TYPE_AUTO[r.type];
                  const [colorBg, colorText] = REWARD_TYPE_COLORS[r.type].split(" ");
                  return (
                    <div key={r.id}
                      className={`bg-white border hover:border-[#3B1F0A]/20 transition-colors flex flex-col ${r.isActive ? "border-[#3B1F0A]/8" : "border-[#3B1F0A]/8 opacity-60"}`}>
                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-9 h-9 flex items-center justify-center ${colorBg}`}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className={colorText}>
                              <path d={REWARD_TYPE_ICONS[r.type]} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className={`text-[10px] font-bold px-2 py-0.5 ${REWARD_TYPE_COLORS[r.type]}`}>
                              {REWARD_TYPE_LABELS[r.type]}
                            </span>
                            {!r.isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500">Paused</span>
                            )}
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-[#3B1F0A] mb-1">{r.name}</h3>
                        <p className="text-xs text-[#3B1F0A]/45 mb-4 line-clamp-2">{r.description}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">Value</span>
                            <span className="text-xs font-bold text-[#C8820A]">{r.value}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">Stars cost</span>
                            <span className="text-xs font-semibold text-[#3B1F0A]">
                              {isAuto
                                ? <span className="text-blue-600 font-bold">Auto</span>
                                : `${r.pointsCost} ★`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">Redemptions</span>
                            <span className="text-xs font-bold text-[#3B1F0A]">{r.redemptionCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">Eligible</span>
                            <div className="flex gap-1">
                              {r.eligibleTiers.map((t) => (
                                <span key={t} className={`text-[9px] font-bold px-1.5 py-0.5 ${TIER_COLORS[t].badge}`}>{t[0]}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[#3B1F0A]/6 px-4 py-3 flex items-center gap-1">
                        <button onClick={() => openEditReward(r)}
                          className="flex items-center gap-1.5 text-[#3B1F0A]/40 hover:text-[#C8820A] text-xs font-semibold transition-colors px-2 py-1">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Edit
                        </button>
                        <button onClick={() => setRewards(toggleReward(r.id))}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2 py-1 ${r.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}>
                          {r.isActive ? "Pause" : "Resume"}
                        </button>
                        <div className="flex-1" />
                        <button onClick={() => setDeleteRewardId(r.id)}
                          className="flex items-center gap-1.5 text-[#3B1F0A]/25 hover:text-red-500 text-xs font-semibold transition-colors px-2 py-1">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════ TIERS ═══════════════════════ */}
        {activeTab === "tiers" && (
          <>
            <div>
              <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Tier Management
              </h2>
              <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
                Configure star thresholds, multipliers, and benefits for each loyalty tier.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {tiers.map((tier, i) => {
                const c = TIER_COLORS[tier.name];
                const pct = totalMembers > 0 ? Math.round((tier.memberCount / totalMembers) * 100) : 0;
                const medals = ["🥉", "🥈", "🥇"];
                return (
                  <div key={tier.name} className={`bg-white border ${c.border} overflow-hidden`}>
                    <div className={`px-5 py-4 ${c.bg} border-b ${c.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black ${c.text}`} style={{ fontFamily: "var(--font-playfair), serif" }}>
                            {tier.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${c.badge}`}>
                            {tier.multiplier}× Stars
                          </span>
                        </div>
                        <button onClick={() => setTierModal({ open: true, tier })}
                          className={`text-xs font-semibold ${c.text} opacity-60 hover:opacity-100 transition-opacity px-2 py-1 border ${c.border}`}>
                          Edit
                        </button>
                      </div>
                      <p className={`text-xs ${c.text} opacity-60`}>
                        {tier.minPoints.toLocaleString()} – {tier.maxPoints ? tier.maxPoints.toLocaleString() : "∞"} ★
                      </p>
                    </div>

                    <div className="px-5 py-4 border-b border-[#3B1F0A]/6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                            {fmtNum(tier.memberCount)}
                          </p>
                          <p className="text-xs text-[#3B1F0A]/40">members · {pct}% of total</p>
                        </div>
                        <span className="text-3xl">{medals[i]}</span>
                      </div>
                      <div className="h-1.5 bg-[#3B1F0A]/6">
                        <div className={`h-full ${c.dot} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      <p className="text-[10px] font-bold text-[#3B1F0A]/40 uppercase tracking-wider mb-2.5">Benefits</p>
                      <ul className="space-y-1.5">
                        {tier.benefits.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-xs text-[#3B1F0A]/65">
                            <span className={`mt-0.5 shrink-0 ${c.star}`}>★</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progression path */}
            <div className="bg-white border border-[#3B1F0A]/8 p-6">
              <h3 className="text-sm font-bold text-[#3B1F0A] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Stars Progression Path
              </h3>
              <div className="h-2 bg-gradient-to-r from-amber-400 via-slate-300 to-[#C8820A] w-full" />
              <div className="flex items-start justify-between mt-2">
                {tiers.map((tier, i) => {
                  const c = TIER_COLORS[tier.name];
                  return (
                    <div key={tier.name} className={i === 0 ? "text-left" : i === tiers.length - 1 ? "text-right" : "text-center"}>
                      <p className={`text-xs font-bold ${c.text}`}>{tier.name}</p>
                      <p className="text-[10px] text-[#3B1F0A]/40">{tier.minPoints.toLocaleString()} ★</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════ SETTINGS ═══════════════════════ */}
        {activeTab === "settings" && configDraft && (
          <>
            <div>
              <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Programme Settings
              </h2>
              <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
                Configure core rules, earning rates, and bonus structures for your loyalty programme.
              </p>
            </div>

            <div className="bg-white border border-[#3B1F0A]/8 p-6 space-y-7">

              {/* Identity */}
              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">
                  Programme Identity
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Programme Name</label>
                    <input value={configDraft.programName} onChange={(e) => setConfigField("programName", e.target.value)}
                      className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Points Currency Name</label>
                    <input value={configDraft.pointsName} onChange={(e) => setConfigField("pointsName", e.target.value)}
                      placeholder="e.g. Stars, Points, Beans"
                      className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
                  </div>
                </div>
              </section>

              {/* Earning */}
              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">
                  Earning Rules
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
                      {configDraft.pointsName} per 1,000₫ spent
                    </label>
                    <div className="relative">
                      <input type="number" value={configDraft.pointsPerThousandVND} min={0.1} step={0.1}
                        onChange={(e) => setConfigField("pointsPerThousandVND", Number(e.target.value))}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors pr-16" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">★/1K₫</span>
                    </div>
                    <p className="text-xs text-[#3B1F0A]/35 mt-1">Base rate; multiplied by tier multiplier</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
                      Points Expiry
                    </label>
                    <div className="relative">
                      <input type="number" value={configDraft.pointsExpiryMonths} min={0}
                        onChange={(e) => setConfigField("pointsExpiryMonths", Number(e.target.value))}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors pr-20" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">months</span>
                    </div>
                    <p className="text-xs text-[#3B1F0A]/35 mt-1">0 = points never expire</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
                      Min. Redemption Threshold
                    </label>
                    <div className="relative">
                      <input type="number" value={configDraft.minRedemptionPoints} min={0}
                        onChange={(e) => setConfigField("minRedemptionPoints", Number(e.target.value))}
                        className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">★</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bonus points */}
              <section>
                <h3 className="text-xs font-bold text-[#3B1F0A]/55 uppercase tracking-wider mb-3 pb-2 border-b border-[#3B1F0A]/8">
                  Automatic Bonus Points
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Welcome Bonus",  key: "welcomeBonusPoints"  as const, desc: "Awarded on sign-up"         },
                    { label: "Birthday Bonus", key: "birthdayBonusPoints" as const, desc: "Awarded on birthday month"  },
                    { label: "Referral Bonus", key: "referralBonusPoints" as const, desc: "Per successful referral"    },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input type="number" value={configDraft[field.key]} min={0}
                          onChange={(e) => setConfigField(field.key, Number(e.target.value))}
                          className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors pr-8" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3B1F0A]/35 font-semibold">★</span>
                      </div>
                      <p className="text-xs text-[#3B1F0A]/35 mt-1">{field.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex items-center justify-between pt-2">
                {configSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Settings saved
                  </span>
                )}
                <div className="ml-auto">
                  <button onClick={handleSaveConfig}
                    className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── Modals ── */}
      {rewardModal.open && (
        <RewardModal
          initial={rewardModal.reward}
          onSave={handleSaveReward}
          onClose={() => setRewardModal({ open: false, reward: EMPTY_REWARD })}
        />
      )}
      {tierModal.open && tierModal.tier && (
        <TierModal
          tier={tierModal.tier}
          onSave={(data) => handleSaveTier(tierModal.tier!.name, data)}
          onClose={() => setTierModal({ open: false, tier: null })}
        />
      )}
      {deleteRewardId && (
        <Confirm
          message={`Delete "${rewards.find((r) => r.id === deleteRewardId)?.name}"? This cannot be undone.`}
          onConfirm={() => { setRewards(deleteReward(deleteRewardId)); setDeleteRewardId(null); }}
          onCancel={() => setDeleteRewardId(null)}
        />
      )}
    </div>
  );
}
