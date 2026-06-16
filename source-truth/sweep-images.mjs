// Walk every dist route, find broken images. "Broken" = failed to load
// (naturalWidth 0 / complete-but-empty), 404 response, or visibly rendered at
// raw intrinsic size with no CSS constraint (a sign of a missing wrapper).
import { chromium } from "playwright";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.LOCAL_URL || "http://localhost:5010";

function findRoutes(dir, base = "") {
  const out = [];
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    if (statSync(fp).isDirectory()) out.push(...findRoutes(fp, base + "/" + f));
    else if (f === "index.html") out.push((base || "") + "/");
  }
  return out;
}
const routes = findRoutes("dist").sort();
console.log("Routes to scan:", routes.length, "\n");

const browser = await chromium.launch({ headless: true });

const brokenByImg = new Map();   // src -> { count, routes:Set, reason }
const img404 = new Map();        // url -> status
let totalImgs = 0;

for (const route of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("response", r => {
    if (r.status() >= 400 && /\.(webp|jpe?g|png|gif|avif|svg)(\?|$)/i.test(r.url())) {
      img404.set(r.url(), r.status());
    }
  });
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1200);
    // force-load lazy images, scroll through
    await page.evaluate(() => {
      document.querySelectorAll("img[loading=lazy]").forEach(i => (i.loading = "eager"));
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img")).map(img => {
        const r = img.getBoundingClientRect();
        return {
          src: img.currentSrc || img.src || img.getAttribute("src") || "(none)",
          complete: img.complete,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          renderedW: Math.round(r.width),
          renderedH: Math.round(r.height),
          display: getComputedStyle(img).display,
        };
      });
    });
    totalImgs += imgs.length;

    for (const im of imgs) {
      let reason = null;
      // Failed to load
      if (im.complete && im.naturalW === 0 && im.display !== "none") reason = "failed-load";
      // Loaded but rendered at zero size while visible
      else if (im.naturalW > 0 && im.renderedW === 0 && im.display !== "none") reason = "zero-rendered";
      if (reason) {
        const key = im.src;
        if (!brokenByImg.has(key)) brokenByImg.set(key, { count: 0, routes: new Set(), reason });
        const e = brokenByImg.get(key);
        e.count++;
        e.routes.add(route);
      }
    }
  } catch (e) {
    console.log("NAV FAIL", route, e.message.slice(0, 60));
  }
  await ctx.close();
}
await browser.close();

console.log("=== IMAGE SWEEP ===");
console.log("Total <img> elements seen:", totalImgs);
console.log("HTTP 4xx/5xx image responses:", img404.size);
for (const [url, status] of img404) console.log("  ", status, url.replace(BASE, ""));
console.log("\nBroken-render images:", brokenByImg.size);
for (const [src, e] of brokenByImg) {
  console.log(`  [${e.reason}] ${src.replace(BASE, "")}`);
  console.log(`     on ${e.routes.size} page(s): ${[...e.routes].slice(0, 5).join(", ")}${e.routes.size > 5 ? " …" : ""}`);
}
if (brokenByImg.size === 0 && img404.size === 0) console.log("\n✅ No broken images.");
