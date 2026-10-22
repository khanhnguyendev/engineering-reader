# HANDOFF (2026-10-22, after M3)

Not a gate. M3 Discoverability is complete; the run continues with M4.

## State
- `main`: M0+M1 (PR #1), M2 (PR #2), M3 (PR #3 + follow-up PR #4), verified on production: https://engineering-reader.vercel.app.
- M3 delivered: full metadata on every page (canonical, OG with per-locale cards, Twitter large card, hreflang for existing pairs only, RSS and markdown alternates), JSON-LD Article with citations, RSS per locale, sitemap with hreflang, robots, llms.txt, a Markdown copy of every post at `/<locale>/posts/<slug>.md`.
- Done-when verified on production: Google's Rich Results Test finds a valid Article in both locales; opengraph.xyz reads the 1200×630 card, title, description and large Twitter card.
- Run ledgers: `docs/runs/`. Rulings: `docs/decisions.md`.

## For Ryan (when you have a moment)
- Read the About page copy (`content/pages/about.vi.mdx`, `about.en.mdx`); the feed line now links to the RSS feed.
- Key-number values are shared across locales, so they were made language-neutral: Discord "9 d", Netflix "99.99% × 10 → ~99.9%". Change them if you prefer other wording; keep them free of words in one language.
- The site name "Hệ thống lớn" appears on English pages, OG cards and feeds because the name is still undecided (PRODUCT.md).
- A no-JS visitor on an `/en/...` 404 sees the Vietnamese text and tab title (static root not-found; ruling in decisions.md).

## Next
M4 Search (spec §8, §10): Pagefind over the static output, one index per locale, a search page that loads the UI lazily and matches the world, accented and unaccented Vietnamese queries matching the same post. Done when a Vietnamese diacritic query returns the right post. Plan to be written at the start of M4.
