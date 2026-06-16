// Surgically wire the ported contact forms to our Netlify SMTP2Go relay.
//
// WHY THIS IS SEPARATE FROM port.mjs:
//   port.mjs regenerates every file in src/data/source-port/ from the raw
//   captures in source-truth/raw-live/. Those captures are older snapshots —
//   re-running a full port reverts hand-finished work in the committed header
//   files (the "Book Now" nav item, the ChilliwackValley-copy.webp logo).
//   So form wiring is applied surgically here instead: this script edits the
//   already-finished page-body files in place and never touches raw-live,
//   headers, footers, or scripts.
//
// What it does, per page-body *.html that contains a <form class="fusion-form">:
//   - sets   action="/.netlify/functions/contact"  method="post"
//   - appends a hidden honeypot field (name="hp_check") the Netlify function
//     and the SourcePort client handler both look for.
//
// Idempotent: re-running it is a no-op (honeypot is only appended when absent;
// files are only rewritten when their content actually changes).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const OUT = join("c:/Projects/valleyseptic", "src/data/source-port");

// The honeypot markup — byte-for-byte what the Netlify function (hp_check) and
// the SourcePort client handler expect. Off-screen + aria-hidden so humans
// never see it; not named after a profile field, with autofill/password-manager
// opt-outs, so browser autofill won't fill it for genuine visitors.
const HONEYPOT =
  '<div aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;' +
  'width:1px;height:1px;overflow:hidden">' +
  '<input type="text" name="hp_check" tabindex="-1" autocomplete="off" ' +
  'data-lpignore="true" data-1p-ignore value=""></div>';

// Page-body files only — exclude header/footer/scripts fragments.
const bodyFiles = readdirSync(OUT)
  .filter(f => f.endsWith(".html") && !/\.(header|footer|scripts)\.html$/.test(f));

let wired = 0;
let formCount = 0;
for (const f of bodyFiles) {
  const path = join(OUT, f);
  const html = readFileSync(path, "utf8");
  // isDocument:false → treat input as a fragment; cheerio won't wrap it in
  // <html>/<head>/<body>. decodeEntities:false matches port.mjs.
  const $ = cheerio.load(html, { decodeEntities: false }, false);

  const forms = $("form.fusion-form");
  if (!forms.length) continue;

  forms.each((_, el) => {
    const $f = $(el);
    $f.attr("action", "/.netlify/functions/contact");
    $f.attr("method", "post");
    if (!$f.find('input[name="hp_check"]').length) $f.append(HONEYPOT);
    formCount++;
  });

  const out = $.html();
  if (out !== html) {
    writeFileSync(path, out);
    wired++;
    console.log(`  wired ${forms.length} form(s) in ${f}`);
  }
}

console.log(`\nDONE. ${formCount} form(s) wired across ${wired} file(s).`);
