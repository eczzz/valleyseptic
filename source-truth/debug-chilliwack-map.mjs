// Why doesn't the chilliwack map render on Astro?
import { chromium } from "playwright";

const TARGETS = [
  { name: "ASTRO Chilliwack", url: "http://localhost:5010/septic-services-chilliwack/" },
  { name: "ASTRO Abbotsford", url: "http://localhost:5010/septic-services-abbotsford/" },
  { name: "RAW   Chilliwack", url: "http://localhost:5012/septic-services-chilliwack/" },
];

const browser = await chromium.launch({ headless: true });
for (const t of TARGETS) {
  console.log(`\n=== ${t.name} ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  const mapReqs = [];
  page.on("pageerror", e => errs.push("PAGEERR: " + e.message.slice(0, 200)));
  page.on("console", m => {
    if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 200));
  });
  page.on("response", r => {
    if (/maps\.googleapis\.com|maps\.google\.com/i.test(r.url())) {
      mapReqs.push(r.status());
    }
  });

  await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => {
    const map = document.querySelector('.fusion-google-map, [id^="fusion_map_"]');
    if (map) map.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(2500);

  const mapInfo = await page.evaluate(() => {
    const maps = Array.from(document.querySelectorAll('.fusion-google-map, [id^="fusion_map_"]'));
    return maps.map(map => ({
      id: map.id,
      class: map.className.slice(0, 80),
      rect: { w: Math.round(map.getBoundingClientRect().width), h: Math.round(map.getBoundingClientRect().height) },
      innerHTMLLen: map.innerHTML.length,
      hasIframe: !!map.querySelector("iframe"),
    }));
  });
  console.log("  maps found:", mapInfo.length);
  mapInfo.forEach((m, i) => console.log("   [" + i + "]", JSON.stringify(m)));
  console.log("  Maps API reqs:", mapReqs.length);
  console.log("  errors (first 5):");
  errs.slice(0, 5).forEach(e => console.log("    ", e));

  await ctx.close();
}
await browser.close();
