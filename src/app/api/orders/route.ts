import { NextRequest, NextResponse } from "next/server";
import type { StoredOrder } from "@/lib/orders";
import { serverOrders } from "@/lib/orders-server";
import { sendOrderEmail } from "@/lib/orders-gmail";

export async function GET() {
  return NextResponse.json(serverOrders);
}

export async function POST(req: NextRequest) {
  try {
    const order: StoredOrder = await req.json();
    if (!serverOrders.find((o) => o.id === order.id)) {
      serverOrders.unshift(order);
    }
    // Persist via Gmail so orders survive serverless cold starts and are visible cross-device.
    // Fire-and-forget — the response is sent immediately while the email sends in the background.
    sendOrderEmail(order).catch((e) =>
      console.error("[api/orders] Gmail send failed:", e)
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
