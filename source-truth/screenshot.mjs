// Screenshot every page on the live site and the local preview at desktop +
// mobile widths, then stitch them side by side so visual diffs are obvious.
// Outputs source-truth/screenshots/<width>-<slug>.png and
// source-truth/screenshots-diff/<width>-<slug>.png (live | rebuilt).
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = "c:/Projects/valleyseptic";
const OUT = join(ROOT, "source-truth/screenshots");
const DIFF = join(ROOT, "source-truth/screenshots-diff");
mkdirSync(OUT, { recursive: true });
mkdirSync(DIFF, { recursive: true });

const LIVE = "https://valleyseptic.ca";
const LOCAL = process.env.LOCAL_URL || "http://localhost:4332";

// Pick a representative sample (full set is ~60 URLs × 2 viewports × 2 sites = 240 shots)
const PAGES = process.env.PAGES_SUBSET ? [["home", "/"]] : [
  ["home", "/"],
  ["about", "/about/"],
  ["contact", "/contact/"],
  ["septic-calculator", "/septic-calculator/"],
  ["septic-inspection", "/septic-inspection/"],
  ["tank-pumping", "/tank-pumping/"],
  ["grease-trap-service", "/grease-trap-service/"],
  ["septic-alarms", "/septic-alarms/"],
  ["emergency-septic-services", "/emergency-septic-services/"],
  ["septic-services-abbotsford", "/septic-services-abbotsford/"],
  ["septic-services-chilliwack", "/septic-services-chilliwack/"],
  ["septic-services-mission", "/septic-services-mission/"],
  ["septic-services-langley", "/septic-services-langley/"],
  ["septic-services-hope", "/septic-services-hope/"],
  ["septic-tank-cleaning-langley", "/septic-tank-cleaning-langley/"],
  ["septic-tank-cleaning-mission", "/septic-tank-cleaning-mission/"],
  ["post-how-does-a-septic-alarm-work", "/how-does-a-septic-alarm-work/"],
];

const VIEWPORTS = process.env.PAGES_SUBSET
  ? [{ name: "desktop", width: 1440, height: 900 }]
  : [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile",  width: 390,  height: 844 },
    ];

async function shot(page, url, file, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
  }
  // Let animations / lazy-loaded images settle
  await page.waitForTimeout(800);
  // Force-load all lazy images AND force-reveal any Avada fusion-animated
  // sections (live JS would do this on scroll, our rebuilt sets dont-animate
  // statically — without this the live page captures with sections still
  // visibility:hidden, making it shorter than the user actually sees).
  await page.evaluate(() => {
    document.querySelectorAll("img[loading=lazy]").forEach(img => img.loading = "eager");
    document.body.classList.add("dont-animate");
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, fullPage: true });
}

async function stitch(leftPath, rightPath, outPath, label) {
  // Resize both to the same width and stack horizontally
  const W = 720;
  const [a, b] = await Promise.all([
    sharp(leftPath).resize({ width: W }).toBuffer(),
    sharp(rightPath).resize({ width: W }).toBuffer(),
  ]);
  const [am, bm] = await Promise.all([
    sharp(a).metadata(),
    sharp(b).metadata(),
  ]);
  const height = Math.max(am.height, bm.height);
  const labelHeight = 28;
  const labelSvg = `
    <svg width="${W * 2 + 8}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#222"/>
      <text x="20" y="19" font-family="monospace" font-size="14" fill="#fff">${label} — LIVE (left) vs REBUILT (right)</text>
      <line x1="${W + 4}" y1="0" x2="${W + 4}" y2="${labelHeight}" stroke="#ffcc00" stroke-width="2"/>
    </svg>
  `;
  await sharp({
    create: { width: W * 2 + 8, height: height + labelHeight, channels: 4, background: { r: 34, g: 34, b: 34, alpha: 1 } },
  })
    .composite([
      { input: Buffer.from(labelSvg), top: 0, left: 0 },
      { input: a, top: labelHeight, left: 0 },
      { input: b, top: labelHeight, left: W + 8 },
    ])
    .png()
    .toFile(outPath);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const [slug, path] of PAGES) {
  for (const v of VIEWPORTS) {
    const livePath = join(OUT, `${v.name}-${slug}-live.png`);
    const localPath = join(OUT, `${v.name}-${slug}-local.png`);
    const diffPath = join(DIFF, `${v.name}-${slug}.png`);
    console.log(`[${v.name}] ${slug}`);
    try {
      await shot(page, LIVE + path, livePath, v);
      await shot(page, LOCAL + path, localPath, v);
      await stitch(livePath, localPath, diffPath, `${v.name} · ${slug}`);
    } catch (e) {
      console.warn(`  FAIL: ${e.message}`);
    }
  }
}

await browser.close();
console.log(`\nDone. ${PAGES.length} pages × ${VIEWPORTS.length} viewports. Diff PNGs in source-truth/screenshots-diff/`);
