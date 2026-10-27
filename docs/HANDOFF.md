# HANDOFF (2026-10-26, after M4)

Not a gate. M4 Search is complete; the run continues with M5.

## State
- `main`: M0+M1 (PR #1), M2 (PR #2), M3 (PR #3 + follow-up PR #4), M4 (PR #5), verified on production: https://engineering-reader.vercel.app.
- M4 delivered: `/vi/search` and `/en/search` (header nav), Pagefind index built from content in `prebuild` (one index per locale), accented and unaccented Vietnamese queries match, rows show title, lead number, summary and company. `pnpm check:index` / `pnpm check:search` (set `BASE` to target production) verify the live index.
- M3 delivered: full metadata on every page (canonical, OG with per-locale cards, Twitter large card, hreflang for existing pairs only, RSS and markdown alternates), JSON-LD Article with citations, RSS per locale, sitemap with hreflang, robots, llms.txt, a Markdown copy of every post at `/<locale>/posts/<slug>.md`.
- Done-when verified on production: Google's Rich Results Test finds a valid Article in both locales; opengraph.xyz reads the 1200×630 card, title, description and large Twitter card.
- Run ledgers: `docs/runs/`. Rulings: `docs/decisions.md`.

## For Ryan (when you have a moment)
- Read the About page copy (`content/pages/about.vi.mdx`, `about.en.mdx`); the feed line now links to the RSS feed.
- Key-number values are shared across locales, so they were made language-neutral: Discord "9 d", Netflix "99.99% × 10 → ~99.9%". Change them if you prefer other wording; keep them free of words in one language.
- The site name "Hệ thống lớn" appears on English pages, OG cards and feeds because the name is still undecided (PRODUCT.md).
- A no-JS visitor on an `/en/...` 404 sees the Vietnamese text and tab title (static root not-found; ruling in decisions.md).

## Next
M5 Pipeline contract (spec §9, §10): `docs/pipeline.md` for an outsider, the pipeline prompt and checklist, validator rules the pipeline needs (including no words in shared key-number values, noted in M3). Done when a fixture PR passes CI unchanged. Plan to be written at the start of M5.
