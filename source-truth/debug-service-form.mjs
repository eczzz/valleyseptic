// Investigate why service-area form only triggers 1 POST while others trigger 2
import { chromium } from "playwright";

const TARGETS = [
  { name: "ABBOTSFORD", url: "http://localhost:5010/septic-services-abbotsford/" },
  { name: "TANK-PUMPING (works)", url: "http://localhost:5010/tank-pumping/" },
];

const browser = await chromium.launch({ headless: true });
for (const t of TARGETS) {
  console.log(`\n=== ${t.name} ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const ajaxPosts = [];
  page.on("request", req => {
    if (req.method() === "POST" && /admin-ajax/.test(req.url())) {
      ajaxPosts.push(req.postData()?.slice(0, 80) || "(no data)");
    }
  });
  page.on("pageerror", e => console.log("  pageerror:", e.message.slice(0, 120)));

  await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Inspect form
  const formInfo = await page.evaluate(() => {
    const f = document.querySelector("form.fusion-form");
    if (!f) return null;
    const submitBtn = f.querySelector('button[type="submit"]');
    return {
      formId: f.id,
      formClass: f.className,
      formNumber: submitBtn?.getAttribute("data-form-number"),
      submitBtnText: submitBtn?.textContent.trim(),
      submitBtnVisible: submitBtn ? (submitBtn.offsetWidth > 0 && submitBtn.offsetHeight > 0) : false,
      hasNameField: !!f.querySelector('input[name="name"]'),
      hasEmailField: !!f.querySelector('input[name="email"]'),
      formInWrapper: f.closest(".fusion-form-form-wrapper")?.className,
    };
  });
  console.log("  form:", JSON.stringify(formInfo));
  console.log("  POSTs so far (after page load, before submit):", ajaxPosts.length);
  ajaxPosts.forEach(p => console.log("    →", p.slice(0, 100)));

  // Fill and submit
  await page.fill('form.fusion-form input[name="name"]', "Test").catch(e => console.log("  fill name failed:", e.message.slice(0, 80)));
  await page.fill('form.fusion-form input[name="email"]', "test@example.com").catch(e => console.log("  fill email failed:", e.message.slice(0, 80)));
  await page.fill('form.fusion-form input[name="phone"]', "555-0100").catch(e => console.log("  fill phone failed:", e.message.slice(0, 80)));
  await page.fill('form.fusion-form input[name="city"]', "Test City").catch(() => {});
  await page.fill('form.fusion-form input[name="subject"]', "Subject").catch(() => {});
  await page.fill('form.fusion-form textarea[name="message"]', "Message").catch(() => {});

  await page.evaluate(() => {
    const btn = document.querySelector('form.fusion-form button[type="submit"]');
    if (btn) btn.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);

  const submitResult = await page.evaluate(() => {
    const f = document.querySelector("form.fusion-form");
    const btn = f?.querySelector('button[type="submit"]');
    if (!btn) return "no submit btn";
    const r = btn.getBoundingClientRect();
    return { visible: r.width > 0 && r.height > 0, x: r.x, y: r.y, w: r.width };
  });
  console.log("  submit btn:", JSON.stringify(submitResult));

  try {
    await page.click('form.fusion-form button[type="submit"]', { timeout: 3000 });
    console.log("  click succeeded");
  } catch (e) {
    console.log("  click FAILED:", e.message.slice(0, 100));
  }
  await page.waitForTimeout(4000);

  // What did the form do?
  const after = await page.evaluate(() => {
    const f = document.querySelector("form.fusion-form");
    if (!f) return null;
    return {
      classList: f.className,
      hasErrorVisible: !!Array.from(f.querySelectorAll("[class*='error']")).find(e => getComputedStyle(e).display !== "none"),
      successMsgVisible: !!Array.from(document.querySelectorAll('.form-response, [class*="response"]')).find(e => getComputedStyle(e).display !== "none" && /thank|sent|success/i.test(e.textContent)),
    };
  });
  console.log("  state after submit:", JSON.stringify(after));
  console.log("  total POSTs:", ajaxPosts.length);
  await ctx.close();
}
await browser.close();
