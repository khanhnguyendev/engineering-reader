# HANDOFF (2026-10-22, after M2)

Not a gate. M2 Wayfinding is complete; the run continues with M3.

## State
- `main`: M0+M1 (PR #1) and M2 (PR #2). Production: https://engineering-reader.vercel.app.
- M2 delivered home per IA, companies, topics, tags, series (fixture-tested only; no real series yet), about, redirects module, localized 404, header nav state. Finish review: ship. DESIGN.md records the new components.
- Run ledger archived at `docs/runs/2026-10-22-m2-ledger.md`. Rulings: `docs/decisions.md`.

## For Ryan (when you have a moment)
- Read the About page copy (`content/pages/about.vi.mdx`, `about.en.mdx`, plus the `about.rss` line in the dictionaries). The run wrote it from the spec; edit freely by content PR.
- The en About page names the site "Hệ thống lớn" because the site name is still undecided (PRODUCT.md).
- A no-JS visitor on an `/en/...` 404 sees the Vietnamese 404 text (static root not-found; ruling in decisions.md).

## Next
M3 Discoverability (spec §10): metadata, hreflang, sitemap, robots, JSON-LD with citations, RSS per locale, OG images per locale, llms.txt, `.md` route. Done when a rich-results test and an OG debugger show correct cards for both locales. Plan to be written at the start of M3.
