// Fetch every -WxH sized image variant referenced by source-port HTML that
// isn't already in /public/images. WP auto-generates these on upload and the
// captured HTML uses them by name; download-assets.mjs only kept originals.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { request } from "node:https";

const ROOT = "c:/Projects/valleyseptic";
const PORT = join(ROOT, "src/data/source-port");
const PUB = join(ROOT, "public/images");

const refs = new Set();

for (const f of readdirSync(PORT).filter(f => f.endsWith(".html"))) {
  const html = readFileSync(join(PORT, f), "utf8");
  // src + srcset values referencing /images/...
  const re = /\/images\/[^\s"')]+/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    let url = m[0];
    // Strip srcset descriptor (trailing space + Nx) shouldn't be present since
    // regex stops at whitespace, but trim trailing punctuation.
    url = url.replace(/[,);]+$/, "");
    if (/\.(webp|jpe?g|png|gif|svg|avif)$/i.test(url)) refs.add(url);
  }
}

console.log(`Found ${refs.size} unique image refs across ported HTML.`);

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
        const next = new URL(res.headers.location, url).toString();
        fetchBuf(next).then(resolve, reject);
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

const concurrency = 6;
const queue = [...refs];
let downloaded = 0, skipped = 0, failed = 0;

async function worker() {
  while (queue.length) {
    const localPath = queue.shift();
    // /images/2024/09/foo-600x450.webp → public/images/2024/09/foo-600x450.webp
    const rel = localPath.replace(/^\/images\//, "");
    const dest = join(PUB, rel);
    if (existsSync(dest)) { skipped++; continue; }
    // Remote: WP serves these at /wp-content/uploads/<rel>
    const remote = `https://valleyseptic.ca/wp-content/uploads/${rel}`;
    try {
      mkdirSync(dirname(dest), { recursive: true });
      const buf = await fetchBuf(remote);
      writeFileSync(dest, buf);
      downloaded++;
      if (downloaded % 20 === 0) console.log(`  +${downloaded} (${queue.length} remaining)`);
    } catch (e) {
      failed++;
      console.warn(`  FAIL ${remote}: ${e.message}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.log(`\nDONE. downloaded=${downloaded} skipped=${skipped} failed=${failed} total=${refs.size}`);
