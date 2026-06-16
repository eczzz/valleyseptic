// Contact-form handler — receives a submission from any ported fusion-form
// and relays it as an email through the SMTP2Go HTTP API.
//
// Netlify Function (v2). Reached at /.netlify/functions/contact.
//
// Env vars (Netlify → Site settings → Environment variables):
//   SMTP2GO_API_KEY   (required) the SMTP2Go API key
//   CONTACT_TO        (required) primary recipient email address
//   CONTACT_BCC       (optional) blind-copy address(es) — single email or a
//                     comma-separated list
//
// Spam handling: a hidden honeypot field (`hp_check`). Real users never see
// or fill it; bots that fill every field trip it and get a silent fake-200.
// The field is deliberately NOT named after a profile field, so browser
// autofill / password managers won't fill it for genuine visitors.

const SMTP2GO_ENDPOINT = "https://api.smtp2go.com/v3/email/send";

// Verified-domain From address. SMTP2Go requires the sending domain to be
// verified — valleyseptic.ca is.
const FROM = "Valley Septic Website <noreply@valleyseptic.ca>";
// Fallback recipient if CONTACT_TO is not configured.
const TO_FALLBACK = "info@valleyseptic.ca";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  // Accept JSON (the normal client path) or form-encoded (no-JS fallback).
  let body = {};
  const ctype = req.headers.get("content-type") || "";
  try {
    if (ctype.includes("application/json")) {
      body = await req.json();
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) body[k] = v;
    }
  } catch {
    return json({ ok: false, error: "Could not read the form submission." }, 400);
  }

  // Honeypot — if filled, it's a bot. Pretend success so it doesn't retry.
  if (typeof body.hp_check === "string" && body.hp_check.trim() !== "") {
    console.warn("contact: honeypot tripped — dropping submission");
    return json({ ok: true });
  }

  const clean = v => String(v ?? "").trim().slice(0, 5000);
  const name = clean(body.name);
  const email = clean(body.email);
  const message = clean(body.message);
  const phone = clean(body.phone);
  const city = clean(body.city);
  const address = clean(body.Address);
  const subject = clean(body.subject);

  if (!name || !email || !message) {
    return json({ ok: false, error: "Please fill in your name, email, and message." }, 422);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 422);
  }

  const apiKey = process.env.SMTP2GO_API_KEY;
  if (!apiKey) {
    console.error("contact: SMTP2GO_API_KEY is not set");
    return json({ ok: false, error: "The contact form isn't configured yet — please call us." }, 500);
  }

  const to = [(process.env.CONTACT_TO || TO_FALLBACK).trim()];
  // Optional blind-copy recipient(s) — single address or comma-separated list.
  const bcc = (process.env.CONTACT_BCC || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["City", city],
    ["Address", address],
    ["Subject", subject],
  ].filter(([, v]) => v);

  const textBody =
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nMessage:\n${message}\n\n— Sent from the valleyseptic.ca contact form`;

  const htmlBody =
    `<h2 style="font-family:Arial,sans-serif">New website enquiry</h2>` +
    `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
    rows.map(([k, v]) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#666"><strong>${escapeHtml(k)}</strong></td>` +
      `<td style="padding:4px 0">${escapeHtml(v)}</td></tr>`
    ).join("") +
    `</table>` +
    `<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">` +
    `<strong>Message:</strong><br>${escapeHtml(message)}</p>` +
    `<p style="font-family:Arial,sans-serif;font-size:12px;color:#999">Sent from the valleyseptic.ca contact form.</p>`;

  const payload = {
    sender: FROM,
    to,
    subject: subject ? `Website enquiry: ${subject}` : `Website enquiry from ${name}`,
    text_body: textBody,
    html_body: htmlBody,
    custom_headers: [{ header: "Reply-To", value: `${name} <${email}>` }],
  };
  if (bcc.length) payload.bcc = bcc;

  let result;
  try {
    const resp = await fetch(SMTP2GO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Smtp2go-Api-Key": apiKey,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });
    result = await resp.json().catch(() => ({}));
    if (resp.ok && result && result.data && result.data.succeeded >= 1) {
      return json({ ok: true });
    }
  } catch (e) {
    console.error("contact: SMTP2Go request failed", e);
    return json({ ok: false, error: "Sorry — your message couldn't be sent. Please call us or try again." }, 502);
  }

  console.error("contact: SMTP2Go did not accept the message", JSON.stringify(result));
  return json({ ok: false, error: "Sorry — your message couldn't be sent. Please call us or try again." }, 502);
};
