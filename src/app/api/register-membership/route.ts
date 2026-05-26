import { NextRequest, NextResponse } from "next/server";
import { getSection, setSection } from "@/lib/admin-store";
import type { LoyaltyCustomer, StarTransaction } from "@/lib/loyalty";

const CUSTOMERS_KEY = "loyalty_customers";
const TRANSACTIONS_KEY = "loyalty_transactions";
const WELCOME_BONUS = 100;

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

function isValidPhone(phone: string): boolean {
  return /^(0|\+84)[3-9]\d{8}$/.test(phone);
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("phone");
  if (!raw) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  const phone = normalizePhone(raw);
  const customers = (await getSection(CUSTOMERS_KEY)) as LoyaltyCustomer[];
  const customer = customers.find((c) => c.phone === phone);

  return NextResponse.json(customer ? { found: true, customer } : { found: false });
}

export async function POST(req: NextRequest) {
  let body: { phone?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!phone || !name) {
    return NextResponse.json({ error: "Phone and name are required" }, { status: 400 });
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid Vietnamese phone number (e.g. 0912 345 678)" },
      { status: 422 }
    );
  }

  const customers = (await getSection(CUSTOMERS_KEY)) as LoyaltyCustomer[];
  if (customers.find((c) => c.phone === phone)) {
    return NextResponse.json(
      { error: "This phone number is already registered" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const customer: LoyaltyCustomer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    phone,
    name,
    email,
    starsBalance: WELCOME_BONUS,
    starsEarned: WELCOME_BONUS,
    starsRedeemed: 0,
    tier: "Bronze",
    totalSpend: 0,
    orderCount: 0,
    joinDate: now.slice(0, 10),
    lastActivity: now,
    createdAt: now,
  };

  const welcomeTxn: StarTransaction = {
    id: `txn_${Date.now()}`,
    customerId: customer.id,
    type: "earn",
    stars: WELCOME_BONUS,
    description: "Welcome bonus — new member",
    createdAt: now,
  };

  await setSection(CUSTOMERS_KEY, [customer, ...customers]);
  const transactions = (await getSection(TRANSACTIONS_KEY)) as StarTransaction[];
  await setSection(TRANSACTIONS_KEY, [welcomeTxn, ...transactions]);

  return NextResponse.json({ success: true, customer });
}
