// Open each counter-bearing page in headless Chromium with JS enabled and
// check the *rendered* counter values after the page loads.
import { chromium } from "playwright";

const BASE = process.env.LOCAL_URL || "http://localhost:5010";
const ROUTES = [
  "/tank-pumping/",
  "/septic-inspection/",
  "/septic-alarms/",
  "/grease-trap-service/",
  "/emergency-septic-services/",
  "/septic-tank-cleaning-langley/",
  "/septic-tank-cleaning-mission/",
];

const browser = await chromium.launch({ headless: true });
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2500);
    // Scroll to where counters are
    await page.evaluate(() => {
      const el = document.querySelector('.display-counter');
      if (el) el.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(2000);
    const vals = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.display-counter'));
      return els.map(el => ({
        rendered: el.textContent.trim(),
        dataValue: el.getAttribute('data-value'),
      }));
    });
    const ok = vals.every(v => v.rendered === v.dataValue);
    console.log(`${route.padEnd(40)} ${ok ? "OK " : "BAD"} ${JSON.stringify(vals)}`);
  } catch (e) {
    console.log(`${route.padEnd(40)} ERR ${e.message.slice(0, 80)}`);
  }
  await ctx.close();
}
await browser.close();
