// Inspect the "Due for Service" dark calculator section
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on("console", msg => { if (msg.type() === "error") console.log("CONSOLE", msg.text().slice(0,300)); });
page.on("response", async (resp) => {
  if (resp.status() >= 400) console.log("HTTP", resp.status(), resp.url());
});

await page.goto("http://localhost:4331/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);

const dark = await page.evaluate(() => {
  const sections = document.querySelectorAll(".fusion-fullwidth");
  // The dark section is the 2nd (index 1) — fusion-builder-row-4
  const s = sections[1];
  if (!s) return { error: "no section[1]" };
  const cs = getComputedStyle(s);
  const rect = s.getBoundingClientRect();
  // Inspect inner row and columns
  const row = s.querySelector(".fusion-builder-row");
  const cols = row ? Array.from(row.children) : [];
  return {
    sectionRect: { x: rect.x, y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    sectionBg: cs.backgroundColor,
    sectionPadding: cs.padding,
    rowClass: row?.className,
    rowDisplay: row ? getComputedStyle(row).display : null,
    rowFlexWrap: row ? getComputedStyle(row).flexWrap : null,
    rowMaxWidth: row ? getComputedStyle(row).maxWidth : null,
    rowWidth: row ? getComputedStyle(row).width : null,
    rowRect: row ? (() => { const r = row.getBoundingClientRect(); return { x: r.x, y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
    cols: cols.map((c, i) => {
      const ccs = getComputedStyle(c);
      const r = c.getBoundingClientRect();
      return {
        idx: i,
        class: c.className.split(/\s+/).slice(0, 3).join(" "),
        display: ccs.display,
        width: ccs.width,
        flex: ccs.flex,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        widthLarge: ccs.getPropertyValue("--awb-width-large").trim(),
      };
    }),
  };
});
console.log(JSON.stringify(dark, null, 2));

await browser.close();
