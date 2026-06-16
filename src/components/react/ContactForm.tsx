import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm({ topic = "general" }: { topic?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    // TODO: wire to backend (Formspree, Netlify Forms, Resend, etc.)
    // Current behavior: pretend success after a moment so the UI is testable.
    await new Promise(r => setTimeout(r, 700));
    console.log("[contact-form] submission (no backend wired):", { topic, ...data });
    setStatus("success");
    setMessage("Thanks — we've received your request and will be in touch shortly.");
    form.reset();
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="topic" value={topic} />
      <div className="contact-form__grid">
        <label className="cf-field">
          <span className="cf-label">Your Name *</span>
          <input type="text" name="name" required autoComplete="name" placeholder="Your Name" />
        </label>
        <label className="cf-field">
          <span className="cf-label">Email *</span>
          <input type="email" name="email" required autoComplete="email" placeholder="Email" />
        </label>
        <label className="cf-field">
          <span className="cf-label">City</span>
          <input type="text" name="city" autoComplete="address-level2" placeholder="City" />
        </label>
        <label className="cf-field">
          <span className="cf-label">Phone Number</span>
          <input type="tel" name="phone" autoComplete="tel" placeholder="Phone Number" />
        </label>
        <label className="cf-field cf-field--full">
          <span className="cf-label">Address (Optional)</span>
          <input type="text" name="address" autoComplete="street-address" placeholder="Address (Optional)" />
        </label>
        <label className="cf-field cf-field--full">
          <span className="cf-label">Subject</span>
          <input type="text" name="subject" placeholder="Subject" />
        </label>
        <label className="cf-field cf-field--full">
          <span className="cf-label">Message *</span>
          <textarea name="message" required rows={6} placeholder="Tell us about your septic needs..." />
        </label>
      </div>
      <button type="submit" className="btn btn-primary btn-lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Submit"}
      </button>
      {status === "success" && <p className="cf-message cf-message--success">{message}</p>}
      {status === "error" && <p className="cf-message cf-message--error">{message}</p>}
      <style>{`
        .contact-form { max-width: 720px; }
        .contact-form__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .cf-field { display: flex; flex-direction: column; gap: 6px; }
        .cf-field--full { grid-column: 1 / -1; }
        .cf-label {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--c-ink);
        }
        .cf-field input,
        .cf-field textarea {
          width: 100%;
          padding: 14px 16px;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--c-ink);
          background: var(--c-white);
          border: 1px solid var(--c-border);
          border-radius: var(--radius-sm);
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .cf-field input:focus,
        .cf-field textarea:focus {
          outline: none;
          border-color: var(--c-primary);
          box-shadow: 0 0 0 3px rgba(175, 143, 97, 0.18);
        }
        .cf-field textarea { resize: vertical; min-height: 120px; }
        .cf-message {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
        }
        .cf-message--success { background: #e6f7e6; color: #2a6a2a; border: 1px solid #b8e0b8; }
        .cf-message--error { background: #fdecea; color: #a23c39; border: 1px solid #f5b5b1; }
        @media (max-width: 640px) {
          .contact-form__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </form>
  );
}
