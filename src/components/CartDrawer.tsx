"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { saveOrder } from "@/lib/orders";
import { findGiftCard, updateGiftCardBalance, type GiftCard } from "@/lib/giftcards";
import { validatePromoCode, calcDiscount, recordPromoUsage } from "@/lib/promotions";
import type { Promotion } from "@/lib/promotions";
import { getCustomers } from "@/lib/loyalty";
import type { LoyaltyCustomer } from "@/lib/loyalty";

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
type PaymentMethod = "cod" | "momo" | "vnpay" | "zalopay" | "card" | "bank" | "giftcard";

const DELIVERY_FEE = 15000;
const FREE_THRESHOLD = 100000;

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  subtitle: string;
  accent: string;
  bg: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "cod",
    label: "Cash on Delivery",
    subtitle: "Pay cash when order arrives",
    accent: "#C8820A",
    bg: "#FFF8EC",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M2 10h20M6 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "momo",
    label: "MoMo",
    subtitle: "Pay with MoMo e-wallet",
    accent: "#ae2070",
    bg: "#fdf0f7",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#ae2070" />
        <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">M</text>
      </svg>
    ),
  },
  {
    id: "vnpay",
    label: "VNPay",
    subtitle: "Scan QR code to pay",
    accent: "#0a4eaf",
    bg: "#eef4ff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="4" fill="#0a4eaf" />
        <text x="12" y="15.5" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">VNPAY</text>
      </svg>
    ),
  },
  {
    id: "zalopay",
    label: "ZaloPay",
    subtitle: "Pay with ZaloPay wallet",
    accent: "#0068ff",
    bg: "#edf4ff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="4" fill="#0068ff" />
        <text x="12" y="15.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Zalo</text>
      </svg>
    ),
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    subtitle: "Visa, Mastercard, JCB",
    accent: "#374151",
    bg: "#f8f8f8",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 9h20M6 14h3M13 14h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "bank",
    label: "Bank Transfer",
    subtitle: "Direct transfer to our account",
    accent: "#2D5016",
    bg: "#f0f7eb",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "giftcard",
    label: "Gift Card",
    subtitle: "Redeem a Highlands gift card",
    accent: "#C8820A",
    bg: "#FFF8EC",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="13" rx="2" />
        <path d="M12 7V20M8 7c0-2 1.5-3 2.5-3s2.5 1.5 2.5 3M16 7c0-2-1.5-3-2.5-3S11 5.5 11 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Payment instructions shown below the selector
const PAYMENT_INSTRUCTIONS: Record<PaymentMethod, React.ReactNode> = {
  cod: (
    <p className="text-xs text-[#3B1F0A]/55 leading-relaxed">
      Please prepare the exact amount of <span className="font-semibold text-[#3B1F0A]">cash</span> for the delivery driver. No change guaranteed.
    </p>
  ),
  momo: (
    <div className="space-y-2">
      <p className="text-xs text-[#3B1F0A]/55 leading-relaxed">
        After placing your order, open the <span className="font-semibold text-[#ae2070]">MoMo app</span> and scan the QR code or transfer to:
      </p>
      <div className="bg-white border border-[#ae2070]/20 rounded px-3 py-2 text-xs space-y-0.5">
        <p className="text-[#3B1F0A]/50">MoMo number</p>
        <p className="font-bold text-[#3B1F0A] tracking-wider">0901 234 567</p>
        <p className="text-[#3B1F0A]/50 mt-1">Account name</p>
        <p className="font-bold text-[#3B1F0A]">HIGHLANDS COFFEE</p>
      </div>
    </div>
  ),
  vnpay: (
    <div className="space-y-2">
      <p className="text-xs text-[#3B1F0A]/55 leading-relaxed">
        A <span className="font-semibold text-[#0a4eaf]">VNPay QR code</span> will appear after order confirmation. Scan with any banking app that supports VNPay.
      </p>
      <p className="text-xs text-[#0a4eaf]/70">Supported: Vietcombank, Techcombank, MB, VPBank, and 40+ others.</p>
    </div>
  ),
  zalopay: (
    <div className="space-y-2">
      <p className="text-xs text-[#3B1F0A]/55 leading-relaxed">
        Open <span className="font-semibold text-[#0068ff]">ZaloPay</span> and send payment to:
      </p>
      <div className="bg-white border border-[#0068ff]/20 rounded px-3 py-2 text-xs space-y-0.5">
        <p className="text-[#3B1F0A]/50">ZaloPay ID</p>
        <p className="font-bold text-[#3B1F0A] tracking-wider">highlands.coffee</p>
        <p className="text-[#3B1F0A]/50 mt-1">Description</p>
        <p className="font-bold text-[#3B1F0A]">Your order number (shown after)</p>
      </div>
    </div>
  ),
  card: (
    <p className="text-xs text-[#3B1F0A]/55 leading-relaxed">
      You will be redirected to a secure payment page after placing your order. Supported: <span className="font-semibold text-[#3B1F0A]">Visa, Mastercard, JCB, American Express</span>.
    </p>
  ),
  bank: (
    <div className="space-y-2">
      <p className="text-xs text-[#3B1F0A]/55 leading-relaxed">Transfer the exact amount to confirm your order:</p>
      <div className="bg-white border border-[#2D5016]/20 rounded px-3 py-2 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-[#3B1F0A]/50">Bank</span>
          <span className="font-bold text-[#3B1F0A]">Vietcombank</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#3B1F0A]/50">Account</span>
          <span className="font-bold text-[#3B1F0A] tracking-wider">1019 0012 3456</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#3B1F0A]/50">Name</span>
          <span className="font-bold text-[#3B1F0A]">HIGHLANDS COFFEE</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#3B1F0A]/50">Reference</span>
          <span className="font-bold text-[#3B1F0A]">Your order number</span>
        </div>
      </div>
    </div>
  ),
  giftcard: <></>,
};

