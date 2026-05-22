import { NextRequest, NextResponse } from "next/server";
import { serverOrders } from "@/lib/orders-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const patch = await req.json();
    const idx = serverOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      serverOrders[idx] = { ...serverOrders[idx], ...patch };
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
