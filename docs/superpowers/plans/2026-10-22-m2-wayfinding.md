# M2: Wayfinding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every route in the information architecture resolves in both locales: home per the IA, companies index and pages, topic pages, tag pages, series pages with prev/next, about, redirects, localized 404.

**Architecture:** All list pages are static (`generateStaticParams` over vocab × locales) built on the M1 loader (`listPosts`, `listPostsBy`, `hasLocale`) plus the pure helpers in `lib/content/index.ts` (Task 1, done) and one shared card component. The about page is MDX compiled by a page-only variant of the M1 pipeline. Redirects come from `content/redirects.json` into `next.config.ts` through an alias-free module.

**Tech Stack:** unchanged from M1 (Next.js 16, Tailwind v4 tokens, next-mdx-remote, zod, vitest).

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md` §6 (IA), §7 (world), §10 M2. DESIGN.md is the visual authority for new surfaces: Three Borders rule (hairline, strong hairline, callout), One Accent, circle reserved for the avatar, chips = strong hairline + 6px radius, no eyebrow/kicker labels above titles, no nested panels.

Plan revision 2 (2026-10-22): folds in the plan review (localized 404 design, key conflicts, featured.json loading, seriesNav signature, redirects module, dev-mode cache, home duplication, DESIGN.md conformance).

## Global Constraints

- Everything under `/[locale]`; both locales for every page; dictionary keys identical across locales; no hard-coded English on vi pages; `export const dynamicParams = false` on every new dynamic page.
- Visual rules from DESIGN.md: `.panel` cards, hairlines, one accent, no gradients/shadows; company brand colour appears only on the letter of a monogram mark inside a card (PostCard, company card); never as a border, never on the home company row or page intros (those use ink).
- Metadata on every page via `buildMetadata` (Task 1): title `${title} · ${site.name}`, description from the page's dek key, canonical, `alternates.languages` vi/en (+ `x-default` vi), `openGraph` locale `vi_VN`/`en_GB`, title, description, url.
- Static output; loaders read files at build only. `listPosts` and `loadVocab` are memoized per root in production and bypass the cache when `process.env.NODE_ENV !== 'production'` (so `next dev` sees edits).
- `VOCAB_ROOT` env (default `content`) mirrors `CONTENT_ROOT`; `loadVocab` reads companies, topics, tags, series, source-hosts AND featured.
- New UI tests: `// @vitest-environment jsdom`, `vi.mock('server-only')`, `vi.mock('next/navigation')` where client components use it, a temp `VOCAB_ROOT` dir holding all six vocab JSONs, `vi.resetModules()` before dynamic page imports.
- Commit messages end with the session's two attribution lines.

## Review Focus

1. A company with zero posts in one locale renders an empty state in that locale, not a crash or an English string. Test in Task 4.
2. A tag listed in `tags.json` but used by no post still has a page with an empty state. Test in Task 5.
3. A post in a series shows prev/next only within the series order; a single-post series shows neither; a post whose slug is not listed in its series renders no series block and fails validation. Test in Task 6.
4. A redirect `from` that equals an existing static route is rejected by the validator. Test in Task 8.
5. `/vi/does-not-exist` and `/en/does-not-exist` render the styled, localized 404 (root `app/not-found.tsx`) with the header. Test in Task 8 and curl in Task 9.

---

## File structure

```
lib/content/index.ts            (done) companiesWithCounts, topicsWithCounts, tagsWithCounts, seriesNav(post, vocab, posts, locale), relatedPosts, featuredPosts
lib/content/load.ts             memoized listPosts (cache in load.ts; dev bypass)
lib/content/vocab.ts            VOCAB_ROOT; featured.json loaded; dev bypass
lib/content/schema.ts           FeaturedSchema
lib/content/validate.ts         featured slugs exist; series slugs exist both ways (series.json → posts, post → series lists it)
lib/content/redirects.ts        alias-free: local zod schema, readRedirects(path), staticRoutes(posts, vocab), toNextRedirects()
lib/metadata.ts                 (done) buildMetadata
lib/mdx/compile.tsx             + compilePage(markdown, locale): remarkGfm + rehypeSections only
components/monogram.tsx         rounded square 6px, hairline border, letter in `color` (brand) or ink
components/post-card.tsx        .panel link: monogram, company (mono-label), title (700), key number (mono) + label, read time, topic chip
components/post-list.tsx        ul of PostCard or empty-state <p>
components/page-intro.tsx       h1 + dek (no label above)
components/section-heading.tsx  h2 (headline style) with optional right-aligned mono "all →" link on the same row
components/post/series-nav.tsx, components/post/related.tsx
app/[locale]/page.tsx           home per IA
app/[locale]/companies/page.tsx, [company]/page.tsx
app/[locale]/topics/page.tsx, [topic]/page.tsx
app/[locale]/tags/page.tsx, [tag]/page.tsx
app/[locale]/series/[series]/page.tsx
app/[locale]/about/page.tsx + content/pages/about.{vi,en}.mdx
app/not-found.tsx               root, localized (vi default; client switch by pathname), imports globals.css, fonts, ThemeScript, Header twinMissing
next.config.ts                  redirects() from lib/content/redirects.ts (relative import)
components/header.tsx           aria-current="page" on the active nav item
dictionaries/{vi,en}.json       new keys (Task 2)
```

