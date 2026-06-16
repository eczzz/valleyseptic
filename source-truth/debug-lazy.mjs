import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push(e.message.slice(0, 160)));
page.on("console", m => { if (m.type() === "error") errs.push("C:" + m.text().slice(0, 160)); });

await page.goto("http://localhost:5010/", { waitUntil: "networkidle", timeout: 30000 });

// State right after load
let s = await page.evaluate(() => ({
  lazyNodes: document.querySelectorAll('script[data-port-lazy]').length,
  activeBundle: document.querySelectorAll('script[src*="cache/min"]').length,
  jq: typeof window.jQuery,
}));
console.log("immediately after load:", JSON.stringify(s));

// Wait for idle boot (timeout 2500) + slack
await page.waitForTimeout(4000);
s = await page.evaluate(() => ({
  activeBundle: document.querySelectorAll('script[src*="cache/min"]').length,
  jq: typeof window.jQuery,
  jqVer: window.jQuery && window.jQuery.fn ? window.jQuery.fn.jquery : null,
  fusionForm: window.jQuery && window.jQuery.fn ? typeof window.jQuery.fn.fusion_maps : "n/a",
}));
console.log("after 4s idle wait:", JSON.stringify(s));

// Trigger an interaction
await page.mouse.move(200, 200);
await page.waitForTimeout(2500);
s = await page.evaluate(() => ({
  activeBundle: document.querySelectorAll('script[src*="cache/min"]').length,
  jq: typeof window.jQuery,
}));
console.log("after interaction:", JSON.stringify(s));

console.log("errors:", errs.length);
errs.slice(0, 8).forEach(e => console.log("  ", e));
await browser.close();
