import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export interface InboundReply {
  recordId: string;
  recordType: "contact" | "application";
  fromEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
  emailMessageId: string;
}

// Strip quoted content from reply body — keeps only the new text above
function extractReplyText(raw: string): string {
  const separators = [
    /^On .{10,120}wrote:/m,
    /^-{3,}\s*Original Message\s*-{3,}/mi,
    /^_{3,}\s*$/m,
    /^From:\s+\S/m,
  ];

  let text = raw;
  for (const sep of separators) {
    const match = text.match(sep);
    if (match?.index !== undefined) {
      text = text.slice(0, match.index);
      break;
    }
  }

  // Drop lines starting with > (email quote markers)
  text = text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .trim();

  return text || raw.trim();
}

export async function GET() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return NextResponse.json({ skipped: true, replies: [] });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    logger: false,
  });

  const replies: InboundReply[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      // Find emails not sent by ourselves since last 30 days
      const uids = await client.search(
        { since, not: { from: GMAIL_USER } },
        { uid: true }
      );

      if (Array.isArray(uids) && uids.length > 0) {
        for await (const msg of client.fetch(
          uids,
          { source: true },
          { uid: true }
        )) {
          try {
            if (!msg.source) continue;
            const parsed = await simpleParser(msg.source);
            const subject = parsed.subject ?? "";

            // Match [CTT-XXXXXXXX] or [APP-XXXXXX] in subject
            const match = subject.match(/\[(CTT-[A-Z0-9]+|APP-\d+)\]/i);
            if (!match) continue;

            const recordId = match[1].toUpperCase();
            const recordType: "contact" | "application" = recordId.startsWith("CTT-")
              ? "contact"
              : "application";

            const fromAddress =
              parsed.from?.value?.[0]?.address ?? "unknown@unknown.com";

            // Skip our own emails (belt & suspenders)
            if (fromAddress.toLowerCase() === GMAIL_USER.toLowerCase()) continue;

            const htmlVal = typeof parsed.html === "string" ? parsed.html : "";
            const rawText = parsed.text ?? (htmlVal ? htmlVal.replace(/<[^>]+>/g, " ") : "") ?? "";
            const body = extractReplyText(rawText);
            if (!body) continue;

            replies.push({
              recordId,
              recordType,
              fromEmail: fromAddress,
              subject,
              body,
              receivedAt: (parsed.date ?? new Date()).toISOString(),
              emailMessageId: parsed.messageId ?? `${Date.now()}-${Math.random()}`,
            });
          } catch {
            // Skip unparseable messages
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("IMAP fetch error:", err);
    return NextResponse.json({ error: String(err), replies: [] }, { status: 500 });
  }

  return NextResponse.json({ replies });
}
