// Test if Google Maps renders on every page that has one.
import { chromium } from "playwright";

const BASE = process.env.LOCAL_URL || "http://localhost:5010";
const ROUTES = [
  "/septic-services-abbotsford/",
  "/septic-services-chilliwack/",
  "/septic-services-mission/",
  "/septic-services-langley/",
  "/septic-services-hope/",
  "/septic-tank-cleaning-langley/",
  "/septic-tank-cleaning-mission/",
  "/contact/",
];

const browser = await chromium.launch({ headless: true });
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3500);
    const maps = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.fusion-google-map, [id^="fusion_map_"]'));
      return els.map(el => ({
        id: el.id,
        rendered: el.innerHTML.length > 1000 && !!el.querySelector("iframe"),
        innerHTMLLen: el.innerHTML.length,
        hasIframe: !!el.querySelector("iframe"),
      }));
    });
    const allOk = maps.length > 0 && maps.every(m => m.rendered);
    console.log(`${route.padEnd(40)} ${allOk ? "OK " : "BAD"} maps=${maps.length} ${JSON.stringify(maps.map(m => ({ rendered: m.rendered, iHTML: m.innerHTMLLen })))}`);
  } catch (e) {
    console.log(`${route.padEnd(40)} ERR ${e.message.slice(0,60)}`);
  }
  await ctx.close();
}
await browser.close();
