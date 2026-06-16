// Robust form test: scroll to form, fill, locator.click (auto-scrolls), wait.
import { chromium } from "playwright";

const BASE = process.env.LOCAL_URL || "http://localhost:5010";

const ROUTES = [
  "/", "/about/", "/contact/",
  "/septic-inspection/", "/tank-pumping/", "/grease-trap-service/",
  "/septic-alarms/", "/emergency-septic-services/",
  "/septic-services-abbotsford/", "/septic-services-chilliwack/",
  "/septic-services-mission/", "/septic-services-langley/", "/septic-services-hope/",
  "/septic-tank-cleaning-langley/", "/septic-tank-cleaning-mission/",
  "/how-does-a-septic-alarm-work/",
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const submitPosts = [];
  page.on("request", req => {
    if (req.method() === "POST" && /admin-ajax/.test(req.url())) {
      const data = req.postData() || "";
      // Tell update_view apart from formData submit
      if (data.includes("formData") || data.includes("WebKitFormBoundary")) {
        submitPosts.push("SUBMIT");
      } else if (data.includes("fusion_form_update_view")) {
        // The view-counter, not a real submit
      } else {
        submitPosts.push("OTHER:" + data.slice(0, 40));
      }
    }
  });

  let status = "OK";
  let error = null;
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    const form = page.locator("form.fusion-form").first();
    const formCount = await form.count();
    if (formCount === 0) { status = "NO FORM"; }
    else {
      await form.scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(800);

      const tryFill = async (sel, val) => {
        try { await page.locator(sel).first().fill(val, { timeout: 1500 }); } catch {}
      };
      await tryFill('form.fusion-form input[name="name"]', "Test Bot");
      await tryFill('form.fusion-form input[name="email"]', "test@example.com");
      await tryFill('form.fusion-form input[name="phone"]', "5550100");
      await tryFill('form.fusion-form input[name="city"]', "Chilliwack");
      await tryFill('form.fusion-form input[name="subject"]', "Form test");
      await tryFill('form.fusion-form textarea[name="message"]', "Automated form test.");

      const submit = page.locator('form.fusion-form button[type="submit"]').first();
      await submit.scrollIntoViewIfNeeded({ timeout: 5000 });
      try {
        await submit.click({ timeout: 5000 });
      } catch (e) {
        // Fallback: force click
        try { await submit.click({ force: true, timeout: 3000 }); }
        catch (e2) { error = "click failed: " + e2.message.slice(0, 80); }
      }
      await page.waitForTimeout(4500);
    }
  } catch (e) {
    status = "ERR";
    error = e.message.slice(0, 100);
  }

  const submitOk = submitPosts.includes("SUBMIT");
  results.push({ route, status, submitOk, error });
  console.log(`${route.padEnd(45)} ${status.padEnd(10)} submit=${submitOk ? "✓" : "✗"} ${error || ""}`);
  await ctx.close();
}

await browser.close();

console.log("\n--- SUMMARY ---");
const ok = results.filter(r => r.submitOk).length;
const noform = results.filter(r => r.status === "NO FORM").length;
const failed = results.filter(r => !r.submitOk && r.status !== "NO FORM").length;
console.log(`Form submission OK:     ${ok} / ${results.length}`);
console.log(`No form (expected):     ${noform}`);
console.log(`Failed:                 ${failed}`);
