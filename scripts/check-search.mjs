// End-to-end UI check of the search page. Run against a started server: `pnpm start`, then `pnpm check:search`.
import puppeteer from "puppeteer";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DISCORD = "/vi/posts/discord-cassandra-to-scylladb";
const nonAscii = (s) => /[^\x00-\x7f]/.test(s);

const viResults = {
  states: ["results"],
  check: (rows) =>
    rows.some((r) => r.href === DISCORD) &&
    rows.every((r) => !r.href.startsWith("/en/")) &&
    nonAscii(rows[0]?.text ?? ""),
  expect: `results incl. ${DISCORD}, no /en/ hrefs, first row accented`,
};
const onlyLocale = (loc) => (rows) => rows.every((r) => r.href.startsWith(`/${loc}/`));

const cases = [
  { locale: "vi", q: "du lieu", ...viResults },
  { locale: "vi", q: "dữ liệu", ...viResults },
  { locale: "vi", q: "zzqxv", states: ["empty"], check: () => true, expect: "empty" },
  { locale: "en", q: "messages", states: ["results"], check: onlyLocale("en"), expect: "results, all /en/" },
  // Pagefind folds and prefix-matches, so English posts may match; the invariant is no vi leak.
  { locale: "en", q: "dữ liệu", states: ["results", "empty"], check: onlyLocale("en"), expect: "results or empty, all /en/" },
  { locale: "en", q: "zzqxv", states: ["empty"], check: () => true, expect: "empty" },
];

const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--no-sandbox"],
  ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
});

async function waitSettled(page) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const state = await page.$eval("[data-search-state]", (el) => el.dataset.searchState).catch(() => "idle");
    if (state !== "idle" && state !== "loading") return state;
    await new Promise((r) => setTimeout(r, 100));
  }
  return "timeout";
}

let failed = 0;
try {
  for (const c of cases) {
    const page = await browser.newPage();
    let line;
    let ok = false;
    try {
      await page.goto(`${BASE}/${c.locale}/search?q=${encodeURIComponent(c.q)}`, { waitUntil: "load" });
      const state = await waitSettled(page);
      const rows = await page.$$eval("ol[data-search-results] li a[href]", (as) =>
        as.map((a) => ({ href: a.getAttribute("href"), text: a.textContent ?? "" })),
      );
      ok = c.states.includes(state) && (state !== "results" || c.check(rows));
      line = `state=${state} hrefs=${rows.map((r) => r.href).join(", ") || "(none)"}`;
    } catch (e) {
      line = String(e);
    }
    await page.close();
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} [${c.locale}] "${c.q}" -> ${line} (expect: ${c.expect})`);
  }
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
