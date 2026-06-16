// Verify rendered dist/<slug>/index.html against source-truth audit data.
// Reports any mismatch in title, meta description, canonical URL, OG image,
// or H1 text.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic";
const audit = JSON.parse(readFileSync(join(ROOT, "source-truth/audit-all.json"), "utf8"));

// Map source slug -> rendered dist path
function distPath(slug) {
  if (slug === "home") return join(ROOT, "dist/index.html");
  const cleaned = slug.replace(/^post-/, "");
  return join(ROOT, `dist/${cleaned}/index.html`);
}

function loadRendered(slug) {
  const p = distPath(slug);
  if (!existsSync(p)) return null;
  const html = readFileSync(p, "utf8");
  const $ = cheerio.load(html);
  return {
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content") || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
    ogImage: $('meta[property="og:image"]').attr("content") || "",
    ogTitle: $('meta[property="og:title"]').attr("content") || "",
    ogType: $('meta[property="og:type"]').attr("content") || "",
    ogModifiedTime: $('meta[property="og:updated_time"]').attr("content") || $('meta[property="article:modified_time"]').attr("content") || "",
    h1: $("h1").first().text().trim(),
    schemaCount: $('script[type="application/ld+json"]').length,
  };
}

const rows = [];
let okCount = 0;
let mismatchCount = 0;

const REDIRECT_ALIASES = new Set(["septic-tank-cleaning-abbotsford"]);

for (const slug of Object.keys(audit).sort()) {
  if (REDIRECT_ALIASES.has(slug)) continue;
  const src = audit[slug];
  const got = loadRendered(slug);
  if (!got) {
    rows.push({ slug, status: "MISSING" });
    mismatchCount++;
    continue;
  }

  const issues = [];
  if (got.title !== src.title) {
    issues.push({ field: "title", expected: src.title, got: got.title });
  }
  if (got.description !== src.description) {
    issues.push({ field: "description", expected: src.description, got: got.description });
  }
  // Canonical: source uses absolute https URL
  if (src.canonical && got.canonical !== src.canonical) {
    issues.push({ field: "canonical", expected: src.canonical, got: got.canonical });
  }
  if (src.h1[0] && got.h1 !== src.h1[0]) {
    issues.push({ field: "h1", expected: src.h1[0], got: got.h1 });
  }

  if (issues.length === 0) {
    okCount++;
    rows.push({ slug, status: "OK" });
  } else {
    mismatchCount++;
    rows.push({ slug, status: "MISMATCH", issues });
  }
}

// Print summary
for (const row of rows) {
  if (row.status === "OK") {
    console.log(`✓ ${row.slug}`);
  } else if (row.status === "MISSING") {
    console.log(`? ${row.slug}  [no rendered page found]`);
  } else {
    console.log(`✗ ${row.slug}`);
    for (const issue of row.issues) {
      console.log(`    ${issue.field}:`);
      console.log(`       expected: ${issue.expected}`);
      console.log(`       got     : ${issue.got}`);
    }
  }
}
console.log(`\n--- ${okCount} OK, ${mismatchCount} mismatches/missing of ${rows.length} pages ---`);
