"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { getOrders } from "@/lib/orders";
import type { StoredOrder } from "@/lib/orders";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Period = "today" | "7d" | "30d" | "90d";
type RowDim = "category" | "product" | "customerType" | "month" | "status" | "payment" | "customer";
type MeasureKey = "revenue" | "orders" | "items" | "avgOrder" | "discount";

interface Filter { dim: RowDim; value: string; mode: "include" | "exclude"; }

interface Config {
  period: Period;
  rowDim1: RowDim;
  rowDim2: RowDim | null;
  measures: MeasureKey[];
  filters: Filter[];
  sort: { by: MeasureKey; dir: "asc" | "desc" } | null;
}

interface Agg { revenue: number; orders: number; items: number; discount: number; }

interface GroupRow {
  key: string;
  label: string;
  agg: Agg;
  children: { key: string; label: string; agg: Agg }[];
}

interface FlatRec {
  orderId: string; orderTotal: number; orderDiscount: number;
  category: string; product: string; customerType: string;
  month: string; status: string; payment: string; customer: string;
  itemRevenue: number; itemQty: number;
}

interface SavedView { id: string; name: string; config: Config; createdAt: string; }

interface CTX {
  x: number; y: number;
  type: "canvas" | "table-header" | "group" | "sub-group" | "measure-header" | "totals";
  dim?: RowDim;
  value?: string;
  measure?: MeasureKey;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const ALL_DIMS: RowDim[] = ["category", "product", "customerType", "month", "status", "payment", "customer"];
const ALL_MEASURES: MeasureKey[] = ["revenue", "orders", "items", "avgOrder", "discount"];

const DIM_LABEL: Record<RowDim, string> = {
  category: "Category", product: "Product", customerType: "Customer Type",
  month: "Month", status: "Order Status", payment: "Payment Method", customer: "Customer Name",
};

const MEASURE_LABEL: Record<MeasureKey, string> = {
  revenue: "Revenue", orders: "Orders", items: "Items Sold",
  avgOrder: "Avg Order Value", discount: "Discount Given",
};

const PERIOD_LABEL: Record<Period, string> = {
  today: "Today", "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days",
};

const PRODUCT_CATS: Record<string, string> = {
  "Vietnamese Iced Coffee": "Coffee", "Milk Coffee": "Coffee",
  "Highlands Espresso": "Coffee",    "Cold Brew": "Coffee",
  "Peach & Lemongrass Iced Tea": "Tea", "Green Milk Tea": "Tea",
  "Black Milk Tea": "Tea",           "Fresh Kumquat Tea": "Tea",
  "Butter Baguette": "Food",         "Almond Croissant": "Food",
  "Matcha Cheesecake": "Food",       "Coffee Tiramisu": "Food",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", preparing: "Preparing", delivering: "Delivering",
  delivered: "Delivered", cancelled: "Cancelled",
};

// Logical drill-down path
const DRILL_PATH: Partial<Record<RowDim, RowDim>> = {
  category: "product", customerType: "customer",
};

const DEFAULT_CFG: Config = {
  period: "30d", rowDim1: "category", rowDim2: null,
  measures: ["revenue", "orders"], filters: [], sort: null,
};

const VIEWS_KEY = "highlands_pivot_views";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtS    = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M₫" : n >= 1_000 ? Math.round(n / 1_000) + "K₫" : n + "₫";
const fmtM    = (v: number, m: MeasureKey) => (m === "orders" || m === "items") ? v.toLocaleString("vi-VN") : fmtS(v);
const getAggM = (a: Agg, m: MeasureKey): number => m === "revenue" ? a.revenue : m === "orders" ? a.orders : m === "items" ? a.items : m === "discount" ? a.discount : a.orders > 0 ? Math.round(a.revenue / a.orders) : 0;

function getDateRange(period: Period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const days = period === "today" ? 0 : period === "7d" ? 6 : period === "30d" ? 29 : 89;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return { start, end };
}

function flattenOrders(orders: StoredOrder[]): FlatRec[] {
  const recs: FlatRec[] = [];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const month = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const base = {
      orderId: o.id, orderTotal: o.total, orderDiscount: o.discount ?? 0,
      customerType: o.loyaltyCustomerId ? "Member" : "Anonymous",
      month, status: STATUS_LABEL[o.status] ?? o.status,
      payment: o.paymentMethod ?? "Cash on Delivery",
      customer: o.customer.name,
    };
    if (o.items.length === 0) {
      recs.push({ ...base, category: "—", product: "—", itemRevenue: o.total, itemQty: 0 });
    } else {
      o.items.forEach(item => recs.push({
        ...base,
        category: PRODUCT_CATS[item.name] ?? "Other",
        product: item.name,
        itemRevenue: item.price * item.quantity,
        itemQty: item.quantity,
      }));
    }
  });
  return recs;
}

