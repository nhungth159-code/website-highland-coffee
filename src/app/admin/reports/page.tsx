"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getOrders } from "@/lib/orders";
import type { StoredOrder, OrderStatus } from "@/lib/orders";

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "today" | "7d" | "30d" | "90d";
type GroupBy = "day" | "week" | "month";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

function fmtShort(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M₫";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K₫";
  return n + "₫";
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function orderLocalDate(iso: string): string {
  return localDateStr(new Date(iso));
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d.getTime() + diffToMon * 86_400_000);
  return localDateStr(mon);
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;
  switch (period) {
    case "today": start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case "7d":    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); break;
    case "30d":   start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29); break;
    case "90d":   start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89); break;
  }
  return { start, end };
}

const PRODUCT_CATEGORIES: Record<string, string> = {
  "Vietnamese Iced Coffee": "Coffee", "Milk Coffee": "Coffee",
  "Highlands Espresso": "Coffee",    "Cold Brew": "Coffee",
  "Peach & Lemongrass Iced Tea": "Tea", "Green Milk Tea": "Tea",
  "Black Milk Tea": "Tea",           "Fresh Kumquat Tea": "Tea",
  "Butter Baguette": "Food",         "Almond Croissant": "Food",
  "Matcha Cheesecake": "Food",       "Coffee Tiramisu": "Food",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending", preparing: "Preparing", delivering: "Delivering",
  delivered: "Delivered", cancelled: "Cancelled",
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#C8820A", preparing: "#3B82F6", delivering: "#8B5CF6",
  delivered: "#10B981", cancelled: "#EF4444",
};

const PERIOD_LABEL: Record<Period, string> = {
  today: "Today", "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days",
};

// ── Revenue Line / Area Chart ─────────────────────────────────────────────────
function RevenueChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  if (data.length === 0) {
    return <div className="h-44 flex items-center justify-center text-[#3B1F0A]/25 text-sm">No data in period</div>;
  }

  const W = 620, H = 190;
  const PAD = { top: 16, right: 16, bottom: 38, left: 64 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);

  const pts = data.map((d, i) => ({
    x: PAD.left + (data.length > 1 ? (i / (data.length - 1)) : 0.5) * iW,
    y: PAD.top + iH - (d.revenue / maxRev) * iH,
    d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    pts.length > 1
      ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + iH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + iH).toFixed(1)} Z`
      : "";

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD.top + iH - t * iH,
    label: fmtShort(Math.round(t * maxRev)),
  }));

  const maxLabels = 9;
  const step = Math.ceil(data.length / maxLabels);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8820A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#C8820A" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y-grid + labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={t.y} x2={PAD.left + iW} y2={t.y}
            stroke="#3B1F0A" strokeOpacity="0.06" strokeWidth="1" />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end"
            fontSize="9.5" fill="#3B1F0A" fillOpacity="0.38">{t.label}</text>
        </g>
      ))}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#revGrad)" />}

      {/* Line */}
      {pts.length > 1 && (
        <path d={linePath} fill="none" stroke="#C8820A" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Dots + X labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={pts.length > 30 ? 1.5 : 3.5}
            fill="#C8820A" stroke="white" strokeWidth="1.5" />
          {i % step === 0 && (
            <text x={p.x} y={H - 6} textAnchor="middle"
              fontSize="9" fill="#3B1F0A" fillOpacity="0.42">{p.d.label}</text>
          )}
          {/* Invisible hover target with tooltip */}
          <circle cx={p.x} cy={p.y} r="8" fill="transparent">
            <title>{p.d.label}: {fmt(p.d.revenue)} · {p.d.orders} orders</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ── Donut / Ring Chart ────────────────────────────────────────────────────────
function DonutChart({ segments, size = 88 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const R = 35;
  const C = 2 * Math.PI * R;

  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="#EDE8E0" strokeWidth="14" />
      </svg>
    );
  }

  const GAP = C * 0.012;
  let cumulativePct = 0;

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="#F0EAE0" strokeWidth="14" />
      {segments.filter((s) => s.value > 0).map((seg, i) => {
        const pct = seg.value / total;
        const len = Math.max(0, pct * C - GAP);
        const rotation = cumulativePct * 360 - 90;
        cumulativePct += pct;
        return (
          <circle key={i} cx="50" cy="50" r={R}
            fill="none" stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`}
            strokeDashoffset="0"
            transform={`rotate(${rotation.toFixed(2)} 50 50)`}>
            <title>{seg.label}: {seg.value}</title>
          </circle>
        );
      })}
    </svg>
  );
}

