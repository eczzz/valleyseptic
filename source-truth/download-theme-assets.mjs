// Download the Avada theme assets (icon fonts, FontAwesome, decorative images)
// referenced by the ported CSS. Reads all *.css in src/data/source-port/,
// extracts unique url() refs, and fetches each from the live site into public/.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { request } from "node:https";

const ROOT = "c:/Projects/valleyseptic";
const PORT = join(ROOT, "src/data/source-port");
const PUBLIC = join(ROOT, "public");
const LIVE = "https://valleyseptic.ca";

const URL_MAP = [
  // Theme path rewrite: /wp-themes-avada/* (used in port) → live /wp-content/themes/Avada/*
  { local: /^\/wp-themes-avada\/(.+)$/, remote: m => `${LIVE}/wp-content/themes/Avada/${m[1]}` },
  // Plugin paths kept as-is (relative to live root)
  { local: /^\/wp-content\/plugins\/(.+)$/, remote: m => `${LIVE}/wp-content/plugins/${m[1]}` },
  // Images already localized into /images/ — map back to wp-content/uploads OR fusion-icons
  { local: /^\/images\/fusion-icons\/(.+)$/, remote: m => `${LIVE}/wp-content/uploads/fusion-icons/${m[1]}` },
  { local: /^\/images\/(.+)$/, remote: m => `${LIVE}/wp-content/uploads/${m[1]}` },
];

function fetchBuf(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0",
        "Accept": "*/*",
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        const next = new URL(res.headers.location, url).toString();
        fetchBuf(next, redirects - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
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

// Gather unique URLs
const refs = new Set();
for (const f of readdirSync(PORT).filter(f => f.endsWith(".css"))) {
  const css = readFileSync(join(PORT, f), "utf8");
  for (const m of css.matchAll(/url\(\s*['"]?([^)'"]+)['"]?\s*\)/g)) {
    const u = m[1].split("?")[0].split("#")[0];
    if (u.startsWith("data:")) continue;
    if (!u.startsWith("/")) continue; // skip already-absolute http(s)
    refs.add(u);
  }
}

console.log(`Found ${refs.size} unique CSS asset refs`);
let downloaded = 0, skipped = 0, failed = 0;
for (const ref of refs) {
  const localPath = join(PUBLIC, ref.replace(/^\//, ""));
  if (existsSync(localPath)) {
    skipped++;
    continue;
  }
  // Determine remote URL
  let remoteUrl = null;
  for (const rule of URL_MAP) {
    const m = ref.match(rule.local);
    if (m) {
      remoteUrl = rule.remote(m);
      break;
    }
  }
  if (!remoteUrl) {
    console.warn(`  no remote mapping for ${ref}`);
    failed++;
    continue;
  }
  try {
    const buf = await fetchBuf(remoteUrl);
    mkdirSync(dirname(localPath), { recursive: true });
    writeFileSync(localPath, buf);
    downloaded++;
    if (downloaded % 10 === 0) console.log(`  ${downloaded} downloaded…`);
  } catch (e) {
    failed++;
    console.warn(`  FAIL ${ref} ← ${remoteUrl}: ${e.message}`);
  }
}
console.log(`\nDONE. downloaded=${downloaded} skipped=${skipped} failed=${failed} (of ${refs.size})`);
