// Clean Avada-heavy post HTML into semantic Astro-ready HTML.
// Keeps: h2-h6, p, ul/ol/li, strong/em, a, img, blockquote, figure.
// Strips: Avada wrappers, fusion-* classes, inline styles, data-* attrs,
// related-posts, author boxes, sharing widgets.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic/source-truth";
const BODIES = join(ROOT, "bodies");
const OUT = join(ROOT, "clean");
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const ALLOWED_TAGS = new Set([
  "h2", "h3", "h4", "h5", "p", "ul", "ol", "li",
  "strong", "em", "b", "i", "a", "img", "br", "hr",
  "blockquote", "figure", "figcaption", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
]);
const ALLOWED_ATTRS = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
};

function remap(url) {
  if (!url) return url;
  return url
    .replace(/^https?:\/\/valleyseptic\.ca\/wp-content\/uploads\//, "/images/")
    .replace(/^https?:\/\/valleyseptic\.ca\//, "/")
    .replace(/-\d+x\d+(@2x)?(\.[a-zA-Z]+)(?:\?[^"']*)?$/, "$2");
}

function clean(html) {
  const $ = cheerio.load(`<root>${html}</root>`, { decodeEntities: false });
  const root = $("root");

  // Strip non-content widgets
  root.find(".author-info, .post-prev-next, .related-posts, .fusion-sharing-box, .fusion-meta-info, .fb-comments, .comment-respond, .single-author, .post-share, .post-share-buttons, .post-meta, .fusion-post-meta, .single-navigation, .post-nav, .post-navigation, .related, .comments-area, #comments, script, style, noscript, iframe").remove();

  // Strip Avada chrome: page title block, breadcrumb, share, TOC, "Get in Touch" buttons inside body, image hero
  root.find('ol').each((_, el) => {
    const txt = $(el).text();
    if (/Uncategorized|Septic Education/i.test(txt) && $(el).find('li').length <= 3) {
      // breadcrumb ol
      $(el).remove();
    }
  });
  // Remove post-title row that repeats H1 + author + date + read-time
  root.find(':contains("min read")').filter((_, el) => {
    const t = $(el).text();
    return /Published On:|Last Updated:|min read/i.test(t) && t.length < 400 && el.tagName !== 'a';
  }).remove();
  // Remove "Table of contents" blocks
  root.find('*').filter((_, el) => /^Table of contents$/i.test($(el).text().trim())).each((_, el) => {
    // remove the immediate parent block
    const p = $(el).closest('div, section').length ? $(el).closest('div, section') : $(el);
    p.remove();
  });
  // Remove "Share Post" blocks
  root.find('*').filter((_, el) => /^Share Post$/i.test($(el).text().trim())).each((_, el) => {
    const p = $(el).closest('div, section').length ? $(el).closest('div, section') : $(el);
    p.remove();
  });
  // Remove "Get in Touch" CTA anchors that appear in-line above first paragraph
  root.find('a').filter((_, el) => /^Get in Touch$/i.test($(el).text().trim())).remove();
  // Remove "Continue Reading", "Read full article" pagination
  root.find('a').filter((_, el) => /Continue Reading|Read more from this category/i.test($(el).text())).remove();
  // Remove dead-link social share anchors (href="#" or href="mailto:#")
  root.find('a[href="#"], a[href="mailto:#"]').remove();
  // Remove "Last Updated:" lines that appear as standalone
  root.find('*').filter((_, el) => {
    const t = $(el).text().trim();
    return /^(Last Updated|Published On|By |Posts by )/.test(t) && t.length < 200;
  }).remove();

  // Recursively unwrap anything that isn't allowed
  let changed = true;
  let safety = 0;
  while (changed && safety++ < 8) {
    changed = false;
    root.find("*").each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      if (!tag) return;
      if (!ALLOWED_TAGS.has(tag)) {
        $(el).replaceWith($(el).contents());
        changed = true;
      }
    });
  }

  // Clean attributes
  root.find("*").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();
    const allowed = ALLOWED_ATTRS[tag] || [];
    Object.keys(el.attribs || {}).forEach(a => {
      if (!allowed.includes(a)) $el.removeAttr(a);
    });
    // Rewrite image URLs
    if (tag === "img") {
      const src = $el.attr("src");
      if (src) $el.attr("src", remap(src));
      $el.attr("loading", "lazy");
    }
    // Rewrite anchor URLs
    if (tag === "a") {
      const href = $el.attr("href");
      if (href && href.startsWith("https://valleyseptic.ca")) {
        $el.attr("href", href.replace(/^https:\/\/valleyseptic\.ca/, ""));
      }
    }
  });

  // Collapse empty tags
  root.find("p, ul, ol").each((_, el) => {
    const $el = $(el);
    if (!$el.text().trim() && !$el.find("img").length) $el.remove();
  });
  // For posts: strip the leading hero image (the post template re-renders it)
  // and the first ul if it's a TOC (anchors starting with #toc_)
  const firstImg = root.find("> img").first();
  if (firstImg.length) firstImg.remove();
  const firstUl = root.find("> ul").first();
  if (firstUl.length && firstUl.find('a[href^="#toc_"], a[href^="#"]').length === firstUl.find("a").length && firstUl.find("a").length) {
    firstUl.remove();
  }

  // Remove duplicate consecutive paragraphs with author dates like "ValleySeptic2025-12-10..."
  root.find("p, span, div").each((_, el) => {
    const txt = $(el).text();
    if (/^\s*(ValleySeptic|bullfinch|rvgye|gdcoy)\d{4}-\d{2}-\d{2}T/.test(txt)) {
      $(el).remove();
    }
  });

  return root.html() || "";
}

const files = readdirSync(BODIES).filter(f => f.endsWith(".json"));
const summary = [];

for (const f of files) {
  const data = JSON.parse(readFileSync(join(BODIES, f), "utf8"));
  const cleaned = clean(data.bodyHtml);

  // Compute a tighter excerpt (first 2 paragraphs)
  const $ = cheerio.load(`<root>${cleaned}</root>`);
  const paragraphs = $("p").toArray().map(p => $(p).text().trim()).filter(Boolean);
  const excerpt = paragraphs.slice(0, 1).join(" ").slice(0, 240);

  const out = {
    slug: data.slug,
    title: (data.title || "").replace(" - Valley Septic Services", "").replace(" | Valley Septic", ""),
    h1: data.h1,
    description: data.description,
    ogImage: data.ogImage,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    detectedDate: data.detectedDate,
    excerpt,
    bodyHtml: cleaned,
    bodyTextLen: cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length,
  };
  writeFileSync(join(OUT, `${f}`), JSON.stringify(out, null, 2));
  summary.push({ slug: data.slug, title: out.title, bodyTextLen: out.bodyTextLen });
}

console.log("DONE.");
summary.forEach(s => console.log(`  ${s.slug}: ${s.bodyTextLen} chars`));