// ── Horizontal Bar ────────────────────────────────────────────────────────────
function HBar({ pct, color = "#C8820A" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-[#3B1F0A]/7 w-full rounded-sm overflow-hidden">
      <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [orders, setOrders]   = useState<StoredOrder[]>([]);
  const [mounted, setMounted] = useState(false);
  const [period,  setPeriod]  = useState<Period>("30d");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    setOrders(getOrders());
    setMounted(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "highlands_orders") setOrders(getOrders());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Derived (ALL hooks before any early return) ────────────────────────────
  const { start, end } = useMemo(() => getDateRange(period), [period]);

  const periodOrders = useMemo(
    () => orders.filter((o) => { const d = new Date(o.createdAt); return d >= start && d <= end; }),
    [orders, start, end],
  );

  const activeOrders    = useMemo(() => periodOrders.filter((o) => o.status !== "cancelled"), [periodOrders]);
  const deliveredOrders = useMemo(() => periodOrders.filter((o) => o.status === "delivered"),  [periodOrders]);

  const kpis = useMemo(() => {
    const revenue      = activeOrders.reduce((s, o) => s + o.total, 0);
    const delivered    = deliveredOrders.reduce((s, o) => s + o.total, 0);
    const discount     = activeOrders.reduce((s, o) => s + (o.discount ?? 0), 0);
    const count        = activeOrders.length;
    const avg          = count > 0 ? Math.round(revenue / count) : 0;
    const memberCount  = activeOrders.filter((o) => o.loyaltyCustomerId).length;
    const memberPct    = count > 0 ? Math.round((memberCount / count) * 100) : 0;
    const cancelCount  = periodOrders.filter((o) => o.status === "cancelled").length;
    return { revenue, delivered, discount, count, avg, memberCount, memberPct, cancelCount };
  }, [activeOrders, deliveredOrders, periodOrders]);

  // Revenue timeline
  const timeline = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();

    activeOrders.forEach((o) => {
      const key =
        groupBy === "day"   ? orderLocalDate(o.createdAt) :
        groupBy === "week"  ? weekKey(o.createdAt) :
                              monthKey(o.createdAt);
      const e = map.get(key) ?? { revenue: 0, orders: 0 };
      map.set(key, { revenue: e.revenue + o.total, orders: e.orders + 1 });
    });

    const result: { label: string; revenue: number; orders: number }[] = [];

    if (groupBy === "day") {
      const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
        const key = localDateStr(d);
        const val = map.get(key) ?? { revenue: 0, orders: 0 };
        result.push({ label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, ...val });
      }
    } else {
      Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, val]) => {
          let label = key;
          if (groupBy === "week") {
            const d = new Date(key + "T00:00:00");
            label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
          } else {
            const [y, m] = key.split("-");
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            label = `${months[parseInt(m) - 1]} ${y}`;
          }
          result.push({ label, ...val });
        });
    }

    return result;
  }, [activeOrders, groupBy, period, end]);

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number; cat: string }>();
    activeOrders.forEach((o) =>
      o.items.forEach((item) => {
        const e = map.get(item.name) ?? { qty: 0, revenue: 0, cat: PRODUCT_CATEGORIES[item.name] ?? "Other" };
        map.set(item.name, { qty: e.qty + item.quantity, revenue: e.revenue + item.price * item.quantity, cat: e.cat });
      })
    );
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .filter((p) => catFilter === "all" || p.cat === catFilter)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [activeOrders, catFilter]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const map = new Map<OrderStatus, number>();
    periodOrders.forEach((o) => map.set(o.status, (map.get(o.status) ?? 0) + 1));
    return (["delivered", "delivering", "preparing", "pending", "cancelled"] as OrderStatus[])
      .map((s) => ({ status: s, count: map.get(s) ?? 0 }))
      .filter((s) => s.count > 0);
  }, [periodOrders]);

  // Customer segments
  const customerSeg = useMemo(() => {
    const members = activeOrders.filter((o) => o.loyaltyCustomerId);
    const anon    = activeOrders.filter((o) => !o.loyaltyCustomerId);
    return {
      member: { count: members.length, revenue: members.reduce((s, o) => s + o.total, 0) },
      anon:   { count: anon.length,    revenue: anon.reduce((s, o) => s + o.total, 0) },
    };
  }, [activeOrders]);

  // Payment methods
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    activeOrders.forEach((o) => {
      const m = o.paymentMethod ?? "Cash on Delivery";
      const e = map.get(m) ?? { count: 0, revenue: 0 };
      map.set(m, { count: e.count + 1, revenue: e.revenue + o.total });
    });
    return Array.from(map.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [activeOrders]);

  // Category performance
  const catPerformance = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    activeOrders.forEach((o) =>
      o.items.forEach((item) => {
        const cat = PRODUCT_CATEGORIES[item.name] ?? "Other";
        const e = map.get(cat) ?? { qty: 0, revenue: 0 };
        map.set(cat, { qty: e.qty + item.quantity, revenue: e.revenue + item.price * item.quantity });
      })
    );
    return Array.from(map.entries())
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [activeOrders]);

  if (!mounted) return null;

  const maxProductRev = topProducts[0]?.revenue ?? 1;
  const totalCatRev   = catPerformance.reduce((s, c) => s + c.revenue, 1);
  const CAT_COLORS    = ["#C8820A", "#3B82F6", "#10B981", "#8B5CF6"];

  return (
    <div className="min-h-screen bg-[#F5F0E8]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/admin" className="text-white/50 hover:text-white transition-colors shrink-0" title="Back">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-lg font-bold tracking-widest shrink-0" style={{ fontFamily: "var(--font-playfair), serif" }}>HIGHLANDS</p>
          <span className="text-white/20 text-lg shrink-0">|</span>
          <div className="flex items-center gap-3 text-sm overflow-x-auto">
            <Link href="/admin" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Orders</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Promotions</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/loyalty" className="text-white/50 hover:text-white transition-colors whitespace-nowrap">Loyalty</Link>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold whitespace-nowrap">Sales Report</span>
          </div>
        </div>
        <button onClick={() => setOrders(getOrders())}
          className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors shrink-0 ml-4">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5">

        {/* ── Interactive Explorer Banner ── */}
        <Link href="/admin/reports/interactive"
          className="flex items-center justify-between bg-[#1A0D00] px-5 py-4 hover:bg-[#3B1F0A] transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-[#C8820A]/15 flex items-center justify-center shrink-0">
              <svg width="18" height="18" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" />
                <circle cx="17" cy="18" r="3" /><path d="M17 15v1.5M17 21v-1.5M14 18h1.5M20 18h-1.5M15.05 15.05l1.06 1.06M19.9 19.9l-1.06-1.06M19.9 15.05l-1.06 1.06M15.05 19.9l1.06-1.06" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">New</p>
              <p className="text-white text-sm font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>Interactive Explorer</p>
              <p className="text-white/40 text-xs">Right-click to group, filter, and pivot data on the fly. Save favourite views.</p>
            </div>
          </div>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"
            className="text-white/30 group-hover:text-[#C8820A] transition-colors shrink-0">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* ── Title + Period Filter ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Sales Report
            </h1>
            <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
              {PERIOD_LABEL[period]} · {activeOrders.length} orders · {fmt(kpis.revenue)} revenue
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["today", "7d", "30d", "90d"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all border ${period === p ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "bg-white text-[#3B1F0A]/55 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/30"}`}>
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Revenue",
              value: fmtShort(kpis.revenue),
              detail: `Collected: ${fmtShort(kpis.delivered)}`,
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0",
              color: "#C8820A",
            },
            {
              label: "Total Orders",
              value: kpis.count.toString(),
              detail: `${kpis.cancelCount} cancelled`,
              icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
              color: "#3B82F6",
            },
            {
              label: "Avg Order Value",
              value: fmtShort(kpis.avg),
              detail: `Discounts: ${fmtShort(kpis.discount)}`,
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              color: "#10B981",
            },
            {
              label: "Member Orders",
              value: `${kpis.memberPct}%`,
              detail: `${kpis.memberCount} of ${kpis.count} orders`,
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
              color: "#8B5CF6",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-[#3B1F0A]/8 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-[#3B1F0A]/45 font-medium leading-tight">{card.label}</p>
                <svg width="15" height="15" fill="none" stroke={card.color} strokeWidth="1.5" viewBox="0 0 24 24" className="shrink-0">
                  <path d={card.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {card.value}
              </p>
              <p className="text-[10px] text-[#3B1F0A]/35 mt-0.5">{card.detail}</p>
            </div>
          ))}
        </div>

        {/* ── Revenue Trend ── */}
        <div className="bg-white border border-[#3B1F0A]/8 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Revenue Trend</p>
              <p className="text-sm font-semibold text-[#3B1F0A]">{PERIOD_LABEL[period]}</p>
            </div>
            <div className="flex gap-1">
              {(["day", "week", "month"] as GroupBy[]).map((g) => (
                <button key={g} onClick={() => setGroupBy(g)}
                  className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-all border ${groupBy === g ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "bg-white text-[#3B1F0A]/38 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/25"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={timeline} />
          {/* Summary row below chart */}
          {timeline.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#3B1F0A]/6">
              {[
                { label: "Peak Day Revenue", value: fmtShort(Math.max(...timeline.map((d) => d.revenue))) },
                { label: "Peak Day Orders",  value: Math.max(...timeline.map((d) => d.orders)).toString() },
                { label: "Days w/ Revenue",  value: timeline.filter((d) => d.revenue > 0).length.toString() },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[10px] text-[#3B1F0A]/40 uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-bold text-[#3B1F0A] mt-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Products + Status ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Product Performance */}
          <div className="lg:col-span-2 bg-white border border-[#3B1F0A]/8 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Product Performance</p>
                <p className="text-sm font-semibold text-[#3B1F0A]">Top items by revenue</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {["all", "Coffee", "Tea", "Food"].map((cat) => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] font-bold tracking-wide capitalize transition-all border ${catFilter === cat ? "bg-[#3B1F0A] text-white border-[#3B1F0A]" : "bg-white text-[#3B1F0A]/38 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/25"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {topProducts.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-[#3B1F0A]/25 text-sm">No product data</div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-[#3B1F0A]/22 text-xs font-bold w-4 shrink-0 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-[#3B1F0A] truncate">{p.name}</span>
                          <span className="text-[9px] text-[#3B1F0A]/35 bg-[#3B1F0A]/6 px-1.5 py-0.5 shrink-0 rounded-sm">{p.cat}</span>
                        </div>
                        <span className="text-xs font-bold text-[#3B1F0A] shrink-0">{fmt(p.revenue)}</span>
                      </div>
                      <HBar pct={(p.revenue / maxProductRev) * 100} />
                      <p className="text-[10px] text-[#3B1F0A]/30 mt-0.5">{p.qty} units · avg {fmt(Math.round(p.revenue / Math.max(p.qty, 1)))}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white border border-[#3B1F0A]/8 p-5">
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Order Status</p>
            <p className="text-sm font-semibold text-[#3B1F0A] mb-4">Distribution</p>

            {statusBreakdown.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-[#3B1F0A]/25 text-sm">No orders</div>
            ) : (
              <>
                <div className="flex justify-center mb-5">
                  <DonutChart
                    segments={statusBreakdown.map((s) => ({ label: STATUS_LABEL[s.status], value: s.count, color: STATUS_COLOR[s.status] }))}
                    size={100}
                  />
                </div>
                <div className="space-y-2">
                  {statusBreakdown.map((s) => {
                    const pct = periodOrders.length > 0 ? Math.round((s.count / periodOrders.length) * 100) : 0;
                    return (
                      <div key={s.status}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[s.status] }} />
                            <span className="text-xs text-[#3B1F0A]/60">{STATUS_LABEL[s.status]}</span>
                          </div>
                          <span className="text-xs font-bold text-[#3B1F0A]">{s.count} <span className="font-normal text-[#3B1F0A]/35">({pct}%)</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Customer / Payment / Category ── */}
        <div className="grid sm:grid-cols-3 gap-4">

          {/* Customer Segments */}
          <div className="bg-white border border-[#3B1F0A]/8 p-5">
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Customer Segments</p>
            <p className="text-sm font-semibold text-[#3B1F0A] mb-4">Member vs Anonymous</p>
            <div className="flex justify-center mb-4">
              <DonutChart
                segments={[
                  { label: "Members",   value: customerSeg.member.count, color: "#C8820A" },
                  { label: "Anonymous", value: customerSeg.anon.count,   color: "#D0C4B0" },
                ]}
                size={92}
              />
            </div>
            <div className="space-y-3">
              {[
                { label: "Members",   count: customerSeg.member.count, rev: customerSeg.member.revenue, color: "#C8820A" },
                { label: "Anonymous", count: customerSeg.anon.count,   rev: customerSeg.anon.revenue,   color: "#D0C4B0" },
              ].map((seg) => (
                <div key={seg.label}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                      <span className="text-xs text-[#3B1F0A]/60">{seg.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[#3B1F0A]">{seg.count} orders</span>
                  </div>
                  <p className="text-[10px] text-[#3B1F0A]/32 mt-0.5 pl-3.5">{fmt(seg.rev)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-[#3B1F0A]/8 p-5">
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Payment Methods</p>
            <p className="text-sm font-semibold text-[#3B1F0A] mb-4">Revenue by channel</p>
            {paymentBreakdown.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-[#3B1F0A]/25 text-xs">No data</div>
            ) : (
              <div className="space-y-4">
                {paymentBreakdown.map((p, i) => {
                  const pct = activeOrders.length > 0 ? Math.round((p.count / activeOrders.length) * 100) : 0;
                  return (
                    <div key={p.method}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#3B1F0A]/60 truncate">{p.method}</span>
                        <span className="text-xs font-bold text-[#3B1F0A] ml-2">{pct}%</span>
                      </div>
                      <HBar pct={pct} color={CAT_COLORS[i % CAT_COLORS.length]} />
                      <p className="text-[10px] text-[#3B1F0A]/32 mt-0.5">{p.count} orders · {fmtShort(p.revenue)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Mix */}
          <div className="bg-white border border-[#3B1F0A]/8 p-5">
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Category Mix</p>
            <p className="text-sm font-semibold text-[#3B1F0A] mb-4">Revenue by category</p>
            {catPerformance.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-[#3B1F0A]/25 text-xs">No data</div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <DonutChart
                    segments={catPerformance.map((c, i) => ({ label: c.cat, value: c.revenue, color: CAT_COLORS[i % CAT_COLORS.length] }))}
                    size={92}
                  />
                </div>
                <div className="space-y-2.5">
                  {catPerformance.map((c, i) => {
                    const pct = Math.round((c.revenue / totalCatRev) * 100);
                    return (
                      <div key={c.cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <span className="text-xs text-[#3B1F0A]/60">{c.cat}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#3B1F0A]">{pct}%</span>
                          <p className="text-[10px] text-[#3B1F0A]/32">{c.qty} units</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Transaction Log ── */}
        <div className="bg-white border border-[#3B1F0A]/8">
          <div className="px-5 py-4 border-b border-[#3B1F0A]/6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.3em] uppercase mb-0.5">Transaction Log</p>
              <p className="text-sm font-semibold text-[#3B1F0A]">
                {periodOrders.length} orders · {PERIOD_LABEL[period]}
              </p>
            </div>
            <Link href="/admin"
              className="flex items-center gap-1 text-xs font-semibold text-[#3B1F0A]/40 hover:text-[#C8820A] transition-colors">
              Manage orders
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {periodOrders.length === 0 ? (
            <div className="py-16 text-center text-[#3B1F0A]/25 text-sm">No orders in this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="bg-[#FAF6EF]">
                    {["Order ID", "Date & Time", "Customer", "Items", "Subtotal", "Discount", "Total", "Payment", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#3B1F0A]/45 tracking-wider uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3B1F0A]/5">
                  {periodOrders.slice(0, 60).map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF6EF]/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#3B1F0A] whitespace-nowrap">{o.id}</td>
                      <td className="px-4 py-2.5 text-xs text-[#3B1F0A]/50 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString("vi-VN")}{" "}
                        <span className="text-[#3B1F0A]/30">{new Date(o.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-2.5 min-w-[120px]">
                        <p className="text-xs font-medium text-[#3B1F0A] leading-tight">{o.customer.name}</p>
                        {o.loyaltyCustomerId && (
                          <span className="text-[9px] font-bold text-[#C8820A]">★ Member</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#3B1F0A]/50">
                        {o.items.reduce((s, i) => s + i.quantity, 0)} items
                        <p className="text-[10px] text-[#3B1F0A]/30 leading-tight truncate max-w-[100px]">
                          {o.items.map((i) => i.name.split(" ")[0]).join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#3B1F0A]/55 whitespace-nowrap">{fmt(o.subtotal)}</td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                        {o.discount ? <span className="text-red-500">−{fmt(o.discount)}</span> : <span className="text-[#3B1F0A]/25">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold text-[#3B1F0A] whitespace-nowrap">{fmt(o.total)}</td>
                      <td className="px-4 py-2.5 text-xs text-[#3B1F0A]/50 whitespace-nowrap max-w-[100px] truncate">
                        {o.paymentMethod ?? "Cash"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
                          style={{ color: STATUS_COLOR[o.status], background: STATUS_COLOR[o.status] + "18" }}>
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {periodOrders.length > 60 && (
                <div className="px-5 py-3 text-xs text-[#3B1F0A]/35 border-t border-[#3B1F0A]/5 text-center">
                  Showing 60 of {periodOrders.length} orders
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
