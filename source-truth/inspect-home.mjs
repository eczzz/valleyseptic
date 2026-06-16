// Inspect computed styles of key sections on the local home page
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Capture console errors and 404s
page.on("console", msg => { if (msg.type() === "error" || msg.type() === "warning") console.log("CONSOLE", msg.type(), msg.text().slice(0,300)); });
page.on("response", async (resp) => {
  if (resp.status() >= 400) console.log("HTTP", resp.status(), resp.url());
});

await page.goto("http://localhost:4330/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);

// Find the rendered .site-header and check its computed style
const headerInfo = await page.evaluate(() => {
  const h = document.querySelector(".site-header");
  if (!h) return { exists: false };
  const cs = getComputedStyle(h);
  const rect = h.getBoundingClientRect();
  return {
    exists: true,
    display: cs.display,
    visibility: cs.visibility,
    position: cs.position,
    zIndex: cs.zIndex,
    rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    innerLogoSrc: h.querySelector("img")?.src,
    innerLogoLoaded: (() => { const i = h.querySelector("img"); return i?.complete && i?.naturalWidth > 0; })(),
    navItems: h.querySelectorAll(".site-nav__link").length,
    siteNavDisplay: getComputedStyle(h.querySelector(".site-nav") || h).display,
  };
});
console.log("HEADER:", JSON.stringify(headerInfo, null, 2));

// Inspect the FIRST fusion-fullwidth section background and dimensions
const fwInfo = await page.evaluate(() => {
  const sections = Array.from(document.querySelectorAll(".fusion-fullwidth"));
  return sections.slice(0, 6).map((s, i) => {
    const cs = getComputedStyle(s);
    const rect = s.getBoundingClientRect();
    return {
      idx: i,
      class: s.className.split(/\s+/).slice(0, 4).join(" "),
      bgColor: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 80),
      padding: cs.padding,
      width: cs.width,
      rect: { x: rect.x, y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      varAwbBg: cs.getPropertyValue("--awb-background-color").trim(),
      varFullWidthBg: cs.getPropertyValue("--full_width_bg_color").trim(),
    };
  });
});
console.log("FULLWIDTH SECTIONS:", JSON.stringify(fwInfo, null, 2));

// Check :root for awb-color1
const rootVars = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    awbColor1: cs.getPropertyValue("--awb-color1").trim(),
    awbColor5: cs.getPropertyValue("--awb-color5").trim(),
    awbCustomColor3: cs.getPropertyValue("--awb-custom_color_3").trim(),
    fullWidthBgColor: cs.getPropertyValue("--full_width_bg_color").trim(),
    containerPaddingDefaultTop: cs.getPropertyValue("--container_padding_default_top").trim(),
    fusionRowMaxWidth: cs.getPropertyValue("--fusion-row-max-width").trim(),
    bodyClasses: document.body.className,
    bodyComputedFont: getComputedStyle(document.body).fontFamily,
  };
});
console.log("ROOT VARS:", JSON.stringify(rootVars, null, 2));

// Inspect main element
const mainInfo = await page.evaluate(() => {
  const m = document.querySelector("main#main");
  const cs = getComputedStyle(m);
  return {
    width: cs.width,
    maxWidth: cs.maxWidth,
    padding: cs.padding,
    margin: cs.margin,
    display: cs.display,
  };
});
console.log("MAIN:", JSON.stringify(mainInfo, null, 2));

await browser.close();
