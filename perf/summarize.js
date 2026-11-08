const fs = require("fs");
for (const f of fs.readdirSync(__dirname).filter((x) => x.endsWith(".json"))) {
  const r = JSON.parse(fs.readFileSync(__dirname + "/" + f, "utf8"));
  const a = r.audits;
  const g = (k) => a[k]?.displayValue ?? "n/a";
  const scripts = (a["network-requests"]?.details?.items ?? []).filter((i) => i.resourceType === "Script");
  const js = scripts.reduce((n, i) => n + (i.transferSize || 0), 0);
  console.log(`${f.replace(".json", "")}: score=${Math.round(r.categories.performance.score * 100)} FCP=${g("first-contentful-paint")} LCP=${g("largest-contentful-paint")} TBT=${g("total-blocking-time")} CLS=${g("cumulative-layout-shift")} SI=${g("speed-index")} JS=${Math.round(js / 1024)}KB total=${g("total-byte-weight")} mainthread=${g("mainthread-work-breakdown")}`);
}
