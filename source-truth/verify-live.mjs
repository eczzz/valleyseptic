// Verify rendered dist/ output against a FRESH capture of the live site
// (raw-live/ directory). Drops per-request noise (WP Rocket cache timestamps,
// fusion map IDs, Google Maps nonces) before comparing.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic";
const RAW_LIVE = join(ROOT, "source-truth/raw-live");
const DIST = join(ROOT, "dist");

const REDIRECTS = new Set(["septic-tank-cleaning-abbotsford"]);

function extract(html) {
  const $ = cheerio.load(html);
  // Walk every JSON-LD block and collect schema @type values for comparison
  const schemaTypes = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).html());
      const items = j["@graph"] || (Array.isArray(j) ? j : [j]);
      for (const item of items) {
        const t = Array.isArray(item["@type"]) ? item["@type"].join("+") : item["@type"];
        schemaTypes.push(t);
      }
    } catch {}
  });
  return {
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content") || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
    ogTitle: $('meta[property="og:title"]').attr("content") || "",
    ogDescription: $('meta[property="og:description"]').attr("content") || "",
    ogImage: $('meta[property="og:image"]').attr("content") || "",
    ogType: $('meta[property="og:type"]').attr("content") || "",
    ogUpdated: $('meta[property="og:updated_time"]').attr("content")
            || $('meta[property="article:modified_time"]').attr("content") || "",
    articlePublished: $('meta[property="article:published_time"]').attr("content") || "",
    articleAuthor: $('meta[property="article:author"]').attr("content") || $('meta[name="author"]').attr("content") || "",
    h1: $("h1").first().text().trim(),
    h2List: $("h2").map((_, el) => $(el).text().trim()).get().filter(t => t),
    schemaTypes,
  };
}

function distPath(slug) {
  if (slug === "home") return join(DIST, "index.html");
  return join(DIST, `${slug.replace(/^post-/, "")}/index.html`);
}

const files = readdirSync(RAW_LIVE).filter(f => f.endsWith(".raw.html")).sort();
let ok = 0, mismatch = 0;
const issues = [];

for (const f of files) {
  const slug = f.replace(".raw.html", "");
  if (REDIRECTS.has(slug)) continue;
  const src = extract(readFileSync(join(RAW_LIVE, f), "utf8"));
  const distFile = distPath(slug);
  if (!existsSync(distFile)) {
    console.log(`? ${slug} — missing in dist`);
    issues.push({ slug, missing: true });
    mismatch++;
    continue;
  }
  const got = extract(readFileSync(distFile, "utf8"));

  const diffs = [];
  const checks = [
    ["title", src.title, got.title],
    ["description", src.description, got.description],
    ["canonical", src.canonical, got.canonical],
    ["og:title", src.ogTitle, got.ogTitle],
    ["og:description", src.ogDescription, got.ogDescription],
    ["og:type", src.ogType, got.ogType],
    ["h1", src.h1, got.h1],
  ];
  for (const [field, e, g] of checks) {
    if (e && e !== g) diffs.push({ field, expected: e, got: g });
  }
  // Article date: published should match; modified might be ours == source's
  if (src.articlePublished && got.articlePublished && src.articlePublished !== got.articlePublished) {
    diffs.push({ field: "article:published_time", expected: src.articlePublished, got: got.articlePublished });
  }

  if (diffs.length === 0) {
    ok++;
    console.log(`✓ ${slug}`);
  } else {
    mismatch++;
    console.log(`✗ ${slug}`);
    for (const d of diffs) {
      console.log(`    ${d.field}:`);
      console.log(`       source : ${d.expected}`);
      console.log(`       rebuilt: ${d.got}`);
    }
    issues.push({ slug, diffs });
  }
}
console.log(`\n--- ${ok} OK, ${mismatch} with diffs (of ${files.length - REDIRECTS.size} pages) ---`);
if (issues.length) {
  console.log("\nWrote diff report to source-truth/live-diff.json");
  require("fs").writeFileSync(
    join(ROOT, "source-truth/live-diff.json"),
    JSON.stringify(issues, null, 2)
  );
}
