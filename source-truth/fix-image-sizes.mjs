// Fix responsive-image `sizes` attributes. Avada's exported `sizes` values
// assume the original WordPress layout and are often far larger than how the
// image actually renders here — so the browser downloads an oversized srcset
// candidate. This measures every srcset <img>'s real rendered width (desktop
// 1440 + mobile 390) and rewrites `sizes` to match, so the browser picks the
// smallest sufficient variant.
//
// Run against the running preview (port 5010). Rewrites the source-port HTML
// fragments in place; re-run `npm run build` afterward.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = "c:/Projects/valleyseptic";
const PORT = join(ROOT, "src/data/source-port");
const BASE = process.env.LOCAL_URL || "http://localhost:5010";

// slug -> route
function loadObj(file, name) {
  const txt = readFileSync(join(PORT, file), "utf8");
  return JSON.parse(txt.slice(txt.indexOf("{", txt.indexOf(name)), txt.lastIndexOf("}") + 1));
}
const cssManifest = loadObj("css-manifest.ts", "PORT_CSS"); // keys = all port slugs

// Map slug -> URL path. Posts live at root; areas/services at root; home = /.
const ROUTE = {
  home: "/",
  "septic-services-abbotsford": "/septic-services-abbotsford/",
  "septic-services-chilliwack": "/septic-services-chilliwack/",
  "septic-services-hope": "/septic-services-hope/",
  "septic-services-langley": "/septic-services-langley/",
  "septic-services-mission": "/septic-services-mission/",
};
function routeFor(slug) {
  if (ROUTE[slug]) return ROUTE[slug];
  if (slug.startsWith("post-")) return "/" + slug.slice(5) + "/";
  return "/" + slug + "/";
}

const browser = await chromium.launch({ headless: true });

// For a given page region selector, return rendered widths of each <img> in
// document order, at the given viewport.
async function measure(page, route, vw) {
  await page.setViewportSize({ width: vw, height: 900 });
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 30000 });
  }
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const regionOf = el =>
      el.closest(".fusion-tb-header") ? "header"
      : el.closest(".fusion-tb-footer") ? "footer"
      : el.closest("main#main") ? "main" : "other";
    const out = { main: [], header: [], footer: [] };
    document.querySelectorAll("img").forEach(img => {
      const r = regionOf(img);
      if (out[r]) out[r].push(Math.round(img.getBoundingClientRect().width));
    });
    return out;
  });
}

const page = await browser.newPage();
let filesChanged = 0, attrsChanged = 0;

for (const slug of Object.keys(cssManifest)) {
  const route = routeFor(slug);
  let desk, mob;
  try {
    desk = await measure(page, route, 1440);
    mob = await measure(page, route, 390);
  } catch (e) {
    console.warn(`  skip ${slug}: ${e.message.slice(0, 60)}`);
    continue;
  }

  for (const [region, suffix] of [["main", ".html"], ["header", ".header.html"], ["footer", ".footer.html"]]) {
    const fp = join(PORT, slug + suffix);
    let html;
    try { html = readFileSync(fp, "utf8"); } catch { continue; }
    // isDocument:false — these files are bare HTML fragments; don't let cheerio
    // wrap them in <html><head><body> (which $.html() would then emit back).
    const $ = cheerio.load(html, { decodeEntities: false }, false);
    const imgs = $("img").toArray();
    const dW = desk[region] || [];
    const mW = mob[region] || [];
    let changed = false;

    imgs.forEach((el, i) => {
      const $el = $(el);
      if (!$el.attr("srcset")) return;            // only responsive imgs
      const d = dW[i], m = mW[i];
      if (!d || d < 2) return;                    // hidden / unmeasured — leave it
      // Round display widths up a touch; browser multiplies by DPR itself.
      const deskPx = Math.ceil(d);
      const mobPx = Math.ceil(m && m > 1 ? m : d);
      const sizes = `(max-width: 640px) ${mobPx}px, ${deskPx}px`;
      if ($el.attr("sizes") !== sizes) {
        $el.attr("sizes", sizes);
        changed = true;
        attrsChanged++;
      }
    });

    if (changed) {
      writeFileSync(fp, $.html());
      filesChanged++;
    }
  }
}

await browser.close();
console.log(`\nDONE. Rewrote sizes on ${attrsChanged} <img> across ${filesChanged} files.`);
