// Inspect the two known gaps:
//   1. Home dark "Due for Service?" section — find calc image and hose image
//   2. About "Our Story: Rooted in Family" card — find why it's not rendering
import { chromium } from "playwright";

const BASE = process.env.LOCAL_URL || "http://localhost:4337";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on("response", async resp => {
  if (resp.status() >= 400 && /\.(webp|jpe?g|png)/i.test(resp.url())) {
    console.log("404 img:", resp.status(), resp.url());
  }
});

// ===== Home =====
console.log("===== HOME =====");
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);

const homeInspect = await page.evaluate(() => {
  const out = {};
  // Find calc.webp img
  const calcImg = document.querySelector('img[src*="calc.webp"], img[src*="calc-"]');
  if (calcImg) {
    const cs = getComputedStyle(calcImg);
    const r = calcImg.getBoundingClientRect();
    out.calcImg = {
      src: calcImg.src,
      naturalW: calcImg.naturalWidth,
      naturalH: calcImg.naturalHeight,
      complete: calcImg.complete,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
    // Walk up ancestors, look for any that's display:none / zero-height
    let p = calcImg.parentElement, depth = 0;
    out.calcImgAncestry = [];
    while (p && depth < 12) {
      const pcs = getComputedStyle(p);
      const pr = p.getBoundingClientRect();
      out.calcImgAncestry.push({
        tag: p.tagName,
        class: (p.className || "").toString().slice(0, 80),
        display: pcs.display,
        visibility: pcs.visibility,
        opacity: pcs.opacity,
        height: Math.round(pr.height),
        width: Math.round(pr.width),
      });
      p = p.parentElement;
      depth++;
    }
  } else {
    out.calcImg = "NOT FOUND in DOM";
  }
  // Hose image (septicpump.webp)
  const hoseImg = document.querySelector('img[src*="septicpump.webp"], img[src*="septicpump-"]');
  if (hoseImg) {
    const cs = getComputedStyle(hoseImg);
    const r = hoseImg.getBoundingClientRect();
    out.hoseImg = {
      src: hoseImg.src,
      naturalW: hoseImg.naturalWidth,
      complete: hoseImg.complete,
      display: cs.display,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  } else {
    out.hoseImg = "NOT FOUND";
  }
  return out;
});
console.log(JSON.stringify(homeInspect, null, 2));

// ===== About =====
console.log("\n===== ABOUT =====");
await page.goto(BASE + "/about/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);

const aboutInspect = await page.evaluate(() => {
  const out = {};
  // Find "Our Story" or "Rooted in Family"
  const all = Array.from(document.querySelectorAll("*"));
  const storyEl = all.find(el => el.textContent && el.textContent.includes("Rooted in Family") && el.children.length === 0);
  if (storyEl) {
    let target = storyEl;
    while (target && !target.classList?.contains("fusion-fullwidth")) target = target.parentElement;
    const t = target || storyEl;
    const cs = getComputedStyle(t);
    const r = t.getBoundingClientRect();
    out.storySection = {
      tag: t.tagName,
      class: (t.className || "").toString().slice(0, 120),
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      height: Math.round(r.height),
      width: Math.round(r.width),
      bgImage: cs.backgroundImage.slice(0, 200),
      bgColor: cs.backgroundColor,
      varAwbBg: cs.getPropertyValue("--awb-background-color").trim(),
      varAwbBgImage: cs.getPropertyValue("--awb-background-image").trim().slice(0, 200),
    };
    // Walk ancestry until body
    out.storyAncestry = [];
    let p = t.parentElement, depth = 0;
    while (p && depth < 8) {
      const pcs = getComputedStyle(p);
      const pr = p.getBoundingClientRect();
      out.storyAncestry.push({
        tag: p.tagName,
        class: (p.className || "").toString().slice(0, 100),
        display: pcs.display,
        height: Math.round(pr.height),
      });
      p = p.parentElement;
      depth++;
    }
  } else {
    out.storySection = "Rooted in Family text not found in DOM";
  }
  return out;
});
console.log(JSON.stringify(aboutInspect, null, 2));

await browser.close();