---

### Task 1: Helpers, memoized loader, VOCAB_ROOT, metadata helper (done, commits 8883ac4 + 2604fd1)

Delivered per revision 1; `seriesNav(post, vocab, posts, locale)` returns `{ index: -1, total: 0 }` when the post is not in a series or its slug is unlisted; validator checks the post's slug is listed in its series.

---

### Task 2: Loader follow-ups, shared list UI, dictionary keys

**Files:** `lib/content/load.ts`, `lib/content/vocab.ts`, `lib/content/schema.ts`, `lib/content/validate.ts`, `components/{monogram,post-card,post-list,page-intro,section-heading}.tsx`, `dictionaries/{vi,en}.json`. Tests: `tests/content/load.test.ts` (dev bypass), `tests/content/validate.test.ts` (featured, series both ways), `tests/ui/components.test.tsx`, key-parity test.

**Interfaces:**
- Cache bypass: both caches are skipped when `process.env.NODE_ENV !== 'production'`; tests set `NODE_ENV=production` (vitest sets `test`; use `vi.stubEnv`) for the memoization tests.
- `FeaturedSchema = z.array(Slug)`; `Vocab.featured: string[]`; validator rule `featured` (error when a featured slug has no post). `post.json.featured` is ignored (documented in the spec's §5 note; schema field kept for now).
- Validator rule `enum` (series): every slug in `series.json` exists as a post; every post with `series` is listed in it (second half already added in Task 1 fix round).
- `Monogram({ name, color?, size? })`: rounded square (6px), 1px hairline border, bold letter in `color` (brand hex) when given else ink; `aria-hidden`.
- `PostCard({ post, locale, company, topicLabel, dict })`: `.panel` link; monogram (brand colour letter) + company name (mono-label); title (Inter 700, clamp 2 lines); first key number (mono) + its label; read time; topic chip (strong hairline, 6px radius).
- `PostList({ posts, locale, vocab, dict, emptyLabel })`: `<ul>` or `<p class="text-muted">`.
- `PageIntro({ title, dek })`; `SectionHeading({ title, href?, hrefLabel? })`.
- Dictionary keys (both files): `home.intro` (one sentence), `home.startHere`, `home.latest`, `home.byCompany`, `home.byTopic`, `home.all` ("Tất cả →" / "All →"); `companies.title`, `companies.dek`, `companies.postsOne` "{n} bài" / "{n} post", `companies.postsOther` "{n} bài" / "{n} posts", `companies.empty`, `companies.blog`; `topics.title`, `topics.dek`, `topics.shelf.distributed-systems|data|realtime|infra|reliability` (one-line deks), `topics.empty`; `tags.title`, `tags.dek`, `tags.empty`; `series.title`, `series.part` "Phần {i}/{n}" / "Part {i} of {n}", `series.prev`, `series.next`, `series.index` ("Xem cả loạt bài" / "View the series"); `related.title`; `about.title`, `about.dek`; `notFound.title`, `notFound.body`, `notFound.home`. Helper `plural(dict, n, oneKey, otherKey)` using `Intl.PluralRules(locale)`.

- [ ] Failing tests: dev bypass; featured and series rules; PostCard markup (brand colour on the letter only, title weight, chip classes); empty state; key parity; `plural` with n=1 and n=3 in en.
- [ ] Implement; commit.

---

### Task 3: Home per IA

**Files:** `app/[locale]/page.tsx`. Test: `tests/ui/home.test.tsx` (replace M1 assertions).

- Order: Header → `<main id="content">` → h1 site name + tagline + `home.intro` → "Start here" (featured, fallback 3 newest) → "Latest" (6 newest excluding Start-here slugs; section hidden when empty) → "By company" (row of monogram (ink letter) + name + count, linking to company pages) → "By topic" (chips with counts). Metadata via `buildMetadata`.
- [ ] Failing tests: order; no slug appears in both Start-here and Latest; Latest hidden when all posts are featured; company row links; topic chips; og:locale `vi_VN`; title `Hệ thống lớn`.
- [ ] Implement; `pnpm build`; commit.

---

### Task 4: Companies index and company page

**Files:** `app/[locale]/companies/page.tsx`, `app/[locale]/companies/[company]/page.tsx`. Tests: `tests/ui/companies.test.tsx`.

- Index: PageIntro + grid of company cards: monogram (brand letter), name (the only link, stretched with `after:absolute after:inset-0`), post count via `plural`, blog link OUTSIDE the name link with `rel="noopener noreferrer"` (no nested anchors). Company page: PageIntro (name; dek = count + blog link), PostList with `companies.empty`; `generateStaticParams` over vocab companies × locales; `notFound()` for unknown.
- [ ] Failing tests incl. Review Focus 1 (en page for a company with vi-only posts shows `companies.empty` in English) and "no `<a>` inside `<a>`".
- [ ] Implement; commit.

---

### Task 5: Topics and tags

**Files:** `app/[locale]/topics/page.tsx`, `app/[locale]/topics/[topic]/page.tsx`, `app/[locale]/tags/page.tsx`, `app/[locale]/tags/[tag]/page.tsx`. Tests: `tests/ui/topics.test.tsx`, `tests/ui/tags.test.tsx`.

- Topic index: five shelves (`topics.shelf.<slug>` deks, counts). Topic page: PageIntro + PostList. Tags index: all tags with counts, sorted by the locale label (`localeCompare` with the locale). Tag page: PageIntro + PostList with `tags.empty` (Review Focus 2). Static params from vocab.
- [ ] Failing tests; implement; commit.

---

### Task 6: Series pages, prev/next, related

**Files:** `app/[locale]/series/[series]/page.tsx`, `components/post/series-nav.tsx`, `components/post/related.tsx`, `app/[locale]/posts/[slug]/page.tsx`. Tests: `tests/ui/series.test.tsx`, post-page test extended.

- Series page: PageIntro (title from series.json vi/en) + ordered list "Part i of n". Post page: after `Byline` mount `SeriesNav` ONLY when `seriesNav(...).index >= 0` (part label, link to `/${locale}/series/${key}` with `series.index`, prev/next), then `Related` (up to 3 PostCards; hidden when empty).
- [ ] Failing tests with a temp `VOCAB_ROOT` series.json (3 posts: middle has prev+next; single-post series shows neither; unlisted slug → no block) and related ordering; the Discord fixture renders no Related (none exist).
- [ ] Implement; commit. Note in RUNLOG: the series route is verified by the fixture test only (no real series in content yet).

---

### Task 7: About page

**Files:** `content/pages/about.vi.mdx`, `content/pages/about.en.mdx`, `app/[locale]/about/page.tsx`, `lib/mdx/compile.tsx` (`compilePage(markdown, locale)`: remarkGfm + rehypeSections only; no refs/mermaid). Test: `tests/ui/about.test.tsx`.

- Content (both locales, equivalent): what the site is; the two-layer anatomy; source policy (primary only; every number referenced; the `[S1 §…]` convention shown as literal text); how posts are made (AI-drafted from sources, reviewed and edited by Ryan; pipeline never auto-merges); selection bar; the RSS line is plain text until M3 (no link). Byline. No numbers needing refs. The controller reviews the copy (owner delegation); flagged for Ryan in HANDOFF.
- [ ] Failing tests: both locales render; a literal `[S1]` in the body stays text (no `href="#S1"`); `<main id="content">`; metadata.
- [ ] Implement; commit.

---

### Task 8: Redirects, localized 404, header nav state

**Files:** `lib/content/redirects.ts`, `next.config.ts`, `lib/content/validate.ts` (rule `redirects`), `app/not-found.tsx` (replace), `components/header.tsx`. Tests: `tests/redirects.test.ts`, `tests/ui/not-found.test.tsx`.

- `lib/content/redirects.ts`: relative imports only (no `@/` anywhere in its import chain); local zod schema `{ from: /^\//, to: /^\//, permanent?: boolean = true }`; `readRedirects(file = 'content/redirects.json')`; `staticRoutes(posts, vocab): Set<string>` (home, posts, companies, topics, tags, series, about × locales, plus `/`); `toNextRedirects(list)`; validator rule `redirects`: `from` must not be in `staticRoutes`, `to` must be internal (Review Focus 4).
- `next.config.ts`: `async redirects() { return toNextRedirects(readRedirects()) }` via a relative import; `pnpm build` must pass.
- `app/not-found.tsx` (root): imports `./globals.css`, the same `next/font` setup and `ThemeScript` as the locale layout; renders `<Header locale="vi" twinMissing />`-equivalent plus a small client component that reads `usePathname()` and shows the `en` strings when the first segment is `en` (both dictionaries' `notFound` strings passed as props); links to `/vi` and `/en`. Delete any `app/[locale]/not-found.tsx`.
- Header: `aria-current="page"` on the nav item matching the first path segment after the locale (client-side via `usePathname` in a tiny `NavLink` component, or server-side by passing `section` from each page).
- [ ] Failing tests: redirects schema/default; `from` on a static route rejected; `/vi/does-not-exist` and `/en/does-not-exist` render the root not-found with vi/en strings (mock `next/font/google` and `next/navigation`); nav `aria-current`.
- [ ] Implement; `pnpm build`; commit.

---

### Task 9: Done-check, finish review, docs, merge

- [ ] Done-when: on `pnpm start`, curl in both locales: home, `/companies`, `/companies/discord`, `/topics`, `/topics/data`, `/tags`, `/tags/cassandra`, `/about`, a post → all 200; `/vi/nope` and `/en/nope` → 404 with the localized page (grep for `notFound.title` text). Series: fixture test only (recorded).
- [ ] Impeccable: `detect --json app components` once; capture home, `/companies/discord`, `/topics/data` at 1440 and 390 in both themes; finish review (fresh reviewer, degraded role) → one fix batch → verdict; documenter updates DESIGN.md with the new components (Monogram, PostCard, chip, SectionHeading).
- [ ] ROADMAP M2 done; RUNLOG; merge PR #2; verify production routes.
