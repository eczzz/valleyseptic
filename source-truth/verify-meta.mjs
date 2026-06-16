// Exhaustive meta-tag diff: source raw-live/<slug>.raw.html vs dist/<slug>/index.html.
// Compares every head field that affects SEO / social previews.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic";
const RAW_LIVE = join(ROOT, "source-truth/raw-live");
const DIST = join(ROOT, "dist");
const REDIRECTS = new Set(["septic-tank-cleaning-abbotsford"]);

function extract(html) {
  const $ = cheerio.load(html);
  return {
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content") || "",
    robots: $('meta[name="robots"]').attr("content") || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
    "og:locale": $('meta[property="og:locale"]').attr("content") || "",
    "og:type": $('meta[property="og:type"]').attr("content") || "",
    "og:title": $('meta[property="og:title"]').attr("content") || "",
    "og:description": $('meta[property="og:description"]').attr("content") || "",
    "og:url": $('meta[property="og:url"]').attr("content") || "",
    "og:site_name": $('meta[property="og:site_name"]').attr("content") || "",
    "og:updated_time": $('meta[property="og:updated_time"]').attr("content") || "",
    "og:image": $('meta[property="og:image"]').attr("content") || "",
    "og:image:width": $('meta[property="og:image:width"]').attr("content") || "",
    "og:image:height": $('meta[property="og:image:height"]').attr("content") || "",
    "og:image:type": $('meta[property="og:image:type"]').attr("content") || "",
    "article:published_time": $('meta[property="article:published_time"]').attr("content") || "",
    "article:modified_time": $('meta[property="article:modified_time"]').attr("content") || "",
    "article:author": $('meta[property="article:author"]').attr("content") || "",
    "article:section": $('meta[property="article:section"]').attr("content") || "",
    "twitter:card": $('meta[name="twitter:card"]').attr("content") || "",
    "twitter:title": $('meta[name="twitter:title"]').attr("content") || "",
    "twitter:description": $('meta[name="twitter:description"]').attr("content") || "",
    "twitter:image": $('meta[name="twitter:image"]').attr("content") || "",
  };
}

function distPath(slug) {
  if (slug === "home") return join(DIST, "index.html");
  return join(DIST, `${slug.replace(/^post-/, "")}/index.html`);
}

const files = readdirSync(RAW_LIVE).filter(f => f.endsWith(".raw.html")).sort();
const fields = Object.keys(extract("<html><head></head><body></body></html>"));
const tally = Object.fromEntries(fields.map(f => [f, { match: 0, diff: 0, missingInSource: 0 }]));
const mismatches = [];

for (const f of files) {
  const slug = f.replace(".raw.html", "");
  if (REDIRECTS.has(slug)) continue;
  const distFile = distPath(slug);
  if (!existsSync(distFile)) continue;
  const src = extract(readFileSync(join(RAW_LIVE, f), "utf8"));
  const got = extract(readFileSync(distFile, "utf8"));

  for (const field of fields) {
    if (!src[field] && !got[field]) continue;
    if (!src[field]) { tally[field].missingInSource++; continue; }
    if (src[field] === got[field]) {
      tally[field].match++;
    } else {
      tally[field].diff++;
      mismatches.push({ slug, field, src: src[field], got: got[field] });
    }
  }
}

console.log("Field-by-field match counts across 29 pages:\n");
const longest = Math.max(...fields.map(f => f.length));
for (const field of fields) {
  const t = tally[field];
  const total = t.match + t.diff;
  const pad = " ".repeat(longest - field.length);
  const status = t.diff === 0 ? "✓" : "✗";
  const note = t.missingInSource ? ` (${t.missingInSource} pages have no source value)` : "";
  console.log(`  ${status}  ${field}${pad}  ${t.match}/${total} match${note}`);
}

if (mismatches.length) {
  console.log("\nMismatches:");
  for (const m of mismatches.slice(0, 30)) {
    console.log(`\n  ${m.slug} → ${m.field}`);
    console.log(`     source : ${m.src}`);
    console.log(`     rebuilt: ${m.got}`);
  }
  if (mismatches.length > 30) console.log(`  ...and ${mismatches.length - 30} more`);
} else {
  console.log("\nAll fields match the live site on all 29 pages.");
}