function getRecDim(rec: FlatRec, dim: RowDim): string {
  const map: Record<RowDim, string> = {
    category: rec.category, product: rec.product, customerType: rec.customerType,
    month: rec.month, status: rec.status, payment: rec.payment, customer: rec.customer,
  };
  return map[dim];
}

function aggregate(recs: FlatRec[]): Agg {
  const totals = new Map<string, number>();
  const discounts = new Map<string, number>();
  recs.forEach(r => {
    if (!totals.has(r.orderId)) {
      totals.set(r.orderId, r.orderTotal);
      discounts.set(r.orderId, r.orderDiscount);
    }
  });
  return {
    revenue: [...totals.values()].reduce((s, v) => s + v, 0),
    orders: totals.size,
    items: recs.reduce((s, r) => s + r.itemQty, 0),
    discount: [...discounts.values()].reduce((s, v) => s + v, 0),
  };
}

function applyFilters(recs: FlatRec[], filters: Filter[]): FlatRec[] {
  return recs.filter(rec =>
    filters.every(f => {
      const v = getRecDim(rec, f.dim);
      return f.mode === "include" ? v === f.value : v !== f.value;
    })
  );
}

function buildPivot(recs: FlatRec[], cfg: Config): GroupRow[] {
  const { rowDim1, rowDim2, sort } = cfg;
  const groups = new Map<string, FlatRec[]>();
  recs.forEach(r => {
    const k = getRecDim(r, rowDim1);
    const arr = groups.get(k) ?? []; arr.push(r); groups.set(k, arr);
  });
  let rows: GroupRow[] = [...groups.entries()].map(([label, gRecs]) => {
    let children: GroupRow["children"] = [];
    if (rowDim2) {
      const sub = new Map<string, FlatRec[]>();
      gRecs.forEach(r => { const k = getRecDim(r, rowDim2); const a = sub.get(k) ?? []; a.push(r); sub.set(k, a); });
      children = [...sub.entries()].map(([subLabel, sRecs]) => ({ key: `${label}::${subLabel}`, label: subLabel, agg: aggregate(sRecs) }));
    }
    return { key: label, label, agg: aggregate(gRecs), children };
  });
  if (sort) {
    const { by, dir } = sort;
    rows = rows.sort((a, b) => dir === "desc" ? getAggM(b.agg, by) - getAggM(a.agg, by) : getAggM(a.agg, by) - getAggM(b.agg, by));
  }
  return rows;
}

function loadViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(VIEWS_KEY) || "[]"); } catch { return []; }
}
function saveViews(v: SavedView[]) { localStorage.setItem(VIEWS_KEY, JSON.stringify(v)); }

