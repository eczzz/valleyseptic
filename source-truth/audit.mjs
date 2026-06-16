// Generate per-page fix dictionary: exact title, meta desc, canonical, OG/Twitter,
// H1/H2/H3 list, schema types, post date, hero image. Read from raw HTML so the
// values match the source byte-for-byte (modulo HTML entity decoding).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic/source-truth";
const RAW = join(ROOT, "raw");
const OUT = join(ROOT, "audit");
mkdirSync(OUT, { recursive: true });

const files = readdirSync(RAW).filter(f => f.endsWith(".raw.html"));

function clean(s) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
function localize(url) {
  if (!url) return url;
  return url
    .replace(/^https?:\/\/valleyseptic\.ca\/wp-content\/uploads\//, "/images/")
    .replace(/^https?:\/\/valleyseptic\.ca\//, "/")
    .replace(/-\d+x\d+(@2x)?(\.[a-zA-Z]+)$/, "$2");
}

const audit = {};

for (const f of files) {
  const slug = f.replace(".raw.html", "");
  const html = readFileSync(join(RAW, f), "utf8");
  const $ = cheerio.load(html);

  const meta = {
    slug,
    title: clean($("title").text()),
    description: $('meta[name="description"]').attr("content") || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
    robots: $('meta[name="robots"]').attr("content") || "",
    og: {},
    tw: {},
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    schemaTypes: [],
    articleSchema: null,
    breadcrumb: [],
    heroImage: "",
    publishedDate: "",
    modifiedDate: "",
    author: "",
    category: "",
  };

  $('meta[property^="og:"]').each((_, el) => {
    meta.og[$(el).attr("property")] = $(el).attr("content");
  });
  $('meta[name^="twitter:"]').each((_, el) => {
    meta.tw[$(el).attr("name")] = $(el).attr("content");
  });

  meta.publishedDate = $('meta[property="article:published_time"]').attr("content") || "";
  meta.modifiedDate = $('meta[property="article:modified_time"]').attr("content") || "";
  // Capture exact og:image fields per page (different from generic logo og:image)
  meta.ogImageUrl = $('meta[property="og:image"]').attr("content") || "";
  meta.ogImageWidth = $('meta[property="og:image:width"]').attr("content") || "";
  meta.ogImageHeight = $('meta[property="og:image:height"]').attr("content") || "";
  meta.ogImageType = $('meta[property="og:image:type"]').attr("content") || "";
  meta.twitterImage = $('meta[name="twitter:image"]').attr("content") || "";
  if (meta.og["og:image"]) meta.og["og:image_local"] = localize(meta.og["og:image"]);

  $("h1").each((_, el) => meta.h1.push(clean($(el).text())));
  $("h2").each((_, el) => meta.h2.push(clean($(el).text())));
  $("h3").each((_, el) => meta.h3.push(clean($(el).text())));
  $("h4").each((_, el) => meta.h4.push(clean($(el).text())));

  // Schema
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    try {
      const parsed = JSON.parse(raw);
      const items = parsed["@graph"] ? parsed["@graph"] : Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const t = Array.isArray(item["@type"]) ? item["@type"].join("+") : item["@type"];
        meta.schemaTypes.push(t || "?");
        if (t === "Article" || t === "BlogPosting") {
          meta.articleSchema = {
            headline: item.headline,
            description: item.description,
            datePublished: item.datePublished,
            dateModified: item.dateModified,
            author: item.author?.name,
            image: item.image,
            articleSection: item.articleSection,
            keywords: item.keywords,
          };
        }
        if (t === "BreadcrumbList") {
          meta.breadcrumb = (item.itemListElement || []).map(x => ({
            name: x.name || x.item?.name,
            url: x.item?.["@id"] || x.item,
          }));
        }
      }
    } catch {}
  });

  // Hero image: first content image after page header
  const firstImg = $(".fusion-image-element img, .post-content img, article img").first();
  if (firstImg.length) {
    meta.heroImage = localize(firstImg.attr("src") || "");
  }
  if (!meta.heroImage && meta.og["og:image"]) {
    meta.heroImage = localize(meta.og["og:image"]);
  }

  // Author / category for posts
  meta.author = $('meta[name="author"]').attr("content") || $('a[rel="author"]').first().text().trim();
  const catLink = $('a[href*="/category/"]').first();
  if (catLink.length) meta.category = clean(catLink.text());

  audit[slug] = meta;
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(meta, null, 2));
}

writeFileSync(join(ROOT, "audit-all.json"), JSON.stringify(audit, null, 2));
console.log(`DONE. ${Object.keys(audit).length} pages audited.`);

// Print quick summary
for (const slug of Object.keys(audit).sort()) {
  const m = audit[slug];
  console.log(`\n[${slug}]`);
  console.log(`  TITLE:  ${m.title}`);
  console.log(`  DESC:   ${m.description.slice(0,120)}${m.description.length>120?"...":""}`);
  console.log(`  H1:     ${m.h1.join(" | ")}`);
  console.log(`  H2:     ${m.h2.slice(0,4).join(" | ")}${m.h2.length>4?"...":""}`);
  console.log(`  schema: ${m.schemaTypes.join(", ")}`);
}
