// Capture three side-by-side screenshots of the home page:
//   1. Monolith — self-contained capture (file://, no JS, embedded CSS+img)
//   2. Raw      — original curl HTML (file://, pulls remote CSS/img live)
//   3. Astro    — our rebuilt production preview
// Stitches the three into one wide PNG for visual triangulation.
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import sharp from "sharp";

const ROOT = "c:/Projects/valleyseptic";
const OUT = join(ROOT, "source-truth/screenshots");
mkdirSync(OUT, { recursive: true });

const slug = process.argv[2] || "home";
// Accept path with or without leading slash; some shells (git-bash on Windows)
// expand a literal '/' arg to a filesystem root, so we normalize.
let rawPath = process.argv[3] || "";
rawPath = rawPath.replace(/^[A-Za-z]:[\\\/]/, "").replace(/^\/+/, "");
const pathForAstro = "/" + rawPath;
const PREVIEW_PORT = process.env.PREVIEW_PORT || "4336";

const MONOLITH = "file:///" + resolve(ROOT, "source-truth/monolith", `${slug}.html`).replace(/\\/g, "/");
const RAW      = "file:///" + resolve(ROOT, "source-truth/raw-live", `${slug}.raw.html`).replace(/\\/g, "/");
const ASTRO    = `http://localhost:${PREVIEW_PORT}${pathForAstro}`;

async function shoot(page, url, file) {
  console.log("  shooting", url.slice(0, 80));
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
  }
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    document.querySelectorAll("img[loading=lazy]").forEach(img => img.loading = "eager");
    // Force-reveal Avada animated sections so live (which uses Avada JS scroll
    // reveal) and offline captures match the fully-rendered DOM users see.
    document.body.classList.add("dont-animate");
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, fullPage: true });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const monolithPng = join(OUT, `THREE-${slug}-monolith.png`);
const rawPng      = join(OUT, `THREE-${slug}-raw.png`);
const astroPng    = join(OUT, `THREE-${slug}-astro.png`);

if (existsSync(MONOLITH.replace("file:///", ""))) await shoot(page, MONOLITH, monolithPng);
else console.warn("  monolith missing for", slug);

if (existsSync(RAW.replace("file:///", ""))) await shoot(page, RAW, rawPng);
else console.warn("  raw missing for", slug);

await shoot(page, ASTRO, astroPng);

await browser.close();

// Stitch all three side-by-side at fixed width
const W = 480;
const labelH = 32;
const inputs = [];
const sources = [];
if (existsSync(monolithPng)) sources.push({ path: monolithPng, label: "1. MONOLITH (offline capture)" });
if (existsSync(rawPng))      sources.push({ path: rawPng,      label: "2. RAW (curl, live CSS)" });
sources.push({ path: astroPng, label: "3. ASTRO (rebuilt)" });

const resized = await Promise.all(sources.map(s => sharp(s.path).resize({ width: W }).toBuffer()));
const metas = await Promise.all(resized.map(b => sharp(b).metadata()));
const maxH = Math.max(...metas.map(m => m.height));

const totalW = W * sources.length + 4 * (sources.length - 1);
const totalH = maxH + labelH;

const labelSvg = `
  <svg width="${totalW}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a1a"/>
    ${sources.map((s, i) => `
      <text x="${i * (W + 4) + 14}" y="22" font-family="ui-monospace,Menlo,monospace" font-size="14" fill="#fff" font-weight="700">${s.label}</text>
      ${i < sources.length - 1 ? `<line x1="${(i + 1) * (W + 4) - 2}" y1="0" x2="${(i + 1) * (W + 4) - 2}" y2="${labelH}" stroke="#ffcc00" stroke-width="2"/>` : ""}
    `).join("\n")}
  </svg>
`;

const composite = [{ input: Buffer.from(labelSvg), top: 0, left: 0 }];
sources.forEach((_, i) => {
  composite.push({ input: resized[i], top: labelH, left: i * (W + 4) });
});

const outPath = join(OUT, `THREE-UP-${slug}.png`);
await sharp({
  create: { width: totalW, height: totalH, channels: 4, background: { r: 26, g: 26, b: 26, alpha: 1 } },
})
  .composite(composite)
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log(`\nWrote ${outPath}`);
