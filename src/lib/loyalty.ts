// ── Types ─────────────────────────────────────────────────────────────────────

export type RewardType    = "discount" | "free_item" | "birthday" | "welcome_bonus" | "double_points" | "referral";
export type TierName      = "Bronze" | "Silver" | "Gold";
export type TransactionType = "earn" | "redeem" | "adjust" | "expire";

export interface LoyaltyCustomer {
  id: string;
  phone: string;          // unique identifier — prevents duplicates
  name: string;
  email: string;
  starsBalance: number;   // current redeemable balance
  starsEarned: number;    // lifetime total earned (used for tier)
  starsRedeemed: number;  // lifetime total redeemed
  tier: TierName;
  totalSpend: number;     // VND
  orderCount: number;
  joinDate: string;       // YYYY-MM-DD
  lastActivity: string;   // ISO datetime
  createdAt: string;
}

export interface StarTransaction {
  id: string;
  customerId: string;
  type: TransactionType;
  stars: number;          // positive = earned, negative = redeemed/expired
  description: string;
  orderAmount?: number;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  value: string;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  redemptionCount: number;
  eligibleTiers: TierName[];
  createdAt: string;
}

export interface LoyaltyTier {
  name: TierName;
  minPoints: number;    // lifetime stars earned threshold
  maxPoints: number | null;
  multiplier: number;   // star earning multiplier
  benefits: string[];
}

export interface LoyaltyConfig {
  programName: string;
  pointsName: string;
  starsPerTenThousand: number; // base stars earned per 10,000₫
  pointsExpiryMonths: number;  // 0 = never expire
  minRedemptionPoints: number;
  welcomeBonusStars: number;
  birthdayBonusStars: number;
  referralBonusStars: number;
}

// ── Storage keys ─────────────────────────────────────────────────────────────

const CUSTOMERS_KEY    = "highlands_loyalty_customers";
const TRANSACTIONS_KEY = "highlands_loyalty_transactions";
const REWARDS_KEY      = "highlands_loyalty_rewards";
const TIERS_KEY        = "highlands_loyalty_tiers";
const CONFIG_KEY       = "highlands_loyalty_config_v2";

// ── Label maps ────────────────────────────────────────────────────────────────

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  discount:      "Discount",
  free_item:     "Free Item",
  birthday:      "Birthday Treat",
  welcome_bonus: "Welcome Bonus",
  double_points: "Double Points",
  referral:      "Referral Bonus",
};

export const REWARD_TYPE_AUTO: Record<RewardType, boolean> = {
  discount:      false,
  free_item:     false,
  birthday:      true,
  welcome_bonus: true,
  double_points: true,
  referral:      true,
};

// ── Seeded defaults ───────────────────────────────────────────────────────────

