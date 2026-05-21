export type RewardType = "points_cashback" | "free_item" | "birthday" | "welcome_bonus" | "double_points" | "referral";
export type TierName = "Bronze" | "Silver" | "Gold";

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
  minPoints: number;
  maxPoints: number | null;
  multiplier: number;
  memberCount: number;
  benefits: string[];
}

export interface LoyaltyConfig {
  programName: string;
  pointsName: string;
  pointsPerThousandVND: number;
  pointsExpiryMonths: number;
  minRedemptionPoints: number;
  birthdayBonusPoints: number;
  welcomeBonusPoints: number;
  referralBonusPoints: number;
}

const REWARDS_KEY = "highlands_loyalty_rewards";
const TIERS_KEY   = "highlands_loyalty_tiers";
const CONFIG_KEY  = "highlands_loyalty_config";

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  points_cashback: "Points Cashback",
  free_item:       "Free Item",
  birthday:        "Birthday Treat",
  welcome_bonus:   "Welcome Bonus",
  double_points:   "Double Points",
  referral:        "Referral Bonus",
};

export const REWARD_TYPE_AUTO: Record<RewardType, boolean> = {
  points_cashback: false,
  free_item:       false,
  birthday:        true,
  welcome_bonus:   true,
  double_points:   true,
  referral:        true,
};

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_REWARDS: LoyaltyReward[] = [
  {
    id: "reward_cashback",
    name: "Star Cashback",
    description: "Redeem 500 stars for 50,000₫ off your next order.",
    type: "points_cashback",
    pointsCost: 500,
    value: "50,000₫ off",
    isActive: true,
    validFrom: "2026-01-01",
    validTo: "",
    redemptionCount: 4231,
    eligibleTiers: ["Bronze", "Silver", "Gold"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "reward_free_drink",
    name: "Free Highlands Drink",
    description: "Redeem 300 stars for any standard-size drink of your choice.",
    type: "free_item",
    pointsCost: 300,
    value: "Free standard drink",
    isActive: true,
    validFrom: "2026-01-01",
    validTo: "",
    redemptionCount: 2876,
    eligibleTiers: ["Silver", "Gold"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "reward_birthday",
    name: "Birthday Treat",
    description: "Automatically receive a complimentary drink during your birthday month.",
    type: "birthday",
    pointsCost: 0,
    value: "Free birthday drink",
    isActive: true,
    validFrom: "2026-01-01",
    validTo: "",
    redemptionCount: 618,
    eligibleTiers: ["Bronze", "Silver", "Gold"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "reward_welcome",
    name: "Welcome Bonus",
    description: "100 stars awarded automatically to all new members upon sign-up.",
    type: "welcome_bonus",
    pointsCost: 0,
    value: "100 stars on sign-up",
    isActive: true,
    validFrom: "2026-01-01",
    validTo: "",
    redemptionCount: 14320,
    eligibleTiers: ["Bronze"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "reward_double_stars",
    name: "Double Stars Weekend",
    description: "Earn 2× stars on all purchases every Saturday and Sunday.",
    type: "double_points",
    pointsCost: 0,
    value: "2× stars earned",
    isActive: true,
    validFrom: "2026-01-01",
    validTo: "",
    redemptionCount: 89400,
    eligibleTiers: ["Bronze", "Silver", "Gold"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "reward_referral",
    name: "Refer a Friend",
    description: "Earn 200 stars for each friend you refer who places their first order.",
    type: "referral",
    pointsCost: 0,
    value: "200 stars per referral",
    isActive: true,
    validFrom: "2026-01-01",
    validTo: "",
    redemptionCount: 3142,
    eligibleTiers: ["Bronze", "Silver", "Gold"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    name: "Bronze",
    minPoints: 0,
    maxPoints: 999,
    multiplier: 1,
    memberCount: 3200000,
    benefits: [
      "Earn 1 star per 10,000₫ spent",
      "Birthday treat every year",
      "Access to star cashback rewards",
      "Welcome bonus: 100 stars",
    ],
  },
  {
    name: "Silver",
    minPoints: 1000,
    maxPoints: 4999,
    multiplier: 1.5,
    memberCount: 3100000,
    benefits: [
      "Earn 1.5 stars per 10,000₫ spent",
      "Free drink size upgrade once per month",
      "Priority customer support",
      "Access to free drink rewards",
      "All Bronze benefits",
    ],
  },
  {
    name: "Gold",
    minPoints: 5000,
    maxPoints: null,
    multiplier: 2,
    memberCount: 1700000,
    benefits: [
      "Earn 2 stars per 10,000₫ spent",
      "Unlimited free drink size upgrades",
      "Exclusive Gold menu access",
      "Early access to new products",
      "Priority service at all locations",
      "All Silver benefits",
    ],
  },
];

const DEFAULT_CONFIG: LoyaltyConfig = {
  programName: "Highlands Stars",
  pointsName: "Stars",
  pointsPerThousandVND: 1,
  pointsExpiryMonths: 12,
  minRedemptionPoints: 100,
  birthdayBonusPoints: 200,
  welcomeBonusPoints: 100,
  referralBonusPoints: 200,
};

// ── Storage helpers ───────────────────────────────────────────────────────────

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

// ── Rewards CRUD ─────────────────────────────────────────────────────────────

export function getRewards(): LoyaltyReward[] { return loadRewards(); }

export function createReward(data: Omit<LoyaltyReward, "id" | "createdAt" | "redemptionCount">): LoyaltyReward[] {
  const list = loadRewards();
  const reward: LoyaltyReward = {
    ...data,
    id: `reward_${Date.now()}`,
    createdAt: new Date().toISOString(),
    redemptionCount: 0,
  };
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
