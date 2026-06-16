// Why doesn't the abbotsford map render on Astro? Check console errors,
// network requests for maps API, and whether the iframe/map div renders.
import { chromium } from "playwright";

const TARGETS = [
  { name: "ASTRO", url: "http://localhost:5010/septic-services-abbotsford/" },
  { name: "RAW  ", url: "http://localhost:5012/septic-services-abbotsford/" },
];

const browser = await chromium.launch({ headless: true });
for (const t of TARGETS) {
  console.log(`\n=== ${t.name} (${t.url}) ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  const requests = [];
  page.on("pageerror", e => errs.push("PAGEERR: " + e.message.slice(0, 200)));
  page.on("console", m => {
    if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 200));
  });
  page.on("response", r => {
    if (/maps\.googleapis\.com|maps\.google\.com/i.test(r.url())) {
      requests.push({ status: r.status(), url: r.url().slice(0, 140) });
    }
  });

  await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3500);

  // Trigger map scroll into view
  await page.evaluate(() => {
    const map = document.querySelector('.fusion-google-map, [id^="fusion_map_"]');
    if (map) map.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(2000);

  const mapState = await page.evaluate(() => {
    const map = document.querySelector('.fusion-google-map, [id^="fusion_map_"]');
    if (!map) return { exists: false };
    const r = map.getBoundingClientRect();
    return {
      exists: true,
      class: map.className.slice(0, 80),
      id: map.id,
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      innerHTMLLen: map.innerHTML.length,
      hasIframe: !!map.querySelector("iframe"),
      hasCanvas: !!map.querySelector("canvas"),
      hasDiv: map.querySelectorAll("div").length,
      googleDefined: typeof window.google !== "undefined",
      mapsDefined: typeof window.google?.maps !== "undefined",
    };
  });
  console.log("  map state:", JSON.stringify(mapState));
  console.log("  Maps API requests:");
  requests.forEach(r => console.log("    ", r.status, r.url));
  console.log("  errors:", errs.length, "→ first few:");
  errs.slice(0, 5).forEach(e => console.log("    ", e));

  await ctx.close();
}
await browser.close();
