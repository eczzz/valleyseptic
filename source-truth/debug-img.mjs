// Compare the two suspect images on Astro vs Raw.
import { chromium } from "playwright";

const SUSPECTS = [
  "valley-septic-service-areas",
  "abbotsford-septic-and-plumbing",
];
const PAGES = {
  "valley-septic-service-areas": "/",
  "abbotsford-septic-and-plumbing": "/septic-services-abbotsford/",
};

const browser = await chromium.launch({ headless: true });
for (const key of SUSPECTS) {
  const route = PAGES[key];
  console.log(`\n=== ${key}  (page ${route}) ===`);
  for (const [label, base] of [["ASTRO", "http://localhost:5010"], ["RAW", "http://localhost:5012"]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      document.querySelectorAll("img[loading=lazy]").forEach(i => (i.loading = "eager"));
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1500);

    const info = await page.evaluate((k) => {
      const img = Array.from(document.querySelectorAll("img")).find(i => (i.src || i.getAttribute("src") || "").includes(k));
      if (!img) return { found: false };
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const anc = [];
      let p = img.parentElement, d = 0;
      while (p && d < 8) {
        const pcs = getComputedStyle(p);
        const pr = p.getBoundingClientRect();
        anc.push({
          tag: p.tagName, cls: (p.className || "").toString().slice(0, 50),
          display: pcs.display, visibility: pcs.visibility,
          w: Math.round(pr.width), h: Math.round(pr.height),
        });
        p = p.parentElement; d++;
      }
      return {
        found: true,
        natural: img.naturalWidth + "x" + img.naturalHeight,
        rendered: Math.round(r.width) + "x" + Math.round(r.height),
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        imgWidthCss: cs.width, imgHeightCss: cs.height,
        ancestry: anc,
      };
    }, key);
    console.log(`  ${label}:`, JSON.stringify(info, null, 1).replace(/\n\s*/g, " "));
  }
}
await browser.close();
