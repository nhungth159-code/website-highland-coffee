import { NextResponse } from "next/server";
import {
  serverOrders,
  gmailSyncing,
  setGmailSyncing,
  setLastGmailSync,
} from "@/lib/orders-server";
import { fetchOrdersFromGmail } from "@/lib/orders-gmail";

// Called once by the admin page on load to pull in orders placed from other devices.
// Waits for IMAP fetch to complete (up to ~12 s) then returns all known orders.
export async function GET() {
  if (!process.env.GMAIL_USER) {
    return NextResponse.json(serverOrders);
  }

  // Only one concurrent IMAP session — skip if already in progress
  if (!gmailSyncing) {
    setGmailSyncing(true);
    try {
      const gmailOrders = await fetchOrdersFromGmail();
      let added = 0;
      for (const order of gmailOrders) {
        if (!serverOrders.find((o) => o.id === order.id)) {
          serverOrders.push(order);
          added++;
        }
      }
      if (added > 0) {
        serverOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      setLastGmailSync(Date.now());
    } finally {
      setGmailSyncing(false);
    }
  }

  return NextResponse.json(serverOrders);
}
