// Tiny static server with slug-aware URL rewriting so /about/ resolves to
// about.html (monolith) or about.raw.html (raw). Also serves an index of
// available slugs at /.
import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const dir = resolve(process.argv[2] || ".");
const port = parseInt(process.argv[3] || "4001", 10);
const suffix = process.argv[4] || ".html"; // raw uses ".raw.html"
const label = process.argv[5] || "static";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function listSlugs() {
  return readdirSync(dir)
    .filter(f => f.endsWith(suffix))
    .map(f => f.replace(suffix, ""))
    .sort();
}

function indexPage(slugs) {
  const links = slugs
    .map(s => `<li><a href="/${s === "home" ? "" : s + "/"}">${s}</a></li>`)
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${label}</title>
<style>body{font-family:ui-monospace,Menlo,monospace;max-width:680px;margin:40px auto;padding:0 16px}
h1{margin-bottom:8px}p{color:#666;margin-bottom:24px}
ul{list-style:none;padding:0;columns:2;gap:24px}li{padding:4px 0}
a{color:#af8f61;text-decoration:none}a:hover{text-decoration:underline}
.banner{padding:14px 18px;background:#283438;color:#fff;border-radius:6px;margin-bottom:24px}</style>
</head><body>
<div class="banner"><strong>${label}</strong> — serving <code>${dir}</code></div>
<h1>Pages</h1>
<p>Click a slug to view it. Compare with <a href="https://valleyseptic.ca/">live</a> and the Astro rebuild.</p>
<ul>${links}</ul>
</body></html>`;
}

createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  // Index
  if (pathname === "/" || pathname === "/index.html") {
    // Try home first; otherwise show index
    const homePath = join(dir, "home" + suffix);
    if (existsSync(homePath) && req.url === "/") {
      res.writeHead(200, { "content-type": MIME[".html"] });
      res.end(readFileSync(homePath));
      return;
    }
    res.writeHead(200, { "content-type": MIME[".html"] });
    res.end(indexPage(listSlugs()));
    return;
  }
  // List endpoint
  if (pathname === "/_slugs") {
    res.writeHead(200, { "content-type": MIME[".html"] });
    res.end(indexPage(listSlugs()));
    return;
  }
  // Slug-style URLs: /about/ → about.html
  if (pathname.endsWith("/")) {
    const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
    const fp = join(dir, slug + suffix);
    if (existsSync(fp)) {
      res.writeHead(200, { "content-type": MIME[".html"] });
      res.end(readFileSync(fp));
      return;
    }
  }
  // Fallback: serve any file relative to dir
  const fp = join(dir, pathname.replace(/^\//, ""));
  if (existsSync(fp) && statSync(fp).isFile()) {
    res.writeHead(200, { "content-type": MIME[extname(fp).toLowerCase()] || "application/octet-stream" });
    res.end(readFileSync(fp));
    return;
  }
  // Try with suffix appended
  const withSuffix = fp + suffix;
  if (existsSync(withSuffix) && statSync(withSuffix).isFile()) {
    res.writeHead(200, { "content-type": MIME[".html"] });
    res.end(readFileSync(withSuffix));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not found: " + pathname);
}).listen(port, () => {
  console.log(`[${label}] listening on http://localhost:${port}/  (root=${dir})`);
});
