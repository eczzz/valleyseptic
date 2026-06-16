// Download every JS bundle referenced by ported pages' .scripts.html so the
// Astro site can load them from /public/ instead of valleyseptic.ca.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { request as httpsRequest } from "node:https";

const ROOT = "c:/Projects/valleyseptic";
const PORT = join(ROOT, "src/data/source-port");
const PUB = join(ROOT, "public");

const urls = new Set();
for (const f of readdirSync(PORT)) {
  if (!f.endsWith(".scripts.html")) continue;
  const html = readFileSync(join(PORT, f), "utf8");
  for (const m of html.matchAll(/src="(\/wp-content\/[^"]+\.js)"/g)) {
    urls.add(m[1]);
  }
}
console.log("Distinct bundle URLs:", urls.size);

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = httpsRequest({
      hostname: u.hostname,
      path: u.pathname + u.search,
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

let downloaded = 0, skipped = 0, failed = 0;
for (const localPath of urls) {
  const dest = join(PUB, localPath.replace(/^\//, ""));
  if (existsSync(dest)) { skipped++; continue; }
  const remote = "https://valleyseptic.ca" + localPath;
  try {
    mkdirSync(dirname(dest), { recursive: true });
    const buf = await fetchBuf(remote);
    writeFileSync(dest, buf);
    downloaded++;
    console.log("  +" + localPath + " (" + buf.length + " bytes)");
  } catch (e) {
    failed++;
    console.warn("  FAIL " + remote + ": " + e.message);
  }
}
console.log(`\nDONE. downloaded=${downloaded} skipped=${skipped} failed=${failed} total=${urls.size}`);