// ─── Context Menu ──────────────────────────────────────────────────────────────
function MenuLabel({ text }: { text: string }) {
  return <p className="px-3.5 pt-2.5 pb-1 text-[9.5px] font-bold tracking-[0.2em] uppercase text-[#C8820A]">{text}</p>;
}
function MenuDivider() { return <div className="my-1.5 border-t border-white/8" />; }
function MenuItem({ label, sub, onClick, danger, checked, icon }: {
  label: string; sub?: string; onClick: () => void;
  danger?: boolean; checked?: boolean; icon?: string;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-left transition-colors hover:bg-white/8 ${danger ? "text-red-400 hover:text-red-300" : checked ? "text-[#C8820A]" : "text-white/80 hover:text-white"}`}>
      <span className="w-3 shrink-0 text-center text-[10px]">
        {checked ? "✓" : icon ?? ""}
      </span>
      <span className="flex-1">{label}</span>
      {sub && <span className="text-white/30 text-[9px]">{sub}</span>}
    </button>
  );
}

interface CTXPanelProps {
  ctx: CTX;
  cfg: Config;
  setCfg: (c: Config) => void;
  setCtx: (c: CTX | null) => void;
  setSaveModal: (v: boolean) => void;
  allValues: Map<RowDim, string[]>;
}
function CTXPanel({ ctx, cfg, setCfg, setCtx, setSaveModal, allValues }: CTXPanelProps) {
  const close = () => setCtx(null);
  const update = (patch: Partial<Config>) => { setCfg({ ...cfg, ...patch }); close(); };

  // Helper to toggle a measure
  const toggleMeasure = (m: MeasureKey) => {
    const next = cfg.measures.includes(m) ? cfg.measures.filter(x => x !== m) : [...cfg.measures, m];
    if (next.length > 0) update({ measures: next });
    else close();
  };

  // Helper to toggle a filter
  const setFilter = (dim: RowDim, value: string, mode: "include" | "exclude") => {
    const already = cfg.filters.find(f => f.dim === dim && f.value === value && f.mode === mode);
    const next = already
      ? cfg.filters.filter(f => !(f.dim === dim && f.value === value && f.mode === mode))
      : [...cfg.filters.filter(f => !(f.dim === dim && f.value === value)), { dim, value, mode }];
    update({ filters: next });
  };

  const activeInclude = (dim: RowDim, value: string) => cfg.filters.some(f => f.dim === dim && f.value === value && f.mode === "include");
  const activeExclude = (dim: RowDim, value: string) => cfg.filters.some(f => f.dim === dim && f.value === value && f.mode === "exclude");

  // CANVAS / TABLE HEADER menu — configure the report
  if (ctx.type === "canvas" || ctx.type === "table-header") {
    const otherDims = ALL_DIMS.filter(d => d !== cfg.rowDim1);
    return (
      <div>
        <MenuLabel text="Group rows by" />
        {ALL_DIMS.map(d => (
          <MenuItem key={d} label={DIM_LABEL[d]} checked={cfg.rowDim1 === d}
            onClick={() => update({ rowDim1: d, rowDim2: null, filters: [] })} />
        ))}
        <MenuDivider />
        <MenuLabel text="Sub-group by" />
        <MenuItem label="None" checked={!cfg.rowDim2}
          onClick={() => update({ rowDim2: null })} />
        {otherDims.map(d => (
          <MenuItem key={d} label={DIM_LABEL[d]} checked={cfg.rowDim2 === d}
            onClick={() => update({ rowDim2: d })} />
        ))}
        <MenuDivider />
        <MenuLabel text="Measures" />
        {ALL_MEASURES.map(m => (
          <MenuItem key={m} label={MEASURE_LABEL[m]} checked={cfg.measures.includes(m)}
            onClick={() => toggleMeasure(m)} />
        ))}
        <MenuDivider />
        <MenuItem label="Save current view" icon="⭐" onClick={() => { setSaveModal(true); close(); }} />
        <MenuItem label="Reset to default" icon="↺" onClick={() => update(DEFAULT_CFG)} />
      </div>
    );
  }

  // MEASURE HEADER menu — sort / add-remove measures
  if (ctx.type === "measure-header" && ctx.measure) {
    const m = ctx.measure;
    const others = ALL_MEASURES.filter(x => !cfg.measures.includes(x));
    return (
      <div>
        <MenuLabel text={MEASURE_LABEL[m]} />
        <MenuItem label="Sort ascending"  icon="↑" checked={cfg.sort?.by === m && cfg.sort?.dir === "asc"}
          onClick={() => update({ sort: { by: m, dir: "asc" } })} />
        <MenuItem label="Sort descending" icon="↓" checked={cfg.sort?.by === m && cfg.sort?.dir === "desc"}
          onClick={() => update({ sort: { by: m, dir: "desc" } })} />
        {cfg.sort?.by === m && (
          <MenuItem label="Clear sort" icon="○" onClick={() => update({ sort: null })} />
        )}
        <MenuDivider />
        <MenuItem label={`Remove "${MEASURE_LABEL[m]}"`} danger onClick={() => toggleMeasure(m)} />
        {others.length > 0 && (
          <>
            <MenuDivider />
            <MenuLabel text="Add measure" />
            {others.map(x => <MenuItem key={x} label={MEASURE_LABEL[x]} icon="+" onClick={() => toggleMeasure(x)} />)}
          </>
        )}
      </div>
    );
  }

  // GROUP ROW or SUB-GROUP ROW menu — filter / drill / sort
  if ((ctx.type === "group" || ctx.type === "sub-group") && ctx.dim && ctx.value) {
    const { dim, value } = ctx as { dim: RowDim; value: string };
    const vals = allValues.get(dim) ?? [];
    const drillDim = DRILL_PATH[dim];
    return (
      <div>
        <MenuLabel text={`${DIM_LABEL[dim]}: "${value}"`} />

        {/* Filters */}
        <MenuItem
          label={activeInclude(dim, value) ? `Remove filter "${value}"` : `Show only "${value}"`}
          icon={activeInclude(dim, value) ? "✕" : "◎"}
          checked={activeInclude(dim, value)}
          onClick={() => setFilter(dim, value, "include")}
        />
        <MenuItem
          label={activeExclude(dim, value) ? `Remove exclusion "${value}"` : `Exclude "${value}"`}
          icon={activeExclude(dim, value) ? "✕" : "⊘"}
          checked={activeExclude(dim, value)}
          onClick={() => setFilter(dim, value, "exclude")}
        />

        {/* Filter by other values in same dim */}
        {vals.filter(v => v !== value).length > 0 && (
          <>
            <MenuDivider />
            <MenuLabel text={`Other ${DIM_LABEL[dim]} values`} />
            {vals.filter(v => v !== value).slice(0, 6).map(v => (
              <MenuItem key={v} label={v} checked={activeInclude(dim, v)}
                sub={activeInclude(dim, v) ? "active" : undefined}
                onClick={() => setFilter(dim, v, "include")} />
            ))}
          </>
        )}

        {/* Drill down */}
        {drillDim && (
          <>
            <MenuDivider />
            <MenuLabel text="Drill down" />
            <MenuItem label={`Explore by ${DIM_LABEL[drillDim]}`} icon="⇲"
              onClick={() => update({
                rowDim1: drillDim, rowDim2: null,
                filters: [...cfg.filters.filter(f => !(f.dim === dim && f.value === value)), { dim, value, mode: "include" }],
              })} />
          </>
        )}

        {/* Sub-group by (if not already sub-grouped) */}
        {ctx.type === "group" && !cfg.rowDim2 && (
          <>
            <MenuDivider />
            <MenuLabel text="Add sub-group by" />
            {ALL_DIMS.filter(d => d !== dim).slice(0, 4).map(d => (
              <MenuItem key={d} label={DIM_LABEL[d]} icon="⊞"
                onClick={() => update({ rowDim2: d })} />
            ))}
          </>
        )}

        {/* Sort */}
        <MenuDivider />
        <MenuLabel text="Sort by" />
        {cfg.measures.map(m => (
          <MenuItem key={m} label={MEASURE_LABEL[m]}
            sub={cfg.sort?.by === m ? (cfg.sort.dir === "desc" ? "↓" : "↑") : undefined}
            onClick={() => {
              const already = cfg.sort?.by === m;
              const nextDir = (already && cfg.sort?.dir === "desc") ? "asc" : "desc";
              update({ sort: { by: m, dir: nextDir } });
            }} />
        ))}
      </div>
    );
  }

  // TOTALS row — just configure measures
  if (ctx.type === "totals") {
    return (
      <div>
        <MenuLabel text="Configure" />
        <MenuItem label="Group rows by..." icon="⊞"
          onClick={() => { setCfg({ ...cfg }); setCtx({ ...ctx, type: "canvas" }); }} />
        <MenuDivider />
        <MenuLabel text="Measures" />
        {ALL_MEASURES.map(m => (
          <MenuItem key={m} label={MEASURE_LABEL[m]} checked={cfg.measures.includes(m)}
            onClick={() => toggleMeasure(m)} />
        ))}
        <MenuDivider />
        <MenuItem label="Save current view" icon="⭐" onClick={() => { setSaveModal(true); close(); }} />
        <MenuItem label="Reset to default" icon="↺" danger onClick={() => update(DEFAULT_CFG)} />
      </div>
    );
  }

  return null;
}

// ─── Save Modal ────────────────────────────────────────────────────────────────
function SaveModal({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#1A0D00]/75 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-xs p-6 shadow-2xl">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#C8820A] mb-1">Save View</p>
        <h3 className="font-bold text-[#3B1F0A] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Name this configuration
        </h3>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) onSave(name.trim()); if (e.key === "Escape") onCancel(); }}
          placeholder="e.g. Coffee by Month"
          className="w-full border border-[#3B1F0A]/15 px-3 py-2.5 text-sm text-[#3B1F0A] outline-none focus:border-[#C8820A] mb-4" />
        <div className="flex gap-2">
          <button onClick={() => name.trim() && onSave(name.trim())}
            className="flex-1 bg-[#C8820A] text-white py-2.5 text-sm font-bold hover:bg-[#3B1F0A] transition-colors">
            Save
          </button>
          <button onClick={onCancel}
            className="flex-1 border border-[#3B1F0A]/15 text-[#3B1F0A]/55 py-2.5 text-sm font-semibold hover:text-[#3B1F0A] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function InteractiveReportPage() {
  const [orders,     setOrders]     = useState<StoredOrder[]>([]);
  const [mounted,    setMounted]    = useState(false);
  const [cfg,        setCfg]        = useState<Config>(DEFAULT_CFG);
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [ctx,        setCtx]        = useState<CTX | null>(null);
  const [saveModal,  setSaveModal]  = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [favOpen,    setFavOpen]    = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrders(getOrders());
    setSavedViews(loadViews());
    setMounted(true);
    const onStorage = (e: StorageEvent) => { if (e.key === "highlands_orders") setOrders(getOrders()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!ctx) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCtx(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setCtx(null); };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", esc); };
  }, [ctx]);

  // ── Derived (ALL hooks before any early return) ─────────────────────────────
  const { start, end } = useMemo(() => getDateRange(cfg.period), [cfg.period]);

  const allRecs = useMemo(() => {
    const periodOrders = orders.filter(o => { const d = new Date(o.createdAt); return d >= start && d <= end; });
    return flattenOrders(periodOrders);
  }, [orders, start, end]);

  const filteredRecs = useMemo(() => applyFilters(allRecs, cfg.filters), [allRecs, cfg.filters]);

  const pivot = useMemo(() => buildPivot(filteredRecs, cfg), [filteredRecs, cfg]);

  const totals = useMemo(() => aggregate(filteredRecs), [filteredRecs]);

  // All unique values per dimension (for filter menu)
  const allValues = useMemo(() => {
    const map = new Map<RowDim, string[]>();
    ALL_DIMS.forEach(dim => {
      const vals = [...new Set(allRecs.map(r => getRecDim(r, dim)))].sort();
      map.set(dim, vals);
    });
    return map;
  }, [allRecs]);

  if (!mounted) return null;

  // ── Context menu handler ────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = (e.target as HTMLElement).closest("[data-cx]") as HTMLElement | null;
    const type = (el?.dataset.cx ?? "canvas") as CTX["type"];
    const dim  = el?.dataset.dim as RowDim | undefined;
    const val  = el?.dataset.val;
    const meas = el?.dataset.meas as MeasureKey | undefined;

    // Clamp to viewport
    const x = Math.min(e.clientX + 6, window.innerWidth  - 230);
    const y = Math.min(e.clientY + 6, window.innerHeight - 340);
    setCtx({ x, y, type, dim, value: val, measure: meas });
  };

  // ── Favorites handlers ──────────────────────────────────────────────────────
  const handleSaveView = (name: string) => {
    const view: SavedView = { id: `view_${Date.now()}`, name, config: cfg, createdAt: new Date().toISOString() };
    const updated = [view, ...savedViews];
    setSavedViews(updated);
    saveViews(updated);
    setSaveModal(false);
  };

  const handleLoadView = (view: SavedView) => {
    setCfg(view.config);
    setExpanded(new Set());
    setFavOpen(false);
  };

  const handleDeleteView = (id: string) => {
    const updated = savedViews.filter(v => v.id !== id);
    setSavedViews(updated);
    saveViews(updated);
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearFilter = (dim: RowDim, value: string, mode: "include" | "exclude") => {
    setCfg(c => ({ ...c, filters: c.filters.filter(f => !(f.dim === dim && f.value === value && f.mode === mode)) }));
  };

  const hasSort = !!cfg.sort;
  const activeCols = cfg.measures.length;

  // Sort indicator for header
  const sortIcon = (m: MeasureKey) => {
    if (cfg.sort?.by !== m) return <span className="text-[#3B1F0A]/20 ml-1">↕</span>;
    return <span className="text-[#C8820A] ml-1">{cfg.sort.dir === "desc" ? "↓" : "↑"}</span>;
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      onContextMenu={handleContextMenu}>

      {/* ── Header ── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/admin/reports" className="text-white/50 hover:text-white transition-colors shrink-0">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-lg font-bold tracking-widest shrink-0" style={{ fontFamily: "var(--font-playfair), serif" }}>HIGHLANDS</p>
          <span className="text-white/20 shrink-0">|</span>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <Link href="/admin" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Orders</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/applications" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Applications</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/contacts" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Contacts</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/gift-cards" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Gift Cards</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Promotions</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/loyalty" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Loyalty</Link>
            <span className="text-white/20">/</span>
            <div className="relative group">
              <span className="flex items-center gap-1 text-white font-semibold cursor-default select-none whitespace-nowrap">
                Report
                <svg width="8" height="4" fill="currentColor" viewBox="0 0 8 4"><path d="M0 0l4 4 4-4H0z"/></svg>
              </span>
              <div className="absolute top-full left-0 pt-1.5 hidden group-hover:block z-[60]">
                <div className="bg-[#1A0D00] border border-white/10 shadow-2xl py-1 min-w-[160px]">
                  <Link href="/admin/reports" className="block px-4 py-2 text-xs text-white/55 hover:text-white hover:bg-white/5 transition-colors">Dashboard</Link>
                  <span className="block px-4 py-2 text-xs text-[#C8820A] font-semibold">✓ Interactive Explorer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Favorites button */}
          <button onClick={() => setFavOpen(p => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-3 py-1.5 border ${favOpen ? "bg-[#C8820A] text-white border-[#C8820A]" : "border-white/20 text-white/60 hover:text-white"}`}>
            <span>⭐</span> Saved views {savedViews.length > 0 && <span className="bg-white/20 px-1.5 rounded-full">{savedViews.length}</span>}
          </button>
          <button onClick={() => setOrders(getOrders())}
            className="text-white/60 hover:text-white transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Saved Views Panel ── */}
      {favOpen && (
        <div className="bg-[#1A0D00] border-b border-white/8 px-6 lg:px-8 py-4">
          <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-3">Saved Views</p>
          {savedViews.length === 0 ? (
            <p className="text-white/30 text-xs">No saved views yet. Right-click anywhere to configure and save a view.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {savedViews.map(v => (
                <div key={v.id} className="flex items-center gap-0 bg-white/6 border border-white/10 hover:border-white/20 transition-colors">
                  <button onClick={() => handleLoadView(v)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:text-white transition-colors">
                    <span className="text-[#C8820A]">⭐</span>
                    <span className="font-semibold">{v.name}</span>
                    <span className="text-white/30">·</span>
                    <span className="text-white/35">{DIM_LABEL[v.config.rowDim1]}</span>
                  </button>
                  <button onClick={() => handleDeleteView(v.id)}
                    className="px-2 py-1.5 text-white/25 hover:text-red-400 transition-colors text-xs border-l border-white/8">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5 space-y-4">

        {/* ── Toolbar ── */}
        <div className="bg-white border border-[#3B1F0A]/8 px-4 py-3 flex flex-wrap items-center gap-3">

          {/* Title + hint */}
          <div className="mr-2">
            <h1 className="text-sm font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Interactive Explorer
            </h1>
            <p className="text-[10px] text-[#3B1F0A]/35">Right-click anywhere to group, filter, and configure</p>
          </div>

          <div className="h-6 w-px bg-[#3B1F0A]/10 hidden sm:block" />

          {/* Period */}
          <div className="flex gap-1">
            {(["today", "7d", "30d", "90d"] as Period[]).map(p => (
              <button key={p} onClick={() => setCfg(c => ({ ...c, period: p }))}
                className={`px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all border ${cfg.period === p ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "text-[#3B1F0A]/50 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/30"}`}>
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-[#3B1F0A]/10 hidden sm:block" />

          {/* Current config chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#3B1F0A]/35 font-semibold uppercase tracking-wider">Grouped by</span>
            <span className="text-[10px] font-bold text-[#3B1F0A] bg-[#C8820A]/12 px-2 py-0.5 border border-[#C8820A]/20">
              {DIM_LABEL[cfg.rowDim1]}
            </span>
            {cfg.rowDim2 && (
              <>
                <span className="text-[#3B1F0A]/25 text-xs">→</span>
                <span className="text-[10px] font-bold text-[#3B1F0A] bg-[#C8820A]/8 px-2 py-0.5 border border-[#C8820A]/15">
                  {DIM_LABEL[cfg.rowDim2]}
                  <button onClick={() => setCfg(c => ({ ...c, rowDim2: null }))} className="ml-1.5 text-[#3B1F0A]/35 hover:text-[#3B1F0A]">✕</button>
                </span>
              </>
            )}
            {hasSort && (
              <span className="text-[10px] text-[#3B1F0A]/50 bg-[#3B1F0A]/5 px-2 py-0.5 border border-[#3B1F0A]/10">
                Sort: {MEASURE_LABEL[cfg.sort!.by]} {cfg.sort!.dir === "desc" ? "↓" : "↑"}
                <button onClick={() => setCfg(c => ({ ...c, sort: null }))} className="ml-1.5 text-[#3B1F0A]/30 hover:text-[#3B1F0A]">✕</button>
              </span>
            )}
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={() => setSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8820A] text-white text-xs font-bold hover:bg-[#3B1F0A] transition-colors">
              <span>⭐</span> Save view
            </button>
            <button onClick={() => { setCfg(DEFAULT_CFG); setExpanded(new Set()); }}
              className="px-3 py-1.5 border border-[#3B1F0A]/15 text-[#3B1F0A]/50 text-xs font-semibold hover:text-[#3B1F0A] transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* ── Active Filter Chips ── */}
        {cfg.filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider">Filters:</span>
            {cfg.filters.map((f, i) => (
              <span key={i}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border ${f.mode === "include" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                {f.mode === "include" ? "◎" : "⊘"} {DIM_LABEL[f.dim]}: {f.value}
                <button onClick={() => clearFilter(f.dim, f.value, f.mode)} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            ))}
            <button onClick={() => setCfg(c => ({ ...c, filters: [] }))}
              className="text-[10px] text-[#3B1F0A]/35 hover:text-[#3B1F0A] font-semibold underline underline-offset-2 transition-colors">
              Clear all
            </button>
          </div>
        )}

        {/* ── Main Pivot Table ── */}
        <div className="bg-white border border-[#3B1F0A]/8" data-cx="canvas">

          {/* Table hint bar */}
          <div className="px-5 py-2.5 border-b border-[#3B1F0A]/6 bg-[#FAF6EF]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase">
                {DIM_LABEL[cfg.rowDim1]}{cfg.rowDim2 ? ` → ${DIM_LABEL[cfg.rowDim2]}` : ""}
              </p>
              <span className="text-[#3B1F0A]/25 text-xs">·</span>
              <p className="text-xs text-[#3B1F0A]/40">
                {pivot.length} groups · {filteredRecs.length > 0 ? `${new Set(filteredRecs.map(r => r.orderId)).size} orders` : "no data"}
              </p>
            </div>
            <p className="text-[10px] text-[#3B1F0A]/25 hidden sm:block">
              Right-click on any row or column header to change grouping, filter, and measures
            </p>
          </div>

          {pivot.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-[#C8820A]/10 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>No data to display</p>
              <p className="text-xs text-[#3B1F0A]/40">Try a wider period or remove active filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: `${200 + activeCols * 130}px` }}>
                <thead>
                  <tr className="border-b border-[#3B1F0A]/8">
                    {/* Dimension column header */}
                    <th className="px-5 py-3 text-left w-56" data-cx="table-header">
                      <span className="text-[10px] font-bold text-[#3B1F0A]/45 tracking-wider uppercase cursor-default select-none">
                        {DIM_LABEL[cfg.rowDim1]}{cfg.rowDim2 ? ` / ${DIM_LABEL[cfg.rowDim2]}` : ""}
                      </span>
                    </th>
                    {/* Measure column headers */}
                    {cfg.measures.map(m => (
                      <th key={m} className="px-5 py-3 text-right" data-cx="measure-header" data-meas={m}>
                        <span className="text-[10px] font-bold text-[#3B1F0A]/45 tracking-wider uppercase cursor-pointer select-none hover:text-[#C8820A] transition-colors">
                          {MEASURE_LABEL[m]}{sortIcon(m)}
                        </span>
                      </th>
                    ))}
                    {/* % of total column */}
                    <th className="px-5 py-3 text-right" data-cx="table-header">
                      <span className="text-[10px] font-bold text-[#3B1F0A]/25 tracking-wider uppercase select-none">% of Total</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pivot.map((row, ri) => {
                    const isExp = expanded.has(row.key);
                    const hasChildren = cfg.rowDim2 && row.children.length > 0;
                    const totalRev = totals.revenue || 1;
                    const rowPct = totals.revenue > 0 ? Math.round((row.agg.revenue / totalRev) * 100) : 0;

                    return (
                      <>
                        {/* Group row */}
                        <tr key={row.key}
                          className={`border-b border-[#3B1F0A]/5 hover:bg-[#FAF6EF]/70 transition-colors cursor-default ${ri % 2 === 0 ? "" : "bg-[#FAF6EF]/25"}`}
                          data-cx="group" data-dim={cfg.rowDim1} data-val={row.label}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {hasChildren && (
                                <button
                                  onClick={e => { e.stopPropagation(); toggleExpand(row.key); }}
                                  className="w-4 h-4 flex items-center justify-center text-[#3B1F0A]/35 hover:text-[#C8820A] transition-colors shrink-0 text-[10px]">
                                  {isExp ? "▾" : "▸"}
                                </button>
                              )}
                              {!hasChildren && <span className="w-4 shrink-0" />}
                              <span className="text-sm font-semibold text-[#3B1F0A]">{row.label}</span>
                            </div>
                          </td>
                          {cfg.measures.map(m => (
                            <td key={m} className="px-5 py-3 text-right tabular-nums text-sm font-medium text-[#3B1F0A]"
                              data-cx="group" data-dim={cfg.rowDim1} data-val={row.label}>
                              {fmtM(getAggM(row.agg, m), m)}
                            </td>
                          ))}
                          <td className="px-5 py-3" data-cx="group" data-dim={cfg.rowDim1} data-val={row.label}>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-[#3B1F0A]/45 tabular-nums w-8 text-right">{rowPct}%</span>
                              <div className="w-16 h-1.5 bg-[#3B1F0A]/6 rounded-full overflow-hidden">
                                <div className="h-full bg-[#C8820A] rounded-full" style={{ width: `${rowPct}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Sub-group rows */}
                        {hasChildren && isExp && row.children.map(child => (
                          <tr key={child.key}
                            className="border-b border-[#3B1F0A]/4 bg-[#FAF6EF]/40 hover:bg-[#FAF6EF] transition-colors cursor-default"
                            data-cx="sub-group" data-dim={cfg.rowDim2} data-val={child.label}>
                            <td className="px-5 py-2">
                              <div className="flex items-center gap-2 pl-6">
                                <span className="w-1 h-1 rounded-full bg-[#C8820A]/40 shrink-0" />
                                <span className="text-xs font-medium text-[#3B1F0A]/75">{child.label}</span>
                              </div>
                            </td>
                            {cfg.measures.map(m => (
                              <td key={m} className="px-5 py-2 text-right tabular-nums text-xs text-[#3B1F0A]/65"
                                data-cx="sub-group" data-dim={cfg.rowDim2} data-val={child.label}>
                                {fmtM(getAggM(child.agg, m), m)}
                              </td>
                            ))}
                            <td className="px-5 py-2">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] text-[#3B1F0A]/30 tabular-nums w-8 text-right">
                                  {totals.revenue > 0 ? Math.round((child.agg.revenue / totalRev) * 100) : 0}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}

                  {/* Totals row */}
                  <tr className="border-t-2 border-[#3B1F0A]/12 bg-[#3B1F0A]/3 cursor-default"
                    data-cx="totals">
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-[#3B1F0A] tracking-wider uppercase">Grand Total</span>
                    </td>
                    {cfg.measures.map(m => (
                      <td key={m} className="px-5 py-3 text-right tabular-nums text-sm font-bold text-[#3B1F0A]"
                        data-cx="totals">
                        {fmtM(getAggM(totals, m), m)}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right" data-cx="totals">
                      <span className="text-xs font-bold text-[#3B1F0A]/60">100%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick stats below table ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: "Groups", value: pivot.length.toString(), sub: `by ${DIM_LABEL[cfg.rowDim1]}` },
            { label: "Active Filters", value: cfg.filters.length.toString(), sub: cfg.filters.length === 0 ? "none applied" : "click chips to remove" },
            { label: "Measures shown", value: `${cfg.measures.length} / ${ALL_MEASURES.length}`, sub: cfg.measures.map(m => MEASURE_LABEL[m]).join(", ") },
            { label: "Saved views", value: savedViews.length.toString(), sub: "click ⭐ to save current" },
          ] as const).map(s => (
            <div key={s.label} className="bg-white border border-[#3B1F0A]/8 px-4 py-3">
              <p className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider font-semibold">{s.label}</p>
              <p className="text-xl font-bold text-[#3B1F0A] mt-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
              <p className="text-[10px] text-[#3B1F0A]/30 mt-0.5 leading-tight">{s.sub}</p>
            </div>
          ))}
        </div>

      </div>

      {/* ── Context Menu ── */}
      {ctx && (
        <div ref={menuRef}
          style={{ position: "fixed", top: ctx.y, left: ctx.x, zIndex: 1000 }}
          className="bg-[#1A0D00] border border-white/10 shadow-2xl w-52 py-2 overflow-hidden"
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}>
          <CTXPanel ctx={ctx} cfg={cfg} setCfg={setCfg} setCtx={setCtx}
            setSaveModal={setSaveModal} allValues={allValues} />
        </div>
      )}

      {/* ── Save Modal ── */}
      {saveModal && (
        <SaveModal
          onSave={handleSaveView}
          onCancel={() => setSaveModal(false)}
        />
      )}
    </div>
  );
}
