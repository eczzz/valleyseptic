// Verify the header logo renders at a sane size on Astro vs Raw.
import { chromium } from "playwright";

const TARGETS = [
  { name: "ASTRO", url: "http://localhost:5010/" },
  { name: "RAW  ", url: "http://localhost:5012/" },
];

const browser = await chromium.launch({ headless: true });
for (const t of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    const logo = await page.evaluate(() => {
      const img = document.querySelector('.fusion-tb-header img, .fusion-logo img, header img');
      if (!img) return { found: false };
      const r = img.getBoundingClientRect();
      return {
        found: true,
        src: img.getAttribute("src"),
        rendered: { w: Math.round(r.width), h: Math.round(r.height) },
        natural: { w: img.naturalWidth, h: img.naturalHeight },
        complete: img.complete,
        loaded: img.complete && img.naturalWidth > 0,
        inHeader: !!img.closest(".fusion-tb-header"),
      };
    });
    console.log(`${t.name}: ${JSON.stringify(logo)}`);
  } catch (e) {
    console.log(`${t.name}: ERR ${e.message.slice(0, 80)}`);
  }
  await ctx.close();
}
await browser.close();
