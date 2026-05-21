import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

// ── Shared layout helpers ────────────────────────────────────────────────────
function infoBox(heading: string, body: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#FAF6EF;border-left:4px solid #C8820A;padding:16px 20px;">
          <p style="margin:0 0 6px;font-family:sans-serif;font-size:13px;font-weight:600;color:#3B1F0A;">${heading}</p>
          <p style="margin:0;font-family:sans-serif;font-size:14px;color:rgba(59,31,10,0.65);line-height:1.7;">${body}</p>
        </td>
      </tr>
    </table>`;
}

function wrap(
  statusLabel: string,
  accentColor: string,
  headline: string,
  bodyHtml: string,
  teamName: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF6EF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EF;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#3B1F0A;padding:24px 36px;">
            <span style="color:#fff;font-family:Georgia,serif;font-size:22px;font-weight:bold;letter-spacing:0.25em;">HIGHLANDS</span>
            <span style="color:rgba(255,255,255,0.35);font-family:sans-serif;font-size:11px;margin-left:12px;letter-spacing:0.2em;text-transform:uppercase;">Coffee</span>
          </td>
        </tr>
        <tr><td style="background:${accentColor};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="background:#fff;padding:44px 36px 36px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:${accentColor};">${statusLabel}</p>
            <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#3B1F0A;font-weight:bold;line-height:1.25;">${headline}</h1>
            <div style="font-family:sans-serif;font-size:15px;color:#3B1F0A;line-height:1.75;">${bodyHtml}</div>
            <p style="margin:32px 0 4px;font-family:sans-serif;font-size:14px;color:#3B1F0A;">Warm regards,</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#3B1F0A;">${teamName}</p>
            <p style="margin:4px 0 0;font-family:sans-serif;font-size:12px;color:rgba(59,31,10,0.4);">Talent &amp; People · Highlands Coffee Corporation</p>
          </td>
        </tr>
        <tr><td style="background:#3B1F0A;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="background:#1A0D00;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:rgba(250,246,239,0.3);">
              © 2026 Highlands Coffee Corporation · This email relates to your job application.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Per-status templates ─────────────────────────────────────────────────────
function buildReviewingEmail(name: string, jobTitle: string, appId: string): string {
  return wrap(
    "Application Update",
    "#C8820A",
    "Your application is<br>under review",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Great news — our Talent team has started reviewing your application for the <strong>${jobTitle}</strong> position.</p>
     ${infoBox("What this means", `A member of our team is carefully reading through your application and will be in touch with next steps. This stage typically takes <strong>3–5 business days</strong>.`)}
     <p style="color:rgba(59,31,10,0.6);font-size:14px;">Your application reference: <strong style="font-family:monospace;color:#3B1F0A;">${appId}</strong></p>`,
    "The Highlands Talent Team"
  );
}

function buildInterviewedEmail(name: string, jobTitle: string, appId: string): string {
  return wrap(
    "You've Been Shortlisted",
    "#C8820A",
    "Congratulations —<br>you're moving forward!",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We're thrilled to let you know that you've been shortlisted for the <strong>${jobTitle}</strong> role at Highlands Coffee. This is an exciting step — our team was genuinely impressed with your application.</p>
     ${infoBox("What happens next", `A member of our Talent team will contact you within <strong>2 business days</strong> to schedule your interview and share details about the format, location or video link, and what to prepare.`)}
     <p style="color:rgba(59,31,10,0.6);font-size:14px;">Please keep your reference number handy: <strong style="font-family:monospace;color:#3B1F0A;">${appId}</strong></p>
     <p>In the meantime, feel free to explore our story on <a href="https://website-highland-coffee.vercel.app/sustainability" style="color:#C8820A;">Sustainability</a> and <a href="https://website-highland-coffee.vercel.app" style="color:#C8820A;">our website</a> — we'd love for you to get to know us better before we meet.</p>`,
    "The Highlands Talent Team"
  );
}

function buildHiredEmail(name: string, jobTitle: string, appId: string): string {
  return wrap(
    "Offer Extended",
    "#2D5016",
    "Welcome to the<br>Highlands family!",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We are absolutely delighted to offer you the position of <strong>${jobTitle}</strong> at Highlands Coffee. After a thorough process, you stood out — and we can't wait to have you on the team.</p>
     ${infoBox("Your next steps", `Our People team will reach out within <strong>1–2 business days</strong> with your official offer letter, start date, onboarding schedule, and everything you'll need for your first day. Please confirm your acceptance by replying to that email.`)}
     <p>This is just the beginning of something great. Highlands Coffee is built on the passion of people like you, and we're proud to welcome you aboard.</p>
     <p style="color:rgba(59,31,10,0.6);font-size:14px;">Reference: <strong style="font-family:monospace;color:#3B1F0A;">${appId}</strong></p>`,
    "The Highlands People Team"
  );
}

function buildRejectedEmail(name: string, jobTitle: string, appId: string): string {
  return wrap(
    "Application Update",
    "#3B1F0A",
    "Thank you for your<br>time and interest",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position at Highlands Coffee. We genuinely appreciate your interest in joining our team.</p>
     <p style="color:rgba(59,31,10,0.65);">After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. This was not an easy decision — the standard of applications we received was high.</p>
     ${infoBox("Keep the door open", `We encourage you to apply again in the future as new opportunities arise. You can view all current openings at any time on our <a href="https://website-highland-coffee.vercel.app/careers" style="color:#C8820A;">Careers page</a>.`)}
     <p style="color:rgba(59,31,10,0.6);font-size:14px;">Reference: <strong style="font-family:monospace;color:#3B1F0A;">${appId}</strong></p>
     <p>We wish you the very best in your job search and future endeavours.</p>`,
    "The Highlands Talent Team"
  );
}

// ── Template dispatcher ──────────────────────────────────────────────────────
function buildEmail(
  status: string,
  name: string,
  jobTitle: string,
  appId: string
): { subject: string; html: string } | null {
  switch (status) {
    case "reviewing":
      return {
        subject: `Application Update · [${appId}] Under Review — ${jobTitle} · Highlands Coffee`,
        html: buildReviewingEmail(name, jobTitle, appId),
      };
    case "interviewed":
      return {
        subject: `Application Update · [${appId}] Shortlisted — ${jobTitle} · Highlands Coffee`,
        html: buildInterviewedEmail(name, jobTitle, appId),
      };
    case "hired":
      return {
        subject: `Application Update · [${appId}] Offer — ${jobTitle} · Highlands Coffee`,
        html: buildHiredEmail(name, jobTitle, appId),
      };
    case "rejected":
      return {
        subject: `Application Update · [${appId}] — ${jobTitle} · Highlands Coffee`,
        html: buildRejectedEmail(name, jobTitle, appId),
      };
    default:
      return null;
  }
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("Email env vars not configured — skipping status email.");
    return NextResponse.json({ skipped: true });
  }

  let name: string, email: string, jobTitle: string, appId: string, status: string;
  try {
    ({ name, email, jobTitle, appId, status } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name || !email || !jobTitle || !appId || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const template = buildEmail(status, name, jobTitle, appId);
  if (!template) {
    return NextResponse.json({ skipped: true, reason: "No email for this status" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"Highlands Coffee Careers" <${GMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Status email error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
