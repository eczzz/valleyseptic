// Walk every ported page in headless Chromium, log any 404s. Output unique
// missing URLs grouped by status, then attempt to fetch them from the live
// site and write to public/ where appropriate.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { request as httpsRequest } from "node:https";

const BASE = process.env.LOCAL_URL || "http://localhost:4333";
const ROOT = "c:/Projects/valleyseptic";

const PAGES = [
  "/", "/about/", "/contact/", "/septic-calculator/", "/septic-inspection/",
  "/tank-pumping/", "/grease-trap-service/", "/septic-alarms/",
  "/emergency-septic-services/",
  "/septic-services-abbotsford/", "/septic-services-chilliwack/",
  "/septic-services-mission/", "/septic-services-langley/", "/septic-services-hope/",
  "/septic-tank-cleaning-langley/", "/septic-tank-cleaning-mission/",
  "/how-does-a-septic-alarm-work/",
];

const missing = new Map(); // url → status code

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on("response", async (resp) => {
  const status = resp.status();
  if (status >= 400) {
    const url = resp.url();
    if (!missing.has(url)) missing.set(url, status);
  }
});

for (const p of PAGES) {
  try {
    await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 30000 });
  } catch (e) {
    console.warn("nav fail", p, e.message);
  }
}
await browser.close();

console.log(`\nUnique missing: ${missing.size}`);
const groups = { img: [], font: [], css: [], other: [] };
for (const [url, status] of missing) {
  if (/\.(webp|jpe?g|png|gif|avif|svg)(\?|$)/i.test(url)) groups.img.push({ url, status });
  else if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) groups.font.push({ url, status });
  else if (/\.css(\?|$)/i.test(url)) groups.css.push({ url, status });
  else groups.other.push({ url, status });
}
for (const [k, items] of Object.entries(groups)) {
  if (!items.length) continue;
  console.log(`\n[${k}] ${items.length}`);
  items.forEach(({ url, status }) => console.log(" ", status, url));
}

// Try downloading images and fonts from live
function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = httpsRequest({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "*/*" },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuf(new URL(res.headers.location, url).toString()).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

const toFetch = [...groups.img, ...groups.font];
let fetched = 0, failed = 0;
for (const { url, status } of toFetch) {
  // url is local like http://localhost:4333/images/foo.webp or .../wp-themes-avada/...
  const u = new URL(url);
  let remote, dest;
  if (u.pathname.startsWith("/images/")) {
    remote = "https://valleyseptic.ca/wp-content/uploads/" + u.pathname.slice("/images/".length);
    dest = join(ROOT, "public/images", u.pathname.slice("/images/".length));
  } else if (u.pathname.startsWith("/wp-themes-avada/")) {
    remote = "https://valleyseptic.ca/wp-content/themes/Avada/" + u.pathname.slice("/wp-themes-avada/".length);
    dest = join(ROOT, "public/wp-themes-avada", u.pathname.slice("/wp-themes-avada/".length));
  } else if (u.pathname.startsWith("/wp-content/")) {
    remote = "https://valleyseptic.ca" + u.pathname;
    dest = join(ROOT, "public" + u.pathname);
  } else {
    continue;
  }
  if (existsSync(dest)) continue;
  try {
    mkdirSync(dirname(dest), { recursive: true });
    const buf = await fetchBuf(remote);
    writeFileSync(dest, buf);
    fetched++;
  } catch (e) {
    failed++;
    console.warn(" FAIL", remote, e.message);
  }
}
console.log(`\nFetched ${fetched}, failed ${failed}, of ${toFetch.length} candidates.`);
