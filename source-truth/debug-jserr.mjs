// Track which script triggers the setAttribute null error
import { chromium } from "playwright";

const ROUTES = [
  "/contact/",
  "/how-does-a-septic-tank-work/",
  "/how-often-should-you-pump-your-septic-tank-in-the-fraser-valley/",
  "/septic-tank-cleaning-langley/",
];

const browser = await chromium.launch({ headless: true });
for (const route of ROUTES) {
  console.log(`\n=== ${route} ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", e => {
    if (/setAttribute/.test(e.message)) {
      console.log("PAGEERR:", e.message);
      console.log("STACK :", (e.stack || "").split("\n").slice(0, 8).join("\n"));
    }
  });
  try {
    await page.goto("http://localhost:5010" + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);
  } catch (e) { console.log("err", e.message.slice(0, 80)); }
  await ctx.close();
}
await browser.close();
