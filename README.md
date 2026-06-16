# Valley Septic — Astro Site

A near-pixel-perfect replica of [valleyseptic.ca](https://valleyseptic.ca/), rebuilt as a static Astro site with React islands for interactivity. No WordPress dependency at runtime.

## Project layout

```
src/
  components/
    global/       # Header, Footer
    sections/     # Hero, ServicesGrid, FeatureList, CtaBanner, ImageText,
                  # ServiceAreasBlock, BlogTeasers, PageHeader, ContactSection,
                  # ProseContent
    react/        # MobileNav, ContactForm, SepticCalculator, FAQAccordion
  config/
    site.ts       # SITE constants + NAV structure
  data/
    services.ts   # Service + Area definitions
    posts.ts      # Blog post index (titles, dates, excerpts, image refs)
    faq.ts        # FAQ Q/A pairs
    page-content.ts  # imports cleaned bodies from source-truth/clean/*.json
  layouts/
    BaseLayout.astro  # <html>/<head>/<body> shell with SEO meta + schema slot
  lib/
    schema.ts     # JSON-LD builders (LocalBusiness, WebPage, Article, FAQPage…)
  pages/
    index.astro                          # homepage
    about.astro · contact.astro · septic-calculator.astro
    septic-inspection.astro · tank-pumping.astro · grease-trap-service.astro
    septic-alarms.astro · emergency-septic-services.astro
    septic-tank-cleaning-langley.astro · septic-tank-cleaning-mission.astro
    septic-tank-cleaning-abbotsford.astro  # 301-style redirect to /septic-services-abbotsford/
    [...slug].astro                      # service-area pages (5) + blog posts (13)
    articles/index.astro                 # blog index
    category/[category].astro            # /category/uncategorized/, /category/septic-education/
    faq-items/index.astro                # FAQ archive
    faq-items/[slug].astro               # 33 FAQ items
    404.astro
public/
  images/         # 67 localized image assets (mirrors WP uploads/year/month structure)
  robots.txt
  _redirects      # Netlify-style 301s for legacy URLs
source-truth/     # source-of-truth captures + extraction scripts (NOT shipped)
  page-inventory.md
  raw/            # 30× original WordPress HTML (curl)
  monolith/       # 30× Monolith captures (CSS+images embedded) for visual reference
  meta/           # 29× JSON metadata, schema, headings, images per page
  bodies/         # raw body HTML per page (post-extraction)
  clean/          # semantic HTML per page (Avada chrome stripped)
  capture.sh      # Monolith + curl batch runner
  extract.mjs     # metadata + asset scanner
  extract-bodies.mjs · clean-posts.mjs
  download-assets.mjs
```

## Pages built (67 total)

| Type | Count | Routes |
|---|---|---|
| Home | 1 | `/` |
| Services | 5 | `/tank-pumping/`, `/septic-inspection/`, `/grease-trap-service/`, `/septic-alarms/`, `/emergency-septic-services/` |
| Service-area | 5 | `/septic-services-{abbotsford,chilliwack,langley,mission,hope}/` |
| Service+City | 2 | `/septic-tank-cleaning-langley/`, `/septic-tank-cleaning-mission/` |
| Utility | 3 | `/about/`, `/contact/`, `/septic-calculator/` |
| Articles | 14 | `/articles/` + 13 individual post pages |
| FAQ | 34 | `/faq-items/` + 33 individual Q&A pages |
| Categories | 2 | `/category/uncategorized/`, `/category/septic-education/` |
| Errors | 1 | `/404.html` |
| Redirect alias | 1 | `/septic-tank-cleaning-abbotsford/` → `/septic-services-abbotsford/` (preserved from source 301) |

Plus `sitemap-index.xml`, `sitemap-0.xml`, `robots.txt`, `_redirects`.

## React interactive components

| Component | Hydration | What it does |
|---|---|---|
| `MobileNav` | `client:load` | Off-canvas mobile menu with submenu toggles, body-scroll lock, auto-close above 1100px |
| `ContactForm` | `client:visible` | Validated contact form with success/error state. **TODO: wire backend** (Formspree/Netlify/Resend) — currently just logs the submission |
| `SepticCalculator` | `client:load` | Household-size × tank-size pump frequency calculator with "next service due" date |
| `FAQAccordion` | `client:visible` | Accessible accordion using `<details>` elements |

## SEO + schema migration

Each page emits JSON-LD via `src/lib/schema.ts`:

- All pages: `LocalBusiness`/`Organization`, `Place`, `WebSite`, `WebPage`
- Service pages: + `Service` (with `areaServed`)
- Service-area pages: + `Service` scoped to that city
- Blog posts: + `Article` + `BreadcrumbList`
- FAQ archive + items: + `FAQPage` with `Question`/`Answer`
- Per-page Open Graph, Twitter card, canonical URL

Page titles, meta descriptions, OG images, and `datePublished`/`dateModified` are all sourced from the corresponding `source-truth/clean/<slug>.json` so they match the original WordPress site.

## Brand tokens

| Color | Hex | Used for |
|---|---|---|
| `--c-tan` (primary) | `#af8f61` | Buttons, accents, CTAs |
| `--c-sage` | `#81a094` | Section backgrounds |
| `--c-teal` | `#4c9ba0` | Accents |
| `--c-brown` | `#775b59` | Secondary accent |
| `--c-ink` | `#32161f` | Text, dark sections |
| `--c-offwhite` | `#f9f9fb` | Alt section background |
| `--c-cream` | `#f2f3f5` | Cards / soft surfaces |

| Font | Used for |
|---|---|
| `Oswald` | Headings (H1–H6), buttons, eyebrows |
| `Barlow Condensed` | Display alt |
| `Open Sans` | Body text |

Pulled directly from the source site's Avada theme tokens (`--awb-color1-8`, `--awb-typography1-4`).

## How to run

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # generates dist/
npm run preview      # serves dist/ at http://localhost:4321
```

## Open TODOs

1. **Contact form backend** — `src/components/react/ContactForm.tsx` currently logs submissions to console with a fake-success state. Wire to Formspree, Netlify Forms, Resend, or your preferred handler.
2. **Google Maps embed** — original site loaded Google Maps API for an embedded map (Maps API key from source: `AIzaSyBCHF28btyUax16dWdjF_Ps-O02oPTJMWg`). The current contact page does not embed a map. Add an `<iframe>` map or re-integrate Maps JS once you have your own API key.
3. **Author bylines** — posts use generic "Valley Septic" as author. Original site had multiple authors (`bullfinch`, `gdcoy`, `rvgye`, `valleyseptic`). Update `src/data/posts.ts` if per-author bylines matter for SEO.
4. **Final image alt text** — many original images had empty `alt=""`; we've added reasonable defaults but a content pass would improve accessibility.
5. **Friends-of-Abbotsford badge** — original homepage included a remote image from `abbotsfordsbest.com/your-logo.png`. Skipped in the rebuild as it was unrelated to the brand and pointed to an external site.
6. **`/septic-tank-cleaning-abbotsford/`** is currently a meta-refresh HTML redirect (preserving the 301 the WordPress site emitted). For Netlify, the `_redirects` file at `/public/_redirects` provides a proper 301. For other hosts, configure platform-level redirects.

## Source-truth provenance

All page content was captured from `https://valleyseptic.ca/` on **2026-05-17**. Captures are in `source-truth/` and were used as the authoritative reference during the rebuild:

- `source-truth/raw/` — 30× raw HTML via curl (~40MB)
- `source-truth/monolith/` — 30× self-contained HTML via Monolith (~870MB, embedded CSS+images, no JS)
- `source-truth/meta/` — 29× JSON with title, description, OG tags, schema, headings, images per page
- `source-truth/clean/` — 30× semantic body HTML (Avada chrome stripped)
- `source-truth/page-inventory.md` — full URL inventory from XML sitemaps
- `source-truth/_aggregate.json` — asset/font/script aggregate across all pages

To re-capture from the live site:

```bash
cd source-truth
bash capture.sh urls.txt            # monolith + curl all URLs
node extract.mjs                    # rebuild meta/*.json
node extract-bodies.mjs             # rebuild bodies/*.json
node clean-posts.mjs                # rebuild clean/*.json
node download-assets.mjs            # rebuild public/images/
```

## Notes on what was NOT migrated

- **WordPress / Avada CSS** — fully removed. CSS rebuilt from scratch using extracted Avada tokens, so no `fusion-*` class soup at runtime.
- **WP Rocket "used CSS"** — removed (the original site had a 200KB+ inlined CSS payload from this plugin).
- **`jQuery`, fusion-app JS** — removed. React handles interactivity instead.
- **Avada fusion-icons** — replaced with inline SVG icons / emoji.
- **Suspicious sitemap entries** in source `robots.txt` (`reune.php`, `tuny/tuny.php`, `index.php?sitemap.xml`) — these looked like spam-injection artifacts, NOT replicated.
- **Author archive pages** (`/author/bullfinch/`, etc.) — not in the rebuilt site; can be added on request.

## Scope honesty

This project converted **the live WordPress site to a fully working Astro replica** with the same URL structure, same brand identity, same SEO/schema scaffolding, and the actual extracted body copy. However:

- The layout is a faithful rebuild using the same brand tokens and section structure, not a byte-for-byte CSS clone. The Avada theme uses a heavy nested `fusion-*` div tree we deliberately replaced with semantic, accessible HTML.
- The site renders correctly across mobile and desktop breakpoints, but a final manual pass against the Monolith snapshots may reveal small spacing/typography deltas you'll want to tune per page.
- Most pages use the `clean-posts.mjs` semantic-only HTML body. Sections that were Avada-builder columns (e.g., Why-Choose-Us cards, stats banners, image-text splits) are rebuilt natively in components — the visual rhythm matches but exact pixel positions are recreated, not extracted.
