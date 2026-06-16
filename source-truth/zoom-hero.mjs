// Zoom screenshot just the hero region of chilliwack on all three versions
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const slug = process.argv[2] || "septic-services-chilliwack";
const path = process.argv[3] || (slug + "/");
const sources = [
  { label: "ASTRO", url: `http://localhost:5010/${path}`, file: `c:/tmp/hero-${slug}-astro.png` },
  { label: "RAW",   url: `http://localhost:5012/${path}`, file: `c:/tmp/hero-${slug}-raw.png` },
];
mkdirSync("c:/tmp", { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const s of sources) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(s.url, { waitUntil: "load", timeout: 30000 });
  }
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: s.file, clip: { x: 0, y: 0, width: 1440, height: 700 } });
  console.log(s.label, "→", s.file);
  await ctx.close();
}
await browser.close();

// Stitch side-by-side
const W = 640;
const bufs = await Promise.all(sources.map(s => sharp(s.file).resize({ width: W }).toBuffer()));
const metas = await Promise.all(bufs.map(b => sharp(b).metadata()));
const maxH = Math.max(...metas.map(m => m.height));
const labelH = 28;
const svg = `<svg width="${W*2 + 8}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#222"/>
  <text x="20" y="20" font-family="monospace" font-size="14" fill="#fff">ASTRO ${slug} hero</text>
  <text x="${W + 20}" y="20" font-family="monospace" font-size="14" fill="#fff">RAW ${slug} hero</text>
</svg>`;
await sharp({
  create: { width: W*2 + 8, height: maxH + labelH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
}).composite([
  { input: Buffer.from(svg), top: 0, left: 0 },
  { input: bufs[0], top: labelH, left: 0 },
  { input: bufs[1], top: labelH, left: W + 8 },
]).png().toFile(`c:/Projects/valleyseptic/source-truth/screenshots/HERO-${slug}.png`);
console.log("wrote HERO-" + slug + ".png");
