// Check whether MobileNav hydration still errors after Vite cache clear.
import { chromium } from "playwright";

const BASE = process.env.LOCAL_URL || "http://localhost:4334";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 800, height: 900 } });
const page = await ctx.newPage();
let createRootError = false;
page.on("console", msg => {
  const t = msg.text();
  if (t.includes("createRoot") || t.includes("astro-island")) {
    console.log("CONSOLE", msg.type(), t.slice(0, 300));
    if (t.includes("createRoot")) createRootError = true;
  }
});
// Try a faq-items page (still uses Astro Header w/ MobileNav)
await page.goto(BASE + "/faq-items/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1500);
console.log("createRoot error present:", createRootError);
await browser.close();
