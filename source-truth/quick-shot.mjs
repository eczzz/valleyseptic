// One-off: screenshot the local home page at desktop width
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "c:/Projects/valleyseptic/source-truth/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();

const targets = [
  ["home", "/"],
  ["about", "/about/"],
  ["tank-pumping", "/tank-pumping/"],
];

for (const [slug, path] of targets) {
  await page.setViewportSize({ width: 1440, height: 900 });
  try {
    await page.goto("http://localhost:4331" + path, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto("http://localhost:4331" + path, { waitUntil: "load", timeout: 30000 });
  }
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.querySelectorAll("img[loading=lazy]").forEach(img => img.loading = "eager");
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/AFTER-${slug}-desktop.png`, fullPage: true });
  console.log("shot " + slug);
}
await browser.close();
