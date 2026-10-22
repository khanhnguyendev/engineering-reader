// Proves the built Pagefind index works. Run against a started server: `pnpm start`, then `pnpm check:index`.
import puppeteer from "puppeteer";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DISCORD = "/vi/posts/discord-cassandra-to-scylladb.html";
// Test hook: FAIL_PROBE=1 inverts one expectation so the script can be seen to fail.
const FAIL_PROBE = process.env.FAIL_PROBE === "1";
const nonAscii = (s) => /[^\x00-\x7f]/.test(s);

const cases = [
  { locale: "vi", q: "du lieu", check: (r) => r.some((x) => x.url === DISCORD) !== FAIL_PROBE, expect: "includes Discord post" },
  { locale: "vi", q: "dữ liệu", check: (r) => r.some((x) => x.url === DISCORD), expect: "includes Discord post" },
  { locale: "vi", q: "zzqxv", check: (r) => r.length === 0, expect: "zero results" },
  { locale: "en", q: "messages", check: (r) => r.length >= 1 && r.every((x) => x.url.startsWith("/en/posts/")), expect: ">=1 result, all /en/posts/" },
  // Pagefind folds and prefix-matches, so English words may match; the invariant is no vi leakage.
  { locale: "en", q: "dữ liệu", check: (r) => r.every((x) => x.url.startsWith("/en/posts/")), expect: "every result under /en/posts/ (zero is fine)" },
  { locale: "en", q: "tin nhắn", check: (r) => r.length === 0, expect: "zero results (vi-only phrase)" },
  { locale: "en", q: "zzqxv", check: (r) => r.length === 0, expect: "zero results" },
];

const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--no-sandbox"],
  ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
});
let failed = 0;
try {
  const pages = {};
  for (const locale of ["vi", "en"]) {
    const page = await browser.newPage();
    await page.goto(`${BASE}/${locale}`, { waitUntil: "load" });
    pages[locale] = page;
  }
  for (const c of cases) {
    let results = [];
    let err = "";
    try {
      results = await pages[c.locale].evaluate(async (q) => {
        const pf = await import("/pagefind/pagefind.js");
        await pf.init?.();
        const r = await pf.search(q);
        return Promise.all(r.results.slice(0, 10).map((x) => x.data()));
      }, c.q);
    } catch (e) {
      err = String(e);
    }
    const ok = !err && c.check(results);
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} [${c.locale}] "${c.q}" -> ${err || results.map((x) => x.url).join(", ") || "(none)"} (expect: ${c.expect})`);

    // Every result carries exact meta; vi results hold accented text.
    for (const x of results) {
      const t = x.meta?.title ?? "";
      const s = x.meta?.summary ?? "";
      const metaOk = t && s && (c.locale !== "vi" || (nonAscii(t) && nonAscii(s)));
      if (!metaOk) {
        failed++;
        console.log(`FAIL [${c.locale}] "${c.q}" meta for ${x.url}: title=${JSON.stringify(t)} summary=${JSON.stringify(s)}`);
      }
    }
  }
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
