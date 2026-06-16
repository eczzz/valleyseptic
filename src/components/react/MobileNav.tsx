import { useEffect, useState } from "react";
import type { NavItem } from "../../config/site";

type Props = {
  nav: NavItem[];
  phone: string;
  phoneHref: string;
};

export default function MobileNav({ nav, phone, phoneHref }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1100) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <button
        type="button"
        className="mobile-nav-trigger"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`mnt-bar${open ? " is-open" : ""}`} />
        <span className={`mnt-bar mnt-bar--middle${open ? " is-open" : ""}`} />
        <span className={`mnt-bar mnt-bar--bottom${open ? " is-open" : ""}`} />
      </button>

      <div className={`mobile-nav-panel${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Mobile menu">
        <ul className="mobile-nav-list">
          {nav.map(item => (
            <li className="mobile-nav-item" key={item.label}>
              {item.children ? (
                <>
                  <button
                    type="button"
                    className={`mobile-nav-link mobile-nav-link--toggle${expanded === item.label ? " is-expanded" : ""}`}
                    onClick={() => setExpanded(e => (e === item.label ? null : item.label))}
                    aria-expanded={expanded === item.label}
                  >
                    {item.label}
                    <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
                      <path d="M0 0l7 8 7-8z" fill="currentColor" />
                    </svg>
                  </button>
                  <ul className={`mobile-nav-sub${expanded === item.label ? " is-expanded" : ""}`}>
                    {item.children.map(c => (
                      <li key={c.label}>
                        <a href={c.href} className="mobile-nav-sublink" onClick={() => setOpen(false)}>
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <a href={item.href} className="mobile-nav-link" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="mobile-nav-cta">
          <a href={phoneHref} className="btn btn-primary btn-lg">
            Call {phone}
          </a>
        </div>
      </div>

      <style>{`
        .mobile-nav-trigger {
          display: none;
          width: 44px;
          height: 44px;
          padding: 10px;
          background: transparent;
          border: 0;
          cursor: pointer;
          z-index: 120;
          position: relative;
        }
        .mnt-bar {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--c-ink);
          margin: 5px auto;
          transition: transform 250ms ease, opacity 250ms ease;
          transform-origin: center;
        }
        .mnt-bar.is-open { transform: translateY(7px) rotate(45deg); }
        .mnt-bar--middle.is-open { opacity: 0; }
        .mnt-bar--bottom.is-open { transform: translateY(-7px) rotate(-45deg); }

        .mobile-nav-panel {
          position: fixed;
          inset: 0;
          background: var(--c-white);
          padding: calc(var(--header-h-mobile) + 24px) 24px 32px;
          overflow-y: auto;
          transform: translateX(100%);
          transition: transform 300ms ease;
          z-index: 90;
        }
        .mobile-nav-panel.is-open { transform: translateX(0); }
        .mobile-nav-list {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
        }
        .mobile-nav-item { margin: 0; border-bottom: 1px solid var(--c-border); }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 4px;
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--c-ink);
          background: transparent;
          border: 0;
          cursor: pointer;
          text-decoration: none;
          text-align: left;
        }
        .mobile-nav-link svg { transition: transform 200ms; }
        .mobile-nav-link.is-expanded svg { transform: rotate(180deg); }
        .mobile-nav-sub {
          list-style: none;
          padding: 0 0 8px 12px;
          margin: 0;
          max-height: 0;
          overflow: hidden;
          transition: max-height 300ms ease;
        }
        .mobile-nav-sub.is-expanded { max-height: 600px; }
        .mobile-nav-sublink {
          display: block;
          padding: 10px 4px;
          font-size: 15px;
          color: var(--c-text);
          text-decoration: none;
        }
        .mobile-nav-sublink:hover { color: var(--c-primary); }
        .mobile-nav-cta { text-align: center; }

        @media (max-width: 1100px) {
          .mobile-nav-trigger { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; margin-left: auto; }
        }
      `}</style>
    </>
  );
}
