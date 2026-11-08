const puppeteer = require("puppeteer-core");
const fs = require("fs");
const cookieLine = fs.readFileSync(__dirname + "/cj.txt", "utf8").split("\n").find((l) => l.includes("session-token"));
const parts = cookieLine.replace(/^#HttpOnly_/, "").split("\t");
const B = "http://localhost:3100";
const typeBench = async (page, selector, text) => {
  await page.evaluate(() => {
    window.__ev = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__ev.push([e.name, e.duration]))).observe({ type: "event", durationThreshold: 16, buffered: false });
  });
  await page.click(selector);
  for (const ch of text) { await page.keyboard.type(ch); await new Promise((r) => setTimeout(r, 150)); }
  await new Promise((r) => setTimeout(r, 800));
  const ev = await page.evaluate(() => window.__ev.filter((e) => /key|input/.test(e[0])).map((e) => e[1]));
  return { worstMs: Math.max(0, ...ev), avgMs: ev.length ? ev.reduce((a, b) => a + b, 0) / ev.length : 0, n: ev.length };
};
(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const out = {};
  const open = async (url, w = 1280, h = 900) => {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.setCookie({ name: parts[5], value: parts[6].trim(), domain: "localhost", path: "/" });
    const errors = []; page.on("console", (m) => m.type() === "error" && errors.push(m.text())); page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(B + url, { waitUntil: "networkidle0" });
    const cdp = await page.createCDPSession(); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    return { page, errors };
  };
  const dom = (p) => p.evaluate(() => document.querySelectorAll("*").length);

  let { page, errors } = await open("/dashboard/baseline?demo=1500&mode=naive");
  out.naive = { dom: await dom(page), ...(await typeBench(page, 'input[aria-label="naive search"]', "persian")) }; await page.close();

  ({ page, errors } = await open("/dashboard?demo=1500"));
  out.optimized = { dom: await dom(page), ...(await typeBench(page, 'input[aria-label="Search your listings"]', "persian")) };
  out.optimized.shown = await page.evaluate(() => document.querySelector("[aria-live]")?.textContent);
  // functional: filter, select, analytics lazy chunk
  await page.select('select[aria-label="Filter by status"]', "sold");
  await new Promise((r) => setTimeout(r, 400));
  out.afterFilter = await page.evaluate(() => document.querySelector("[aria-live]")?.textContent);
  await page.click('input[type=checkbox]'); await new Promise((r) => setTimeout(r, 200));
  out.selection = await page.evaluate(() => document.querySelector("[aria-live]")?.textContent);
  const before = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => r.name.includes(".js")).length);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Analytics/.test(b.textContent)).click());
  await page.waitForSelector("svg[role=img]", { timeout: 5000 });
  out.lazyChunksLoadedOnDemand = (await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => r.name.includes(".js")).length)) - before;
  await page.screenshot({ path: "perf/dashboard-desktop.png" });
  out.errors = errors; await page.close();

  ({ page, errors } = await open("/dashboard?demo=1500", 375, 800));
  out.mobileDom = await dom(page); out.mobileOverflowX = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await page.screenshot({ path: "perf/dashboard-mobile.png" }); out.mobileErrors = errors; await page.close();

  ({ page, errors } = await open("/admin/users?demo=1500"));
  out.users = { dom: await dom(page), ...(await typeBench(page, 'input[aria-label="Search users"]', "tanvir")) };
  out.users.shown = await page.evaluate(() => document.querySelector("[aria-live]")?.textContent);
  await page.screenshot({ path: "perf/admin-users-desktop.png" }); out.users.errors = errors; await page.close();
  ({ page } = await open("/admin/users-baseline?demo=1500")); out.usersBaselineDom = await dom(page); await page.close();
  ({ page, errors } = await open("/dashboard/shop")); out.shopErrors = errors; await page.close();
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
