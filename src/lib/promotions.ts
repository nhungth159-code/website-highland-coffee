export type PromoType = "percent" | "fixed" | "bogo" | "free_delivery";

export interface Promotion {
  id: string;
  name: string;
  code: string;
  description: string;
  type: PromoType;
  value: number;           // percent (0-100) or fixed VND; ignored for bogo & free_delivery
  minPurchase: number;     // 0 = no minimum
  startDate: string;       // "YYYY-MM-DD"
  endDate: string;         // "YYYY-MM-DD"
  maxUses: number;         // 0 = unlimited
  usedCount: number;
  totalDiscountGiven: number;
  isActive: boolean;
  createdAt: string;
  // BOGO details
  bogoDetails?: { buyQty: number; getQty: number };
}

export type PromoStatus = "active" | "expired" | "scheduled" | "paused" | "exhausted";

const KEY = "highlands_promotions";

const DEFAULTS: Promotion[] = [
  {
    id: "promo_highlands25",
    name: "25% Off Your Order",
    code: "HIGHLANDS25",
    description: "25% off all orders. Valid for all customers.",
    type: "percent",
    value: 25,
    minPurchase: 0,
    startDate: "2026-01-01",
    endDate: "2026-05-31",
    maxUses: 0,
    usedCount: 147,
    totalDiscountGiven: 4312500,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "promo_bogo_jun",
    name: "Buy 1 Get 1 Free",
    code: "BOGO2026",
    description: "Buy any drink and get a second one free. Limited time.",
    type: "bogo",
    value: 0,
    minPurchase: 35000,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    maxUses: 500,
    usedCount: 0,
    totalDiscountGiven: 0,
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
    bogoDetails: { buyQty: 1, getQty: 1 },
  },
];

function load(): Promotion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(DEFAULTS));
      return DEFAULTS;
    }
    return JSON.parse(raw) as Promotion[];
  } catch {
    return DEFAULTS;
  }
}

function save(list: Promotion[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getPromotions(): Promotion[] {
  return load();
}

/** Returns today's date as YYYY-MM-DD in the local timezone (not UTC). */
function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getPromoStatus(p: Promotion): PromoStatus {
  const today = localToday();
  // Date-based states take absolute precedence — they cannot be overridden by isActive.
  if (p.endDate && today > p.endDate) return "expired";
  if (p.maxUses > 0 && p.usedCount >= p.maxUses) return "exhausted";
  // Admin-managed states (only apply when within valid date range).
  if (!p.isActive) return "paused";
  if (today < p.startDate) return "scheduled";
  return "active";
}

/** Validate a code string against the promotions list. Returns the matching promo or an error. */
export function validatePromoCode(
  code: string,
  subtotal: number
): { valid: true; promo: Promotion } | { valid: false; error: string } {
  const list = load();
  const promo = list.find((p) => p.code.toUpperCase() === code.toUpperCase());
  if (!promo) return { valid: false, error: "Invalid promo code." };

  const status = getPromoStatus(promo);
  if (status === "paused") return { valid: false, error: "This promo code is currently inactive." };
  if (status === "expired") return { valid: false, error: `This code expired on ${formatDate(promo.endDate)}.` };
  if (status === "scheduled") return { valid: false, error: `This code is valid from ${formatDate(promo.startDate)}.` };
  if (status === "exhausted") return { valid: false, error: "This promo code has reached its usage limit." };

  if (promo.minPurchase > 0 && subtotal < promo.minPurchase) {
    return {
      valid: false,
      error: `Minimum order of ${promo.minPurchase.toLocaleString("vi-VN")}₫ required.`,
    };
  }

  return { valid: true, promo };
}

/** Calculate the discount amount for a validated promo. */
export function calcDiscount(promo: Promotion, subtotal: number): number {
  if (promo.type === "percent") return Math.round(subtotal * promo.value / 100);
  if (promo.type === "fixed") return Math.min(promo.value, subtotal);
  return 0; // bogo & free_delivery handled separately
}

/** Record a usage when an order is placed with this promo. */
export function recordPromoUsage(code: string, discountAmount: number): void {
  const list = load();
  const updated = list.map((p) =>
    p.code.toUpperCase() === code.toUpperCase()
      ? { ...p, usedCount: p.usedCount + 1, totalDiscountGiven: p.totalDiscountGiven + discountAmount }
      : p
  );
  save(updated);
}

export function createPromotion(data: Omit<Promotion, "id" | "createdAt" | "usedCount" | "totalDiscountGiven">): Promotion[] {
  const list = load();
  const promo: Promotion = {
    ...data,
    id: `promo_${Date.now()}`,
    createdAt: new Date().toISOString(),
    usedCount: 0,
    totalDiscountGiven: 0,
  };
  const updated = [promo, ...list];
  save(updated);
  return updated;
}

export function updatePromotion(id: string, data: Partial<Omit<Promotion, "id" | "createdAt">>): Promotion[] {
  const list = load();
  const updated = list.map((p) => (p.id === id ? { ...p, ...data } : p));
  save(updated);
  return updated;
}

export function deletePromotion(id: string): Promotion[] {
  const updated = load().filter((p) => p.id !== id);
  save(updated);
  return updated;
}

export function togglePromotion(id: string): Promotion[] {
  const list = load();
  const updated = list.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
  save(updated);
  return updated;
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export { formatDate };
