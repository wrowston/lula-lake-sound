import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "@convex/_generated/api";

export const runtime = "nodejs";

/** Default when `RESEND_FROM_EMAIL` is unset; must be on the verified Resend domain. */
const DEFAULT_RESEND_FROM = "Lula Lake Sound <noreply@lulalakesound.com>";

function resolveResendFrom(env: string | undefined): string {
  const trimmed = env?.trim();
  if (!trimmed) {
    return DEFAULT_RESEND_FROM;
  }
  if (trimmed.includes("yourdomain.com")) {
    console.warn("RESEND_FROM_EMAIL used placeholder domain; using default sender.");
    return DEFAULT_RESEND_FROM;
  }
  return trimmed;
}

const MAX_LEN = {
  artistName: 200,
  contactName: 200,
  email: 320,
  phone: 50,
  message: 10000,
} as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot: bots often fill hidden fields; accept quietly without sending mail or DB writes.
  const honeypot = body.website;
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return Response.json({ success: true });
  }

  const artistName = typeof body.artistName === "string" ? body.artistName.trim() : "";
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone =
    typeof body.phone === "string" && body.phone.trim().length > 0
      ? body.phone.trim()
      : undefined;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    !isNonEmptyString(artistName) ||
    artistName.length > MAX_LEN.artistName ||
    !isNonEmptyString(contactName) ||
    contactName.length > MAX_LEN.contactName ||
    !isNonEmptyString(email) ||
    email.length > MAX_LEN.email ||
    !isNonEmptyString(message) ||
    message.length > MAX_LEN.message
  ) {
    return Response.json(
      { success: false, message: "Please fill in all required fields correctly." },
      { status: 400 }
    );
  }

  if (phone && phone.length > MAX_LEN.phone) {
    return Response.json(
      { success: false, message: "Please shorten the phone number." },
      { status: 400 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL");
    return Response.json(
      { success: false, message: "Server configuration error." },
      { status: 500 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = resolveResendFrom(process.env.RESEND_FROM_EMAIL);
  const toEmail = process.env.CONTACT_TO_EMAIL ?? "info@lulalakesound.com";

  if (!resendKey) {
    console.error("Missing RESEND_API_KEY");
    return Response.json(
      { success: false, message: "Server configuration error." },
      { status: 500 }
    );
  }

  const convex = new ConvexHttpClient(convexUrl);

  try {
    await convex.mutation(api.inquiries.create, {
      artistName,
      contactName,
      email,
      phone,
      message,
    });
  } catch (err) {
    console.error("Convex mutation failed:", err);
    return Response.json(
      { success: false, message: "Could not save your inquiry. Please try again." },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);

  const text = [
    `Artist / Band: ${artistName}`,
    `Contact: ${contactName}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    "",
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
    <p><strong>Artist / Band:</strong> ${escapeHtml(artistName)}</p>
    <p><strong>Contact name:</strong> ${escapeHtml(contactName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `Artist inquiry from ${artistName}`,
      text,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        {
          success: false,
          message:
            "Your inquiry was saved but email delivery failed. Please email us directly at info@lulalakesound.com.",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Resend send failed:", err);
    return Response.json(
      {
        success: false,
        message:
          "Your inquiry was saved but email delivery failed. Please email us directly at info@lulalakesound.com.",
      },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
