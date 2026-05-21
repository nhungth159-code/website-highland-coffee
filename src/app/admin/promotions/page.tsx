"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotion,
  getPromoStatus,
  formatDate,
} from "@/lib/promotions";
import type { Promotion, PromoType, PromoStatus } from "@/lib/promotions";

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

const STATUS_STYLE: Record<PromoStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:    { label: "Active",     bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  expired:   { label: "Expired",    bg: "bg-red-50",      text: "text-red-600",     dot: "bg-red-400"     },
  scheduled: { label: "Scheduled",  bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-400"    },
  paused:    { label: "Paused",     bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400"   },
  exhausted: { label: "Exhausted",  bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-400"  },
};

const TYPE_LABELS: Record<PromoType, string> = {
  percent:       "% Discount",
  fixed:         "Fixed Off",
  bogo:          "Buy X Get Y",
  free_delivery: "Free Delivery",
};

const TYPE_OPTIONS: { value: PromoType; label: string; desc: string }[] = [
  { value: "percent",       label: "Percentage Discount", desc: "e.g. 25% off subtotal" },
  { value: "fixed",         label: "Fixed Amount Off",    desc: "e.g. 50,000₫ off"     },
  { value: "bogo",          label: "Buy X Get Y",         desc: "e.g. Buy 1 Get 1 Free" },
  { value: "free_delivery", label: "Free Delivery",       desc: "Waive delivery fee"    },
];

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  type: "percent" as PromoType,
  value: 25,
  minPurchase: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  maxUses: 0,
  isActive: true,
  bogoDetails: { buyQty: 1, getQty: 1 },
};

// ── Confirm dialog ────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
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

// ── Promo Form Modal ──────────────────────────────────────────
function PromoModal({
  initial,
  onSave,
  onClose,
}: {
  initial: typeof EMPTY_FORM & { id?: string };
  onSave: (data: typeof EMPTY_FORM & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initial.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.code.trim()) e.code = "Code is required";
    if (!/^[A-Z0-9_-]{2,20}$/.test(form.code.trim().toUpperCase())) e.code = "Code must be 2–20 chars (letters, numbers, - _)";
    if ((form.type === "percent") && (form.value < 1 || form.value > 100)) e.value = "Must be 1–100%";
    if (form.type === "fixed" && form.value < 1000) e.value = "Must be at least 1,000₫";
    if (!form.startDate) e.startDate = "Start date required";
    if (!form.endDate) e.endDate = "End date required";
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = "End must be after start";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, code: form.code.trim().toUpperCase() });
  };

  const showValue = form.type === "percent" || form.type === "fixed";
  const showBogo  = form.type === "bogo";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeUp .25s ease" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div className="bg-[#1A0D00] px-7 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5">
              {isEdit ? "Edit Promotion" : "New Promotion"}
            </p>
            <h2 className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {isEdit ? form.name || "Edit" : "Create a Promotion"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* Name + Code row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Promotion Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Summer Discount"
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.name ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Promo Code *</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER25"
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors font-mono tracking-widest uppercase ${errors.code ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={2} placeholder="Customer-facing description..."
              className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors resize-none" />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-2">Promotion Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
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

          {/* Value */}
          {showValue && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">
                  {form.type === "percent" ? "Discount %" : "Amount (₫)"} *
                </label>
                <div className="relative">
                  <input type="number" value={form.value} onChange={(e) => set("value", Number(e.target.value))}
                    min={form.type === "percent" ? 1 : 1000} max={form.type === "percent" ? 100 : undefined}
                    className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors pr-10 ${errors.value ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#3B1F0A]/35 font-semibold">
                    {form.type === "percent" ? "%" : "₫"}
                  </span>
                </div>
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Min. Purchase (₫)</label>
                <input type="number" value={form.minPurchase} onChange={(e) => set("minPurchase", Number(e.target.value))} min={0}
                  placeholder="0 = no minimum"
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
              </div>
            </div>
          )}

          {/* BOGO details */}
          {showBogo && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Buy Quantity</label>
                <input type="number" value={form.bogoDetails.buyQty} min={1}
                  onChange={(e) => set("bogoDetails", { ...form.bogoDetails, buyQty: Number(e.target.value) })}
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Get Quantity Free</label>
                <input type="number" value={form.bogoDetails.getQty} min={1}
                  onChange={(e) => set("bogoDetails", { ...form.bogoDetails, getQty: Number(e.target.value) })}
                  className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.startDate ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">End Date *</label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className={`w-full border px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors ${errors.endDate ? "border-red-400" : "border-[#3B1F0A]/15"}`} />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Max uses + active toggle */}
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-[#3B1F0A]/55 tracking-wider uppercase mb-1.5">Max Uses</label>
              <input type="number" value={form.maxUses} min={0} onChange={(e) => set("maxUses", Number(e.target.value))}
                placeholder="0 = unlimited"
                className="w-full border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white outline-none focus:border-[#C8820A] transition-colors" />
              <p className="text-xs text-[#3B1F0A]/35 mt-1">0 = unlimited uses</p>
            </div>
            <div className="pt-6">
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#3B1F0A]/8 flex items-center justify-end gap-3 bg-[#FAF6EF]/60 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#3B1F0A]/15 text-sm font-semibold text-[#3B1F0A]/55 hover:text-[#3B1F0A] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-[#C8820A] text-white text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            {isEdit ? "Save Changes" : "Create Promotion"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; promo: typeof EMPTY_FORM & { id?: string } }>({ open: false, promo: EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | PromoStatus>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPromos(getPromotions());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Stats
  const stats = useMemo(() => {
    const active    = promos.filter((p) => getPromoStatus(p) === "active");
    const totalUses = promos.reduce((s, p) => s + p.usedCount, 0);
    const totalDisc = promos.reduce((s, p) => s + p.totalDiscountGiven, 0);
    const avgDisc   = totalUses > 0 ? Math.round(totalDisc / totalUses) : 0;
    return { active: active.length, totalUses, totalDisc, avgDisc };
  }, [promos]);

  // Filtered list
  const visible = useMemo(() => {
    let list = filterStatus === "all" ? promos : promos.filter((p) => getPromoStatus(p) === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    return list;
  }, [promos, filterStatus, search]);

  const openCreate = () => setModal({ open: true, promo: { ...EMPTY_FORM } });

  const openEdit = (p: Promotion) =>
    setModal({
      open: true,
      promo: {
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        type: p.type,
        value: p.value,
        minPurchase: p.minPurchase,
        startDate: p.startDate,
        endDate: p.endDate,
        maxUses: p.maxUses,
        isActive: p.isActive,
        bogoDetails: p.bogoDetails ?? { buyQty: 1, getQty: 1 },
      },
    });

  const handleSave = (data: typeof EMPTY_FORM & { id?: string }) => {
    const payload = {
      name: data.name,
      code: data.code,
      description: data.description,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase,
      startDate: data.startDate,
      endDate: data.endDate,
      maxUses: data.maxUses,
      isActive: data.isActive,
      bogoDetails: data.type === "bogo" ? data.bogoDetails : undefined,
    };
    if (data.id) {
      setPromos(updatePromotion(data.id, payload));
    } else {
      setPromos(createPromotion(payload));
    }
    setModal({ open: false, promo: EMPTY_FORM });
  };

  const handleToggle = (id: string) => setPromos(togglePromotion(id));
  const handleDelete = (id: string) => { setPromos(deletePromotion(id)); setDeleteId(null); };

  const STATUS_TABS: { key: "all" | PromoStatus; label: string }[] = [
    { key: "all",       label: "All"       },
    { key: "active",    label: "Active"    },
    { key: "scheduled", label: "Scheduled" },
    { key: "paused",    label: "Paused"    },
    { key: "expired",   label: "Expired"   },
    { key: "exhausted", label: "Exhausted" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-white/50 hover:text-white transition-colors" title="Back to Orders">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold tracking-widest" style={{ fontFamily: "var(--font-playfair), serif" }}>HIGHLANDS</p>
            <span className="text-white/20 text-lg">|</span>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-white/50 hover:text-white transition-colors">Orders</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/applications" className="text-white/50 hover:text-white transition-colors">Applications</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/contacts" className="text-white/50 hover:text-white transition-colors">Contacts</Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/gift-cards" className="text-white/50 hover:text-white transition-colors">Gift Cards</Link>
              <span className="text-white/20">/</span>
              <span className="text-white font-semibold">Promotions</span>
            </div>
          </div>
        </div>
        <button onClick={() => setPromos(getPromotions())} className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Promos",    value: stats.active,           sub: "running now",             icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" },
            { label: "Total Uses",       value: stats.totalUses,        sub: "across all promos",       icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            { label: "Total Discounted", value: fmt(stats.totalDisc),   sub: "given to customers",      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0" },
            { label: "Avg Discount",     value: fmt(stats.avgDisc),     sub: "per redemption",          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#3B1F0A]/8 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-[#3B1F0A]/45 font-medium">{s.label}</p>
                <svg width="16" height="16" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
              <p className="text-xs text-[#3B1F0A]/35 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Promotions
            </h1>
            <p className="text-xs text-[#3B1F0A]/45 mt-0.5">{promos.length} total promotion{promos.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors shrink-0">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New Promotion
          </button>
        </div>

        {/* ── Filter tabs + search ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name..."
              className="w-full bg-white border border-[#3B1F0A]/10 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(({ key, label }) => {
              const count = key === "all" ? promos.length : promos.filter((p) => getPromoStatus(p) === key).length;
              return (
                <button key={key} onClick={() => setFilterStatus(key)}
                  className={`px-3 py-2 text-xs font-semibold tracking-wide capitalize transition-all border ${filterStatus === key ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "bg-white text-[#3B1F0A]/55 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/30"}`}>
                  {label} <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Promotions list ── */}
        {visible.length === 0 ? (
          <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#3B1F0A]/5 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {search ? "No promotions match your search" : "No promotions yet"}
            </p>
            <p className="text-sm text-[#3B1F0A]/40 mb-5">
              {search ? "Try a different term." : "Create your first promotion to get started."}
            </p>
            {!search && (
              <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                Create Promotion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => {
              const status = getPromoStatus(p);
              const style  = STATUS_STYLE[status];
              const usagePct = p.maxUses > 0 ? Math.min(100, Math.round(p.usedCount / p.maxUses * 100)) : null;

              return (
                <div key={p.id} className="bg-white border border-[#3B1F0A]/8 hover:border-[#3B1F0A]/15 transition-colors">
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">

                    {/* Left: status dot + code + name */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                          <span className="font-mono font-bold text-[#3B1F0A] tracking-wider text-sm">{p.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${style.bg} ${style.text}`}>{style.label}</span>
                          <span className="text-[10px] font-semibold text-[#3B1F0A]/40 bg-[#3B1F0A]/5 px-1.5 py-0.5">
                            {TYPE_LABELS[p.type]}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#3B1F0A]">{p.name}</p>
                        {p.description && <p className="text-xs text-[#3B1F0A]/45 mt-0.5 line-clamp-1">{p.description}</p>}
                      </div>
                    </div>

                    {/* Middle: value + dates + usage */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs shrink-0 sm:min-w-[320px]">
                      <div>
                        <p className="text-[#3B1F0A]/40 uppercase tracking-wider text-[10px] font-semibold mb-0.5">Discount</p>
                        <p className="font-bold text-[#3B1F0A]">
                          {p.type === "percent"       && `${p.value}% off`}
                          {p.type === "fixed"         && `${fmt(p.value)} off`}
                          {p.type === "bogo"          && `Buy ${p.bogoDetails?.buyQty ?? 1} Get ${p.bogoDetails?.getQty ?? 1}`}
                          {p.type === "free_delivery" && "Free delivery"}
                        </p>
                        {p.minPurchase > 0 && <p className="text-[#3B1F0A]/35 text-[10px]">Min. {fmt(p.minPurchase)}</p>}
                      </div>
                      <div>
                        <p className="text-[#3B1F0A]/40 uppercase tracking-wider text-[10px] font-semibold mb-0.5">Valid Period</p>
                        <p className="font-medium text-[#3B1F0A]">{formatDate(p.startDate)}</p>
                        <p className="text-[#3B1F0A]/45">→ {formatDate(p.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-[#3B1F0A]/40 uppercase tracking-wider text-[10px] font-semibold mb-0.5">
                          Usage {p.maxUses > 0 ? `/ ${p.maxUses}` : ""}
                        </p>
                        <p className="font-bold text-[#3B1F0A]">{p.usedCount.toLocaleString()} uses</p>
                        {p.maxUses > 0 && usagePct !== null && (
                          <div className="mt-1 h-1.5 bg-[#3B1F0A]/10 w-24">
                            <div
                              className={`h-full transition-all ${usagePct >= 90 ? "bg-red-500" : usagePct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[#3B1F0A]/35 text-[10px] mt-0.5">{fmt(p.totalDiscountGiven)} given</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(p)}
                        className="flex items-center gap-1.5 text-[#3B1F0A]/40 hover:text-[#C8820A] text-xs font-semibold transition-colors px-2 py-1">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Edit
                      </button>
                      <button onClick={() => handleToggle(p.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2 py-1 ${p.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          {p.isActive
                            ? <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                            : <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />}
                        </svg>
                        {p.isActive ? "Pause" : "Resume"}
                      </button>
                      <button onClick={() => setDeleteId(p.id)}
                        className="flex items-center gap-1.5 text-[#3B1F0A]/30 hover:text-red-500 text-xs font-semibold transition-colors px-2 py-1">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Loyalty / engagement tip */}
                  {status === "active" && p.usedCount > 0 && (
                    <div className="border-t border-[#3B1F0A]/6 px-5 py-2.5 bg-[#FAF6EF]/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#3B1F0A]/50">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>
                          {p.usedCount} redemptions · {fmt(p.totalDiscountGiven)} total discount given
                          {p.type === "percent" && p.usedCount > 0 && (
                            <span className="ml-2 text-[#C8820A] font-semibold">
                              ~{fmt(Math.round(p.totalDiscountGiven / p.usedCount * 100 / p.value))} avg order value
                            </span>
                          )}
                        </span>
                      </div>
                      {p.maxUses > 0 && usagePct !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 ${usagePct >= 90 ? "bg-red-50 text-red-600" : usagePct >= 60 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {usagePct}% used
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Loyalty section ── */}
        <div className="bg-[#1A0D00] p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.35em] uppercase mb-1">Loyalty Programme</p>
              <h2 className="text-white text-xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Highlands Stars
              </h2>
              <p className="text-white/40 text-sm mt-1">8,000,000+ active members · Points-based loyalty system</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Members",          value: "8M+",     icon: "bg-[#C8820A]/15 text-[#C8820A]" },
              { label: "Avg Stars / Order", value: "45",     icon: "bg-blue-400/15 text-blue-300"   },
              { label: "Redemption Rate",  value: "62%",     icon: "bg-emerald-400/15 text-emerald-300" },
              { label: "Retention Boost",  value: "+34%",    icon: "bg-purple-400/15 text-purple-300"  },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 px-4 py-3">
                <p className="text-white/35 text-[10px] uppercase tracking-wider font-semibold">{s.label}</p>
                <p className="text-white text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { tier: "Bronze",   range: "0–999 stars",     members: "3.2M", color: "text-amber-600", bg: "bg-amber-600/10" },
              { tier: "Silver",   range: "1,000–4,999",     members: "3.1M", color: "text-slate-300", bg: "bg-slate-300/10" },
              { tier: "Gold",     range: "5,000+ stars",    members: "1.7M", color: "text-[#C8820A]", bg: "bg-[#C8820A]/10" },
            ].map((t) => (
              <div key={t.tier} className={`px-4 py-3 border border-white/8 flex items-center justify-between ${t.bg}`}>
                <div>
                  <p className={`text-sm font-bold ${t.color}`}>{t.tier}</p>
                  <p className="text-white/35 text-xs">{t.range}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{t.members}</p>
                  <p className="text-white/30 text-[10px]">members</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {modal.open && (
        <PromoModal
          initial={modal.promo}
          onSave={handleSave}
          onClose={() => setModal({ open: false, promo: EMPTY_FORM })}
        />
      )}
      {deleteId && (
        <Confirm
          message={`Delete "${promos.find((p) => p.id === deleteId)?.name}"? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
