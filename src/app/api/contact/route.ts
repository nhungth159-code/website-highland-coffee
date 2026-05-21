import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

// ── Per-subject config ──────────────────────────────────────────────────────
const SUBJECT_CONFIG: Record<
  string,
  { teamName: string; replyTime: string; bodyHtml: (name: string, refId: string) => string }
> = {
  "General Enquiry": {
    teamName: "Highlands Coffee Team",
    replyTime: "1 business day",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thanks for reaching out! We've received your enquiry and a member of our team will get back to you shortly.</p>
      ${infoBox("What to expect", `We aim to respond to all general enquiries within <strong>1 business day</strong>. Your reference number is <code>${refId}</code>.`)}
      <p>In the meantime, you might find an answer in our <a href="https://website-highland-coffee.vercel.app/faqs" style="color:#C8820A;">FAQs</a>.</p>`,
  },

  "Customer Feedback": {
    teamName: "Customer Experience Team",
    replyTime: "2 business days",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for taking the time to share your feedback — it genuinely shapes how we improve every cup and every visit. We read every message carefully.</p>
      ${infoBox("Your feedback matters", `Our Customer Experience team will review your comments and follow up within <strong>2 business days</strong>. Reference: <code>${refId}</code>.`)}
      <p>If you'd like to discuss your experience sooner, please call our hotline at <strong>1800 6567</strong> (Mon–Sun, 07:00–22:00).</p>`,
  },

  "Order Issue": {
    teamName: "Customer Care Team",
    replyTime: "4 business hours",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We're sorry to hear you experienced an issue with your order. Our Customer Care team is already looking into it and we'll get this resolved for you as quickly as possible.</p>
      ${infoBox("What happens next", `A care specialist will contact you within <strong>4 business hours</strong> with an update or resolution. Please keep your order details handy. Your case reference is <code>${refId}</code>.`)}
      <p>For urgent issues, please call <strong>1800 6567</strong> directly and quote your reference number.</p>`,
  },

  "Franchise & Partnership": {
    teamName: "Partnerships Team",
    replyTime: "3 business days",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for your interest in partnering with Highlands Coffee. We're always excited to explore meaningful collaborations that align with our brand values.</p>
      ${infoBox("Next steps", `Our Partnerships team will review your enquiry and reach out within <strong>3 business days</strong>. To help us prepare, please have your business registration documents and proposal ready. Reference: <code>${refId}</code>.`)}
      <p>You can also email us directly at <a href="mailto:partners@highlandscoffee.vn" style="color:#C8820A;">partners@highlandscoffee.vn</a> for quicker follow-up.</p>`,
  },

  "Press & Media": {
    teamName: "Press & Communications Team",
    replyTime: "1 business day",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for your press enquiry. Our Communications team keeps a close eye on all media requests and will be in touch promptly.</p>
      ${infoBox("Press resources", `For urgent requests, our Press team responds within <strong>1 business day</strong>. Brand assets, executive bios, and fact sheets are available on request. Reference: <code>${refId}</code>.`)}
      <p>For immediate needs, contact <a href="mailto:press@highlandscoffee.vn" style="color:#C8820A;">press@highlandscoffee.vn</a> directly.</p>`,
  },

  "Careers": {
    teamName: "Talent & People Team",
    replyTime: "2 business days",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for your interest in joining the Highlands Coffee family! We're always looking for passionate people who love coffee and great service.</p>
      ${infoBox("Explore open roles", `Our Talent team will be in touch within <strong>2 business days</strong>. In the meantime, browse all current openings on our <a href="https://website-highland-coffee.vercel.app/careers" style="color:#C8820A;">Careers page</a> and apply directly. Reference: <code>${refId}</code>.`)}
      <p>We look forward to learning more about you!</p>`,
  },

  "Sustainability": {
    teamName: "Sustainability Team",
    replyTime: "3 business days",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for your sustainability enquiry. This is a topic deeply close to our hearts — from our farming partnerships in the Central Highlands to our zero-waste packaging goals.</p>
      ${infoBox("Our commitment", `Our Sustainability team will respond within <strong>3 business days</strong>. You can also explore our full impact story on the <a href="https://website-highland-coffee.vercel.app/sustainability" style="color:#C8820A;">Sustainability page</a>. Reference: <code>${refId}</code>.`)}
      <p>For NGO collaborations or ESG reporting enquiries, reach us at <a href="mailto:green@highlandscoffee.vn" style="color:#C8820A;">green@highlandscoffee.vn</a>.</p>`,
  },

  "Other": {
    teamName: "Highlands Coffee Team",
    replyTime: "2 business days",
    bodyHtml: (name, refId) => `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thanks for getting in touch. We've received your message and will make sure it reaches the right person on our team.</p>
      ${infoBox("What to expect", `We'll get back to you within <strong>2 business days</strong>. Your reference number is <code>${refId}</code>.`)}
      <p>If your matter is urgent, please call our hotline at <strong>1800 6567</strong> (Mon–Sun, 07:00–22:00).</p>`,
  },
};

// ── Shared components ───────────────────────────────────────────────────────
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

function buildEmail(name: string, subject: string, refId: string): string {
  const config = SUBJECT_CONFIG[subject] ?? SUBJECT_CONFIG["Other"];
  const bodyHtml = config.bodyHtml(name, refId);

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
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:#C8820A;">${subject}</p>
            <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#3B1F0A;font-weight:bold;line-height:1.25;">
              We've received<br>your message
            </h1>

            <div style="font-family:sans-serif;font-size:15px;color:#3B1F0A;line-height:1.75;">
              ${bodyHtml}
            </div>

            <p style="margin:32px 0 4px;font-family:sans-serif;font-size:14px;color:#3B1F0A;">Warm regards,</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#3B1F0A;">${config.teamName}</p>
            <p style="margin:4px 0 0;font-family:sans-serif;font-size:12px;color:rgba(59,31,10,0.4);">Highlands Coffee Corporation</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#3B1F0A;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A0D00;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-family:sans-serif;font-size:11px;color:rgba(250,246,239,0.3);">
              © 2026 Highlands Coffee Corporation · This email was sent because you contacted us via highlandscoffee.vn
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Route handler ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("Email env vars not configured — skipping contact confirmation email.");
    return NextResponse.json({ skipped: true });
  }

  let name: string, email: string, subject: string, refId: string;
  try {
    ({ name, email, subject, refId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name || !email || !subject || !refId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"Highlands Coffee" <${GMAIL_USER}>`,
      to: email,
      subject: `Message Received · [${refId}] ${subject} — Highlands Coffee`,
      html: buildEmail(name, subject, refId),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact mail error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
