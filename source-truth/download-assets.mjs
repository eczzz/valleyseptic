// Download all image assets to public/images, preserving WP path structure
// where convenient. Skips data: URIs, external third-party hosts, and known
// "size variants" — keeps only the largest version of each image group.
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { request } from "node:https";

const ROOT = "c:/Projects/valleyseptic";
const OUT = join(ROOT, "public/images");
mkdirSync(OUT, { recursive: true });

const aggregate = JSON.parse(readFileSync(join(ROOT, "source-truth/_aggregate.json"), "utf8"));
const assets = aggregate.allAssets;

// Group WP responsive variants. WP names files as `name-WIDTHxHEIGHT.ext`,
// `name-WIDTHxHEIGHT@2x.ext`, or `name.ext` (original). We keep the original.
function canonicalName(url) {
  const u = url.replace(/^https?:\/\/[^/]+/, "");
  // Strip size suffix like -800x533, -800x533@2x
  return u.replace(/-\d+x\d+(@2x)?(?=\.[a-zA-Z]+$)/, "");
}

const groups = new Map();
for (const url of assets) {
  if (url.startsWith("data:")) continue;
  // Skip non-valleyseptic CDNs (suspicious external refs)
  if (!url.includes("valleyseptic.ca")) continue;
  // Skip font files (handled separately)
  if (/\.(woff2?|ttf|otf|eot|svg\?)/.test(url) && url.includes("fonts/")) continue;
  const key = canonicalName(url);
  if (!groups.has(key)) groups.set(key, new Set());
  groups.get(key).add(url);
}

console.log(`Asset groups: ${groups.size}`);

function getOriginal(group) {
  const arr = [...group];
  // Prefer the URL without size suffix
  const orig = arr.find(u => !/-\d+x\d+(@2x)?\.[a-zA-Z]+$/.test(u));
  if (orig) return orig;
  // Else pick largest by parsing dimensions in name
  let best = arr[0], bestArea = 0;
  for (const u of arr) {
    const m = u.match(/-(\d+)x(\d+)(?:@2x)?\.[a-zA-Z]+$/);
    if (m) {
      const a = parseInt(m[1]) * parseInt(m[2]);
      if (a > bestArea) { bestArea = a; best = u; }
    }
  }
  return best;
}

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/126.0 Safari/537.36",
        "Accept": "image/webp,image/*,*/*",
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        const next = new URL(res.headers.location, url).toString();
        fetchBuf(next).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

let downloaded = 0, skipped = 0, failed = 0;
const manifest = [];

for (const [key, group] of groups) {
  const url = getOriginal(group);
  // Local path within /public/images mirrors WP structure (wp-content/uploads/year/month/file.ext)
  let localPath = key.replace(/^\/wp-content\/uploads\//, "");
  localPath = localPath.replace(/^\/wp-content\/themes\//, "themes/");
  localPath = localPath.replace(/^\//, "");
  // Strip query strings, fragments
  localPath = localPath.split("?")[0].split("#")[0];
  if (!localPath) continue;

  const dest = join(OUT, localPath);
  manifest.push({ original: url, local: `/images/${localPath}`, group: [...group] });

  if (existsSync(dest)) {
    skipped++;
    continue;
  }

  try {
    mkdirSync(dirname(dest), { recursive: true });
    const buf = await fetchBuf(url);
    writeFileSync(dest, buf);
    downloaded++;
    if (downloaded % 10 === 0) console.log(`  ${downloaded} downloaded...`);
  } catch (e) {
    failed++;
    console.warn(`  FAIL ${url}: ${e.message}`);
  }
}

writeFileSync(join(ROOT, "source-truth/asset-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`DONE. downloaded=${downloaded} skipped=${skipped} failed=${failed} groups=${groups.size}`);
