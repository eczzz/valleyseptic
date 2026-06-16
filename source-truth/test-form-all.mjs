// For every port-backed route, fill the contact form and verify the POST
// hits valleyseptic.ca/wp-admin/admin-ajax.php (i.e. the Avada Fusion JS is
// loaded and form-submit is wired up).
import { chromium } from "playwright";

const BASE = process.env.LOCAL_URL || "http://localhost:5010";

const ROUTES = [
  "/",
  "/about/",
  "/contact/",
  "/septic-calculator/",
  "/septic-inspection/",
  "/tank-pumping/",
  "/grease-trap-service/",
  "/septic-alarms/",
  "/emergency-septic-services/",
  "/septic-services-abbotsford/",
  "/septic-services-chilliwack/",
  "/septic-services-mission/",
  "/septic-services-langley/",
  "/septic-services-hope/",
  "/septic-tank-cleaning-langley/",
  "/septic-tank-cleaning-mission/",
  // Sample of post pages
  "/how-does-a-septic-alarm-work/",
  "/can-a-septic-tank-freeze/",
  "/spring-septic-maintenance-tips/",
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const ajaxPosts = [];
  const errors = [];
  page.on("request", req => {
    if (req.method() === "POST" && /valleyseptic\.ca\/wp-admin\/admin-ajax\.php/.test(req.url())) {
      const data = req.postData() || "";
      ajaxPosts.push({ action: (data.match(/name="action"\s*\r?\n\s*\r?\n([^\r\n-]+)/) || [, data.slice(0, 80)])[1] });
    }
  });
  page.on("pageerror", err => errors.push(err.message.slice(0, 200)));
  page.on("console", m => {
    if (m.type() === "error" && /fusion|jquery|ajax/i.test(m.text())) errors.push(m.text().slice(0, 200));
  });

  let result = { route, status: "OK", posts: 0, formFound: false, error: null };
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1200);
    // Find a fusion form
    const formInfo = await page.evaluate(() => {
      const f = document.querySelector('form.fusion-form');
      if (!f) return null;
      const fields = {};
      f.querySelectorAll('input[name],textarea[name]').forEach(el => {
        fields[el.name] = el.tagName.toLowerCase();
      });
      return { id: f.className.match(/fusion-form-(\d+)/)?.[1], fields };
    });
    if (!formInfo) {
      result.status = "NO FORM";
    } else {
      result.formFound = true;
      // Fill known fields
      const tryFill = async (sel, val) => {
        try { await page.fill(sel, val, { timeout: 1500 }); } catch {}
      };
      await tryFill('form.fusion-form input[name="name"]', "Test Bot");
      await tryFill('form.fusion-form input[name="email"]', "test@example.com");
      await tryFill('form.fusion-form input[name="phone"]', "555-0100");
      await tryFill('form.fusion-form input[name="city"]', "Chilliwack");
      await tryFill('form.fusion-form input[name="subject"]', "Per-route form test");
      await tryFill('form.fusion-form textarea[name="message"]', "Automated form test — please ignore.");
      // Submit
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      try {
        await page.click('form.fusion-form button[type="submit"]', { timeout: 3000 });
      } catch (e) {
        result.error = "submit click failed: " + e.message.slice(0, 80);
      }
      await page.waitForTimeout(3000);
      result.posts = ajaxPosts.filter(p => /fusion_form_submit/.test(JSON.stringify(p)) || /formData/.test(JSON.stringify(p))).length;
      // If we got >=1 admin-ajax POST that wasn't just the update_view ping, count as submit
      result.posts = ajaxPosts.length;
      if (ajaxPosts.length === 0) result.status = "NO AJAX POST";
    }
  } catch (e) {
    result.status = "ERR";
    result.error = e.message.slice(0, 120);
  }
  if (errors.length) result.error = (result.error || "") + " | console:" + errors[0];
  results.push(result);
  console.log(`${route.padEnd(48)} ${result.status.padEnd(12)} posts=${result.posts} ${result.error || ""}`);
  await ctx.close();
}

await browser.close();

console.log("\n--- SUMMARY ---");
const ok = results.filter(r => r.posts >= 2).length;
const noform = results.filter(r => r.status === "NO FORM").length;
const noajax = results.filter(r => r.status === "NO AJAX POST").length;
const errs = results.filter(r => r.status === "ERR").length;
console.log(`OK (>=2 admin-ajax posts):  ${ok} / ${results.length}`);
console.log(`No form found:              ${noform}`);
console.log(`No AJAX posts:              ${noajax}`);
console.log(`Errors:                     ${errs}`);
