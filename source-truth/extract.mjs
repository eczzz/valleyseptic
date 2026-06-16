// Extract metadata, schema, headings, asset URLs from captured raw HTML files.
// Outputs JSON per page into source-truth/meta/<slug>.json plus aggregate
// source-truth/_aggregate.json (asset URLs, navigation, etc.).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic/source-truth";
const RAW = join(ROOT, "raw");
const META = join(ROOT, "meta");
mkdirSync(META, { recursive: true });

const files = readdirSync(RAW).filter(f => f.endsWith(".raw.html"));

const allAssets = new Set();
const allNavLinks = new Set();
const allInternalLinks = new Set();
const externalScripts = new Set();
const fontUrls = new Set();
const summary = [];

function text(t) {
  return (t ?? "").replace(/\s+/g, " ").trim();
}

for (const f of files) {
  const slug = f.replace(".raw.html", "");
  const html = readFileSync(join(RAW, f), "utf8");
  const $ = cheerio.load(html);

  const head = $("head");
  const title = text(head.find("title").text());
  const metaDesc = head.find('meta[name="description"]').attr("content") || "";
  const canonical = head.find('link[rel="canonical"]').attr("href") || "";
  const robots = head.find('meta[name="robots"]').attr("content") || "";

  // OG / Twitter
  const og = {};
  head.find('meta[property^="og:"]').each((_, el) => {
    og[$(el).attr("property")] = $(el).attr("content");
  });
  const tw = {};
  head.find('meta[name^="twitter:"]').each((_, el) => {
    tw[$(el).attr("name")] = $(el).attr("content");
  });

  // JSON-LD schema
  const schema = [];
  head.find('script[type="application/ld+json"]').each((_, el) => {
    const t = $(el).html();
    try { schema.push(JSON.parse(t)); }
    catch { schema.push({ _raw: t }); }
  });
  $("body").find('script[type="application/ld+json"]').each((_, el) => {
    const t = $(el).html();
    try { schema.push(JSON.parse(t)); }
    catch { schema.push({ _raw: t }); }
  });

  // Headings (H1-H4)
  const headings = [];
  $("h1, h2, h3, h4").each((_, el) => {
    const t = text($(el).text());
    if (t) headings.push({ tag: el.tagName.toLowerCase(), text: t });
  });

  // Page text content (rough). Walk main element if present, otherwise body.
  const main = $("main").length ? $("main") : $("body");
  const bodyText = text(main.text()).slice(0, 4000);

  // Images
  const images = [];
  $("img").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") || $el.attr("data-src") || $el.attr("data-lazy-src") || "";
    const dataSrcset = $el.attr("srcset") || $el.attr("data-srcset") || "";
    const alt = $el.attr("alt") || "";
    const w = $el.attr("width") || "";
    const h = $el.attr("height") || "";
    if (src) {
      images.push({ src, alt, w, h, srcset: dataSrcset });
      if (src.startsWith("http")) allAssets.add(src);
      if (dataSrcset) dataSrcset.split(",").forEach(s => {
        const u = s.trim().split(/\s+/)[0];
        if (u?.startsWith("http")) allAssets.add(u);
      });
    }
  });

  // Background-image URLs in inline styles
  $("[style*='background-image']").each((_, el) => {
    const s = $(el).attr("style") || "";
    const m = s.match(/url\(['"]?([^'")]+)['"]?\)/);
    if (m) allAssets.add(m[1]);
  });

  // Fonts (linked or via @font-face references)
  $('link[rel="preload"][as="font"], link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && /\.(woff2?|ttf|otf|eot)/.test(href)) fontUrls.add(href);
  });

  // External scripts (e.g., Google Tag Manager, analytics)
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("http") && !src.includes("valleyseptic.ca")) {
      externalScripts.add(src);
    }
  });

  // Iframe embeds
  const iframes = [];
  $("iframe").each((_, el) => {
    iframes.push({
      src: $(el).attr("src") || $(el).attr("data-src") || "",
      title: $(el).attr("title") || "",
    });
  });

  // Forms
  const forms = [];
  $("form").each((_, el) => {
    const $f = $(el);
    const fields = [];
    $f.find("input, textarea, select, button").each((_, fe) => {
      const $fe = $(fe);
      fields.push({
        tag: fe.tagName.toLowerCase(),
        type: $fe.attr("type") || "",
        name: $fe.attr("name") || "",
        placeholder: $fe.attr("placeholder") || "",
        label: text($fe.attr("aria-label") || ""),
        required: $fe.attr("required") !== undefined,
        value: $fe.attr("value") || "",
        text: text($fe.text()),
      });
    });
    forms.push({
      action: $f.attr("action") || "",
      method: $f.attr("method") || "",
      class: $f.attr("class") || "",
      id: $f.attr("id") || "",
      fields,
    });
  });

  // Header nav (Avada uses #main-menu or .fusion-main-menu)
  const navLinks = [];
  $(".fusion-main-menu a, #menu-main-menu a, header a").each((_, el) => {
    const href = $(el).attr("href");
    const t = text($(el).text());
    if (href && t) navLinks.push({ href, text: t });
    if (href && href.startsWith("https://valleyseptic.ca")) allInternalLinks.add(href);
  });

  // Footer links
  $("footer a, .fusion-footer a").each((_, el) => {
    const href = $(el).attr("href");
    if (href?.startsWith("https://valleyseptic.ca")) allInternalLinks.add(href);
  });

  // All internal links body-wide
  $("a[href]").each((_, el) => {
    const h = $(el).attr("href");
    if (h?.startsWith("https://valleyseptic.ca")) allInternalLinks.add(h);
  });

  // Avada column structure — detect sections
  const sections = [];
  $(".fusion-fullwidth, section, .fusion-builder-row").slice(0, 30).each((i, el) => {
    const $s = $(el);
    sections.push({
      class: $s.attr("class") || "",
      id: $s.attr("id") || "",
      hasBg: !!($s.attr("style") || "").match(/background-image/),
      bgImage: (() => {
        const m = ($s.attr("style") || "").match(/url\(['"]?([^'")]+)['"]?\)/);
        return m ? m[1] : "";
      })(),
      bgColor: (() => {
        const m = ($s.attr("style") || "").match(/background-color:\s*([^;]+)/);
        return m ? m[1].trim() : "";
      })(),
    });
  });

  const out = {
    slug,
    title,
    metaDesc,
    canonical,
    robots,
    og, tw,
    schemaCount: schema.length,
    schema,
    headings,
    bodyTextSample: bodyText,
    images,
    iframes,
    forms,
    sections,
    navLinks: navLinks.slice(0, 50),
  };
  writeFileSync(join(META, `${slug}.json`), JSON.stringify(out, null, 2));
  summary.push({ slug, title, h1: headings.find(h => h.tag === "h1")?.text || "", imgCount: images.length, formCount: forms.length, schemaCount: schema.length });
  console.log(`  ${slug}: H1='${(headings.find(h=>h.tag==='h1')?.text||'').slice(0,60)}' imgs=${images.length}`);
}

writeFileSync(join(ROOT, "_aggregate.json"), JSON.stringify({
  pageCount: files.length,
  summary,
  allAssets: [...allAssets].sort(),
  fontUrls: [...fontUrls].sort(),
  externalScripts: [...externalScripts].sort(),
  internalLinks: [...allInternalLinks].sort(),
}, null, 2));

console.log(`\nDONE. ${files.length} pages parsed. ${allAssets.size} asset URLs, ${externalScripts.size} external scripts.`);
