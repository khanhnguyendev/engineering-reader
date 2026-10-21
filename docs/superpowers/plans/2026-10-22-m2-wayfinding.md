# M2: Wayfinding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every route in the information architecture resolves in both locales: home per the IA, companies index and pages, topic pages, tag pages, series pages with prev/next, about, redirects, localized 404.

**Architecture:** All list pages are static (`generateStaticParams` over vocab × locales), built on the M1 loader (`listPosts`, `listPostsBy`, `hasLocale`) plus a small set of pure helpers (`lib/content/index.ts`) and one shared card component. The about page is MDX compiled by the M1 pipeline. Redirects come from `content/redirects.json` into `next.config.ts`.

**Tech Stack:** unchanged from M1 (Next.js 16, Tailwind v4 tokens, next-mdx-remote, zod, vitest).

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md` §6 (IA), §7 (world), §10 M2. DESIGN.md is the visual authority for new surfaces (tokens, named rules: one accent, no nested panels, mono only for numbers/refs/labels, callout only on the post page).

## Global Constraints

- Everything under `/[locale]`; both locales for every page; dictionary keys identical across locales; no hard-coded English on vi pages.
- Visual rules from DESIGN.md: `.panel` cards, hairlines, one accent, no gradients/shadows, company brand colour only on the monogram mark on cards (never as page accent), Inter prose, mono for numbers and uppercase labels only.
- Metadata on every page: title, description, canonical, `alternates.languages` for both locales (+ `x-default: vi`), `openGraph` with `locale` in `ll_CC` form (`vi_VN`, `en_GB`), title, description, url.
- Static output; loaders read files at build only; `listPosts` memoized per root.
- `VOCAB_ROOT` env (default `content`) mirrors `CONTENT_ROOT` so page tests can point at fixtures.
- Commit messages end with the session's two attribution lines.

## Review Focus

1. A company with zero posts in one locale must render an empty state in that locale, not a crash or an English string. Test in Task 4.
2. A tag listed in `tags.json` but used by no post must still have a page (static params from vocab) with an empty state. Test in Task 5.
3. A post in a series must show prev/next only within the series order, and a series with one post shows neither. Test in Task 6.
4. A redirect entry with `from` equal to a real route must not shadow it: validator rejects it. Test in Task 8.
5. `/vi/does-not-exist` renders the localized 404 with the header, in Vietnamese. Test in Task 8.

---

## File structure

```
lib/content/index.ts            pure helpers: companiesWithCounts, topicsWithCounts, tagsWithCounts, seriesNav, relatedPosts, featuredPosts, memoized listPosts wrapper
lib/content/vocab.ts            VOCAB_ROOT env default
lib/content/schema.ts           RedirectsSchema, AboutPage? (none; MDX only)
components/post-card.tsx        card: monogram (brand colour), company, title, one key number, read time, topic chip
components/post-list.tsx        ul of PostCard
components/page-intro.tsx       h1 + dek
components/section-heading.tsx  mono label + h2
components/monogram.tsx         letter mark in brand colour
app/[locale]/page.tsx           home per IA
app/[locale]/companies/page.tsx, [company]/page.tsx
app/[locale]/topics/page.tsx, [topic]/page.tsx
app/[locale]/tags/page.tsx, [tag]/page.tsx
app/[locale]/series/[series]/page.tsx
app/[locale]/about/page.tsx + content/pages/about.{vi,en}.mdx
app/[locale]/not-found.tsx, app/not-found.tsx (styled, localized by path)
next.config.ts                  redirects() from content/redirects.json
lib/metadata.ts                 buildMetadata({locale, path, title, description}) shared helper
dictionaries/{vi,en}.json       new keys: home.*, companies.*, topics.*, tags.*, series.*, about.*, notFound.*
tests/content/index.test.ts, tests/ui/{home,companies,topics,tags,series,about,not-found}.test.tsx, tests/redirects.test.ts
```

---

### Task 1: Helpers, memoized loader, VOCAB_ROOT, metadata helper

**Files:** `lib/content/index.ts`, `lib/content/load.ts` (memoize), `lib/content/vocab.ts` (`VOCAB_ROOT`), `lib/metadata.ts`, `lib/content/schema.ts` (`RedirectsSchema`). Test: `tests/content/index.test.ts`, `tests/metadata.test.ts`.

**Interfaces:**
- `listPosts(root)` memoized per root in a module Map (cleared by `_resetListPostsCache()` for tests).
- `VOCAB_ROOT = process.env.VOCAB_ROOT ?? 'content'`; `loadVocab(root = VOCAB_ROOT)`.
- `companiesWithCounts(posts, vocab, locale): Array<{ company: Company; count: number }>` (all vocab companies, count of posts with the locale).
- `topicsWithCounts(posts, vocab, locale)`, `tagsWithCounts(posts, vocab, locale)` same shape with `topic`/`tag`.
- `seriesNav(post, vocab, posts): { series?: Series & { key: string }; prev?: PostRecord; next?: PostRecord; index: number; total: number }`.
- `relatedPosts(post, posts, locale, n = 3)`: same topic first (newest), then same company, excluding self, with the locale.
- `featuredPosts(posts, vocabFeatured: string[], locale, n = 3)`: featured.json order, fallback newest.
- `RedirectsSchema = z.array(z.object({ from: z.string().startsWith('/'), to: z.string().startsWith('/'), permanent: z.boolean().default(true) }))`.
- `buildMetadata({ locale, path, title, description, type? }): Metadata` → metadataBase from SITE_URL, title, description, canonical `/${locale}${path}`, languages `{ vi, en, 'x-default': vi path }`, openGraph `{ locale: ll_CC, title, description, url, type }`.

- [ ] Failing tests for every helper on the `good-post` fixture plus temp copies (counts, series nav with 1 and 3 posts, related ordering, featured fallback, redirects schema, buildMetadata shape).
- [ ] Implement; `pnpm test`; commit.

---

### Task 2: Shared list UI and dictionary keys

**Files:** `components/{monogram,post-card,post-list,page-intro,section-heading}.tsx`, `dictionaries/{vi,en}.json`. Test: `tests/ui/components.test.tsx`, key-parity test extended.

**Interfaces:**
- `Monogram({ name, color, size? })`: circle/rounded square with the first letter, `color` as border+text (brand colour allowed here only), `aria-hidden`.
- `PostCard({ post, locale, company, dict })`: `.panel` link to the post; monogram + company name (mono-label), title (Inter 600, 2 lines max), first key number (mono) + label, read time, topic chip (hairline pill).
- `PostList({ posts, locale, vocab, dict, emptyLabel })`: `<ul>` or empty state `<p class="text-muted">`.
- `PageIntro({ title, dek })`, `SectionHeading({ label, title, href? })`.
- Dictionary keys (both files): `home.startHere`, `home.latest`, `home.byCompany`, `home.byTopic`, `home.allPosts`; `companies.title`, `companies.dek`, `companies.postsCount` "{n} bài" / "{n} posts", `companies.empty`, `companies.blog` ("Blog kỹ thuật" / "Engineering blog"); `topics.title`, `topics.dek`, `topics.empty`; `tags.title`, `tags.dek`, `tags.empty`; `series.title`, `series.part` "Phần {i}/{n}" / "Part {i} of {n}", `series.prev`, `series.next`; `related.title` ("Đọc tiếp" / "Read next"); `about.title`, `about.dek`; `notFound.title`, `notFound.body`, `notFound.home`.

- [ ] Failing tests: PostCard markup (monogram colour style, title, key number mono, read time), empty state, key parity.
- [ ] Implement; commit.

---

### Task 3: Home per IA

**Files:** `app/[locale]/page.tsx`. Test: `tests/ui/home.test.tsx` (replace M1 list assertions).

- Order: Header → `<main id="content">` → site name h1 + tagline → "Start here" (3 featured or newest) → "Latest" (6–8 cards) → "By company" (row of monogram + name links with counts) → "By topic" (chips with counts) → link to all posts? (no: latest covers it). Metadata via `buildMetadata` (fixes og:locale).
- [ ] Failing tests: sections present in order; featured fallback; company row links to `/vi/companies/discord`; topic chips; og:locale `vi_VN`.
- [ ] Implement; `pnpm build`; commit.

---

### Task 4: Companies index and company page

**Files:** `app/[locale]/companies/page.tsx`, `app/[locale]/companies/[company]/page.tsx`. Tests: `tests/ui/companies.test.tsx`.

- Index: PageIntro + grid of company cards (monogram, name, count, blog link `rel="noopener"`). Company page: PageIntro (name + "{n} posts" + blog link), PostList; `generateStaticParams` over vocab companies × locales; `notFound()` for unknown; empty state (Review Focus 1).
- [ ] Failing tests incl. empty state in `en` for a company with vi-only posts (temp fixture with en draft).
- [ ] Implement; commit.

---

### Task 5: Topics and tags

**Files:** `app/[locale]/topics/page.tsx`, `app/[locale]/topics/[topic]/page.tsx`, `app/[locale]/tags/page.tsx`, `app/[locale]/tags/[tag]/page.tsx`. Tests: `tests/ui/topics.test.tsx`, `tests/ui/tags.test.tsx`.

- Topic index: five shelves with counts and deks (dictionary `topics.dek.<slug>`). Topic page: PageIntro + PostList. Tags index: all tags with counts (mono counts), alphabetical; tag page: PageIntro + PostList; empty state (Review Focus 2). Static params from vocab.
- [ ] Failing tests; implement; commit.

---

### Task 6: Series pages, prev/next, related posts

**Files:** `app/[locale]/series/[series]/page.tsx`, `components/post/series-nav.tsx`, `components/post/related.tsx`, `app/[locale]/posts/[slug]/page.tsx` (mount both). Tests: `tests/ui/series.test.tsx`, post-page test extended.

- Series page: PageIntro (vi/en title from series.json) + ordered list with "Part i of n". Post page: `SeriesNav` above Sources when in a series (prev/next links, part label); `Related` after Sources (up to 3 cards). Static params from vocab series.
- [ ] Failing tests with a temp `series.json` via `VOCAB_ROOT` (3 posts; middle has prev+next; single-post series shows neither: Review Focus 3); related ordering.
- [ ] Implement; commit.

---

### Task 7: About page

**Files:** `content/pages/about.vi.mdx`, `content/pages/about.en.mdx`, `app/[locale]/about/page.tsx`, `lib/mdx/compile.tsx` (`compilePage(markdown, locale)` variant without post binding). Test: `tests/ui/about.test.tsx`.

- Content (both locales, equivalent): what the site is; the two-layer post anatomy; source policy (primary only, every number referenced); how posts are made (AI-drafted from sources, reviewed and edited by Ryan; pipeline never auto-merges); selection bar; contact/RSS placeholder lines pointing to the feed route (M3). Byline. No numbers that need refs.
- [ ] Failing tests: page renders both locales, contains the AI/process paragraph, `<main id="content">`, metadata.
- [ ] Implement; commit.

---

### Task 8: Redirects, localized 404, metadata sweep, nav

**Files:** `next.config.ts`, `lib/content/redirects.ts`, `app/[locale]/not-found.tsx`, `app/not-found.tsx`, `components/header.tsx` (nav links now resolve; add Tags? no: keep companies/topics/about), `scripts/validate-content.ts` (redirect rule: `from` must not equal an existing static route; `to` must be a route or external URL). Tests: `tests/redirects.test.ts`, `tests/ui/not-found.test.tsx`.

- `redirects()` in next.config reads and validates `content/redirects.json` (empty today) and returns Next redirect objects. Localized 404: Header + title/body/home link from the dictionary; root `app/not-found.tsx` infers locale from the first path segment (default vi) using `headers()`/pathname is unavailable in not-found: render vi with an `en` link.
- [ ] Failing tests (Review Focus 4, 5); implement; `pnpm build`; commit.

---

### Task 9: Done-check, finish review, docs, merge

- [ ] Done-when: `curl` every IA route for both locales on `pnpm start` (home, companies, companies/discord, topics, topics/data, tags, tags/cassandra, series index not required, about, a post) → all 200; `/vi/nope` → 404 with the localized page.
- [ ] Impeccable: run `detect --json app components` once; capture home + companies/discord + topics/data at 1440 and 390 in both themes; finish review (fresh reviewer, degraded role) → one fix batch → verdict; documenter updates DESIGN.md if the system gained components (PostCard, Monogram, chips).
- [ ] ROADMAP M2 done; RUNLOG; merge PR; verify production.
