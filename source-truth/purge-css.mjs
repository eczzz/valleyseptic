// Tree-shake the ported Avada CSS. Each public/port-css/*.css is the FULL
// Avada theme stylesheet (~1MB) or the WP-Rocket tree-shake (~250KB) — both
// carry rules for components that never appear on these pages. PurgeCSS keeps
// only rules whose selectors match the actual rendered DOM.
//
// A CSS file is shared by multiple pages, so each file is purged against the
// UNION of every page that references it (from css-manifest.ts) — purging
// against a single page would strip classes other pages need.
//
// Run AFTER port.mjs. Overwrites the files in place (keeps the hashed name —
// it stays a stable cache key even though the content is now smaller).
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PurgeCSS } from "purgecss";

const ROOT = "c:/Projects/valleyseptic";
const PORT = join(ROOT, "src/data/source-port");
const CSS_DIR = join(ROOT, "public/port-css");

// --- Load manifests ---
function loadObj(file, exportName) {
  const txt = readFileSync(join(PORT, file), "utf8");
  const start = txt.indexOf("{", txt.indexOf(exportName));
  return JSON.parse(txt.slice(start, txt.lastIndexOf("}") + 1));
}
const cssManifest = loadObj("css-manifest.ts", "PORT_CSS");       // slug -> ["/port-css/x.css", ...]
const bodyClasses = loadObj("body-classes.ts", "PORT_BODY_CLASS"); // slug -> "class string"

// --- Build: cssFile -> concatenated content of every page that uses it ---
const fileContent = new Map(); // filename -> [content strings]
for (const [slug, refs] of Object.entries(cssManifest)) {
  // Gather this page's full markup: body + header + footer + <body class="...">
  const parts = [];
  for (const suffix of [".html", ".header.html", ".footer.html"]) {
    const fp = join(PORT, slug + suffix);
    try { parts.push(readFileSync(fp, "utf8")); } catch {}
  }
  // The <body> element's class list drives a huge number of Avada selectors
  // (.fusion-body, .page-id-N, .layout-wide-mode, .dont-animate, …).
  parts.push(`<body class="${bodyClasses[slug] || ""}"></body>`);
  // Also: <html> + #wrapper / #main landmark elements Avada keys layout on.
  parts.push(`<html class="avada-html-layout-wide avada-html-header-position-top avada-is-100-percent-template"><div id="wrapper" class="fusion-wrapper"></div><main id="main" class="clearfix width-100"></main><div id="content"></div></html>`);

  const pageContent = parts.join("\n");
  for (const ref of refs) {
    const name = ref.replace("/port-css/", "");
    if (!fileContent.has(name)) fileContent.set(name, []);
    fileContent.get(name).push(pageContent);
  }
}

// --- Safelist: classes/ids toggled by Avada JS at runtime that won't appear
// in the static HTML, so PurgeCSS must be told to keep them. ---
const safelist = {
  standard: [
    "do-animate", "dont-animate", "is-in",
    "admin-bar", "html", "body", "wp-singular",
  ],
  deep: [
    // animation / reveal
    /animated$/, /fadeIn/, /fadeOut/, /bounceIn/, /flipIn/, /slideIn/, /zoomIn/, /revealIn/,
    // sticky header (classes added on scroll)
    /sticky/, /-shrink/, /scroll/,
    // form interaction states
    /fusion-form/, /error/, /valid/, /success/, /-submitted/, /-processing/,
    // mobile menu / nav toggles
    /mobile/, /-active/, /-open/, /-hover/, /menu-item/, /current[-_]/,
    // sliders / swiper (home column background slider)
    /swiper/, /slider/, /awb-background-slider/,
    // lightbox / modal / tooltip / popover
    /lightbox/, /modal/, /tooltip/, /popover/, /fusion-flyout/,
    // google maps generated DOM
    /^gm-/, /^gmnoprint/, /^gm-style/, /fusion-google-map/, /fusion-maps/,
    // counters / progress
    /counter/, /progress/, /display-counter/,
    // accordion / tabs / toggles
    /accordion/, /fusion-tabs/, /fusion-toggle/, /panel/,
  ],
  greedy: [
    // Whole interaction-state families — keep anything containing these.
    /:hover/, /:focus/, /:active/, /:not\(/,
  ],
};

// --- Purge each unique CSS file ---
let totalBefore = 0, totalAfter = 0;
const results = [];
const cssFiles = readdirSync(CSS_DIR).filter(f => f.endsWith(".css"));

for (const name of cssFiles) {
  const fp = join(CSS_DIR, name);
  const before = statSync(fp).size;
  totalBefore += before;
  const css = readFileSync(fp, "utf8");
  const contentStrings = fileContent.get(name) || [];
  if (!contentStrings.length) {
    console.warn(`  ! ${name}: no page references it — leaving untouched`);
    totalAfter += before;
    continue;
  }
  const purged = await new PurgeCSS().purge({
    content: contentStrings.map(raw => ({ raw, extension: "html" })),
    css: [{ raw: css }],
    safelist,
    variables: false,   // keep ALL CSS custom properties — Avada is var-driven
    keyframes: false,   // keep all @keyframes (small, risky to drop)
    fontFace: false,    // keep all @font-face (icon fonts hard to detect)
  });
  const out = purged[0]?.css ?? css;
  writeFileSync(fp, out);
  totalAfter += out.length;
  results.push({ name, before, after: out.length });
}

results.sort((a, b) => b.before - a.before);
console.log("file".padEnd(34), "before".padStart(10), "after".padStart(10), "saved");
for (const r of results) {
  const pct = ((1 - r.after / r.before) * 100).toFixed(0);
  console.log(
    r.name.padEnd(34),
    String(r.before).padStart(10),
    String(r.after).padStart(10),
    `-${pct}%`
  );
}
const kb = n => (n / 1024).toFixed(0) + "KB";
console.log(`\nTOTAL: ${kb(totalBefore)} -> ${kb(totalAfter)}  (-${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
