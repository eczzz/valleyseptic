// Extract actual post & page body content from raw HTML captures.
// Outputs source-truth/bodies/<slug>.json with title, excerpt, date, author, image, htmlBody.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic/source-truth";
const RAW = join(ROOT, "raw");
const OUT = join(ROOT, "bodies");
mkdirSync(OUT, { recursive: true });

const files = readdirSync(RAW).filter(f => f.endsWith(".raw.html"));

// Map remote WP uploads URL -> local public path.
function remap(url) {
  if (!url) return url;
  return url
    .replace(/^https?:\/\/valleyseptic\.ca\/wp-content\/uploads\//, "/images/")
    .replace(/^https?:\/\/valleyseptic\.ca\//, "/")
    // strip srcset-style "name-WIDTHxHEIGHT.ext" → "name.ext" for the small set we have local copies of
    .replace(/-\d+x\d+(@2x)?(\.[a-zA-Z]+)$/, "$2");
}

function fixImgs($, root) {
  root.find("img").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") || $el.attr("data-src") || $el.attr("data-lazy-src");
    if (src) $el.attr("src", remap(src));
    $el.removeAttr("srcset");
    $el.removeAttr("data-srcset");
    $el.removeAttr("data-src");
    $el.removeAttr("data-lazy-src");
    $el.removeAttr("loading");
    $el.attr("loading", "lazy");
    // Drop fusion-specific lazy classes
    const cls = ($el.attr("class") || "").replace(/lazyload\S*/g, "").trim();
    if (cls) $el.attr("class", cls); else $el.removeAttr("class");
  });
  // Strip inline styles that reference WP uploads
  root.find("[style]").each((_, el) => {
    const s = $(el).attr("style") || "";
    if (s.includes("wp-content/uploads")) {
      const fixed = s.replace(/url\(['"]?https?:\/\/valleyseptic\.ca\/wp-content\/uploads\/([^'")]+)['"]?\)/g, "url('/images/$1')");
      $(el).attr("style", fixed);
    }
  });
  // Strip script tags inside content
  root.find("script, noscript, style").remove();
  return root;
}

function getContent($, slug) {
  // Avada wraps content in .post-content / .entry-content / .fusion-builder-row in some cases
  let body =
    $(".post-content").first().clone() ||
    $(".entry-content").first().clone() ||
    $(".fusion-post-content").first().clone();
  // Fallback to .fusion-fullwidth section sequence
  if (!body || !body.length) {
    body = $("main").first().clone();
  }
  if (!body || !body.length) {
    body = $("article").first().clone();
  }
  return body;
}

function getMeta($) {
  return {
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content") || "",
    ogImage: $('meta[property="og:image"]').attr("content") || "",
    datePublished: $('meta[property="article:published_time"]').attr("content") || "",
    dateModified: $('meta[property="article:modified_time"]').attr("content") || "",
    author: $('meta[name="author"]').attr("content") || "",
  };
}

function detectDate(text) {
  // Look for dates in the form "May 10, 2026" / "April 2, 2026"
  const m = text.match(/\b([A-Z][a-z]+ \d{1,2},\s*\d{4})\b/);
  return m ? m[1] : "";
}

for (const f of files) {
  const slug = f.replace(".raw.html", "");
  const html = readFileSync(join(RAW, f), "utf8");
  const $ = cheerio.load(html);

  // Strip Avada chrome from body content
  // We'll capture the main content area heuristically. For Avada blog posts,
  // the body is inside `#post-X .post-content` or `.entry-content`. For pages,
  // it's `.fusion-page-content` and the inner builder rows.
  let bodyHtml = "";
  const isPost = slug.startsWith("post-");

  if (isPost) {
    const node = $(".post-content").first();
    if (node.length) {
      fixImgs($, node);
      // Remove the leftover fusion footer elements
      node.find(".fusion-sharing-box, .author-info, .post-prev-next, .related-posts").remove();
      bodyHtml = node.html() || "";
    } else {
      // fallback
      const article = $("article").first();
      if (article.length) {
        fixImgs($, article);
        bodyHtml = article.html() || "";
      }
    }
  } else {
    // page: extract the page content area between header/footer
    const node = $(".fusion-page-content-wrapper, .fusion-page-content, main").first();
    if (node.length) {
      fixImgs($, node);
      bodyHtml = node.html() || "";
    }
  }

  const meta = getMeta($);
  const h1 = $("h1").first().text().trim();
  const visibleText = (bodyHtml || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const excerpt = visibleText.slice(0, 240);
  const detectedDate = detectDate(visibleText);

  const data = {
    slug,
    h1,
    title: meta.title,
    description: meta.description,
    ogImage: remap(meta.ogImage),
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    detectedDate,
    author: meta.author,
    bodyHtml,
    bodyTextSample: visibleText.slice(0, 1200),
  };
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(data, null, 2));
  console.log(`  ${slug}: title='${meta.title.slice(0,60)}' bodyLen=${bodyHtml.length}`);
}

console.log("DONE");
