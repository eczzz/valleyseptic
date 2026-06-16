// For each captured page, extract:
//   1. the Avada-generated CSS from <style id="wpr-usedcss"> (the "only what's
//      actually used on this page" bundle WP Rocket inlines)
//   2. the <main id="main"> HTML (the content area between Avada header/footer)
// then rewrite asset/link URLs to local paths and write paired files into
// src/data/source-port/<slug>.{css,html}. The Astro page can then inline both
// to get pixel-perfect parity with the live site.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic";
const RAW = join(ROOT, "source-truth/raw-live");
const OUT = join(ROOT, "src/data/source-port");
// Content-addressed CSS lives in /public so it ships as a cacheable static
// asset (one file shared by every page that has identical CSS) instead of
// being inlined into each ~1.5MB HTML document.
const CSS_OUT = join(ROOT, "public/port-css");
mkdirSync(OUT, { recursive: true });
mkdirSync(CSS_OUT, { recursive: true });

function cssHash(s) {
  return createHash("md5").update(s).digest("hex").slice(0, 16);
}

const files = readdirSync(RAW).filter(f => f.endsWith(".raw.html")).sort();

function rewriteUrls(text) {
  return text
    // Localize asset paths
    .replace(/https?:\/\/valleyseptic\.ca\/wp-content\/uploads\//g, "/images/")
    .replace(/https?:\/\/valleyseptic\.ca\/wp-content\/themes\/Avada\/(assets\/|includes\/lib\/assets\/)/g, "/wp-themes-avada/$1")
    // Localize page links
    .replace(/https?:\/\/valleyseptic\.ca\//g, "/")
    // Protocol-relative variants
    .replace(/\/\/valleyseptic\.ca\/wp-content\/uploads\//g, "/images/")
    .replace(/\/\/valleyseptic\.ca\//g, "/");
}

function cleanCss(css) {
  css = rewriteUrls(css);
  // Normalize every @font-face to `font-display: swap` — Avada ships icon
  // fonts with `font-display: block` (text invisible until the font loads)
  // and the Google-font subsets with no font-display at all. `swap` shows
  // fallback text immediately, which is what PageSpeed's Font Display audit
  // wants and removes the flash-of-invisible-text render delay.
  css = css.replace(/@font-face\s*\{([^}]*)\}/gi, (m, body) => {
    if (/font-display\s*:/i.test(body)) {
      return m.replace(/font-display\s*:\s*[^;}]+/i, "font-display:swap");
    }
    return `@font-face{${body.replace(/;?\s*$/, "")};font-display:swap}`;
  });
  return css;
}

function cleanFragment($root, $) {
  // Strip WP-only nodes that don't belong in a static port
  $root.find('.fusion-admin-bar, #wpadminbar').remove();
  // Strip script tags (we re-add only the ones we need elsewhere)
  $root.find('script').remove();
  // Strip noscript that contains tracking pixels
  $root.find('noscript').remove();
  // Remove fusion privacy hidden inputs we don't have a backend for
  $root.find('input[name^="fusion_privacy"], input[name="privacy_expiration_action"]').remove();
  // Remove ONLY the "Featured On" external-image badge that points to
  // abbotsfordsbest.com — walk up to the closest image-frame wrapper. NEVER
  // remove the closest .fusion-layout-column: on the home page that column
  // also contains the H3 "CONTACT CHILLIWACK VALLEY…" title and intro copy,
  // which we want to keep.
  $root.find('img[src*="abbotsfordsbest.com"]').each((_, el) => {
    const $el = $(el);
    const wrap = $el.closest('.fusion-image-element, .fusion-image-wrapper, .imageframe-liftup');
    if (wrap.length) wrap.remove();
    else $el.remove();
  });
  // Also drop any remaining "Featured on" anchor pointing to that external host.
  $root.find('a[href*="abbotsfordsbest.com"]').remove();
  // Strip Bing image-cache thumbnails (tse*.mm.bing.net). These are stale CDN
  // links the live site has in post bodies — Bing periodically purges them
  // and they 404. Removing them rather than waiting for broken-image icons.
  $root.find('img[src*=".mm.bing.net"]').remove();
  // Counter boxes (e.g. "98% Customer Satisfaction", "25+ Years Serving") ship
  // with text "0" and rely on Avada's count-up JS reading data-value. We don't
  // ship that JS — bake the final value into the DOM so the static page shows
  // the right number.
  $root.find('.display-counter[data-value]').each((_, el) => {
    const $el = $(el);
    const v = $el.attr('data-value');
    if (v) $el.text(v);
  });
  // Localize image src/srcset
  $root.find('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src) $el.attr('src', rewriteUrls(src));
    const srcset = $el.attr('srcset');
    if (srcset) $el.attr('srcset', rewriteUrls(srcset));
    const dataSrc = $el.attr('data-src') || $el.attr('data-lazy-src');
    if (dataSrc) $el.attr('src', rewriteUrls(dataSrc));
    $el.removeAttr('data-src');
    $el.removeAttr('data-lazy-src');
    $el.removeAttr('data-srcset');
    // Drop fusion-lazyload class
    const cls = ($el.attr('class') || '').replace(/lazyload\S*/g, '').trim();
    if (cls) $el.attr('class', cls); else $el.removeAttr('class');
  });
  // Localize anchor hrefs
  $root.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) $(el).attr('href', rewriteUrls(href));
  });
  // Localize anywhere background-image references appear inline
  $root.find('[style*="background"]').each((_, el) => {
    const s = $(el).attr('style');
    if (s) $(el).attr('style', rewriteUrls(s));
  });
  return $root.html() || "";
}

