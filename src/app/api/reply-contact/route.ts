import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

function buildReplyEmail(
  toName: string,
  subject: string,
  body: string,
  originalMessage: string,
  refId: string,
  agentName: string
): string {
  const bodyLines = body.replace(/\n/g, "<br>");
  const quotedLines = originalMessage.replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
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
        <tr><td style="background:#C8820A;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:44px 36px 36px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:#C8820A;">Reply from Highlands Coffee</p>
            <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-size:24px;color:#3B1F0A;font-weight:bold;line-height:1.3;">
              ${subject}
            </h1>

            <p style="margin:0 0 6px;font-family:sans-serif;font-size:15px;color:#3B1F0A;">Hi <strong>${toName}</strong>,</p>

            <!-- Reply body -->
            <div style="font-family:sans-serif;font-size:15px;color:rgba(59,31,10,0.8);line-height:1.75;margin:16px 0 28px;">
              ${bodyLines}
            </div>

            <!-- Signature -->
            <p style="margin:0 0 4px;font-family:sans-serif;font-size:14px;color:#3B1F0A;">Warm regards,</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#3B1F0A;">${agentName}</p>
            <p style="margin:4px 0 0;font-family:sans-serif;font-size:12px;color:rgba(59,31,10,0.4);">Customer Support · Highlands Coffee Corporation</p>

            <!-- Quoted original -->
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(59,31,10,0.08);">
              <p style="margin:0 0 10px;font-family:sans-serif;font-size:11px;font-weight:600;color:rgba(59,31,10,0.35);text-transform:uppercase;letter-spacing:0.2em;">Your original message · ${refId}</p>
              <div style="border-left:3px solid #C8820A;padding:12px 16px;background:#FAF6EF;">
                <p style="margin:0;font-family:sans-serif;font-size:13px;color:rgba(59,31,10,0.55);line-height:1.7;">${quotedLines}</p>
              </div>
            </div>
          </td>
        </tr>

        <tr><td style="background:#3B1F0A;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="background:#1A0D00;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:rgba(250,246,239,0.3);">
              © 2026 Highlands Coffee Corporation · This is a reply to your enquiry ref ${refId}.
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
    return NextResponse.json({ skipped: true, reason: "Email not configured" });
  }

  let toName: string,
    toEmail: string,
    subject: string,
    body: string,
    originalMessage: string,
    refId: string,
    agentName: string;

  try {
    ({ toName, toEmail, subject, body, originalMessage, refId, agentName } =
      await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!toName || !toEmail || !subject || !body || !refId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"Highlands Coffee Support" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `Re: [${refId}] ${subject}`,
      html: buildReplyEmail(toName, subject, body, originalMessage, refId, agentName || "Highlands Coffee Team"),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reply mail error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
