"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getOrders } from "@/lib/orders";
import type { StoredOrder } from "@/lib/orders";

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending:    { label: "Confirmed",  bg: "bg-amber-50",  text: "text-amber-700"  },
  preparing:  { label: "Preparing", bg: "bg-blue-50",   text: "text-blue-700"   },
  delivering: { label: "On the Way",bg: "bg-purple-50", text: "text-purple-700" },
  delivered:  { label: "Delivered", bg: "bg-green-50",  text: "text-green-700"  },
  cancelled:  { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-500"  },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function TrackPage() {
  const [input, setInput] = useState("");
  const [recentOrders, setRecentOrders] = useState<StoredOrder[]>([]);
  const router = useRouter();

  useEffect(() => {
    setRecentOrders(getOrders().slice(0, 5));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = input.trim().toUpperCase();
    if (id) router.push(`/track/${id}`);
  };

  return (
    <div
      className="min-h-screen bg-[#FAF6EF] flex flex-col"
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
        <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">
          ← Back to menu
        </Link>
      </header>

      <div className="flex-1 px-6 py-12 max-w-sm mx-auto w-full">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#C8820A]/10 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-center mb-8">
          <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.3em] uppercase mb-3">
            Order Status
          </p>
          <h1
            className="text-4xl font-bold text-[#3B1F0A] mb-3"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Track Your Order
          </h1>
          <p className="text-[#3B1F0A]/50 text-sm leading-relaxed">
            Enter your order number to check your delivery status in real time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="HC-123456"
            className="w-full border border-[#3B1F0A]/15 px-5 py-4 text-center text-xl font-bold text-[#3B1F0A] tracking-[0.2em] bg-white outline-none focus:border-[#C8820A] transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-[#3B1F0A]/25 placeholder:text-base"
          />
          <button
            type="submit"
            className="w-full bg-[#C8820A] text-white py-4 font-bold tracking-wider text-sm hover:bg-[#3B1F0A] transition-colors"
          >
            Track Order
          </button>
        </form>

        <p className="text-center text-xs text-[#3B1F0A]/35 mt-5">
          Your order number starts with <strong className="text-[#3B1F0A]/50">HC-</strong> and
          was shown on your confirmation screen.
        </p>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-semibold text-[#3B1F0A]/40 tracking-widest uppercase mb-3">
              Your Recent Orders
            </p>
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
                return (
                  <Link
                    key={order.id}
                    href={`/track/${order.id}`}
                    className="flex items-center justify-between bg-white border border-[#3B1F0A]/8 px-4 py-3.5 hover:border-[#C8820A]/40 hover:shadow-sm transition-all group"
                  >
                    <div className="min-w-0">
                      <p
                        className="font-bold text-[#3B1F0A] tracking-wider text-sm"
                        style={{ fontFamily: "var(--font-playfair), serif" }}
                      >
                        {order.id}
                      </p>
                      <p className="text-xs text-[#3B1F0A]/40 mt-0.5">
                        {timeAgo(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      <svg
                        className="text-[#3B1F0A]/25 group-hover:text-[#C8820A] transition-colors"
                        width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      >
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
