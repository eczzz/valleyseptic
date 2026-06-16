// Compare JSON-LD structured data per page: source-truth/raw-live/<slug>.raw.html
// vs dist/<slug>/index.html. Reports missing @type nodes and key fields.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic";
const RAW_LIVE = join(ROOT, "source-truth/raw-live");
const DIST = join(ROOT, "dist");
const REDIRECTS = new Set(["septic-tank-cleaning-abbotsford"]);

function extractSchemas(html) {
  const $ = cheerio.load(html);
  const all = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).html());
      const items = j["@graph"] || (Array.isArray(j) ? j : [j]);
      for (const it of items) all.push(it);
    } catch (e) {
      all.push({ _parseError: e.message });
    }
  });
  return all;
}

function typeOf(node) {
  const t = node["@type"];
  return Array.isArray(t) ? t.join("+") : (t || "?");
}

function distPath(slug) {
  if (slug === "home") return join(DIST, "index.html");
  return join(DIST, `${slug.replace(/^post-/, "")}/index.html`);
}

const files = readdirSync(RAW_LIVE).filter(f => f.endsWith(".raw.html")).sort();
const report = [];
let pagesOk = 0, pagesMissingSchema = 0;

for (const f of files) {
  const slug = f.replace(".raw.html", "");
  if (REDIRECTS.has(slug)) continue;
  const distFile = distPath(slug);
  if (!existsSync(distFile)) continue;

  const src = extractSchemas(readFileSync(join(RAW_LIVE, f), "utf8"));
  const got = extractSchemas(readFileSync(distFile, "utf8"));

  const srcTypes = src.map(typeOf);
  const gotTypes = got.map(typeOf);

  // Missing = in source but not in rebuilt
  const missing = srcTypes.filter(t => !gotTypes.includes(t));
  const extra = gotTypes.filter(t => !srcTypes.includes(t));

  // Detailed comparisons on key Schema.org fields
  const fieldDiffs = [];
  for (const type of new Set([...srcTypes, ...gotTypes])) {
    const sNode = src.find(n => typeOf(n) === type);
    const gNode = got.find(n => typeOf(n) === type);
    if (!sNode || !gNode) continue;
    // Compare a handful of well-known fields
    const fields = ["name", "headline", "url", "description", "datePublished", "dateModified", "@id"];
    for (const fld of fields) {
      if (sNode[fld] != null && JSON.stringify(sNode[fld]) !== JSON.stringify(gNode[fld])) {
        fieldDiffs.push({ type, field: fld, src: sNode[fld], dist: gNode[fld] });
      }
    }
  }

  const entry = {
    slug,
    srcTypes,
    gotTypes,
    missing,
    extra,
    fieldDiffs,
  };
  report.push(entry);

  if (missing.length === 0) pagesOk++;
  else pagesMissingSchema++;

  const status = missing.length === 0 ? "✓" : "✗";
  console.log(`${status} ${slug}`);
  console.log(`   source : ${srcTypes.join(", ")}`);
  console.log(`   rebuilt: ${gotTypes.join(", ")}`);
  if (missing.length) console.log(`   MISSING: ${missing.join(", ")}`);
  if (extra.length) console.log(`   extra  : ${extra.join(", ")}`);
}

console.log(`\n--- ${pagesOk} pages with all source @types present, ${pagesMissingSchema} pages with missing @types ---`);
writeFileSync(join(ROOT, "source-truth/schema-diff.json"), JSON.stringify(report, null, 2));
console.log("Wrote full report to source-truth/schema-diff.json");
