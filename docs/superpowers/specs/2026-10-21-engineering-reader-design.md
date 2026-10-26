# Engineering Reader: design

Date: 2026-10-21. Status: approved by Ryan in brainstorming; reviewed by a builder check.

Working name: "Hệ thống lớn" (site name and domain are undecided; the builder uses a placeholder string from one config constant).

Tagline: "Bài học từ hệ thống lớn, cho team nhỏ" / "Lessons from big systems, for small teams".

Companion documents: `PRODUCT.md` (product truth, used by Impeccable) and `.impeccable/surfaces/app-locale-posts-slug-page-tsx.md` (direction contract for the post page). This document is the spec a builder plans from; where it and those files overlap, this document wins and they are updated.

## 1. Intent

A curated, bilingual (Vietnamese primary, English full equivalent) digest of engineering cases from large companies. Each post retells one real decision, incident, migration, or scaling problem in plain words, with concrete numbers traceable to primary sources, and translates it down to what a small team can do with it.

Why: Vietnamese developers read English engineering blogs slowly and skim; nuance is lost. Nobody does this in Vietnamese at quality. Existing English products are either pattern-based (ByteByteGo), neutral summaries (Quastor), or industry reporting (The Pragmatic Engineer).

### Reader

Vietnamese software developer, roughly 2 to 6 years' experience, mid-level, on the senior or architect track. Job to be done: preparing for a design review at work or a system design interview. Not casual curiosity.

Reading pattern: meets a post via a shared link on a phone, reads about two minutes, decides whether to return on a laptop. Optimize the phone skim first; the laptop deep read second.

English edition: same reader type outside Vietnam, plus Vietnamese developers who prefer English at work. Same persona, different language.

### Success

A phone reader leaves the top layer in under two minutes with the story, two to four sourced numbers, and one thing to change next week. A returning reader uses the deep layer to prepare for a design review or interview.

## 2. Goals, non-goals, anti-goals

Goals
- Every post has a stand-alone top layer and a story-driven deep layer, identical in structure across both languages.
- Every concrete number is traceable to a named primary source with a locator.
- The repo is the database; a scheduled AI pipeline can contribute posts by pull request with no special casing.
- Both light and dark themes are complete from day one.

Non-goals
- Not a translation; posts retell in our own words and never reproduce the original. Images from sources are never used, not even redrawn.
- No news coverage, tutorials, tooling reviews, or interview-question lists.
- 2 to 3 posts per week is a ceiling, not a target. One great post beats three average ones; this is the pipeline's selection bar.
- Out of v1 and undecided as product features: comments, newsletter, bookmarks, any paid or external service beyond Vercel Analytics.

Anti-goals (a failure even if it technically works)
- A post whose number cannot be traced.
- A pipeline PR that auto-merges or lands without a human checklist review.
- A look indistinguishable from a template, or a light theme that reads as an afterthought.
- A page that reads as "developer tool docs"; the product is closer to an engineering magazine.

## 3. Constraints

- Next.js 16 (App Router), React 19, deployed on Vercel free tier. Fully static output; no runtime database; no paid services.
- Content: MDX under `content/posts/`. No CMS.
- Vietnamese with full diacritics everywhere: fonts must cover Vietnamese; line-height leaves room for stacked diacritics; monospace faces are used only for numbers, references, and ASCII labels, never for Vietnamese prose or headings.
- Asset limits: 300 KB per image, 2 MB per post folder. Alt text required in both locales. No image URL on an external domain.
- Slugs never change after merge.

## 4. Post anatomy (identical in both languages)

Top layer, fixed, in this order, readable on a phone in under two minutes:
1. Title. Case-shaped, not topic-shaped ("Discord moved 1T messages from Cassandra to ScyllaDB", not "Database migration at Discord").
2. Summary. One line, at most 160 characters; doubles as meta description.
3. Key numbers. 2 to 4, prefer 3. Each: value, label, source reference. Every number carries a reference; the count is not a rule.
4. TL;DR. 3 to 5 bullets: problem, what they did, outcome.
5. For a small team ("Cho team nhỏ"). 2 to 4 bullets, second person: what you change next week, what does not transfer from their scale.

