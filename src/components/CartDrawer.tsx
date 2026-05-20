"use client";

import { useState } from "react";
import Image from "next/image";
import { saveOrder } from "@/lib/orders";

export type CartItem = {
  name: string;
  price: number;
  img: string;
  quantity: number;
};

interface Props {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (name: string, delta: number) => void;
  onClearCart: () => void;
}

type Step = "cart" | "checkout" | "success";

const DELIVERY_FEE = 15000;
const FREE_THRESHOLD = 100000;

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

export default function CartDrawer({ cart, isOpen, onClose, onUpdate, onClearCart }: Props) {
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [loading, setLoading] = useState(false);
  const [orderNum, setOrderNum] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Invalid phone number";
    if (!form.address.trim()) e.address = "Address is required";
    return e;
  };

  const handlePlaceOrder = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const num = `HC-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNum(num);
    saveOrder({
      id: num,
      createdAt: new Date().toISOString(),
      customer: { name: form.name, phone: form.phone, address: form.address, notes: form.notes },
      items: cart.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, img: i.img })),
      subtotal,
      deliveryFee,
      total,
      status: "pending",
    });
    setStep("success");
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      if (step === "success") {
        onClearCart();
        setStep("cart");
        setForm({ name: "", phone: "", address: "", notes: "" });
        setErrors({});
      }
    }, 350);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-[420px] bg-[#FAF6EF] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── STEP 1: CART ─────────────────────────── */}
        {step === "cart" && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#3B1F0A]/10 shrink-0">
              <div>
                <h2
                  className="text-xl font-bold text-[#3B1F0A]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Your Order
                </h2>
                {count > 0 && (
                  <p className="text-xs text-[#3B1F0A]/45 mt-0.5">
                    {count} item{count !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center text-[#3B1F0A]/50 hover:text-[#3B1F0A] transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#3B1F0A]/5 flex items-center justify-center">
                    <svg width="28" height="28" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path
                        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="font-bold text-[#3B1F0A] mb-1"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      Cart is empty
                    </p>
                    <p className="text-sm text-[#3B1F0A]/45">
                      Scroll down and add items from the menu below.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-sm text-[#C8820A] font-semibold hover:underline"
                  >
                    Browse Menu →
                  </button>
                </div>
              ) : (
                <div>
                  {cart.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-4 py-4 border-b border-[#3B1F0A]/8 last:border-0"
                    >
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden">
                        <Image
                          src={item.img}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-[#3B1F0A] text-sm leading-tight"
                          style={{ fontFamily: "var(--font-playfair), serif" }}
                        >
                          {item.name}
                        </p>
                        <p className="text-[#C8820A] text-sm font-semibold mt-0.5">
                          {fmt(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onUpdate(item.name, -1)}
                          className="w-7 h-7 flex items-center justify-center border border-[#3B1F0A]/18 text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white transition-colors font-bold"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-[#3B1F0A]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdate(item.name, 1)}
                          className="w-7 h-7 flex items-center justify-center border border-[#3B1F0A]/18 text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-[#3B1F0A]/10 bg-white shrink-0">
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between text-[#3B1F0A]/55">
                    <span>Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#3B1F0A]/55">
                    <span>Delivery</span>
                    <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                      {deliveryFee === 0 ? "Free" : fmt(deliveryFee)}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-[#3B1F0A]/35">
                      Add {fmt(FREE_THRESHOLD - subtotal)} more for free delivery
                    </p>
                  )}
                  <div
                    className="flex justify-between font-bold text-[#3B1F0A] pt-2 border-t border-[#3B1F0A]/8"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-[#C8820A] text-white py-3.5 font-bold tracking-wider text-sm hover:bg-[#3B1F0A] transition-colors"
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: CHECKOUT ─────────────────────── */}
        {step === "checkout" && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#3B1F0A]/10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("cart")}
                  className="text-[#3B1F0A]/45 hover:text-[#3B1F0A] transition-colors"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h2
                  className="text-xl font-bold text-[#3B1F0A]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Checkout
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Order mini-summary */}
              <div className="bg-white border border-[#3B1F0A]/8 p-4">
                <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-2">
                  Order Summary
                </p>
                {cart.map((i) => (
                  <div key={i.name} className="flex justify-between text-sm py-0.5">
                    <span className="text-[#3B1F0A]">
                      {i.name}{" "}
                      <span className="text-[#3B1F0A]/35">×{i.quantity}</span>
                    </span>
                    <span className="font-medium text-[#3B1F0A]">{fmt(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div
                  className="border-t border-[#3B1F0A]/8 mt-2 pt-2 flex justify-between font-bold text-[#3B1F0A]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              {/* Delivery form */}
              <div>
                <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-3">
                  Delivery Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }));
                        setErrors((e2) => ({ ...e2, name: "" }));
                      }}
                      placeholder="Nguyễn Văn A"
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${
                        errors.name ? "border-red-400" : "border-[#3B1F0A]/15"
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, phone: e.target.value }));
                        setErrors((e2) => ({ ...e2, phone: "" }));
                      }}
                      placeholder="0901 234 567"
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${
                        errors.phone ? "border-red-400" : "border-[#3B1F0A]/15"
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, address: e.target.value }));
                        setErrors((e2) => ({ ...e2, address: "" }));
                      }}
                      placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                      rows={2}
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] resize-none transition-colors ${
                        errors.address ? "border-red-400" : "border-[#3B1F0A]/15"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Notes{" "}
                      <span className="text-[#3B1F0A]/35 font-normal text-xs">(optional)</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Less ice, extra sugar, call before arriving..."
                      rows={2}
                      className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-3">
                  Payment Method
                </p>
                <div className="border-2 border-[#C8820A] bg-[#C8820A]/5 p-4 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#C8820A] flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C8820A]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#3B1F0A] text-sm">Cash on Delivery (COD)</p>
                    <p className="text-xs text-[#3B1F0A]/50 mt-0.5">
                      Pay in cash when your order arrives. No card needed.
                    </p>
                  </div>
                  <svg
                    className="ml-auto shrink-0"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#C8820A"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M2 10h20M6 14h4" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-[#3B1F0A]/10 bg-white shrink-0">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-[#3B1F0A]/55">Total (pay on delivery)</span>
                <span className="font-bold text-[#3B1F0A]">{fmt(total)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-[#C8820A] text-white py-3.5 font-bold tracking-wider text-sm hover:bg-[#3B1F0A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="white"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Placing order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: SUCCESS ──────────────────────── */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
              <svg
                width="36"
                height="36"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold text-[#3B1F0A] mb-2"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Order Placed!
            </h2>
            <p className="text-sm text-[#3B1F0A]/55 mb-6 max-w-xs leading-relaxed">
              Thank you! Your order will arrive in{" "}
              <strong className="text-[#3B1F0A]">30–45 minutes</strong>. Please have cash ready.
            </p>

            <div className="bg-[#3B1F0A] px-8 py-4 mb-6 w-full max-w-xs">
              <p className="text-white/50 text-[11px] tracking-widest uppercase mb-1">
                Order Number
              </p>
              <p
                className="text-3xl font-bold text-white tracking-widest"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {orderNum}
              </p>
            </div>

            <div className="w-full max-w-xs bg-white border border-[#3B1F0A]/8 p-4 mb-5 text-left">
              {cart.map((i) => (
                <div key={i.name} className="flex justify-between text-sm py-1 text-[#3B1F0A]">
                  <span>
                    {i.name} <span className="text-[#3B1F0A]/35">×{i.quantity}</span>
                  </span>
                  <span className="font-medium">{fmt(i.price * i.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-[#3B1F0A]/8 mt-2 pt-2 flex justify-between font-bold text-[#3B1F0A]">
                <span>Total (COD)</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            <p className="text-xs text-[#3B1F0A]/35 mb-5">
              Payment collected at the door.
            </p>
            <button
              onClick={handleClose}
              className="w-full max-w-xs bg-[#C8820A] text-white py-3.5 font-bold tracking-wider text-sm hover:bg-[#3B1F0A] transition-colors"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </>
  );
}