const DEFAULT_CUSTOMERS: LoyaltyCustomer[] = [
  { id: "cust_01", phone: "0912345678", name: "Nguyễn Thị Lan",    email: "lan.nguyen@gmail.com",  starsBalance: 5200, starsEarned: 6800,  starsRedeemed: 1600, tier: "Gold",   totalSpend: 15400000, orderCount: 48, joinDate: "2024-03-15", lastActivity: "2026-05-18T09:30:00.000Z", createdAt: "2024-03-15T00:00:00.000Z" },
  { id: "cust_02", phone: "0987654321", name: "Trần Minh Tuấn",    email: "tuan.tran@gmail.com",   starsBalance: 2100, starsEarned: 2650,  starsRedeemed: 550,  tier: "Silver", totalSpend: 6200000,  orderCount: 23, joinDate: "2024-08-20", lastActivity: "2026-05-17T14:15:00.000Z", createdAt: "2024-08-20T00:00:00.000Z" },
  { id: "cust_03", phone: "0903456789", name: "Lê Thị Hoa",        email: "hoa.le@yahoo.com",      starsBalance: 450,  starsEarned: 450,   starsRedeemed: 0,    tier: "Bronze", totalSpend: 1800000,  orderCount: 8,  joinDate: "2026-03-10", lastActivity: "2026-05-15T11:20:00.000Z", createdAt: "2026-03-10T00:00:00.000Z" },
  { id: "cust_04", phone: "0978123456", name: "Phạm Văn Đức",      email: "duc.pham@outlook.com",  starsBalance: 8900, starsEarned: 11200, starsRedeemed: 2300, tier: "Gold",   totalSpend: 28500000, orderCount: 87, joinDate: "2023-11-05", lastActivity: "2026-05-20T08:45:00.000Z", createdAt: "2023-11-05T00:00:00.000Z" },
  { id: "cust_05", phone: "0912678901", name: "Vũ Thị Mai",        email: "mai.vu@gmail.com",      starsBalance: 1800, starsEarned: 2200,  starsRedeemed: 400,  tier: "Silver", totalSpend: 5100000,  orderCount: 19, joinDate: "2025-01-22", lastActivity: "2026-05-16T16:30:00.000Z", createdAt: "2025-01-22T00:00:00.000Z" },
  { id: "cust_06", phone: "0963456789", name: "Hoàng Văn Nam",     email: "",                      starsBalance: 200,  starsEarned: 200,   starsRedeemed: 0,    tier: "Bronze", totalSpend: 650000,   orderCount: 3,  joinDate: "2026-04-28", lastActivity: "2026-05-10T10:00:00.000Z", createdAt: "2026-04-28T00:00:00.000Z" },
  { id: "cust_07", phone: "0912789012", name: "Đặng Thị Thu",      email: "thu.dang@gmail.com",    starsBalance: 3400, starsEarned: 3900,  starsRedeemed: 500,  tier: "Silver", totalSpend: 9200000,  orderCount: 31, joinDate: "2024-06-14", lastActivity: "2026-05-19T12:10:00.000Z", createdAt: "2024-06-14T00:00:00.000Z" },
  { id: "cust_08", phone: "0987890123", name: "Bùi Minh Khoa",     email: "khoa.bui@gmail.com",    starsBalance: 6100, starsEarned: 7800,  starsRedeemed: 1700, tier: "Gold",   totalSpend: 19800000, orderCount: 62, joinDate: "2024-01-10", lastActivity: "2026-05-18T15:25:00.000Z", createdAt: "2024-01-10T00:00:00.000Z" },
  { id: "cust_09", phone: "0903123456", name: "Ngô Thị Thanh",     email: "thanh.ngo@gmail.com",   starsBalance: 750,  starsEarned: 750,   starsRedeemed: 0,    tier: "Bronze", totalSpend: 2800000,  orderCount: 11, joinDate: "2025-09-03", lastActivity: "2026-05-14T09:50:00.000Z", createdAt: "2025-09-03T00:00:00.000Z" },
  { id: "cust_10", phone: "0978234567", name: "Đinh Văn Long",     email: "long.dinh@outlook.com", starsBalance: 1300, starsEarned: 1600,  starsRedeemed: 300,  tier: "Silver", totalSpend: 3900000,  orderCount: 15, joinDate: "2025-04-17", lastActivity: "2026-05-12T14:40:00.000Z", createdAt: "2025-04-17T00:00:00.000Z" },
  { id: "cust_11", phone: "0901234567", name: "Lý Thị Kim Anh",    email: "kimanh.ly@gmail.com",   starsBalance: 920,  starsEarned: 1050,  starsRedeemed: 130,  tier: "Silver", totalSpend: 3100000,  orderCount: 13, joinDate: "2025-07-25", lastActivity: "2026-05-11T11:15:00.000Z", createdAt: "2025-07-25T00:00:00.000Z" },
  { id: "cust_12", phone: "0976543210", name: "Cao Thanh Tùng",    email: "tung.cao@gmail.com",    starsBalance: 4200, starsEarned: 5100,  starsRedeemed: 900,  tier: "Gold",   totalSpend: 12600000, orderCount: 38, joinDate: "2024-05-08", lastActivity: "2026-05-20T07:55:00.000Z", createdAt: "2024-05-08T00:00:00.000Z" },
];