// Success screen payment note per method
const SUCCESS_NOTE: Record<PaymentMethod, string> = {
  cod: "Please have the exact cash amount ready for the delivery driver.",
  momo: "Complete your MoMo payment now to avoid cancellation.",
  vnpay: "Scan the VNPay QR code sent to your phone to confirm payment.",
  zalopay: "Send your ZaloPay transfer now using the order number above.",
  card: "Your card payment has been submitted for processing.",
  bank: "Transfer the amount to our Vietcombank account using your order number as reference.",
  giftcard: "Your gift card balance has been applied. Enjoy your order!",
};

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

export default function CartDrawer({ cart, isOpen, onClose, onUpdate, onClearCart }: Props) {
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [loading, setLoading] = useState(false);
  const [orderNum, setOrderNum] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [gcInput, setGcInput] = useState("");
  const [gcCard, setGcCard] = useState<GiftCard | null | "not_found">(null);
  const [gcError, setGcError] = useState("");

  // Member vs anonymous checkout
  const [checkoutMode, setCheckoutMode] = useState<"unset" | "member" | "anonymous">("unset");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberLookup, setMemberLookup] = useState<LoyaltyCustomer | null | "not_found">(null);

  const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Gold:   { bg: "#FFF8EC", text: "#C8820A", border: "#C8820A40" },
    Silver: { bg: "#F5F5F5", text: "#6B7280", border: "#9CA3AF40" },
    Bronze: { bg: "#FFF7ED", text: "#92400E", border: "#D9770640" },
  };

  const lookupMember = () => {
    const phone = memberPhone.trim();
    if (!phone) return;
    const customers = getCustomers();
    const found = customers.find((c) => c.phone === phone);
    if (found) {
      setMemberLookup(found);
      setForm((f) => ({ ...f, name: found.name, phone: found.phone }));
    } else {
      setMemberLookup("not_found");
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = (appliedPromo?.type === "free_delivery" || subtotal >= FREE_THRESHOLD) ? 0 : DELIVERY_FEE;
  const promoDiscount = appliedPromo ? calcDiscount(appliedPromo, subtotal) : 0;
  const total = subtotal + deliveryFee - promoDiscount;
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)!;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const result = validatePromoCode(code, subtotal);
    if (result.valid) {
      setAppliedPromo(result.promo);
      setPromoError("");
      setPromoInput("");
    } else {
      setPromoError(result.error);
    }
  };

  const applyGiftCard = () => {
    const code = gcInput.trim();
    if (!code) return;
    const card = findGiftCard(code);
    if (!card) {
      setGcCard("not_found");
      setGcError("Gift card not found. Please check your code.");
    } else if (card.balance <= 0) {
      setGcCard("not_found");
      setGcError("This gift card has no remaining balance.");
    } else {
      setGcCard(card);
      setGcError("");
    }
  };

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

    if (paymentMethod === "giftcard") {
      if (!gcCard || gcCard === "not_found") {
        setGcError("Please apply a valid gift card code before placing your order.");
        return;
      }
      if (gcCard.balance < total) {
        setGcError(`Insufficient balance. Card has ${fmt(gcCard.balance)} but order total is ${fmt(total)}.`);
        return;
      }
    }

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
      discount: promoDiscount,
      total,
      status: "pending",
      paymentMethod: paymentMethod === "giftcard" ? `Gift Card (${gcInput.trim().toUpperCase()})` : selectedMethod.label,
    });

    if (paymentMethod === "giftcard" && gcCard && gcCard !== "not_found") {
      updateGiftCardBalance(gcCard.code, total);
    }

    if (appliedPromo) {
      recordPromoUsage(appliedPromo.code, promoDiscount);
    }

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
        setAppliedPromo(null);
        setPromoInput("");
        setPromoError("");
        setPaymentMethod("cod");
        setGcInput("");
        setGcCard(null);
        setGcError("");
        setCheckoutMode("unset");
        setMemberPhone("");
        setMemberLookup(null);
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
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#3B1F0A] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                      Cart is empty
                    </p>
                    <p className="text-sm text-[#3B1F0A]/45">Scroll down and add items from the menu below.</p>
                  </div>
                  <Link href="/#menu" onClick={handleClose} className="text-sm text-[#C8820A] font-semibold hover:underline">
                    Browse Menu →
                  </Link>
                </div>
              ) : (
                <div>
                  {cart.map((item) => (
                    <div key={item.name} className="flex items-center gap-4 py-4 border-b border-[#3B1F0A]/8 last:border-0">
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden">
                        <Image src={item.img} alt={item.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#3B1F0A] text-sm leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                          {item.name}
                        </p>
                        <p className="text-[#C8820A] text-sm font-semibold mt-0.5">{fmt(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onUpdate(item.name, -1)}
                          className="w-7 h-7 flex items-center justify-center border border-[#3B1F0A]/18 text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white transition-colors font-bold"
                        >−</button>
                        <span className="w-5 text-center text-sm font-bold text-[#3B1F0A]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdate(item.name, 1)}
                          className="w-7 h-7 flex items-center justify-center border border-[#3B1F0A]/18 text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white transition-colors font-bold"
                        >+</button>
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
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#3B1F0A]/55">
                    <span>Delivery</span>
                    <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                      {deliveryFee === 0 ? "Free" : fmt(deliveryFee)}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-[#3B1F0A]/35">Add {fmt(FREE_THRESHOLD - subtotal)} more for free delivery</p>
                  )}
                  {promoDiscount > 0 && appliedPromo && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Promo ({appliedPromo.name})</span>
                      <span>−{fmt(promoDiscount)}</span>
                    </div>
                  )}
                  <div
                    className="flex justify-between font-bold text-[#3B1F0A] pt-2 border-t border-[#3B1F0A]/8"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    <span>Total</span><span>{fmt(total)}</span>
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
                  onClick={() => { setStep("cart"); setCheckoutMode("unset"); setMemberPhone(""); setMemberLookup(null); }}
                  className="text-[#3B1F0A]/45 hover:text-[#3B1F0A] transition-colors"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Checkout
                </h2>
              </div>
              <button onClick={handleClose} className="text-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-colors">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ── Mode selector ── */}
            {checkoutMode === "unset" && (
              <div className="flex-1 flex flex-col px-6 py-6 space-y-5">
                {/* Order mini-summary */}
                <div className="bg-white border border-[#3B1F0A]/8 p-4">
                  <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-2">Order Summary</p>
                  {cart.map((i) => (
                    <div key={i.name} className="flex justify-between text-sm py-0.5">
                      <span className="text-[#3B1F0A]">{i.name} <span className="text-[#3B1F0A]/35">×{i.quantity}</span></span>
                      <span className="font-medium text-[#3B1F0A]">{fmt(i.price * i.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#3B1F0A]/8 mt-2 pt-2 flex justify-between font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    <span>Total</span><span>{fmt(total)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-3">How would you like to continue?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Member option */}
                    <button
                      onClick={() => setCheckoutMode("member")}
                      className="flex flex-col items-center gap-3 p-5 border-2 border-[#3B1F0A]/10 bg-white hover:border-[#C8820A] hover:bg-[#FFF8EC] transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FFF8EC] border-2 border-[#C8820A]/30 flex items-center justify-center group-hover:border-[#C8820A] transition-all">
                        <svg width="22" height="22" fill="none" stroke="#C8820A" strokeWidth="1.6" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#3B1F0A] text-sm">Member</p>
                        <p className="text-[10px] text-[#3B1F0A]/45 mt-0.5 leading-tight">Sign in with phone<br />to earn & redeem stars</p>
                      </div>
                    </button>

                    {/* Anonymous option */}
                    <button
                      onClick={() => setCheckoutMode("anonymous")}
                      className="flex flex-col items-center gap-3 p-5 border-2 border-[#3B1F0A]/10 bg-white hover:border-[#3B1F0A]/35 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#3B1F0A]/5 border-2 border-[#3B1F0A]/12 flex items-center justify-center group-hover:border-[#3B1F0A]/25 transition-all">
                        <svg width="22" height="22" fill="none" stroke="#3B1F0A" strokeWidth="1.6" viewBox="0 0 24 24" className="opacity-50">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#3B1F0A] text-sm">Anonymous</p>
                        <p className="text-[10px] text-[#3B1F0A]/45 mt-0.5 leading-tight">Enter details manually<br />without an account</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Member or Anonymous flow ── */}
            {checkoutMode !== "unset" && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Order mini-summary */}
              <div className="bg-white border border-[#3B1F0A]/8 p-4">
                <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-2">Order Summary</p>
                {cart.map((i) => (
                  <div key={i.name} className="flex justify-between text-sm py-0.5">
                    <span className="text-[#3B1F0A]">{i.name} <span className="text-[#3B1F0A]/35">×{i.quantity}</span></span>
                    <span className="font-medium text-[#3B1F0A]">{fmt(i.price * i.quantity)}</span>
                  </div>
                ))}
                {promoDiscount > 0 && appliedPromo && (
                  <div className="flex justify-between text-sm py-0.5 text-green-600 font-medium">
                    <span>Promo ({appliedPromo.name})</span>
                    <span>−{fmt(promoDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-[#3B1F0A]/8 mt-2 pt-2 flex justify-between font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>

              {/* Member lookup panel */}
              {checkoutMode === "member" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase">Member Lookup</p>
                    <button onClick={() => { setCheckoutMode("unset"); setMemberPhone(""); setMemberLookup(null); setForm(f => ({ ...f, name: "", phone: "" })); }}
                      className="text-[10px] text-[#3B1F0A]/40 hover:text-[#3B1F0A] font-semibold transition-colors">
                      Change type
                    </button>
                  </div>
                  <div className="bg-[#FFF8EC] border border-[#C8820A]/25 p-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={memberPhone}
                        onChange={(e) => { setMemberPhone(e.target.value); setMemberLookup(null); setForm(f => ({ ...f, name: "", phone: "" })); }}
                        onKeyDown={(e) => e.key === "Enter" && lookupMember()}
                        placeholder="Enter your phone number"
                        maxLength={11}
                        className="flex-1 border border-[#3B1F0A]/15 px-3.5 py-2.5 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors font-mono tracking-wider"
                      />
                      <button onClick={lookupMember}
                        className="bg-[#C8820A] text-white px-4 py-2.5 text-xs font-bold tracking-wide hover:bg-[#3B1F0A] transition-colors shrink-0">
                        Look Up
                      </button>
                    </div>

                    {memberLookup === "not_found" && (
                      <div className="flex items-start gap-2 text-xs text-red-600">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                        </svg>
                        <span>
                          No member found with this phone number.{" "}
                          <button onClick={() => { setCheckoutMode("anonymous"); setMemberPhone(""); setMemberLookup(null); }}
                            className="underline font-semibold hover:text-red-700">Continue as Anonymous</button>
                        </span>
                      </div>
                    )}

                    {memberLookup && memberLookup !== "not_found" && (() => {
                      const tc = TIER_COLORS[memberLookup.tier] ?? TIER_COLORS.Bronze;
                      return (
                        <div className="flex items-center gap-3 bg-white border px-3.5 py-3" style={{ borderColor: tc.border }}>
                          <div className="w-9 h-9 flex items-center justify-center text-sm font-black shrink-0"
                            style={{ background: tc.bg, color: tc.text }}>
                            ★
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#3B1F0A] text-sm leading-tight">{memberLookup.name}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: tc.text }}>
                              {memberLookup.tier} · {memberLookup.starsBalance.toLocaleString()} ★ balance
                            </p>
                          </div>
                          <svg width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Delivery form */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase">Delivery Details</p>
                  {checkoutMode === "anonymous" && (
                    <button onClick={() => { setCheckoutMode("unset"); setForm(f => ({ ...f, name: "", phone: "" })); }}
                      className="text-[10px] text-[#3B1F0A]/40 hover:text-[#3B1F0A] font-semibold transition-colors">
                      Change type
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {/* Name — read-only for verified member, editable for anonymous */}
                  {checkoutMode === "member" && memberLookup && memberLookup !== "not_found" ? (
                    <div>
                      <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">Full Name</label>
                      <div className="flex items-center gap-2 border border-[#C8820A]/30 bg-[#FFF8EC] px-4 py-3">
                        <span className="flex-1 text-sm font-semibold text-[#3B1F0A]">{memberLookup.name}</span>
                        <span className="text-[10px] text-[#C8820A] font-bold tracking-wide bg-[#C8820A]/10 px-2 py-0.5">VERIFIED</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((e2) => ({ ...e2, name: "" })); }}
                        placeholder="Nguyễn Văn A"
                        className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${errors.name ? "border-red-400" : "border-[#3B1F0A]/15"}`}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                  )}

                  {/* Phone — read-only for verified member, editable for anonymous */}
                  {checkoutMode === "member" && memberLookup && memberLookup !== "not_found" ? (
                    <div>
                      <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">Phone Number</label>
                      <div className="flex items-center gap-2 border border-[#C8820A]/30 bg-[#FFF8EC] px-4 py-3">
                        <span className="flex-1 text-sm font-mono text-[#3B1F0A]/70 tracking-wide">{memberLookup.phone}</span>
                        <span className="text-[10px] text-[#C8820A] font-bold tracking-wide bg-[#C8820A]/10 px-2 py-0.5">MEMBER</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((e2) => ({ ...e2, phone: "" })); }}
                        placeholder="0901 234 567"
                        className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${errors.phone ? "border-red-400" : "border-[#3B1F0A]/15"}`}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setErrors((e2) => ({ ...e2, address: "" })); }}
                      placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                      rows={2}
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] resize-none transition-colors ${errors.address ? "border-red-400" : "border-[#3B1F0A]/15"}`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Notes <span className="text-[#3B1F0A]/35 font-normal text-xs">(optional)</span>
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

              {/* Promo Code */}
              <div>
                <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-3">Promo Code</p>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-green-700 font-bold text-sm tracking-wider">{appliedPromo.code}</span>
                      <span className="text-green-600 text-xs">· {appliedPromo.name} applied</span>
                    </div>
                    <button onClick={() => setAppliedPromo(null)} className="text-xs text-green-600 hover:text-red-500 transition-colors">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      placeholder="Enter promo code"
                      className="flex-1 border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors uppercase"
                    />
                    <button
                      onClick={applyPromo}
                      className="bg-[#3B1F0A] text-white px-5 py-3 text-sm font-semibold hover:bg-[#1A0D00] transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-[11px] font-semibold text-[#3B1F0A]/45 tracking-widest uppercase mb-3">
                  Payment Method
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {PAYMENT_METHODS.map((method) => {
                    const selected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className="relative flex items-center gap-2.5 px-3 py-3 border-2 transition-all duration-150 text-left"
                        style={{
                          borderColor: selected ? method.accent : "rgba(59,31,10,0.12)",
                          background: selected ? method.bg : "white",
                        }}
                      >
                        <span style={{ color: selected ? method.accent : "rgba(59,31,10,0.45)" }}>
                          {method.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#3B1F0A] leading-tight truncate">{method.label}</p>
                          <p className="text-[10px] text-[#3B1F0A]/40 leading-tight mt-0.5 truncate">{method.subtitle}</p>
                        </div>
                        {selected && (
                          <span
                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: method.accent }}
                          >
                            <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instructions / gift-card input for selected method */}
                {paymentMethod === "giftcard" ? (
                  <div className="p-3.5 border border-[#C8820A]/30 bg-[#FFF8EC] space-y-3">
                    <p className="text-xs font-semibold text-[#3B1F0A] tracking-wide uppercase">Enter Gift Card Code</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gcInput}
                        onChange={(e) => {
                          setGcInput(e.target.value.toUpperCase());
                          setGcCard(null);
                          setGcError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && applyGiftCard()}
                        placeholder="HGC-XXXX-XXXX"
                        className="flex-1 border border-[#3B1F0A]/15 px-3 py-2 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/30 outline-none focus:border-[#C8820A] transition-colors font-mono tracking-widest uppercase"
                      />
                      <button
                        onClick={applyGiftCard}
                        className="bg-[#C8820A] text-white px-4 py-2 text-xs font-bold tracking-wide hover:bg-[#3B1F0A] transition-colors shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {gcError && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                        </svg>
                        {gcError}
                      </p>
                    )}
                    {gcCard && gcCard !== "not_found" && (
                      <div className="flex items-center justify-between bg-white border border-[#C8820A]/30 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div>
                            <p className="text-xs font-bold text-[#3B1F0A]">{gcCard.code}</p>
                            <p className="text-[11px] text-[#3B1F0A]/50">Balance: {fmt(gcCard.balance)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${gcCard.balance >= total ? "text-green-600" : "text-red-500"}`}>
                          {gcCard.balance >= total ? "Sufficient" : "Insufficient"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="p-3.5 rounded-sm border"
                    style={{
                      borderColor: `${selectedMethod.accent}33`,
                      background: selectedMethod.bg,
                    }}
                  >
                    {PAYMENT_INSTRUCTIONS[paymentMethod]}
                  </div>
                )}
              </div>
            </div>
            )}

            {checkoutMode !== "unset" && (
            <div className="px-6 py-5 border-t border-[#3B1F0A]/10 bg-white shrink-0">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-[#3B1F0A]/55">
                  Total · <span style={{ color: selectedMethod.accent }} className="font-semibold">{selectedMethod.label}</span>
                </span>
                <span className="font-bold text-[#3B1F0A]">{fmt(total)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full text-white py-3.5 font-bold tracking-wider text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: loading ? "#3B1F0A" : selectedMethod.accent }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Placing order...
                  </>
                ) : (
                  `Pay with ${selectedMethod.label}`
                )}
              </button>
            </div>
            )}
          </>
        )}

        {/* ── STEP 3: SUCCESS ──────────────────────── */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto py-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: `${selectedMethod.accent}18` }}
            >
              <svg width="36" height="36" fill="none" stroke={selectedMethod.accent} strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#3B1F0A] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Order Placed!
            </h2>
            <p className="text-sm text-[#3B1F0A]/55 mb-5 max-w-xs leading-relaxed">
              {SUCCESS_NOTE[paymentMethod]}
            </p>

            <div className="bg-[#3B1F0A] px-8 py-4 mb-5 w-full max-w-xs">
              <p className="text-white/50 text-[11px] tracking-widest uppercase mb-1">Order Number</p>
              <p className="text-3xl font-bold text-white tracking-widest" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {orderNum}
              </p>
            </div>

            {/* Payment method badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-semibold"
              style={{ background: selectedMethod.bg, color: selectedMethod.accent, border: `1px solid ${selectedMethod.accent}33` }}
            >
              <span>{selectedMethod.icon}</span>
              {selectedMethod.label}
            </div>

            <div className="w-full max-w-xs bg-white border border-[#3B1F0A]/8 p-4 mb-5 text-left">
              {cart.map((i) => (
                <div key={i.name} className="flex justify-between text-sm py-1 text-[#3B1F0A]">
                  <span>{i.name} <span className="text-[#3B1F0A]/35">×{i.quantity}</span></span>
                  <span className="font-medium">{fmt(i.price * i.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-[#3B1F0A]/8 mt-2 pt-2 space-y-1 text-sm">
                <div className="flex justify-between text-[#3B1F0A]/50">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-[#3B1F0A]/50">
                    <span>Delivery</span><span>{fmt(deliveryFee)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Promo discount</span><span>−{fmt(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#3B1F0A]/50">
                  <span>Payment</span>
                  <span className="font-semibold" style={{ color: selectedMethod.accent }}>
                    {selectedMethod.label}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#3B1F0A] pt-1 border-t border-[#3B1F0A]/8">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/track/${orderNum}`}
              onClick={handleClose}
              className="w-full max-w-xs bg-[#3B1F0A] text-white py-3.5 font-bold tracking-wider text-sm hover:bg-[#1A0D00] transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              Track My Order
            </Link>
            <button
              onClick={handleClose}
              className="w-full max-w-xs border border-[#3B1F0A]/15 text-[#3B1F0A]/55 py-3 font-semibold text-sm hover:text-[#3B1F0A] hover:border-[#3B1F0A]/30 transition-colors"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </>
  );
}
