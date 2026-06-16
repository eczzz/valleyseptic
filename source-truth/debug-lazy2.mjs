// Generous-timing check: does the lazy JS eventually wire up forms + maps?
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
for (const route of ["/septic-services-abbotsford/", "/tank-pumping/"]) {
  console.log("\n=== " + route + " ===");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5010" + route, { waitUntil: "networkidle", timeout: 30000 });

  for (const t of [3000, 6000, 10000]) {
    await page.waitForTimeout(t === 3000 ? 3000 : 3000);
    const s = await page.evaluate(() => {
      const f = document.querySelector("form.fusion-form");
      const map = document.querySelector('.fusion-google-map, [id^="fusion_map_"]');
      return {
        jq: typeof window.jQuery,
        bundleTags: document.querySelectorAll('script[src*="cache/min"]').length,
        formSubmitBound: f && window.jQuery
          ? Object.keys(window.jQuery._data(f, "events") || {}).includes("submit")
          : false,
        mapRendered: map ? (map.innerHTML.length > 1000 && !!map.querySelector("iframe")) : "no-map",
      };
    });
    console.log("  @" + t + "ms:", JSON.stringify(s));
  }
  await ctx.close();
}
await browser.close();