const DEFAULT_TRANSACTIONS: StarTransaction[] = [
  { id: "txn_01", customerId: "cust_04", type: "earn",   stars: 190, description: "Purchase — 950,000₫",            orderAmount: 950000,  createdAt: "2026-05-20T08:45:00.000Z" },
  { id: "txn_02", customerId: "cust_12", type: "earn",   stars: 152, description: "Purchase — 760,000₫",            orderAmount: 760000,  createdAt: "2026-05-20T07:55:00.000Z" },
  { id: "txn_03", customerId: "cust_07", type: "earn",   stars: 93,  description: "Purchase — 620,000₫",            orderAmount: 620000,  createdAt: "2026-05-19T12:10:00.000Z" },
  { id: "txn_04", customerId: "cust_01", type: "earn",   stars: 170, description: "Purchase — 850,000₫",            orderAmount: 850000,  createdAt: "2026-05-18T09:30:00.000Z" },
  { id: "txn_05", customerId: "cust_08", type: "earn",   stars: 224, description: "Purchase — 1,120,000₫",          orderAmount: 1120000, createdAt: "2026-05-18T15:25:00.000Z" },
  { id: "txn_06", customerId: "cust_02", type: "earn",   stars: 68,  description: "Purchase — 450,000₫",            orderAmount: 450000,  createdAt: "2026-05-17T14:15:00.000Z" },
  { id: "txn_07", customerId: "cust_05", type: "earn",   stars: 81,  description: "Purchase — 540,000₫",            orderAmount: 540000,  createdAt: "2026-05-16T16:30:00.000Z" },
  { id: "txn_08", customerId: "cust_03", type: "earn",   stars: 38,  description: "Purchase — 380,000₫",            orderAmount: 380000,  createdAt: "2026-05-15T11:20:00.000Z" },
  { id: "txn_09", customerId: "cust_04", type: "redeem", stars: -500,description: "Redeemed: Star Cashback",                               createdAt: "2026-05-15T14:00:00.000Z" },
  { id: "txn_10", customerId: "cust_09", type: "earn",   stars: 43,  description: "Purchase — 430,000₫",            orderAmount: 430000,  createdAt: "2026-05-14T09:50:00.000Z" },
  { id: "txn_11", customerId: "cust_10", type: "earn",   stars: 65,  description: "Purchase — 430,000₫",            orderAmount: 430000,  createdAt: "2026-05-12T14:40:00.000Z" },
  { id: "txn_12", customerId: "cust_08", type: "redeem", stars: -300,description: "Redeemed: Free Highlands Drink",                        createdAt: "2026-05-08T09:20:00.000Z" },
  { id: "txn_13", customerId: "cust_12", type: "earn",   stars: 240, description: "Purchase — 1,200,000₫",          orderAmount: 1200000, createdAt: "2026-05-05T15:30:00.000Z" },
  { id: "txn_14", customerId: "cust_07", type: "redeem", stars: -500,description: "Redeemed: Star Cashback",                               createdAt: "2026-05-05T11:00:00.000Z" },
  { id: "txn_15", customerId: "cust_04", type: "earn",   stars: 296, description: "Purchase — 1,480,000₫",          orderAmount: 1480000, createdAt: "2026-05-10T11:30:00.000Z" },
  { id: "txn_16", customerId: "cust_01", type: "redeem", stars: -300,description: "Redeemed: Free Highlands Drink",                        createdAt: "2026-05-10T10:15:00.000Z" },
  { id: "txn_17", customerId: "cust_11", type: "earn",   stars: 58,  description: "Purchase — 390,000₫",            orderAmount: 390000,  createdAt: "2026-05-11T11:15:00.000Z" },
  { id: "txn_18", customerId: "cust_06", type: "earn",   stars: 100, description: "Welcome bonus — new member",                           createdAt: "2026-04-28T10:00:00.000Z" },
  { id: "txn_19", customerId: "cust_03", type: "earn",   stars: 100, description: "Welcome bonus — new member",                           createdAt: "2026-03-10T10:00:00.000Z" },
  { id: "txn_20", customerId: "cust_02", type: "earn",   stars: 142, description: "Purchase — 940,000₫",            orderAmount: 940000,  createdAt: "2026-04-22T13:00:00.000Z" },
];

