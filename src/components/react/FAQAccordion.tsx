import { useState } from "react";

export type FAQ = { q: string; a: string };

export default function FAQAccordion({ items }: { items: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq-accordion">
      {items.map((it, i) => (
        <details
          key={i}
          className="faq-accordion__item"
          open={open === i}
          onToggle={e => {
            if ((e.currentTarget as HTMLDetailsElement).open) setOpen(i);
            else if (open === i) setOpen(null);
          }}
        >
          <summary className="faq-accordion__q">
            <span>{it.q}</span>
            <span className="faq-accordion__icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="faq-accordion__a" dangerouslySetInnerHTML={{ __html: it.a }} />
        </details>
      ))}
      <style>{`
        .faq-accordion { max-width: 880px; margin: 0 auto; }
        .faq-accordion__item {
          border-bottom: 1px solid var(--c-border);
          padding: 0;
        }
        .faq-accordion__q {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 0;
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 600;
          color: var(--c-ink);
          cursor: pointer;
          list-style: none;
        }
        .faq-accordion__q::-webkit-details-marker { display: none; }
        .faq-accordion__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--c-bg-alt);
          color: var(--c-primary);
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform 200ms ease, background 200ms ease;
        }
        .faq-accordion__item[open] .faq-accordion__icon {
          transform: rotate(45deg);
          background: var(--c-primary);
          color: var(--c-white);
        }
        .faq-accordion__a {
          padding: 0 0 20px;
          font-size: 16px;
          line-height: 1.75;
          color: var(--c-text);
        }
        .faq-accordion__a p:first-child { margin-top: 0; }
        .faq-accordion__a p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}
