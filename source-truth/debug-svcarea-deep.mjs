// Deep debug: what state is the form in on service-area vs tank-pumping?
import { chromium } from "playwright";

const TARGETS = [
  { name: "ABBOTSFORD (fail)", url: "http://localhost:5010/septic-services-abbotsford/" },
  { name: "TANK-PUMPING (ok)", url: "http://localhost:5010/tank-pumping/" },
];

const browser = await chromium.launch({ headless: true });
for (const t of TARGETS) {
  console.log(`\n=== ${t.name} ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const posts = [];
  page.on("request", req => {
    if (req.method() === "POST" && /admin-ajax/.test(req.url())) {
      const data = req.postData() || "";
      posts.push(data.includes("formData") ? "SUBMIT" : data.includes("update_view") ? "VIEW" : "OTHER");
    }
  });
  const errs = [];
  page.on("pageerror", e => errs.push(e.message.slice(0, 100)));
  await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);

  // Probe form state
  const probe = await page.evaluate(() => {
    const forms = document.querySelectorAll("form.fusion-form");
    return Array.from(forms).map((f, i) => {
      const submit = f.querySelector('button[type="submit"]');
      return {
        idx: i,
        formClass: f.className,
        formAction: f.action,
        submitDataNumber: submit?.dataset.formNumber,
        formListenerKeys: Object.keys(f).filter(k => k.startsWith("__")), // jQuery event data keys
        // jQuery event data is stored on $._data(el, 'events')
        jqEvents: window.jQuery ? Object.keys(window.jQuery._data(f, "events") || {}) : null,
        // Does fusion-form-builder think it owns this form?
        wrapperClass: f.closest(".fusion-form-form-wrapper")?.className,
      };
    });
  });
  console.log("  form probe:", JSON.stringify(probe, null, 2));

  // Try a JS-level submit triggering
  const submitAttempt = await page.evaluate(() => {
    const f = document.querySelector("form.fusion-form");
    if (!f) return "no form";
    // Fill fields
    const fill = (sel, val) => { const el = f.querySelector(sel); if (el) el.value = val; };
    fill('input[name="name"]', "Test");
    fill('input[name="email"]', "test@example.com");
    fill('input[name="phone"]', "5550100");
    fill('input[name="city"]', "Test");
    fill('input[name="subject"]', "Subject");
    fill('textarea[name="message"]', "Message");
    // Click submit
    const btn = f.querySelector('button[type="submit"]');
    if (!btn) return "no btn";
    btn.click();
    return "clicked";
  });
  console.log("  submit attempt:", submitAttempt);
  await page.waitForTimeout(4500);
  console.log("  POSTs:", posts.length, posts);
  if (errs.length) console.log("  errors:", errs.length, "first:", errs[0]);
  await ctx.close();
}
await browser.close();