const DEFAULT_REWARDS: LoyaltyReward[] = [
  { id: "reward_cashback",     name: "Star Cashback",          description: "Redeem 500 stars for 50,000₫ off your next order.", type: "discount",      pointsCost: 500, value: "50,000₫ off",        isActive: true, validFrom: "2026-01-01", validTo: "", redemptionCount: 4231,  eligibleTiers: ["Bronze", "Silver", "Gold"], createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "reward_free_drink",   name: "Free Highlands Drink",   description: "Redeem 300 stars for any standard-size drink.",     type: "free_item",     pointsCost: 300, value: "Free standard drink",isActive: true, validFrom: "2026-01-01", validTo: "", redemptionCount: 2876,  eligibleTiers: ["Silver", "Gold"],           createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "reward_birthday",     name: "Birthday Treat",         description: "Auto-issued: complimentary drink on birthday month.",type: "birthday",      pointsCost: 0,   value: "Free birthday drink",isActive: true, validFrom: "2026-01-01", validTo: "", redemptionCount: 618,   eligibleTiers: ["Bronze", "Silver", "Gold"], createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "reward_welcome",      name: "Welcome Bonus",          description: "Auto-issued: 100 stars on new member sign-up.",     type: "welcome_bonus", pointsCost: 0,   value: "100 stars on sign-up",isActive: true,validFrom: "2026-01-01", validTo: "", redemptionCount: 14320, eligibleTiers: ["Bronze"],                    createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "reward_double_stars", name: "Double Stars Weekend",   description: "2× stars on all purchases every Sat & Sun.",       type: "double_points", pointsCost: 0,   value: "2× stars earned",    isActive: true, validFrom: "2026-01-01", validTo: "", redemptionCount: 89400, eligibleTiers: ["Bronze", "Silver", "Gold"], createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "reward_referral",     name: "Refer a Friend",         description: "200 stars for each friend who places first order.", type: "referral",      pointsCost: 0,   value: "200 stars/referral", isActive: true, validFrom: "2026-01-01", validTo: "", redemptionCount: 3142,  eligibleTiers: ["Bronze", "Silver", "Gold"], createdAt: "2026-01-01T00:00:00.000Z" },
];

const DEFAULT_TIERS: LoyaltyTier[] = [
  { name: "Bronze", minPoints: 0,    maxPoints: 999,  multiplier: 1,   benefits: ["Earn 1 star per 10,000₫ spent", "Birthday treat every year", "Welcome bonus: 100 stars", "Access to discount rewards"] },
  { name: "Silver", minPoints: 1000, maxPoints: 4999, multiplier: 1.5, benefits: ["Earn 1.5 stars per 10,000₫ spent", "Free drink size upgrade once/month", "Priority customer support", "All Bronze benefits"] },
  { name: "Gold",   minPoints: 5000, maxPoints: null,  multiplier: 2,   benefits: ["Earn 2 stars per 10,000₫ spent", "Unlimited free drink size upgrades", "Exclusive Gold menu access", "Early product access", "All Silver benefits"] },
];

const DEFAULT_CONFIG: LoyaltyConfig = {
  programName: "Highlands Stars",
  pointsName: "Stars",
  starsPerTenThousand: 1,
  pointsExpiryMonths: 12,
  minRedemptionPoints: 100,
  welcomeBonusStars: 100,
  birthdayBonusStars: 200,
  referralBonusStars: 200,
};

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadCustomers(): LoyaltyCustomer[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOMERS;
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(DEFAULT_CUSTOMERS)); return DEFAULT_CUSTOMERS; }
    return JSON.parse(raw) as LoyaltyCustomer[];
  } catch { return DEFAULT_CUSTOMERS; }
}

function saveCustomers(list: LoyaltyCustomer[]): void {
  if (typeof window !== "undefined") localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
}

function loadTransactions(): StarTransaction[] {
  if (typeof window === "undefined") return DEFAULT_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) { localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(DEFAULT_TRANSACTIONS)); return DEFAULT_TRANSACTIONS; }
    return JSON.parse(raw) as StarTransaction[];
  } catch { return DEFAULT_TRANSACTIONS; }
}

function saveTransactions(list: StarTransaction[]): void {
  if (typeof window !== "undefined") localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
}

function loadRewards(): LoyaltyReward[] {
  if (typeof window === "undefined") return DEFAULT_REWARDS;
  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    if (!raw) { localStorage.setItem(REWARDS_KEY, JSON.stringify(DEFAULT_REWARDS)); return DEFAULT_REWARDS; }
    return JSON.parse(raw) as LoyaltyReward[];
  } catch { return DEFAULT_REWARDS; }
}

function saveRewards(list: LoyaltyReward[]): void {
  if (typeof window !== "undefined") localStorage.setItem(REWARDS_KEY, JSON.stringify(list));
}

function loadTiers(): LoyaltyTier[] {
  if (typeof window === "undefined") return DEFAULT_TIERS;
  try {
    const raw = localStorage.getItem(TIERS_KEY);
    if (!raw) { localStorage.setItem(TIERS_KEY, JSON.stringify(DEFAULT_TIERS)); return DEFAULT_TIERS; }
    return JSON.parse(raw) as LoyaltyTier[];
  } catch { return DEFAULT_TIERS; }
}

