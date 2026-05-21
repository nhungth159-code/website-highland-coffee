"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOrders, updateOrderStatus } from "@/lib/orders";
import type { StoredOrder, OrderStatus } from "@/lib/orders";

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; next: OrderStatus | null; nextLabel: string | null }
> = {
  pending:    { label: "Pending",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   next: "preparing",  nextLabel: "Start Preparing" },
  preparing:  { label: "Preparing",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     next: "delivering", nextLabel: "Out for Delivery" },
  delivering: { label: "Delivering", color: "text-orange-700",  bg: "bg-orange-50 border-orange-200", next: "delivered",  nextLabel: "Mark Delivered" },
  delivered:  { label: "Delivered",  color: "text-green-700",   bg: "bg-green-50 border-green-200",   next: null,         nextLabel: null },
  cancelled:  { label: "Cancelled",  color: "text-slate-500",   bg: "bg-slate-50 border-slate-200",   next: null,         nextLabel: null },
};

const ALL_STATUSES = ["all", "pending", "preparing", "delivering", "delivered", "cancelled"] as const;
type FilterTab = (typeof ALL_STATUSES)[number];

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── Main component ────────────────────────────────────────────
export default function AdminPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
    setMounted(true);

    const onStorage = () => setOrders(getOrders());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleStatusChange = (id: string, status: OrderStatus) => {
    const updated = updateOrderStatus(id, status);
    setOrders(updated);
  };

  const advance = (order: StoredOrder) => {
    const next = STATUS_CONFIG[order.status].next;
    if (next) handleStatusChange(order.id, next);
  };

  const cancel = (order: StoredOrder) => {
    handleStatusChange(order.id, "cancelled");
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      delivering: orders.filter((o) => o.status === "delivering").length,
      todayRevenue: todayOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((s, o) => s + o.total, 0),
      todayCount: todayOrders.length,
    };
  }, [orders]);

  // Filtered + searched list
  const visible = useMemo(() => {
    let list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen bg-[#F5F0E8]"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-white/50 hover:text-white transition-colors"
            title="Back to site"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            <p
              className="text-lg font-bold tracking-widest"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              HIGHLANDS
            </p>
            <span className="text-white/20 text-lg">|</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-white font-semibold">Orders</span>
              <span className="text-white/20">/</span>
              <Link href="/admin/applications" className="text-white/50 hover:text-white transition-colors">
                Applications
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/contacts" className="text-white/50 hover:text-white transition-colors">
                Contacts
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/gift-cards" className="text-white/50 hover:text-white transition-colors">
                Gift Cards
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors">
                Promotions
              </Link>
              <span className="text-white/20">/</span>
              <Link href="/admin/loyalty" className="text-white/50 hover:text-white transition-colors">
                Loyalty
              </Link>
            </div>
          </div>
        </div>
        <button
          onClick={() => setOrders(getOrders())}
          className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ── Page title ─────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Orders
          </h1>
          <p className="text-sm text-[#3B1F0A]/45 mt-0.5">
            Monitor and fulfil customer orders from placement through to delivery.
          </p>
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today's Orders", value: stats.todayCount, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", sub: "orders placed today" },
            { label: "Pending",        value: stats.pending,    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0",                                                                                                   sub: "waiting to prepare" },
            { label: "Active",         value: stats.preparing + stats.delivering, icon: "M13 10V3L4 14h7v7l9-11h-7",                                                                                                   sub: "preparing + delivering" },
            { label: "Today's Revenue",value: fmt(stats.todayRevenue), icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0", sub: "excl. cancelled" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#3B1F0A]/8 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-[#3B1F0A]/45 font-medium">{s.label}</p>
                <svg width="16" height="16" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p
                className="text-2xl font-bold text-[#3B1F0A]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {s.value}
              </p>
              <p className="text-xs text-[#3B1F0A]/35 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filter ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, name, or phone..."
              className="w-full bg-white border border-[#3B1F0A]/10 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {ALL_STATUSES.map((s) => {
              const count =
                s === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-2 text-xs font-semibold tracking-wide capitalize transition-all border ${
                    filter === s
                      ? "bg-[#3B1F0A] text-white border-[#3B1F0A]"
                      : "bg-white text-[#3B1F0A]/55 border-[#3B1F0A]/10 hover:border-[#3B1F0A]/30"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_CONFIG[s as OrderStatus].label}{" "}
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Order list ────────────────────────────────── */}
        {visible.length === 0 ? (
          <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#3B1F0A]/5 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p
              className="font-bold text-[#3B1F0A] mb-1"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {search ? "No orders match your search" : "No orders yet"}
            </p>
            <p className="text-sm text-[#3B1F0A]/40">
              {search ? "Try a different search term." : "Orders placed on the site will appear here."}
            </p>
            {!search && (
              <Link
                href="/"
                className="inline-block mt-4 text-sm text-[#C8820A] font-semibold hover:underline"
              >
                Go to the site →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const isExpanded = expanded === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#3B1F0A]/8 overflow-hidden"
                >
                  {/* Order row */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAF6EF]/60 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    {/* Order # + time */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="font-bold text-[#3B1F0A] tracking-wide"
                          style={{ fontFamily: "var(--font-playfair), serif" }}
                        >
                          {order.id}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 border ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#3B1F0A]/45">
                        <span>{order.customer.name}</span>
                        <span>·</span>
                        <span>{order.customer.phone}</span>
                        <span>·</span>
                        <span>{timeAgo(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Item count + total */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-bold text-[#3B1F0A]">{fmt(order.total)}</p>
                      <p className="text-xs text-[#3B1F0A]/40 mt-0.5">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} items
                      </p>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      className={`shrink-0 text-[#3B1F0A]/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-[#3B1F0A]/8 px-5 py-5 bg-[#FAF6EF]/40 space-y-5">

                      {/* Items */}
                      <div>
                        <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">
                          Items Ordered
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <div className="relative w-10 h-10 shrink-0 overflow-hidden">
                                <Image
                                  src={item.img}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#3B1F0A] truncate">{item.name}</p>
                                <p className="text-xs text-[#3B1F0A]/40">×{item.quantity}</p>
                              </div>
                              <p className="text-sm font-semibold text-[#3B1F0A] shrink-0">
                                {fmt(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-[#3B1F0A]/8 mt-3 pt-3 flex justify-between text-sm">
                          <span className="text-[#3B1F0A]/50">Subtotal</span>
                          <span className="text-[#3B1F0A]">{fmt(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#3B1F0A]/50">Delivery</span>
                          <span className={order.deliveryFee === 0 ? "text-green-600 font-medium" : "text-[#3B1F0A]"}>
                            {order.deliveryFee === 0 ? "Free" : fmt(order.deliveryFee)}
                          </span>
                        </div>
                        <div
                          className="flex justify-between text-sm font-bold text-[#3B1F0A] mt-2 pt-2 border-t border-[#3B1F0A]/8"
                          style={{ fontFamily: "var(--font-playfair), serif" }}
                        >
                          <span>Total ({order.paymentMethod ?? "COD"})</span>
                          <span>{fmt(order.total)}</span>
                        </div>
                      </div>

                      {/* Delivery info */}
                      <div>
                        <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">
                          Delivery Details
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {[
                            { label: "Name",    value: order.customer.name },
                            { label: "Phone",   value: order.customer.phone },
                            { label: "Address", value: order.customer.address },
                            ...(order.customer.notes
                              ? [{ label: "Notes", value: order.customer.notes }]
                              : []),
                          ].map((f) => (
                            <div key={f.label}>
                              <span className="text-[#3B1F0A]/40 text-xs">{f.label}</span>
                              <p className="text-[#3B1F0A] font-medium">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            onClick={() => advance(order)}
                            className="flex-1 bg-[#C8820A] text-white py-2.5 text-sm font-bold tracking-wide hover:bg-[#3B1F0A] transition-colors"
                          >
                            {cfg.nextLabel}
                          </button>
                          <button
                            onClick={() => cancel(order)}
                            className="sm:w-32 border border-red-200 text-red-500 py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {(order.status === "delivered" || order.status === "cancelled") && (
                        <div className={`text-center py-2.5 text-sm font-semibold ${cfg.color} ${cfg.bg} border`}>
                          {order.status === "delivered" ? "✓ Order completed" : "✕ Order cancelled"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
