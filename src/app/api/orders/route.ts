import { NextRequest, NextResponse } from "next/server";
import type { StoredOrder } from "@/lib/orders";
import { serverOrders } from "@/lib/orders-server";

export async function GET() {
  return NextResponse.json(serverOrders);
}

export async function POST(req: NextRequest) {
  try {
    const order: StoredOrder = await req.json();
    if (!serverOrders.find((o) => o.id === order.id)) {
      serverOrders.unshift(order);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
