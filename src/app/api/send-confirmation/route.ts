import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

function buildEmail(name: string, jobTitle: string, appId: string): string {
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

        <!-- Amber accent -->
        <tr><td style="background:#C8820A;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:44px 36px 36px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:#C8820A;">Application Received</p>
            <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-size:28px;color:#3B1F0A;font-weight:bold;line-height:1.2;">
              We've got your<br>application!
            </h1>

            <p style="margin:0 0 18px;font-family:sans-serif;font-size:15px;color:#3B1F0A;line-height:1.7;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="margin:0 0 18px;font-family:sans-serif;font-size:15px;color:rgba(59,31,10,0.75);line-height:1.7;">
              Thank you for applying for the <strong style="color:#3B1F0A;">${jobTitle}</strong> position at Highlands Coffee. We're excited to learn more about you!
            </p>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="background:#FAF6EF;border-left:4px solid #C8820A;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-family:sans-serif;font-size:13px;font-weight:600;color:#3B1F0A;">What happens next?</p>
                  <p style="margin:0;font-family:sans-serif;font-size:14px;color:rgba(59,31,10,0.65);line-height:1.7;">
                    Our talent team will carefully review your application and reach out to you within <strong style="color:#3B1F0A;">3–5 business days</strong>.
                    If you're shortlisted, we'll contact you to schedule the next steps.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 18px;font-family:sans-serif;font-size:14px;color:rgba(59,31,10,0.55);line-height:1.7;">
              Your application reference number is <strong style="font-family:monospace;color:#3B1F0A;">${appId}</strong>. Keep this for your records.
            </p>

            <p style="margin:0 0 4px;font-family:sans-serif;font-size:14px;color:#3B1F0A;">Warm regards,</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#3B1F0A;">The Highlands Coffee Team</p>
            <p style="margin:4px 0 0;font-family:sans-serif;font-size:12px;color:rgba(59,31,10,0.4);">Talent &amp; People · Highlands Coffee Corporation</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#3B1F0A;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A0D00;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:rgba(250,246,239,0.3);">
              © 2026 Highlands Coffee Corporation · This email was sent because you submitted a job application.
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
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let name: string, email: string, jobTitle: string, appId: string;
  try {
    ({ name, email, jobTitle, appId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name || !email || !jobTitle || !appId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await resend.emails.send({
    from: "Highlands Coffee Careers <onboarding@resend.dev>",
    to: email,
    subject: `We received your application — Highlands Coffee`,
    html: buildEmail(name, jobTitle, appId),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
