export interface GiftCard {
  code: string;
  amount: number;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  purchasedAt: string;
  balance: number;
}

const KEY = "highlands_giftcards";

export const saveGiftCard = (card: GiftCard): void => {
  const existing = getGiftCards();
  existing.unshift(card);
  localStorage.setItem(KEY, JSON.stringify(existing));
};

export const getGiftCards = (): GiftCard[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const findGiftCard = (code: string): GiftCard | null => {
  return getGiftCards().find((c) => c.code === code.toUpperCase()) ?? null;
};

export const generateCode = (): string => {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HGC-${seg()}-${seg()}`;
};

export const updateGiftCardBalance = (code: string, deduction: number): void => {
  const cards = getGiftCards();
  const idx = cards.findIndex((c) => c.code === code.toUpperCase());
  if (idx === -1) return;
  cards[idx].balance = Math.max(0, cards[idx].balance - deduction);
  localStorage.setItem(KEY, JSON.stringify(cards));
};

export const topUpGiftCard = (code: string, amount: number): GiftCard | null => {
  const cards = getGiftCards();
  const idx = cards.findIndex((c) => c.code === code.toUpperCase());
  if (idx === -1) return null;
  cards[idx].balance += amount;
  cards[idx].amount += amount;
  localStorage.setItem(KEY, JSON.stringify(cards));
  return cards[idx];
};

export const revokeGiftCard = (code: string): void => {
  const cards = getGiftCards();
  const idx = cards.findIndex((c) => c.code === code.toUpperCase());
  if (idx === -1) return;
  cards[idx].balance = 0;
  localStorage.setItem(KEY, JSON.stringify(cards));
};

export const deleteGiftCard = (code: string): void => {
  const cards = getGiftCards().filter((c) => c.code !== code.toUpperCase());
  localStorage.setItem(KEY, JSON.stringify(cards));
};