const bodyClasses = {};
const cssManifest = {};
let processed = 0;
for (const f of files) {
  const slug = f.replace(".raw.html", "");
  const html = readFileSync(join(RAW, f), "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  // Capture the WP-Rocket "used CSS" tree-shake (~260KB) AND the Avada theme
  // inline stylesheet (~1MB, contains font-face decls, has-awb-color helpers,
  // and many component rules wpr-usedcss tree-shook away). Order matches the
  // source: wpr-usedcss first, fusion-stylesheet-inline-css second so the
  // latter wins on same-specificity conflicts.
  const wpr = $('style#wpr-usedcss').html() || "";
  const fusionInline = $('style#fusion-stylesheet-inline-css').html() || "";
  const main = $('main#main');
  if (!main.length) {
    console.warn(`  skip ${slug}: no <main id="main"> found`);
    continue;
  }
  // Capture the body-end <script> tags BEFORE cleanFragment strips them.
  //
  // These scripts (the ~800KB WP-Rocket bundle = jQuery + Avada Fusion JS, the
  // Google Maps API, and the inline glue) power forms, maps, the mobile menu
  // and the sticky header — but NOTHING the page needs for first paint (we
  // bake counter values, use `dont-animate`, and images are plain <img>).
  //
  // So they are emitted as INERT <script type="text/plain" data-port-lazy>
  // tags and activated by a tiny bootstrap (added in SourcePort) once the
  // page is idle OR the user first interacts — keeping ~800KB of JS
  // parse/execute off the critical loading path.
  //
  // Activation order = original document order: [Maps API, inline glue,
  // bundle, map-init]. The Maps API must run before the bundle — the bundle
  // references `google` at top level and would throw `google is not defined`
  // (aborting mid-execution, losing form-binding + the fusion_maps plugin) if
  // it ran first. (`awbMapInit` is just an empty no-op in the bundle, so its
  // ordering vs. the Maps API callback is irrelevant.)
  const scriptItems = []; // { kind, src?, code? }
  $('body script').each((_, el) => {
    const $el = $(el);
    const type = ($el.attr('type') || '').toLowerCase();
    if (type.includes('json') || type === 'speculationrules') return;
    const src = $el.attr('src');
    if (src) {
      if (/googletagmanager\.com|google-analytics\.com/i.test(src)) return;
      // WP-Rocket performance beacon — telemetry to a WP backend that doesn't
      // exist for a static rebuild; throws on missing DOM landmarks. Drop.
      if (/wpr-beacon/i.test(src)) return;
      if (/wp-content\/cache\/min\//.test(src)) {
        scriptItems.push({ kind: "bundle", src: rewriteUrls(src) });
      } else if (/maps\.googleapis\.com/.test(src)) {
        scriptItems.push({ kind: "maps", src });
      } else {
        scriptItems.push({ kind: "src", src: rewriteUrls(src) });
      }
    } else {
      let code = $el.html() || '';
      if (!code.trim()) return;
      if (/dataLayer.*gtm\.js|GTM-[A-Z0-9]+/i.test(code)) return;
      // The map-init inline registers `fusion_run_map_*` on the window 'load'
      // event. Since we now activate scripts AFTER load, that listener would
      // never fire — rewrite it to poll and run directly. The poll waits for
      // BOTH the Google Maps API (window.google.maps.Map) AND Avada's
      // `fusion_maps` jQuery plugin, which the bundle registers inside a
      // jQuery(document).ready() callback that resolves a tick after the
      // bundle's top-level code finishes.
      code = code.replace(
        /google\.maps\.event\.addDomListener\(\s*window\s*,\s*['"]load['"]\s*,\s*([A-Za-z0-9_$]+)\s*\)/g,
        "(function _pw(){(window.google&&window.google.maps&&window.google.maps.Map&&window.jQuery&&window.jQuery.fn&&window.jQuery.fn.fusion_maps)?$1():setTimeout(_pw,80);})()"
      );
      scriptItems.push({ kind: "inline", code });
    }
  });
  // Keep original document order — see note above.
  const scriptsHtml = scriptItems.map(it => {
    if (it.src) return `<script type="text/plain" data-port-lazy data-src="${it.src}"></script>`;
    return `<script type="text/plain" data-port-lazy>${it.code}</script>`;
  }).join("\n");

  // Split the page CSS into two content-addressed shared files:
  //   - wpr-<hash>.css     the WP-Rocket per-page tree-shake (~260KB, 19 variants)
  //   - fusion-<hash>.css  the Avada theme stylesheet (~1MB, only 5 variants —
  //                        24/29 pages share just 2 of them)
  // Pages that have identical CSS reference the identical file, so the browser
  // downloads each unique stylesheet once and caches it across navigations.
  // Cascade order (wpr first, fusion second) is preserved by emitting the two
  // <link> tags in that order.
  const wprCss = wpr ? cleanCss(wpr) : "";
  const fusionCss = fusionInline ? cleanCss(fusionInline) : "";
  const cssRefs = [];
  if (wprCss) {
    const name = `wpr-${cssHash(wprCss)}.css`;
    const fp = join(CSS_OUT, name);
    if (!existsSync(fp)) writeFileSync(fp, wprCss);
    cssRefs.push(`/port-css/${name}`);
  }
  if (fusionCss) {
    const name = `fusion-${cssHash(fusionCss)}.css`;
    const fp = join(CSS_OUT, name);
    if (!existsSync(fp)) writeFileSync(fp, fusionCss);
    cssRefs.push(`/port-css/${name}`);
  }
  cssManifest[slug] = cssRefs;

  const body = cleanFragment(main, $);

  // Capture the Avada theme-builder header and footer fragments. They include
  // logo, nav, phone CTA (header) and copyright + footer widgets (footer).
  // Per-page extraction preserves the .current-menu-item state.
  //
  // Capture the OUTER HTML (including the `.fusion-tb-header` /
  // `.fusion-tb-footer fusion-footer` wrapper div) — Avada has header/footer-
  // scoped CSS (e.g. logo sizing) keyed on those wrapper classes, so dropping
  // the wrapper leaves the logo unstyled at its 1000×300 intrinsic size.
  const header = $('#wrapper > .fusion-tb-header').first();
  const footer = $('#wrapper > .fusion-tb-footer').first();
  let headerHtml = "";
  let footerHtml = "";
  if (header.length) {
    cleanFragment(header, $); // clean in place
    headerHtml = $.html(header);
  }
  if (footer.length) {
    cleanFragment(footer, $);
    footerHtml = $.html(footer);
  }

  // Capture body classes — Avada uses .fusion-body, .home, .page-id-N, etc.
  // for many CSS selectors. Strip admin/preview-only classes. Add `dont-animate`
  // so Avada's `.fusion-animated { visibility:hidden }` reveals stay visible
  // without the runtime JS that would otherwise toggle `do-animate` on scroll.
  const rawBodyClass = ($('body').attr('class') || '').trim();
  const filteredBodyClass = rawBodyClass
    .split(/\s+/)
    .filter(c => !/^(admin-bar|customizer-active|fusion-builder-live-preview)$/.test(c))
    .concat(["dont-animate"])
    .join(' ');
  bodyClasses[slug] = filteredBodyClass;

  writeFileSync(join(OUT, `${slug}.html`), body);
  if (headerHtml) writeFileSync(join(OUT, `${slug}.header.html`), headerHtml);
  if (footerHtml) writeFileSync(join(OUT, `${slug}.footer.html`), footerHtml);
  if (scriptsHtml) writeFileSync(join(OUT, `${slug}.scripts.html`), scriptsHtml);
  processed++;
  console.log(`  ${slug}: css=${(wprCss.length + fusionCss.length)}B (${cssRefs.length} shared files)  html=${body.length}B  header=${headerHtml.length}B  footer=${footerHtml.length}B  scripts=${scriptsHtml.length}B`);
}

// Emit a TS manifest of per-slug body classes consumed by SourcePort + BaseLayout.
const manifest = `// AUTO-GENERATED by source-truth/port.mjs. Do not edit by hand.
export const PORT_BODY_CLASS: Record<string, string> = ${JSON.stringify(bodyClasses, null, 2)};
`;
writeFileSync(join(OUT, "body-classes.ts"), manifest);

// Emit a TS manifest of per-slug CSS file references (paths under /port-css/).
const cssManifestTs = `// AUTO-GENERATED by source-truth/port.mjs. Do not edit by hand.
export const PORT_CSS: Record<string, string[]> = ${JSON.stringify(cssManifest, null, 2)};
`;
writeFileSync(join(OUT, "css-manifest.ts"), cssManifestTs);

// Garbage-collect orphaned content-addressed CSS files (hashes no longer
// referenced by any page after a re-port).
const referenced = new Set(Object.values(cssManifest).flat().map(p => p.replace("/port-css/", "")));
for (const f of readdirSync(CSS_OUT)) {
  if (f.endsWith(".css") && !referenced.has(f)) rmSync(join(CSS_OUT, f));
}
console.log(`\nCSS: ${referenced.size} unique shared files in public/port-css/`);

console.log(`\nDONE. ${processed} pages ported into src/data/source-port/`);
