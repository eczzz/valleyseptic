// Submit the home contact form on each version and report whether it goes
// through to the live valleyseptic.ca admin-ajax.php endpoint.
import { chromium } from "playwright";

const TARGETS = [
  { label: "ASTRO", url: "http://localhost:5010/" },
  { label: "RAW  ", url: "http://localhost:5012/" },
];

const browser = await chromium.launch({ headless: true });

for (const t of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const reqs = [];
  page.on("request", req => {
    if (req.method() === "POST" && /admin-ajax|valleyseptic/i.test(req.url())) {
      reqs.push({ url: req.url(), postData: (req.postData() || "").slice(0, 200) });
    }
  });
  const responses = [];
  page.on("response", async resp => {
    if (resp.request().method() === "POST" && /admin-ajax/i.test(resp.url())) {
      responses.push({ url: resp.url(), status: resp.status(), body: (await resp.text().catch(() => "")).slice(0, 300) });
    }
  });
  page.on("console", m => {
    if (/error|fusion/i.test(m.text())) console.log(`[${t.label}] CONSOLE`, m.type(), m.text().slice(0, 200));
  });

  console.log(`\n=== ${t.label} (${t.url}) ===`);
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Scroll to bottom to make contact form visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    // Find the form and fill it
    await page.fill('form.fusion-form input[name="name"]', "Test Bot").catch(e => console.log("  fill name failed:", e.message));
    await page.fill('form.fusion-form input[name="email"]', "test@example.com").catch(e => console.log("  fill email failed:", e.message));
    await page.fill('form.fusion-form input[name="phone"]', "555-0100").catch(e => console.log("  fill phone failed:", e.message));
    await page.fill('form.fusion-form input[name="city"]', "Chilliwack").catch(() => {});
    await page.fill('form.fusion-form input[name="subject"]', "Test from rebuild").catch(() => {});
    await page.fill('form.fusion-form textarea[name="message"]', "Automated form test — please ignore.").catch(() => {});
    // Submit
    await page.click('form.fusion-form button[type="submit"]').catch(e => console.log("  submit failed:", e.message));
    await page.waitForTimeout(4000);
    // Check for the "Your message has been sent" success class becoming visible
    const success = await page.evaluate(() => {
      const el = document.querySelector(".fusion-form-response, .form-response, .form-form-response");
      return el ? { text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 200), visible: getComputedStyle(el).display !== "none" } : null;
    });
    console.log("  POST count:", reqs.length);
    reqs.slice(0, 3).forEach(r => console.log("   ", r.url, "data:", r.postData));
    console.log("  Response count:", responses.length);
    responses.slice(0, 3).forEach(r => console.log("   ", r.status, r.url, "body:", r.body));
    console.log("  Success element:", JSON.stringify(success));
  } catch (e) {
    console.log("  ERR:", e.message);
  }
  await ctx.close();
}

await browser.close();
