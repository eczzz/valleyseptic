// Re-encode heavy images in place at a sane quality. WordPress/Avada exported
// these at near-lossless quality; q≈80 WebP/JPEG is visually indistinguishable
// but roughly half the bytes. Dimensions, format, and filename are preserved
// so all srcset references keep working.
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = "c:/Projects/valleyseptic";
const IMG = join(ROOT, "public/images");
const THRESHOLD = 100 * 1024; // only touch files larger than 100 KB
const DRY = process.argv.includes("--dry");

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    const st = statSync(fp);
    if (st.isDirectory()) out.push(...walk(fp));
    else out.push({ fp, size: st.size });
  }
  return out;
}

const files = walk(IMG).filter(f => {
  const ext = extname(f.fp).toLowerCase();
  return [".webp", ".jpg", ".jpeg", ".png"].includes(ext) && f.size > THRESHOLD;
});

console.log(`${files.length} images over ${THRESHOLD / 1024}KB${DRY ? "  (dry run)" : ""}\n`);

let before = 0, after = 0, changed = 0;
for (const { fp, size } of files.sort((a, b) => b.size - a.size)) {
  before += size;
  const ext = extname(fp).toLowerCase();
  const buf = readFileSync(fp);
  let img = sharp(buf, { animated: ext === ".webp" });
  let out;
  try {
    if (ext === ".webp") {
      out = await img.webp({ quality: 80, effort: 5 }).toBuffer();
    } else if (ext === ".jpg" || ext === ".jpeg") {
      out = await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    } else if (ext === ".png") {
      // Re-encode PNG with max compression + palette quantization where it helps.
      out = await img.png({ compressionLevel: 9, palette: true, quality: 82, effort: 8 }).toBuffer();
    }
  } catch (e) {
    console.warn(`  SKIP ${fp.replace(IMG, "")}: ${e.message}`);
    after += size;
    continue;
  }
  // Only keep the re-encode if it actually shrinks the file.
  if (out && out.length < size) {
    if (!DRY) writeFileSync(fp, out);
    after += out.length;
    changed++;
    const pct = ((1 - out.length / size) * 100).toFixed(0);
    console.log(`  ${(size / 1024).toFixed(0).padStart(6)}KB -> ${(out.length / 1024).toFixed(0).padStart(6)}KB  -${pct}%  ${fp.replace(IMG, "")}`);
  } else {
    after += size;
  }
}

const mb = n => (n / 1024 / 1024).toFixed(1) + "MB";
console.log(`\n${changed}/${files.length} re-encoded. TOTAL ${mb(before)} -> ${mb(after)}  (-${((1 - after / before) * 100).toFixed(0)}%)`);
