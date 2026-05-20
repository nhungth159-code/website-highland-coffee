"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrackPage() {
  const [input, setInput] = useState("");
  const router = useRouter();

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

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
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
        </div>
      </div>
    </div>
  );
}