function saveTiers(list: LoyaltyTier[]): void {
  if (typeof window !== "undefined") localStorage.setItem(TIERS_KEY, JSON.stringify(list));
}

function loadConfig(): LoyaltyConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) { localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG)); return DEFAULT_CONFIG; }
    return JSON.parse(raw) as LoyaltyConfig;
  } catch { return DEFAULT_CONFIG; }
}

// ── Business logic ────────────────────────────────────────────────────────────

export function computeTier(starsEarned: number, tiers: LoyaltyTier[]): TierName {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  for (const t of sorted) {
    if (starsEarned >= t.minPoints) return t.name;
  }
  return "Bronze";
}

export function calculateStarsForPurchase(
  orderAmount: number,
  tierMultiplier: number,
  starsPerTenThousand: number
): number {
  return Math.floor((orderAmount / 10000) * starsPerTenThousand * tierMultiplier);
}

// ── Customers CRUD ────────────────────────────────────────────────────────────

export function getCustomers(): LoyaltyCustomer[] { return loadCustomers(); }

export function findCustomerByPhone(phone: string): LoyaltyCustomer | undefined {
  return loadCustomers().find((c) => c.phone === phone.trim());
}

export function createCustomer(
  data: Pick<LoyaltyCustomer, "phone" | "name" | "email">,
  tiers: LoyaltyTier[],
  config: LoyaltyConfig
): { success: true; customers: LoyaltyCustomer[]; transactions: StarTransaction[] } | { success: false; error: string } {
  const list = loadCustomers();
  if (list.find((c) => c.phone === data.phone.trim())) {
    return { success: false, error: "A customer with this phone number already exists." };
  }
  const now = new Date().toISOString();
  const customer: LoyaltyCustomer = {
    id: `cust_${Date.now()}`,
    phone: data.phone.trim(),
    name: data.name.trim(),
    email: data.email.trim(),
    starsBalance: config.welcomeBonusStars,
    starsEarned: config.welcomeBonusStars,
    starsRedeemed: 0,
    tier: computeTier(config.welcomeBonusStars, tiers),
    totalSpend: 0,
    orderCount: 0,
    joinDate: now.slice(0, 10),
    lastActivity: now,
    createdAt: now,
  };
  const updatedCustomers = [...list, customer];
  saveCustomers(updatedCustomers);

  const welcomeTxn: StarTransaction = {
    id: `txn_${Date.now()}`,
    customerId: customer.id,
    type: "earn",
    stars: config.welcomeBonusStars,
    description: "Welcome bonus — new member",
    createdAt: now,
  };
  const txnList = loadTransactions();
  const updatedTxns = [welcomeTxn, ...txnList];
  saveTransactions(updatedTxns);

  return { success: true, customers: updatedCustomers, transactions: updatedTxns };
}

export function updateCustomer(
  id: string,
  data: Partial<Pick<LoyaltyCustomer, "name" | "email" | "phone">>,
  existingCustomers?: LoyaltyCustomer[]
): { success: true; customers: LoyaltyCustomer[] } | { success: false; error: string } {
  const list = existingCustomers ?? loadCustomers();
  if (data.phone) {
    const conflict = list.find((c) => c.phone === data.phone!.trim() && c.id !== id);
    if (conflict) return { success: false, error: "That phone number belongs to another customer." };
  }
  const updated = list.map((c) =>
    c.id === id ? { ...c, ...data, phone: data.phone ? data.phone.trim() : c.phone } : c
  );
  saveCustomers(updated);
  return { success: true, customers: updated };
}

export function deleteCustomer(id: string): LoyaltyCustomer[] {
  const updated = loadCustomers().filter((c) => c.id !== id);
  saveCustomers(updated);
  return updated;
}

// ── Star transactions ─────────────────────────────────────────────────────────

export function getTransactions(): StarTransaction[] { return loadTransactions(); }

