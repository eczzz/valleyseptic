// Static check: every img src + EVERY srcset candidate referenced by ported
// HTML (body, header, footer) must exist in public/. The runtime sweep only
// catches the one srcset candidate the browser actually picks.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PORT = "src/data/source-port";
const PUB = "public";

const refs = new Set();
for (const f of readdirSync(PORT)) {
  if (!f.endsWith(".html")) continue;
  const html = readFileSync(join(PORT, f), "utf8");
  // src="..."
  for (const m of html.matchAll(/\bsrc="([^"]+)"/g)) refs.add(m[1]);
  // srcset="url1 200w, url2 400w, ..."
  for (const m of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.add(url);
    }
  }
}

let checked = 0, missing = [];
for (const ref of refs) {
  // Only check local image paths
  if (!/^\/images\//.test(ref)) continue;
  if (!/\.(webp|jpe?g|png|gif|avif|svg)$/i.test(ref)) continue;
  checked++;
  const fp = join(PUB, ref.replace(/^\//, ""));
  if (!existsSync(fp)) missing.push(ref);
}

console.log(`Local image refs checked (src + every srcset candidate): ${checked}`);
console.log(`Missing from public/: ${missing.length}`);
missing.sort().forEach(m => console.log("  ✗", m));
if (missing.length === 0) console.log("✅ Every referenced image variant exists on disk.");
