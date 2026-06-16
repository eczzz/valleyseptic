// Why does Playwright .click() time out on abbotsford submit button?
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const posts = [];
page.on("request", r => {
  if (r.method() === "POST" && /admin-ajax/.test(r.url())) posts.push(r.postData()?.slice(0, 50));
});

await page.goto("http://localhost:5010/septic-services-abbotsford/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);

// Inspect the submit button location and elements at that point
const inspect = await page.evaluate(() => {
  const btn = document.querySelector('form.fusion-form button[type="submit"]');
  if (!btn) return { error: "no btn" };
  btn.scrollIntoView({ block: "center" });
  const r = btn.getBoundingClientRect();
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const stack = document.elementsFromPoint(cx, cy);
  return {
    btnRect: { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top },
    centerPoint: { cx, cy },
    elementsAtCenter: stack.slice(0, 6).map(el => ({
      tag: el.tagName,
      class: (el.className || "").toString().slice(0, 80),
      id: el.id,
    })),
    isClickable: stack.length > 0 && (stack[0] === btn || btn.contains(stack[0]) || (stack[0]?.contains?.(btn) ?? false)),
  };
});
console.log("inspect:", JSON.stringify(inspect, null, 2));

// Try to fill and force-click via JS
await page.fill('form.fusion-form input[name="name"]', "Test").catch(() => {});
await page.fill('form.fusion-form input[name="email"]', "test@example.com").catch(() => {});
await page.fill('form.fusion-form input[name="phone"]', "555-0100").catch(() => {});
await page.fill('form.fusion-form input[name="city"]', "Abbotsford").catch(() => {});
await page.fill('form.fusion-form input[name="subject"]', "Sub").catch(() => {});
await page.fill('form.fusion-form textarea[name="message"]', "Msg").catch(() => {});

console.log("\nPosts after fill:", posts.length);

// Force-click via JS
const clickResult = await page.evaluate(() => {
  const btn = document.querySelector('form.fusion-form button[type="submit"]');
  if (!btn) return "no btn";
  btn.click();
  return "JS click fired";
});
console.log("force-click:", clickResult);
await page.waitForTimeout(4000);
console.log("Posts after force-click:", posts.length);
posts.forEach(p => console.log("  →", p));

await browser.close();