export function addPurchaseStars(
  customerId: string,
  orderAmount: number,
  tiers: LoyaltyTier[],
  config: LoyaltyConfig
): { customers: LoyaltyCustomer[]; transactions: StarTransaction[] } {
  const list = loadCustomers();
  const customer = list.find((c) => c.id === customerId);
  if (!customer) return { customers: list, transactions: loadTransactions() };

  const tierInfo = tiers.find((t) => t.name === customer.tier);
  const multiplier = tierInfo?.multiplier ?? 1;
  const stars = calculateStarsForPurchase(orderAmount, multiplier, config.starsPerTenThousand);
  const newEarned = customer.starsEarned + stars;
  const newTier = computeTier(newEarned, tiers);
  const now = new Date().toISOString();

  const updatedCustomers = list.map((c) =>
    c.id === customerId
      ? { ...c, starsBalance: c.starsBalance + stars, starsEarned: newEarned, totalSpend: c.totalSpend + orderAmount, orderCount: c.orderCount + 1, tier: newTier, lastActivity: now }
      : c
  );
  saveCustomers(updatedCustomers);

  const txn: StarTransaction = {
    id: `txn_${Date.now()}`,
    customerId,
    type: "earn",
    stars,
    description: `Purchase — ${orderAmount.toLocaleString("vi-VN")}₫`,
    orderAmount,
    createdAt: now,
  };
  const txnList = [txn, ...loadTransactions()];
  saveTransactions(txnList);

  return { customers: updatedCustomers, transactions: txnList };
}

export function addManualAdjust(
  customerId: string,
  stars: number,
  reason: string,
  tiers: LoyaltyTier[]
): { customers: LoyaltyCustomer[]; transactions: StarTransaction[] } {
  const list = loadCustomers();
  const customer = list.find((c) => c.id === customerId);
  if (!customer) return { customers: list, transactions: loadTransactions() };

  const newBalance  = Math.max(0, customer.starsBalance + stars);
  const newEarned   = stars > 0 ? customer.starsEarned + stars : customer.starsEarned;
  const newRedeemed = stars < 0 ? customer.starsRedeemed + Math.abs(stars) : customer.starsRedeemed;
  const newTier     = computeTier(newEarned, tiers);
  const now         = new Date().toISOString();

  const updatedCustomers = list.map((c) =>
    c.id === customerId
      ? { ...c, starsBalance: newBalance, starsEarned: newEarned, starsRedeemed: newRedeemed, tier: newTier, lastActivity: now }
      : c
  );
  saveCustomers(updatedCustomers);

  const txn: StarTransaction = {
    id: `txn_${Date.now()}`,
    customerId,
    type: stars >= 0 ? "adjust" : "redeem",
    stars,
    description: reason.trim() || (stars >= 0 ? "Manual adjustment — stars added" : "Reward redeemed"),
    createdAt: now,
  };
  const txnList = [txn, ...loadTransactions()];
  saveTransactions(txnList);

  return { customers: updatedCustomers, transactions: txnList };
}

// ── Rewards CRUD ─────────────────────────────────────────────────────────────

export function getRewards(): LoyaltyReward[] { return loadRewards(); }

export function createReward(data: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount">): LoyaltyReward[] {
  const list = loadRewards();
  const reward: LoyaltyReward = { ...data, id: `reward_${Date.now()}`, createdAt: new Date().toISOString(), redemptionCount: 0 };
  const updated = [reward, ...list];
  saveRewards(updated);
  return updated;
}

export function updateReward(id: string, data: Partial<Omit<LoyaltyReward, "id" | "createdAt">>): LoyaltyReward[] {
  const updated = loadRewards().map((r) => (r.id === id ? { ...r, ...data } : r));
  saveRewards(updated);
  return updated;
}

export function deleteReward(id: string): LoyaltyReward[] {
  const updated = loadRewards().filter((r) => r.id !== id);
  saveRewards(updated);
  return updated;
}

export function toggleReward(id: string): LoyaltyReward[] {
  const updated = loadRewards().map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
  saveRewards(updated);
  return updated;
}

// ── Tiers ─────────────────────────────────────────────────────────────────────

export function getTiers(): LoyaltyTier[] { return loadTiers(); }

export function updateTier(name: TierName, data: Partial<Omit<LoyaltyTier, "name">>): LoyaltyTier[] {
  const updated = loadTiers().map((t) => (t.name === name ? { ...t, ...data } : t));
  saveTiers(updated);
  return updated;
}

// ── Config ────────────────────────────────────────────────────────────────────

export function getConfig(): LoyaltyConfig { return loadConfig(); }

export function saveConfig(data: LoyaltyConfig): LoyaltyConfig {
  if (typeof window !== "undefined") localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
  return data;
}
