// Comprehensive pre-launch audit. Visits every dist/*/index.html via headless
// chromium, captures 404s, console errors, and key page state, then prints a
// per-page report + a top-line summary.
import { chromium } from "playwright";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.LOCAL_URL || "http://localhost:5010";

// Discover every dist route
function findRoutes(dir, base = "") {
  const out = [];
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    if (statSync(fp).isDirectory()) out.push(...findRoutes(fp, base + "/" + f));
    else if (f === "index.html") out.push((base || "") + "/");
  }
  return out;
}
const routes = findRoutes("dist").filter(r => r !== "/404.html").sort();
console.log("Routes:", routes.length);

const browser = await chromium.launch({ headless: true });

// Aggregate counters
const totals = {
  ok: 0, pages: 0,
  unique404s: new Set(),
  jsErrors: new Set(),
  hadCounter: 0, counterOk: 0,
  hadMap: 0, mapOk: 0,
  hadForm: 0, formOk: 0,
};
const pageErrors = [];

for (const route of routes) {
  totals.pages++;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  const url404 = [];
  page.on("response", r => {
    if (r.status() >= 400 && !/wp-admin\/admin-ajax|admin-ajax\.php/i.test(r.url())) {
      url404.push({ status: r.status(), url: r.url() });
      totals.unique404s.add(r.status() + " " + r.url().replace(BASE, ""));
    }
  });
  page.on("pageerror", e => {
    const m = e.message.slice(0, 200);
    // jQuery + google + awbMapInit are known race-condition warnings from
    // matching live behavior; not real failures.
    if (!/jQuery is not defined|google is not defined|awbMapInit is not a function/.test(m)) {
      errs.push(m);
      totals.jsErrors.add(m);
    }
  });

  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll(".display-counter"));
      const maps = Array.from(document.querySelectorAll(".fusion-google-map, [id^='fusion_map_']"));
      const forms = Array.from(document.querySelectorAll("form.fusion-form"));
      return {
        title: document.title,
        h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60),
        counters: counters.map(c => ({ rendered: c.textContent.trim(), dataValue: c.getAttribute("data-value") })),
        maps: maps.map(m => ({ iHTML: m.innerHTML.length, hasIframe: !!m.querySelector("iframe") })),
        forms: forms.map(f => ({
          jqSubmit: window.jQuery ? (Object.keys(window.jQuery._data?.(f, "events") || {}).includes("submit")) : null,
        })),
        meta: {
          description: document.querySelector("meta[name='description']")?.content?.slice(0, 80),
          canonical: document.querySelector("link[rel='canonical']")?.href,
          ogTitle: document.querySelector("meta[property='og:title']")?.content?.slice(0, 60),
        },
      };
    });

    // Score
    if (state.counters.length) {
      totals.hadCounter++;
      if (state.counters.every(c => c.rendered === c.dataValue)) totals.counterOk++;
    }
    if (state.maps.length) {
      totals.hadMap++;
      if (state.maps.every(m => m.iHTML > 1000 && m.hasIframe)) totals.mapOk++;
    }
    if (state.forms.length) {
      totals.hadForm++;
      if (state.forms.every(f => f.jqSubmit)) totals.formOk++;
    }

    const broken = [];
    if (url404.length) broken.push(`404×${url404.length}`);
    if (errs.length) broken.push(`jsErr×${errs.length}`);
    if (state.counters.length && state.counters.some(c => c.rendered !== c.dataValue)) broken.push("counter");
    if (state.maps.length && state.maps.some(m => m.iHTML <= 1000)) broken.push("map");
    if (state.forms.length && state.forms.some(f => !f.jqSubmit)) broken.push("form");

    const ok = broken.length === 0;
    if (ok) totals.ok++;
    console.log(
      `${ok ? "✓" : "✗"} ${route.padEnd(60)}` +
      ` cnt=${state.counters.length} map=${state.maps.length} form=${state.forms.length}` +
      ` meta=${state.meta.description ? "Y" : "N"}/${state.meta.canonical ? "Y" : "N"}` +
      (broken.length ? "  ⚠ " + broken.join(",") : "")
    );
    if (url404.length) {
      pageErrors.push({ route, type: "404", items: url404.slice(0, 4) });
    }
    if (errs.length) {
      pageErrors.push({ route, type: "jsError", items: errs.slice(0, 3) });
    }
  } catch (e) {
    console.log(`✗ ${route.padEnd(60)} ERR ${e.message.slice(0, 80)}`);
    pageErrors.push({ route, type: "nav", error: e.message });
  }
  await ctx.close();
}

await browser.close();

console.log("\n=== SUMMARY ===");
console.log(`Pages OK:             ${totals.ok} / ${totals.pages}`);
console.log(`Counters OK:          ${totals.counterOk} / ${totals.hadCounter}`);
console.log(`Maps OK:              ${totals.mapOk} / ${totals.hadMap}`);
console.log(`Forms wired:          ${totals.formOk} / ${totals.hadForm}`);
console.log(`Unique 404s:          ${totals.unique404s.size}`);
[...totals.unique404s].slice(0, 10).forEach(u => console.log("  ", u));
console.log(`Unique JS errors:     ${totals.jsErrors.size}`);
[...totals.jsErrors].slice(0, 10).forEach(e => console.log("  ", e.slice(0, 120)));

if (pageErrors.length) {
  console.log("\n=== PAGE ERRORS ===");
  pageErrors.slice(0, 20).forEach(p => {
    console.log(p.route + " — " + p.type);
    if (p.items) p.items.forEach(it => console.log("  →", JSON.stringify(it).slice(0, 200)));
    if (p.error) console.log("  →", p.error);
  });
}
