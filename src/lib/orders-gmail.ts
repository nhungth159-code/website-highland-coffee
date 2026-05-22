import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { StoredOrder } from "./orders";

export const SUBJECT_TAG = "[HC-ORDER]";
const IMAP_TIMEOUT_MS = 20_000;

export async function sendOrderEmail(order: StoredOrder): Promise<void> {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: GMAIL_USER,
    to: GMAIL_USER,
    subject: `${SUBJECT_TAG} ${order.id}`,
    // Plain text body = raw JSON so we can parse it back exactly
    text: JSON.stringify(order),
  });
}

export async function fetchOrdersFromGmail(): Promise<StoredOrder[]> {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return [];

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    logger: false,
  });

  const orders: StoredOrder[] = [];

  // Hard timeout so a slow IMAP connection doesn't block the admin forever
  const timeout = new Promise<StoredOrder[]>((resolve) =>
    setTimeout(() => resolve([]), IMAP_TIMEOUT_MS)
  );

  const fetch = async (): Promise<StoredOrder[]> => {
    try {
      await client.connect();
      // Search All Mail so we find orders regardless of whether Gmail put them in
      // Inbox, Sent, Spam, or Promotions — cloud IPs often trigger spam filters.
      const lock = await client.getMailboxLock("[Gmail]/All Mail");

      try {
        const since = new Date();
        since.setDate(since.getDate() - 90);

        // Match by subject tag — more reliable than from-address matching
        const uids = await client.search(
          { since, subject: SUBJECT_TAG },
          { uid: true }
        );

        if (Array.isArray(uids) && uids.length > 0) {
          for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
            try {
              if (!msg.source) continue;
              const parsed = await simpleParser(msg.source);
              const subject = parsed.subject ?? "";
              if (!subject.includes(SUBJECT_TAG)) continue;

              const text = (parsed.text ?? "").trim();
              const order: StoredOrder = JSON.parse(text);
              if (order.id && order.createdAt && order.customer) {
                orders.push(order);
              }
            } catch {
              // Skip unparseable or non-order messages
            }
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
    } catch (err) {
      console.error("[orders-gmail] IMAP fetch error:", err);
    }

    return orders;
  };

  return Promise.race([fetch(), timeout]);
}
