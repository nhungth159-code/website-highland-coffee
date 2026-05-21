"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOrders } from "@/lib/orders";
import type { StoredOrder } from "@/lib/orders";

// ── Progress step config ─────────────────────────────────────
const STEPS = [
  {
    status: "pending",
    label: "Confirmed",
    desc: "We've received your order",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    status: "preparing",
    label: "Preparing",
    desc: "Crafting your order",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    status: "delivering",
    label: "On the Way",
    desc: "Heading to your door",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    status: "delivered",
    label: "Delivered",
    desc: "Enjoy your order!",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const STATUS_ORDER = ["pending", "preparing", "delivering", "delivered"];

const STATUS_INFO: Record<string, { headline: string; body: string; eta?: string }> = {
  pending:    { headline: "Order Received",      body: "We've got your order! Our team will start preparing it shortly.",   eta: "Est. 35–45 min" },
  preparing:  { headline: "Being Prepared",      body: "Our baristas are crafting your drinks with care right now.",        eta: "Est. 20–30 min" },
  delivering: { headline: "On Its Way!",         body: "Your order is heading to you. Please have your cash ready.",        eta: "Est. 10–15 min" },
  delivered:  { headline: "Delivered! ☕",       body: "Your order has arrived. Thank you for choosing Highlands Coffee!" },
  cancelled:  { headline: "Order Cancelled",     body: "This order was cancelled. Contact us if you need help." },
};

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ── Page ─────────────────────────────────────────────────────
export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<StoredOrder | null | "not-found">(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(() => {
    const found = getOrders().find((o) => o.id === id.toUpperCase());
    setOrder(found ?? "not-found");
    setLastChecked(new Date());
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Loading ──────────────────────────────────────────────
  if (order === null) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <svg className="animate-spin text-[#C8820A]" width="32" height="32" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────
  if (order === "not-found") {
    return (
      <div
        className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center px-6 text-center"
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        <div className="w-16 h-16 rounded-full bg-[#3B1F0A]/5 flex items-center justify-center mb-5">
          <svg width="28" height="28" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
        <h2
          className="text-2xl font-bold text-[#3B1F0A] mb-2"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Order Not Found
        </h2>
        <p className="text-[#3B1F0A]/50 text-sm mb-6 max-w-xs">
          We couldn&apos;t find order <strong className="text-[#3B1F0A]">{id.toUpperCase()}</strong>.
          Please check the number and try again.
        </p>
        <Link
          href="/track"
          className="bg-[#C8820A] text-white px-8 py-3 font-bold text-sm hover:bg-[#3B1F0A] transition-colors"
        >
          Try Again
        </Link>
      </div>
    );
  }

  // ── Tracking view ────────────────────────────────────────
  const info = STATUS_INFO[order.status] ?? STATUS_INFO.pending;
  const stepIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const progressPct = stepIndex <= 0 ? 0 : (stepIndex / (STEPS.length - 1)) * 100;

  return (
    <div
      className="min-h-screen bg-[#F5F0E8]"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-[#3B1F0A] px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl tracking-widest text-white"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          HIGHLANDS
        </Link>
        <Link href="/track" className="text-white/50 hover:text-white text-sm transition-colors">
          Track another →
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Order ID + auto-refresh note */}
        <div className="text-center pb-2">
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.3em] uppercase mb-1">
            Order Tracking
          </p>
          <p
            className="text-3xl font-bold text-[#3B1F0A] tracking-widest"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {order.id}
          </p>
          <p className="text-xs text-[#3B1F0A]/30 mt-1.5 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live · checked {lastChecked ? timeAgo(lastChecked.toISOString()) : "—"}
          </p>
        </div>

        {/* Status banner */}
        {!isCancelled ? (
          <div className="bg-[#3B1F0A] text-white p-5 text-center">
            <p
              className="text-xl font-bold mb-1"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {info.headline}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">{info.body}</p>
            {info.eta && (
              <div className="mt-3 inline-flex items-center gap-2 bg-[#C8820A]/20 text-[#C8820A] px-4 py-1.5 text-xs font-semibold">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
                {info.eta}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-200 p-5 text-center">
            <p className="font-bold text-slate-600 mb-1">{info.headline}</p>
            <p className="text-slate-500 text-sm">{info.body}</p>
          </div>
        )}

        {/* Progress tracker */}
        {!isCancelled && (
          <div className="bg-white border border-[#3B1F0A]/8 p-6">
            {/* Progress bar */}
            <div className="relative mb-6">
              <div className="h-1 bg-[#3B1F0A]/8 rounded-full" />
              <div
                className="absolute top-0 left-0 h-1 bg-[#C8820A] rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-4 gap-2">
              {STEPS.map((step, i) => {
                const done = stepIndex >= i;
                const active = stepIndex === i;
                return (
                  <div key={step.status} className="flex flex-col items-center gap-2 text-center">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        done
                          ? "bg-[#C8820A] border-[#C8820A] text-white"
                          : "bg-white border-[#3B1F0A]/12 text-[#3B1F0A]/20"
                      } ${active ? "ring-4 ring-[#C8820A]/20 scale-110" : ""}`}
                    >
                      {done ? (
                        active ? (
                          step.icon
                        ) : (
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-[10px] font-bold leading-tight ${
                          done ? "text-[#3B1F0A]" : "text-[#3B1F0A]/25"
                        }`}
                      >
                        {step.label}
                      </p>
                      {active && (
                        <p className="text-[9px] text-[#C8820A] font-medium mt-0.5 leading-tight">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white border border-[#3B1F0A]/8 p-5">
          <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-4">
            Your Order
          </p>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="relative w-10 h-10 shrink-0 overflow-hidden">
                  <Image src={item.img} alt={item.name} fill className="object-cover" sizes="40px" />
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
          <div className="border-t border-[#3B1F0A]/8 mt-4 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-[#3B1F0A]/45">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#3B1F0A]/45">
              <span>Delivery</span>
              <span className={order.deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                {order.deliveryFee === 0 ? "Free" : fmt(order.deliveryFee)}
              </span>
            </div>
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Promo discount</span>
                <span>−{fmt(order.discount!)}</span>
              </div>
            )}
            <div
              className="flex justify-between font-bold text-[#3B1F0A] pt-2 border-t border-[#3B1F0A]/8"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              <span>Total ({order.paymentMethod ?? "COD"})</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white border border-[#3B1F0A]/8 p-5">
          <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">
            Delivering To
          </p>
          <p className="font-semibold text-[#3B1F0A]">{order.customer.name}</p>
          <p className="text-sm text-[#3B1F0A]/55 mt-0.5">{order.customer.phone}</p>
          <p className="text-sm text-[#3B1F0A]/55 mt-0.5">{order.customer.address}</p>
          {order.customer.notes && (
            <p className="text-xs text-[#3B1F0A]/35 mt-2 italic">
              Note: {order.customer.notes}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-[#3B1F0A]/30 pb-4">
          Status updates automatically every 10 seconds.
        </p>
      </div>
    </div>
  );
}
