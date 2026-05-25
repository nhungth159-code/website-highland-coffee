import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

function buildEmail(
  recipientName: string,
  senderName: string,
  amount: number,
  code: string,
  message: string,
  tier: string,
): string {
  const formatted = `${amount.toLocaleString("vi-VN")}₫`;

  // Gradient colours per tier
  const gradients: Record<string, { from: string; to: string; accent: string }> = {
    Starter: { from: "#3B1F0A", to: "#6B3A1F", accent: "#C8820A" },
    Classic: { from: "#1A0D00", to: "#3B1F0A", accent: "#D4960F" },
    Premium: { from: "#C8820A", to: "#8B5A05", accent: "#FAF6EF" },
    Gold:    { from: "#2D5016", to: "#1A3009", accent: "#C8820A" },
  };
  const g = gradients[tier] ?? gradients["Classic"];

  const messageBlock = message
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td style="background:#FAF6EF;border-left:4px solid #C8820A;padding:18px 20px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:12px;font-weight:600;color:#C8820A;letter-spacing:0.1em;text-transform:uppercase;">A note from ${senderName}</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#3B1F0A;line-height:1.7;font-style:italic;">"${message}"</p>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#FAF6EF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EF;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#3B1F0A;padding:24px 36px;">
            <span style="color:#ffffff;font-family:Georgia,serif;font-size:22px;font-weight:bold;letter-spacing:0.25em;">HIGHLANDS</span>
            <span style="color:rgba(255,255,255,0.35);font-family:sans-serif;font-size:11px;margin-left:12px;letter-spacing:0.2em;text-transform:uppercase;">Coffee</span>
          </td>
        </tr>

        <!-- Amber accent -->
        <tr><td style="background:#C8820A;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Gift card visual -->
        <tr>
          <td style="background:#ffffff;padding:36px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:linear-gradient(135deg,${g.from} 0%,${g.to} 100%);border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:32px;">
                  <!-- Top row -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:18px;font-weight:bold;letter-spacing:0.2em;">HIGHLANDS</p>
                        <p style="margin:4px 0 0;color:${g.accent};font-family:sans-serif;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;">Coffee · Gift Card</p>
                      </td>
                      <td align="right">
                        <p style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:28px;font-weight:bold;">${formatted}</p>
                        <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-family:sans-serif;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;">${tier}</p>
                      </td>
                    </tr>
                  </table>
                  <!-- Bottom row -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-family:sans-serif;font-size:11px;">For ${recipientName}</p>
                        <p style="margin:0;color:rgba(255,255,255,0.35);font-family:monospace;font-size:16px;font-weight:bold;letter-spacing:0.25em;">${code}</p>
                        <p style="margin:6px 0 0;color:rgba(255,255,255,0.35);font-family:sans-serif;font-size:10px;">From ${senderName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 36px 40px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:#C8820A;">You've received a gift!</p>
            <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-size:28px;color:#3B1F0A;font-weight:bold;line-height:1.2;">
              ${senderName} sent you<br>a Highlands Gift Card
            </h1>

            <p style="margin:0 0 18px;font-family:sans-serif;font-size:15px;color:#3B1F0A;line-height:1.7;">
              Hi <strong>${recipientName}</strong>,
            </p>
            <p style="margin:0 0 18px;font-family:sans-serif;font-size:15px;color:rgba(59,31,10,0.75);line-height:1.7;">
              You've been gifted a <strong style="color:#3B1F0A;">Highlands Coffee Gift Card</strong> worth <strong style="color:#C8820A;">${formatted}</strong>. Use it at any of our 500+ stores nationwide or when ordering online — no expiry, no fuss.
            </p>

            ${messageBlock}

            <!-- Code box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td align="center" style="background:#1A0D00;border-radius:12px;padding:28px;">
                  <p style="margin:0 0 8px;font-family:sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:rgba(250,246,239,0.45);">Your Gift Card Code</p>
                  <p style="margin:0;font-family:monospace;font-size:28px;font-weight:bold;color:#C8820A;letter-spacing:0.2em;">${code}</p>
                  <p style="margin:10px 0 0;font-family:sans-serif;font-size:12px;color:rgba(250,246,239,0.35);">Redeem in any Highlands store or online at checkout</p>
                </td>
              </tr>
            </table>

            <!-- How to redeem -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#FAF6EF;border-left:4px solid #C8820A;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-family:sans-serif;font-size:13px;font-weight:600;color:#3B1F0A;">How to redeem</p>
                  <p style="margin:0 0 10px;font-family:sans-serif;font-size:13px;font-weight:600;color:#C8820A;letter-spacing:0.05em;">In store</p>
                  <p style="margin:0 0 12px;font-family:sans-serif;font-size:14px;color:rgba(59,31,10,0.65);line-height:1.7;">
                    1. Visit any Highlands Coffee store nationwide.<br>
                    2. Order your favourite drinks or food.<br>
                    3. Show the code at the counter — your balance is deducted instantly.
                  </p>
                  <p style="margin:0 0 10px;font-family:sans-serif;font-size:13px;font-weight:600;color:#C8820A;letter-spacing:0.05em;">Online</p>
                  <p style="margin:0;font-family:sans-serif;font-size:14px;color:rgba(59,31,10,0.65);line-height:1.7;">
                    1. Place an order on the Highlands Coffee website.<br>
                    2. At checkout, select <strong style="color:#3B1F0A;">Gift Card</strong> as your payment method.<br>
                    3. Enter the code above — your balance is applied automatically.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px;font-family:sans-serif;font-size:14px;color:#3B1F0A;">With warmth,</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#3B1F0A;">The Highlands Coffee Team</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#3B1F0A;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A0D00;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:rgba(250,246,239,0.3);">
              © 2026 Highlands Coffee Corporation · Redeemable in-store and online · No cash value · No expiry
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("Email env vars not configured — skipping gift card email.");
    return NextResponse.json({ skipped: true, reason: "Email not configured" });
  }

  let recipientName: string,
    recipientEmail: string,
    senderName: string,
    amount: number,
    code: string,
    message: string,
    tier: string;

  try {
    ({ recipientName, recipientEmail, senderName, amount, code, message, tier } =
      await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!recipientName || !recipientEmail || !senderName || !amount || !code || !tier) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"Highlands Coffee" <${GMAIL_USER}>`,
      to: recipientEmail,
      subject: `${senderName} sent you a Highlands Coffee Gift Card 🎁`,
      html: buildEmail(recipientName, senderName, amount, code, message ?? "", tier),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gift card mail error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