Deep layer, 6 to 10 minutes' reading: free H2 headings that follow the story of the case (where they started, what broke, options, what they built, what it cost, what went wrong after). Inline references in the body: `[S1]`, `[S2 §3]`, `[S3 @12:40]`. Diagrams are Mermaid blocks in the MDX body with translated labels per locale. Whole post 8 to 12 minutes.

Fixed ending:
- Lessons. About them: what they would do differently, what the case proves. Opinion allowed. 2 to 3 bullets. May be omitted when nothing is non-obvious.
- Sources. Structured, primary only, rendered from data: id, type (blog, talk, paper), title, authors, publish date, URL, accessed date, locator (section or timestamp). A line beside it reads "Drafted with AI from the sources above, reviewed and edited by Ryan." (Vietnamese equivalent in `vi`.)

Subject rule: Lessons is about them, For a small team is about you. A bullet that fits both goes to For a small team.

Review checklist (gates merge; the pipeline self-checks against it and prints it in the PR body):
- Functional and non-functional requirements stated.
- Scale estimate present with numbers.
- Bottleneck named explicitly.
- At least one trade-off with both sides.
- At least one failure mode or lesson from failure.
- Every number has a source reference.
- For a small team is specific, not a platitude.
- Subject check: Lessons is about them, For a small team is about you.
- Nothing paraphrased so closely it reproduces the original.
- Same diagram count and shape across locales.

