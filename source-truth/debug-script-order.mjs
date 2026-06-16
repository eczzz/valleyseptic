// Capture script execution and errors on raw vs astro
import { chromium } from "playwright";

const TARGETS = [
  { name: "RAW  ", url: "http://localhost:5012/" },
  { name: "ASTRO", url: "http://localhost:5010/" },
];

const browser = await chromium.launch({ headless: true });
for (const t of TARGETS) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push("PAGEERR: " + e.message.slice(0, 200)));
  page.on("console", m => {
    if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 200));
  });
  const responses = [];
  page.on("response", resp => {
    if (resp.url().endsWith(".js")) responses.push({ url: resp.url().slice(-80), status: resp.status() });
  });

  await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  const state = await page.evaluate(() => ({
    hasJQuery: typeof jQuery !== "undefined",
    jQueryVersion: typeof jQuery !== "undefined" ? jQuery.fn?.jquery : null,
    hasFusion: typeof fusionApp !== "undefined" || typeof Fusion !== "undefined" || !!window.Fusion,
    fusionFormCount: document.querySelectorAll("form.fusion-form").length,
    bodyClasses: document.body.className.split(" ").slice(0, 5).join(" "),
  }));

  console.log(`\n=== ${t.name} (${t.url}) ===`);
  console.log("  state:", JSON.stringify(state));
  console.log("  scripts loaded:", responses.length);
  responses.slice(0, 5).forEach(r => console.log("   ", r.status, r.url));
  console.log("  errors:", errs.length);
  errs.slice(0, 5).forEach(e => console.log("   ", e));
  await ctx.close();
}
await browser.close();