Source policy: primary sources only (the company's own engineering blog, a talk by their engineers, a paper). Secondary summaries (newsletters, Reddit, Hacker News) may inform but are never cited as the source of a number. Any number that cannot be traced is not used.

Byline: the accountable human, "Ryan" / "Biên tập: Ryan". The About page explains the full process; that is where trust is built. Pipeline PRs never auto-merge.

## 5. Content model

```
content/
  posts/<slug>/
    post.json          shared, language-independent facts
    vi.mdx             Vietnamese body and translated fields
    en.mdx             English body and translated fields
    *.svg              Mermaid renders (derived, committed) and hand-drawn SVGs (human posts only)
    *.png|jpg          optional assets, within limits
  companies.json       controlled list; also the pipeline's feed list
  topics.json          five shelves with vi/en labels
  tags.json            controlled list with vi/en labels
  series.json          ordered slugs per series
  featured.json        ordered slugs for "start here"
  redirects.json       old path to new path
  seen.json            pipeline ledger
```

### post.json

```json
{
  "slug": "discord-cassandra-to-scylladb",
  "company": "discord",
  "topic": "data",
  "caseType": "migration",
  "tags": ["cassandra", "scylladb", "storage"],
  "series": null,
  "publishedAt": "2026-10-20",
  "updatedAt": null,
  "sourcePublishedAt": "2023-03-06",
  "featured": false,
  "author": "pipeline",
  "reviewedBy": "ryan",
  "keyNumbers": [
    { "id": "messages", "value": "1T", "ref": "S1" },
    { "id": "nodes", "value": "177 → 72", "ref": "S1" }
  ],
  "sources": [
    {
      "id": "S1",
      "type": "blog",
      "title": "How Discord Stores Trillions of Messages",
      "authors": ["Bo Ingram"],
      "publishedAt": "2023-03-06",
      "url": "https://discord.com/blog/how-discord-stores-trillions-of-messages",
      "accessedAt": "2026-10-20",
      "locator": null
    }
  ]
}
```

Enums: `company` from companies.json; `topic` one of `distributed-systems`, `data`, `realtime`, `infra`, `reliability`; `caseType` one of `migration`, `incident`, `design-decision`, `scaling`; `tags` 2 to 5 from tags.json; `series` a key in series.json or null; `author` is `pipeline` or a human handle; `reviewedBy` a human handle.

### Locale frontmatter (vi.mdx, en.mdx)

```yaml
title: ...
summary: ...            # at most 160 characters
tldr: [...]
keyNumberLabels:        # keys must equal post.json keyNumbers ids
  messages: tin nhắn đã migrate
  nodes: số node sau khi đổi
smallTeam: [...]
lessons: [...]          # optional
draft: false            # optional; true excludes the locale from the build
```

Body below the frontmatter is the deep layer. Mermaid as fenced ```mermaid blocks. A locale exists when its file exists and is not draft.

### Slug

Shared across languages. English, kebab-case, company slug first, then the case in four to six words. No dates. Never changes after merge; renames go through redirects.json.

### companies.json entry

`slug`, `name`, `blogUrl`, `feedUrl`, `brandColor`, `logo` (path under `public/logos/`, SVG). Brand colour is used only on the logo mark on cards; the page accent never changes.

### seen.json

Keyed by normalized source URL (scheme and host lowercased, fragment stripped, `utm_*` parameters removed, other query parameters kept and sorted so YouTube `v=` ids stay distinct, trailing slash removed):

```json
{
  "https://discord.com/blog/how-discord-stores-trillions-of-messages": {
    "company": "discord", "seenAt": "2026-10-20", "decision": "picked", "slug": "discord-cassandra-to-scylladb"
  },
  "https://netflixtechblog.com/some-post": {
    "company": "netflix", "seenAt": "2026-10-20", "decision": "skipped", "reason": "tooling announcement, no numbers"
  }
}
```

Skipped entries are kept so the pipeline never re-evaluates; deleting an entry re-queues it.

`featured.json` (ordered slugs) is the single source of truth for the home page's "Start here" picks; the `featured` boolean in `post.json` is ignored (kept in the schema for now).

### Validation (`scripts/validate-content.ts`, runs as `prebuild` and in CI)

Errors (fail the build):
- post.json and locale frontmatter match their zod schemas; the same schemas feed the site loader.
- Enum membership for company, topic, caseType, tags, series.
- `keyNumberLabels` keys equal keyNumbers ids exactly, in every locale.
- Every `[S\d+...]` reference in a body resolves to a source id; every source id is referenced at least once in at least one locale.
- Sources are primary: host is the company's blog host from companies.json or on the explicit allowlist in `content/source-hosts.json` (youtube.com, usenix.org, acm.org, dl.acm.org, arxiv.org, infoq.com, and named conference sites). `talk` and `paper` sources must carry a locator.
- No external image URL in any body. Asset size limits. Alt text present on every image in both locales.
- Same count of Mermaid blocks across locales.
- Deep layer reading time 6 to 10 minutes; whole post 8 to 12 (words per minute: 200 for Vietnamese, 230 for English; both configurable in one place).
- Summary at most 160 characters.
- Both locales present unless one is marked draft.

Warnings (printed, do not fail):
- `publishedAt` more than 3 days before the build date.
- Lessons omitted.

## 6. Information architecture

Every page lives under a locale prefix. `/` redirects to `/vi` (308). No Accept-Language sniffing.

```
/[locale]                      home
/[locale]/posts/[slug]         post
/[locale]/posts/[slug].md      the post as Markdown (top layer, body, sources)
/[locale]/companies            index
/[locale]/companies/[company]  posts by company
/[locale]/topics/[topic]       posts by topic (five shelves)
/[locale]/tags/[tag]           posts by tag
/[locale]/series/[series]      posts in a series, in order
/[locale]/search               Pagefind UI
/[locale]/about                what this is, the process, the source policy
/[locale]/feed.xml             RSS
/feed.xml                      301 to /vi/feed.xml
/llms.txt                      site index for agents, both locales
/sitemap.xml, /robots.txt
```

Home: tagline and one sentence; "Start here" (three posts from featured.json); latest 6 to 8 cards (company mark, title, one key number, read time); browse by company; browse by topic. Not a reverse-chronological dump.

Post page, in order: breadcrumb (company); title; meta (byline, date, read time, topic, case type); the top layer exactly as section 4 orders it (summary, key numbers, TL;DR, For a small team); the same order governs the `.md` route, the RSS item and the OG card, all above the deep-read divider; the deep layer; Lessons; Sources with the AI line; prev/next when in a series, two to three related posts (same topic first, then same company). Desktop: 720px reading column plus a 260px sticky rail (author card, table of contents with active section, share). Phone: single column; the table of contents collapses to a disclosure after the top layer. Reading progress indicator driven by scroll position only.

Language switch: header toggle VI | EN links to the same path in the other locale. When the twin locale is missing, the toggle links to that locale's home and the post page shows a one-line note. Lists show only posts that exist in the current locale.

hreflang: emitted only for pairs that exist; `x-default` is `vi`.

## 7. Visual direction

User-pinned: the dark developer-docs convention as 200lab.io renders it, executed at the craft level of Linear (dark, hairlines, panels), Stripe blog and Stripe Press (long-form typography and rhythm), and fly.io blog (readable technical voice with numbers).

World
- Dark: ground `#0a111c`, a 40px hairline grid in mint at 7% opacity, ink `#eef0f1`, secondary `#d4d9db`, muted `#9aa5ad`, hairlines `rgba(148,197,180,.17)`, panels 2.5% to 4% white, radius 8 to 10px, one accent mint `#6ee7b7`.
- Light: a first-class twin from the same tokens: paper ground, the same grid at low opacity, the same single accent darkened for contrast, same hairline and panel roles. Light must look as intentional as dark.
- Default theme follows `prefers-color-scheme`; a toggle persists the choice; a small inline script applies the stored theme before first paint.
- Type: Inter for all text (Vietnamese subset), JetBrains Mono for numbers, references, and ASCII labels only. Body 16 to 18px, line-height 1.6 to 1.7. Title tracking no tighter than -2%.
- Dividing blocks, three levels: hairlines for large regions; muted panels for TL;DR, each deep-layer H2 section, code, the rail; an accent border only on the "Cho team nhỏ" callout. A monospace divider "ĐỌC SÂU · n PHÚT" / "DEEP READ · n MIN" marks where the deep layer begins. No nested panels: code blocks, diagrams and tables inside a section panel are set off by hairline rules, never bordered boxes. No gradients, no glow, no second colour.
- Company colours appear only on logo marks on cards.
- The chosen first-viewport sketch is `.impeccable/mocks/decision/pinned-neon-navy-carded.html` (phone, 390 wide). The direction contract lives in the surface brief; the build is audited against both.

OG images: generated at build per locale from post.json and the locale title (company mark, title, one key number large, tagline), light background regardless of theme, Vietnamese-capable font file loaded from the repo.

## 8. Technical design

- Next.js 16 App Router, React 19, TypeScript, pnpm, Tailwind v4 with tokens as CSS variables under `@theme`; `[data-theme]` attribute with `prefers-color-scheme` fallback.
- Content loader `lib/content.ts`: reads post folders at build, parses frontmatter with gray-matter, validates with the shared zod schemas, compiles MDX with `next-mdx-remote/rsc` and `remark-gfm`. All routes use `generateStaticParams` for both locales. No runtime file reads.
- Syntax highlighting: `rehype-pretty-code` over Shiki at build, dual theme via CSS variables, no client JS.
- Mermaid: build-time. `scripts/render-mermaid.ts` finds every ```mermaid block, renders it to SVG (Mermaid CLI with headless Chromium), and writes `<slug>/<locale>-diagram-<n>.svg` into the post folder; the SVG is committed. The script is idempotent: it re-renders only when the block's hash differs from a hash comment stored in the SVG. Authors run it locally; CI also runs it on every pull request, commits any new or re-rendered SVG back to the PR branch, and then fails the PR if anything is still stale. The pipeline never runs it (it writes Mermaid source only). At build, the MDX component for a mermaid block inlines the matching SVG; if the SVG is missing, it renders the source as a code block. SVG colours use CSS variables so both themes work.
- i18n: `[locale]` segment with `generateStaticParams(['vi','en'])`; UI strings in `dictionaries/{vi,en}.json`; `proxy.ts` only redirects `/` to `/vi`. `generateMetadata` emits canonical, OG, Twitter card, and `alternates.languages` only for existing pairs.
- SEO: `app/sitemap.ts`, `app/robots.ts`, JSON-LD `Article` with `author`, `inLanguage`, and `citation` from sources. `llms.txt` lists both locales' posts with summaries. `/[locale]/posts/[slug].md` route returns Markdown assembled from frontmatter and body.
- RSS: `app/[locale]/feed.xml/route.ts`, static, summary plus link, not full content.
- Search: Pagefind runs post-build over the static output, one index per locale (`--root` per locale directory or `data-pagefind-filter` by language); the search page loads the Pagefind UI lazily and matches the world. Both accented and unaccented Vietnamese queries must match ("dữ liệu" and "du lieu" find the same post): index an accent-folded copy of title, summary and body alongside the original (builder's call on mechanism, for example a hidden `data-pagefind-body` block or query normalisation). Builder's call, recorded here. Recorded (M4): Pagefind 1.5.2 indexes `.next/server/app` in `postbuild`, split per locale by `<html lang>`; only post `<article data-pagefind-body>` is indexed; Pagefind folds diacritics natively and an accent-folded copy is also carried via `data-pagefind-index-attrs` (spec requirement, belt and braces); the search page is a custom UI on Pagefind's JS API that renders rows from `data-pagefind-meta` only (never Pagefind excerpts, which would show folded text).
- Series: `series.json` maps a series key to an ordered list of slugs and vi/en titles; the post page shows prev/next and a series index link.
- Redirects: `content/redirects.json` read in `next.config.ts` into `redirects()`.
- Reading progress: a thin bar driven by scroll position only; no stored state.
- Fonts via `next/font/google` with `display: swap`.
- Analytics: `@vercel/analytics` only.
- CI (GitHub Actions on every PR): `pnpm validate`, `pnpm render-mermaid --check`, `pnpm build`. Branch protection on `main`: CI required, no auto-merge. Vercel preview deploys on PRs; production on merge.

Rejected: Contentlayer, Velite, next-intl, any CMS, client-side Mermaid, client-side search libraries.

## 9. Pipeline contract (M5 writes `docs/pipeline.md` for an outsider)

A Claude Code scheduled cloud routine (the `/schedule` facility), running on Ryan's subscription with `gh` access, in a separate session with no access to this conversation. The pipeline never needs Chromium or a build toolchain: it writes Mermaid source only; CI renders and commits the SVG. Pipeline and CI stay fully decoupled. Steps:
1. Rebase on `main`; read `companies.json` (feeds) and `seen.json`.
2. Fetch each feed; for each unseen item, decide picked or skipped against the selection bar (one great post beats three average ones; must have concrete numbers and a real decision, incident, migration, or scaling problem).
3. For each pick: write `post.json`, `vi.mdx`, `en.mdx`, run `validate-content` (pure TypeScript, no browser), run the review checklist and print it in the PR body with the sources.
4. Update `seen.json` once per run; open one PR per run, labeled `pipeline`. Never merge.

Ledger rules (my call, recorded for the builder):
- At most one pipeline PR in flight. If a `pipeline` PR is open, the run exits without doing anything.
- The pipeline reads the ledger from `main` and from every `pipeline/*` branch (open or closed-unmerged within the last 90 days, via the GitHub API). Entries found only on a closed-unmerged branch are treated as `decision: rejected` and are written into the next run's ledger, so a rejected draft is never re-picked without a human deleting the entry.
- A run with no picks still pushes a `pipeline/ledger-<date>` branch and opens a ledger-only PR, so skip decisions reach `main`. Merged pipeline branches are deleted.

Shadow mode means Ryan reads every pipeline PR in full before merging; after exit, review is by the printed checklist plus the sources block. Ryan applies the label `clean` to a merged PR that meets the clean definition; a script (`scripts/shadow-status.ts`) counts consecutive `clean` merges and the days since the first pipeline PR and prints whether the exit condition holds.

Shadow mode after the pipeline first runs: exit after 5 consecutive clean PRs and no earlier than 3 weeks. Clean means merged with zero edits to post.json and only minor prose edits in MDX; any edit to a number or a source resets the count to zero.

## 10. Roadmap

Each milestone merges to `main` and deploys green. v1 is done when M8 closes.

- M0 Repo and contract. Scaffold, tokens for both themes, CI, content schemas, `validate-content` as prebuild, companies/topics/tags/source-hosts files, empty seen.json, three fixture posts in both locales, real cases with traced primary sources (never synthetic; they are public from M1). Process: Claude proposes 5 to 6 candidates, Ryan picks three, Claude drafts, Ryan edits by hand (not checklist review) because these are the model the pipeline imitates. Constraints: three companies, three different caseTypes, at least one with a Mermaid diagram, one whose primary source is a talk (exercises locator and allowlist), one with Lessons legitimately omitted. Chosen fixtures: (1) Discord, "How Discord Stores Trillions of Messages" (blog, migration, data, Mermaid); (2) Cloudflare, "Post Mortem on Cloudflare Control Plane and Analytics Outage" (blog, incident, reliability; Lessons omitted as a stated decision in the PR because the source lists its own, so "Cho team nhỏ" carries the weight: a five-person team has no second data center, what the case says about single points of failure in their own control plane); (3) Netflix, "Mastering Chaos: A Netflix Guide to Microservices" (Josh Evans, QCon SF 2016, talk on InfoQ/YouTube, design-decision, reliability; exercises timestamp locators and the talk-host allowlist). TAO (Meta, USENIX 2013) stays a regular post candidate. All three URLs are verified before drafting. Done when `pnpm build` fails on a deliberately bad post and passes on the three.
- M1 Read a post, deploy. Post page to the direction contract, both themes, toggle, phone and desktop, Mermaid SVG, highlighting, sources block, byline and AI line, reading progress, `/` redirect, home as a plain list for now, Vercel connected, Analytics on. Done when three posts are live and the Impeccable finish review on the post page returns ship.
- M2 Wayfinding. Home per IA, companies, topics, tags, series with prev/next, about, redirects. Done when every IA route resolves in both locales.
- M3 Discoverability. Metadata, hreflang, sitemap, robots, JSON-LD with citations, RSS per locale, OG images per locale, llms.txt, `.md` route. Done when a rich-results test and an OG debugger show correct cards for both locales.
- M4 Search. Pagefind per locale, search UI, zero-result state. Done when a Vietnamese diacritic query returns the right post.
- M5 Pipeline contract. `docs/pipeline.md` written for an outsider; a dry-run script generates a post folder from a fixture and opens a PR; CI labels pipeline PRs. Done when a fixture PR passes CI unchanged.
- M6 Pipeline. The scheduled task in shadow mode per section 9. Done when `shadow-status` reports the exit condition met (5 consecutive clean merges, at least 3 weeks).
- M7 Craft pass. Impeccable finish review on every surface, DESIGN.md written from the built world, Lighthouse on phone, both themes audited against the craft references.
- M8 Domain and launch. Site name, domain, redirect from vercel.app, first ten posts in both locales. Done when every v1 item in this document ships.

GitHub: one public repo under Ryan's personal account (free branch protection and Vercel Hobby both require this; rejected pipeline drafts being visible is accepted, it shows the review is real), one Project board with fields Milestone (M0 to M8), Type (code, content, pipeline, design), Locale (vi, en, both); one issue per milestone bullet; labels `pipeline`, `content`, `needs-source`; PR template carrying the review checklist; GitHub Milestones M0 to M8. Pipeline PRs are not tracked on the board.

## 11. Left to the builder

- Exact Tailwind token names, spacing scale, and component file layout.
- Light theme hex values, derived from the dark tokens and checked for WCAG AA contrast.
- Pagefind integration details (per-locale index strategy) as long as diacritic search works.
- Mermaid CLI wiring in CI (Chromium install step) and the hash-comment format.
- Reading-time word counts per locale beyond the stated defaults.
- Test strategy: at minimum, validator unit tests with the three fixtures plus deliberately broken copies.

## 12. Open items recorded, not blocking

- Site name and domain (M8).
- Whether company logos are sourced as SVG from each company's press kit or drawn as monogram marks; until decided, a monogram fallback renders from the company name.
