# M0 + M1: Foundation and Post Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A validated content repo with three real bilingual fixture posts (M0) and a deployed, static Next.js 16 site that renders the post page to the direction contract in both themes (M1).

**Architecture:** Content lives in `content/posts/<slug>/{post.json,vi.mdx,en.mdx}` and is loaded at build time by `lib/content`, validated by the same zod schemas the CLI validator uses (`prebuild`). MDX compiles server-side with `next-mdx-remote/rsc`; Mermaid blocks are rendered to committed SVGs by a script (run locally and by CI, which commits renders back to the PR branch) and inlined at build. All routes are static via `generateStaticParams` for `vi` and `en`.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, pnpm, Tailwind v4 (`@theme inline` tokens), zod, gray-matter, next-mdx-remote, remark-gfm, rehype-pretty-code + shiki, @mermaid-js/mermaid-cli (local + CI only, never the pipeline), vitest + jsdom + @testing-library/react, @vercel/analytics, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md` (sections 4, 5, 7, 8, 10). Direction contract: `.impeccable/surfaces/app-locale-posts-slug-page-tsx.md`. Chosen first-viewport sketch: `.impeccable/mocks/decision/pinned-neon-navy-carded.html` (its gradient title rule is overridden by the spec's "no gradients": use a solid 1px accent rule).

Plan revision 2 (2026-10-21): folds in the plan review. Rulings are in `docs/decisions.md`.

## Global Constraints

- Next.js 16, React 19, TypeScript strict, pnpm. Fully static output; no runtime file reads; no paid services; Vercel free tier. `lint` is `eslint .`.
- Locales: exactly `vi` and `en`, defined once in `lib/i18n.ts`. Every route under `/[locale]`. `/` redirects to `/vi` with 308.
- Top-layer order, everywhere it is rendered: title, summary, key numbers, TL;DR, "Cho team nhỏ" / "For a small team". Then the deep-read divider, deep layer, Lessons (optional), Sources with the AI line.
- Topics enum: `distributed-systems`, `data`, `realtime`, `infra`, `reliability`. caseType enum: `migration`, `incident`, `design-decision`, `scaling`. Tags 2 to 5 from `tags.json`. Key numbers 2 to 4; every `keyNumbers[].ref` must be a source id.
- Reading time: 200 words/min Vietnamese, 230 words/min English (one constant each). Deep layer 6 to 10 min; whole post 8 to 12 min. Summary at most 160 code points after NFC normalization.
- Sources primary only: company blog host from `companies.json` or a host in `content/source-hosts.json`. `talk` and `paper` sources must have a `locator`. Every source id is referenced at least once (body ref or key-number ref, any locale).
- URL normalization (ruling, spec §5 updated): lowercase scheme and host, strip fragment, remove `utm_*` params, keep other query params sorted, drop trailing slash.
- Assets: 300 KB per image, 2 MB per post folder, no external image URL, alt text on every image in both locales.
- Monospace (JetBrains Mono, subsets latin + latin-ext + vietnamese) only for numbers, references, and short uppercase labels (including the Vietnamese divider "ĐỌC SÂU"); never prose or headings. Inter (subsets latin + vietnamese) for text. Body 16 to 18px, line-height 1.6 to 1.7.
- One accent only (`#6ee7b7` dark; a darkened derivative for light meeting WCAG AA). No gradients, no glow. Panels never nest: inside a section panel, code blocks and diagrams get a hairline border and no panel fill. Company brand colour only on logo marks on cards.
- Both themes complete from tokens; default follows `prefers-color-scheme` (CSS fallback for no-JS); toggle persists to `localStorage` key `theme`; applied before first paint via inline script; `<html suppressHydrationWarning>` with no server-rendered `data-theme`.
- Byline: "Biên tập: Ryan" (vi) / "Ryan" (en). AI line beside Sources: vi "Soạn thảo với AI từ các nguồn trên, Ryan đọc lại và biên tập." en "Drafted with AI from the sources above, reviewed and edited by Ryan."
- Every git commit ends with the two attribution lines from the executing session's system reminder (this session: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LaKJt5FibpbGVQpy31eJ4G`).
- The pipeline never runs Chromium; Mermaid is rendered locally by authors and by CI, which commits renders to the PR branch.
- Fixture posts: real cases, traced numbers only (a number not in the verified list is not used), both locales, committed to the milestone branch; Ryan hand-edits them at gate 1 (no per-post PRs).

## Review Focus

1. A locale file with Windows line endings or a UTF-8 BOM must still parse and validate identically. Test in Task 5.
2. A body that references `[S3]` when only `S1` and `S2` exist must fail with the reference named, not crash; a key number with `ref: "S9"` must fail too. Tests in Task 5.
3. A Mermaid block edited after its SVG was rendered must fail `render-mermaid --check` (stale hash), and the page must fall back to the source code block when the SVG is missing. Tests in Tasks 6 and 13.
4. A source URL on a company's blog host with `utm_` query parameters must pass the primary-host check and normalize to the same key; a YouTube URL must keep `v=`. Tests in Tasks 3 and 5.
5. Theme must not flash: with `localStorage.theme = "light"` and OS dark, the first paint is light; a thrown `localStorage` (private mode) falls back to OS. Test in Task 11.

---

## File structure

```
package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, eslint.config.mjs, proxy.ts, puppeteer.json, mermaid.config.json
.github/workflows/ci.yml, .github/pull_request_template.md
app/
  globals.css                       raw tokens on :root / [data-theme], @theme inline mapping, base typography, code-theme switch
  layout.tsx                        passthrough root
  not-found.tsx                     own <html><body>
  [locale]/layout.tsx               <html lang suppressHydrationWarning> + theme script + fonts + Analytics
  [locale]/page.tsx                 plain post list (M1 only)
  [locale]/posts/[slug]/page.tsx    post page
components/
  theme-script.tsx, theme-toggle.tsx, lang-switch.tsx (client, usePathname), header.tsx, reading-progress.tsx, toc.tsx (client, IntersectionObserver), share-link.tsx (client, copy URL)
  post/post-meta.tsx, tags-row.tsx, key-numbers.tsx, tldr.tsx, small-team.tsx, deep-divider.tsx, lessons.tsx, sources.tsx, byline.tsx, missing-locale-note.tsx
  mdx/mermaid.tsx, mdx/components.tsx
content/                            see spec §5
dictionaries/vi.json, en.json       nested JSON, dotted access
lib/
  i18n.ts                           LOCALES, Locale, isLocale, otherLocale, getDictionary, fmt
  site.ts                           SITE_URL constant (env NEXT_PUBLIC_SITE_URL, default http://localhost:3000)
  content/schema.ts, vocab.ts, reading-time.ts, refs.ts, normalize-url.ts, load.ts, validate.ts, mermaid.ts
  mdx/compile.tsx, mdx/remark-mermaid.ts, mdx/remark-refs.ts, mdx/rehype-sections.ts
scripts/validate-content.ts, scripts/render-mermaid.ts
tests/                              vitest; tests/fixtures/posts/good-post (valid, full length); tests use CONTENT_ROOT
```

Content root: every loader entry point takes `root` defaulting to `process.env.CONTENT_ROOT ?? 'content/posts'`.

---

### Task 1: Scaffold, toolchain, CI skeleton (done, commit 90b8555)

Delivered: Next 16.4.2 / React 19.3 / Tailwind 4.3 / Vitest 5 scaffold, scripts (`lint: eslint .`, `prebuild: pnpm validate`), vitest with react plugin + jsdom deps, locale layout skeleton with `suppressHydrationWarning`, `not-found.tsx`, placeholder validator, CI job `ci`. pnpm build-script approvals live in `pnpm-workspace.yaml` (`allowBuilds`).

---

### Task 2: Vocabulary files and zod schemas

**Files:** `content/{companies,topics,tags,series,featured,redirects,seen,source-hosts}.json`, `lib/i18n.ts` (LOCALES only for now), `lib/content/schema.ts`, `lib/content/vocab.ts`. Test: `tests/content/schema.test.ts`.

**Interfaces:**
- `lib/i18n.ts`: `export const LOCALES = ['vi','en'] as const; export type Locale = typeof LOCALES[number]; export function isLocale(x: string): x is Locale; export function otherLocale(l: Locale): Locale`. (Dictionary functions come in Task 12.)
- `lib/content/schema.ts` imports `LOCALES`. Exports `SourceSchema`, `KeyNumberSchema`, `PostJsonSchema`, `LocaleFrontmatterSchema`, `CompanySchema`, `CompaniesSchema`, `TopicsSchema`, `TagsSchema`, `SeriesSchema`, `SourceHostsSchema`, constants `TOPICS`, `CASE_TYPES`, types `PostJson`, `LocaleFrontmatter`, `Company`, `Source`, `KeyNumber`. Rules: `Source.type ∈ blog|talk|paper`; `locator` required when talk/paper (superRefine, issue path `sources.<i>.locator`); `keyNumbers` 2–4; `tags` 2–5; dates `YYYY-MM-DD`; `updatedAt`, `series` nullable; `summary` max 160 code points after `normalize('NFC')`; `tldr` 3–5; `smallTeam` 2–4; `lessons` optional 2–3; `keyNumberLabels` record; `draft` optional.
- `lib/content/vocab.ts`: `loadVocab(root = 'content'): Vocab` with `Vocab = { companies: Company[]; topics: Topic[]; tags: Tag[]; series: Record<string, Series>; sourceHosts: string[] }`.

- [ ] Write vocabulary files. `companies.json`: only verified entries now: discord (`https://discord.com/blog`, feed `https://discord.com/blog/rss.xml`), cloudflare (`https://blog.cloudflare.com`, feed `https://blog.cloudflare.com/rss/`), netflix (`https://netflixtechblog.com`, feed `https://netflixtechblog.com/feed`); fetch each feed URL with curl and record the HTTP status in the report; a non-200 feed URL is replaced by the one found on the blog's page or set to `null` with a note. `logo` paths `public/logos/<slug>.svg` (may not exist). `topics.json` five entries `{slug, vi, en}`. `tags.json` 30 starter tags `{slug, vi, en}` including cassandra, scylladb, postgres, sharding, kafka, rust, data-center, control-plane, chaos-engineering, microservices, storage, performance, request-coalescing, hot-partition, high-availability, gc-pause, migration-tooling, observability, circuit-breaker, service-discovery. `series.json` `{}`, `featured.json` `[]`, `redirects.json` `[]`, `seen.json` `{}`, `source-hosts.json` `["youtube.com","www.youtube.com","youtu.be","www.infoq.com","infoq.com","www.usenix.org","usenix.org","dl.acm.org","acm.org","arxiv.org","www.arxiv.org","qconferences.com","qconsf.com","qconlondon.com","www.cncf.io"]`.
- [ ] Failing tests: Discord-shaped post.json passes; unknown topic fails; 1 and 5 key numbers fail; talk without locator fails with issue path `sources.0.locator`; summary of 161 code points fails and a 160-code-point NFD Vietnamese string passes; `keyNumberLabels` required.
- [ ] Implement; tests pass; commit.

---

### Task 3: Pure utilities: reading time, references, URL normalization

**Files:** `lib/content/reading-time.ts`, `lib/content/refs.ts`, `lib/content/normalize-url.ts`. Test: `tests/content/utils.test.ts`.

**Interfaces:**
- `WPM: Record<Locale, number> = { vi: 200, en: 230 }`; `countWords(text: string): number` (strip frontmatter and fenced code, split on whitespace); `readingTime(text: string, locale: Locale): { words: number; minutes: number }` (ceil).
- `extractRefs(body: string): Array<{ id: string; locator?: string; raw: string }>` matching `[S1]`, `[S2 §3]`, `[S3 @12:40]`, `[S4 p.7]`.
- `normalizeSourceUrl(url: string): string` per Global Constraints; `hostOf(url: string): string`.

- [ ] Failing tests: vi 1000 words → 5; en 1000 words → 5; fenced code ignored; refs with locators; `normalizeSourceUrl('https://Discord.com/blog/x/?utm_source=a#top') === 'https://discord.com/blog/x'`; `normalizeSourceUrl('https://www.youtube.com/watch?v=CZ3wIuvmHeM&utm_medium=x') === 'https://www.youtube.com/watch?v=CZ3wIuvmHeM'`; `hostOf`.
- [ ] Implement; pass; commit.

---

### Task 4: Post loader

**Files:** `lib/content/load.ts`. Test: `tests/content/load.test.ts`; fixture `tests/fixtures/posts/good-post/{post.json,vi.mdx,en.mdx}`.

**Interfaces:**
- `type RawLocale = { file: string; frontmatter: unknown; body: string; draft: boolean }`
- `type RawPost = { slug: string; dir: string; meta: unknown; locales: Partial<Record<Locale, RawLocale>> }`
- `readRawPost(dir: string): RawPost` (strips BOM, CRLF → LF, NFC-normalizes; gray-matter frontmatter; never throws on schema problems).
- `type LocaleDoc = { frontmatter: LocaleFrontmatter; body: string; readingTime: { deep: number; whole: number }; refs: Ref[]; mermaidBlocks: string[] }`
- `type PostRecord = { slug: string; dir: string; meta: PostJson; locales: Partial<Record<Locale, LocaleDoc>> }`
- `parsePost(raw: RawPost): { post?: PostRecord; issues: ZodIssueWithFile[] }` (`ZodIssueWithFile = ZodIssue & { file: string }`); drafts stay in the raw post but are excluded from `PostRecord.locales`.
- `CONTENT_ROOT = process.env.CONTENT_ROOT ?? 'content/posts'`; `listPosts(root = CONTENT_ROOT): PostRecord[]` (throws if any issues; `publishedAt` desc), `getPost(root, slug)`, `hasLocale(p, l)`, `listPostsBy(root, filter: { company?; topic?; tag?; series? })`.
- Whole reading time = deep words + top-layer words (summary, tldr, smallTeam, lessons, keyNumberLabels) at locale WPM.

- [ ] Write `good-post` as a full-length valid post (company discord, topic data, caseType migration, 3 key numbers all `ref: S1`, one blog source, vi deep layer ≥1500 words and en deep layer ≥1600 words of real sentences, one ```mermaid block each, `[S1]` refs, summary ≤160). Test asserts both locales' `readingTime.deep` within 6–10 and `whole` within 8–12.
- [ ] Failing tests: readRawPost on a CRLF+BOM copy equals the LF copy; parsePost gives both locales, `mermaidBlocks.length === 1`, refs include S1; draft `en.mdx` copy → `hasLocale(p,'en') === false` while raw lists it `draft: true`; `listPosts` 1; `listPostsBy({company:'discord'})` 1, `{topic:'infra'}` 0.
- [ ] Implement; pass; commit.

---

### Task 5: Validator rules and CLI

**Files:** `lib/content/validate.ts`, `scripts/validate-content.ts` (replace). Test: `tests/content/validate.test.ts` (temp copies of `good-post`, mutated per rule).

**Interfaces:**
- `type Finding = { level: 'error'|'warn'; rule: string; slug: string; file?: string; message: string }`
- `zodIssuesToFindings(issues, slug): Finding[]`: path `topic|caseType|tags|company|series` → `enum`, `sources.*.locator` → `locator`, `summary` → `summary-length`, else `schema`.
- `validatePost(raw: RawPost, vocab: Vocab, opts: { today: string }): Finding[]`: zod mapping first; on success the rules `labels`, `refs` (body refs and `keyNumbers[].ref` resolve; every source id referenced somewhere), `source-host`, `image-external`, `asset-size`, `alt-text`, `mermaid-count`, `reading-time`, `locales` (both present unless `draft`); warnings `published-at` (>3 days before `today`), `lessons-omitted`.
- `validateAll(root, vocab, opts): { findings: Finding[]; ok: boolean }`. CLI prints grouped findings, exits 1 on any error; default root `content/posts`.

- [ ] Failing tests, one per rule id, plus Review Focus 1, 2 (`[S3]` and `ref:"S9"`, message names the id), 4 (utm URL passes `source-host`); `good-post` zero errors; deep layer cut to 300 words → `reading-time`; `publishedAt` 4 days before today → warn.
- [ ] Implement; `pnpm validate` on empty `content/posts` prints ok; commit.

---

### Task 6: Mermaid render script

**Files:** `lib/content/mermaid.ts`, `scripts/render-mermaid.ts`, `puppeteer.json` (`{"args":["--no-sandbox","--disable-setuid-sandbox"]}`), `mermaid.config.json`. Test: `tests/content/mermaid.test.ts` (temp copies only).

**Interfaces:**
- `MERMAID_THEME = { theme: 'base', themeVariables: { primaryColor: '#010101', primaryTextColor: '#020202', primaryBorderColor: '#030303', lineColor: '#030303', secondaryColor: '#040404', tertiaryColor: '#040404', background: '#050505', fontFamily: 'Inter, Arial, sans-serif' } }`; `SENTINELS = { '#010101': 'var(--panel)', '#020202': 'var(--ink)', '#030303': 'var(--hairline-strong)', '#040404': 'var(--panel-2)', '#050505': 'transparent' }`.
- `hashBlock(src)` = sha256(`src + JSON.stringify(MERMAID_THEME)`)[0:12]; `svgName(locale, index)` = `${locale}-diagram-${index+1}.svg`; `readSvgHash(svg)` reads `<!-- mermaid:<hash> -->` on line 1; `postProcessSvg(svg, { id })` replaces sentinels with variables and sets the root `id`; `planRenders(raw: RawPost): Array<{ locale; index; src; file; status: 'missing'|'stale'|'fresh' }>`.
- CLI `tsx scripts/render-mermaid.ts [--check] [root=content/posts]`: for each missing/stale, `mmdc -i tmp.mmd -o out.svg -c mermaid.config.json -p puppeteer.json --svgId <slug>-<locale>-<n> --backgroundColor transparent`, post-process, prepend hash comment. `--check` lists missing/stale, exits 1, never launches Chrome.

- [ ] Failing tests: hash stable and changes with theme; planRenders missing → fresh (after writing an SVG with the right hash) → stale (after editing the block); `postProcessSvg` replaces `#010101` with `var(--panel)`.
- [ ] Implement; `pnpm render-mermaid --check tests/fixtures/posts` exits 1 naming the missing file; one real local render on a temp copy of `good-post` (`pnpm exec puppeteer browsers install chrome` if needed; report output); commit.

---

### Task 7: CI Mermaid render-and-commit, PR template, repo setup doc

**Files:** `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `docs/repo-setup.md`.

- [ ] CI after install: `pnpm exec puppeteer browsers install chrome`; `pnpm render-mermaid`; if `git status --porcelain content/posts` is non-empty and the event is a same-repo `pull_request`, commit `chore(mermaid): render diagrams` as `github-actions[bot]` and push to the PR branch (`permissions: contents: write`; checkout `ref: ${{ github.head_ref }}`, `fetch-depth: 0`); then `pnpm render-mermaid --check`, test, validate, build.
- [ ] PR template: spec §4 review checklist as checkboxes, "Sources" section, "Lessons omitted? state why" line.
- [ ] `docs/repo-setup.md`: public personal repo, branch protection requiring `ci`, Vercel connect, labels `pipeline`, `content`, `needs-source`, `clean`, Milestones M0–M8, Project fields. Marked as executed by the controller with `gh` (Task 7b); Vercel link via CLI if authenticated, else needs-human.
- [ ] Commit.

### Task 7b (controller): create the GitHub repo, push, open draft PR

- [ ] `gh repo create engineering-reader --public --source . --push`; branch protection on `main` requiring check `ci` via `gh api`; labels and milestones; record the URL in `docs/decisions.md`; open the M0+M1 PR as draft from `m0-m1/foundation`.

---

### Task 8: Fixture post 1, Discord (migration, data, Mermaid)

**Files:** `content/posts/discord-cassandra-to-scylladb/{post.json,vi.mdx,en.mdx,vi-diagram-1.svg,en-diagram-1.svg}`.

Source (verified 2026-10-21): S1 blog, "How Discord Stores Trillions of Messages", Bo Ingram, 2023-03-06, `https://discord.com/blog/how-discord-stores-trillions-of-messages`. Verified numbers (use only these): 12 Cassandra nodes in 2017; 177 Cassandra nodes early 2022; 72 ScyllaDB nodes after; historical read p99 40–125 ms → 15 ms; insert p99 5–70 ms → 5 ms; migration estimated 3 months with Spark, done in about 9 days after rewriting the migrator in Rust; up to 3.2 million rows/s; cutover May 2022. "Trillions" is a word in the title, not a number: do not write "1T".

- [ ] `post.json`: topic `data`, caseType `migration`, tags `[cassandra, scylladb, rust, hot-partition, request-coalescing]`, `publishedAt` today, `sourcePublishedAt` 2023-03-06, `author: ryan`, `reviewedBy: ryan`, keyNumbers `nodes` ("177 → 72", S1), `latency` ("p99 40–125 → 15 ms", S1), `migration` (value "9 days", estimate in the label, S1); S1 with `accessedAt` today, `locator` null.
- [ ] Draft `vi.mdx`: frontmatter per spec §4; deep layer 1500–2000 words in story H2s; every number with inline `[S1 §<heading>]`; one ```mermaid flowchart (gateway → data service (Rust, request coalescing) → ScyllaDB) with Vietnamese labels. Technical terms stay English.
- [ ] Draft `en.mdx` as a full equivalent: deep layer 1500–2300 words, same H2 count, one Mermaid block with English labels, same refs.
- [ ] `pnpm validate` zero errors (check both locales' reading times); `pnpm render-mermaid`; `--check` fresh; commit including SVGs.

---

### Task 9: Fixture post 2, Cloudflare (incident, reliability, Lessons omitted)

**Files:** `content/posts/cloudflare-control-plane-outage-2023/{post.json,vi.mdx,en.mdx}` (+ SVGs if a diagram is used).

Source (verified): S1 blog, "Post mortem on the Cloudflare Control Plane and Analytics Outage", Matthew Prince, 2023-11-04, `https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/`. Verified numbers: outage 2023-11-02 11:43 UTC to 2023-11-04 04:25 UTC; three data centers near Hillsboro; Cloudflare about 10% of PDX-04 capacity; UPS batteries lasted about 4 minutes against a 10-minute design.

- [ ] `post.json`: topic `reliability`, caseType `incident`, tags `[data-center, control-plane, high-availability, chaos-engineering]`, keyNumbers `duration` ("≈41 h", S1), `ups` ("4 / 10 min", S1), `share` ("≈10%", S1), `sourcePublishedAt` 2023-11-04.
- [ ] Draft both locales with no `lessons` key; `smallTeam` carries the weight: a five-person team has no second data center; what this says about single points of failure in their own control plane (one admin box, one CI runner, one DNS account). Same word targets as Task 8.
- [ ] `pnpm validate`: zero errors, one `lessons-omitted` warning. Commit. Gate-1 handoff states: "Lessons omitted deliberately: the source lists its own under 'Lessons and Remediation'."

---

### Task 10: Fixture post 3, Netflix talk (design-decision, reliability, timestamp locators)

**Files:** `content/posts/netflix-microservices-mastering-chaos/{post.json,vi.mdx,en.mdx}`.

Source (verified 2026-10-21): S1 talk, "Mastering Chaos - A Netflix Guide to Microservices", Josh Evans, QCon San Francisco, November 2016, `https://www.youtube.com/watch?v=CZ3wIuvmHeM`; `publishedAt` = the YouTube upload date read from the page (record it); `locator` = `@mm:ss` of the headline number. Only one source (InfoQ page dropped: it blocks fetches and would need its own reference).

- [ ] Read the transcript (`yt-dlp --write-auto-sub --skip-download` or the YouTube transcript panel); collect 2–4 concrete numbers with timestamps; every number in the body carries `[S1 @mm:ss]`.
- [ ] `post.json`: caseType `design-decision`, topic `reliability`, tags from `[microservices, chaos-engineering, high-availability, circuit-breaker, service-discovery]`, `sourcePublishedAt` = upload date.
- [ ] Draft both locales with lessons present; same word targets.
- [ ] `pnpm validate` zero errors (proves talk-host allowlist and locator rules). Commit.

M0 done when: `pnpm build` passes on the three posts, and fails when a temp copy of one post has a key-number ref changed to `S9` (verify once; do not commit the broken copy). Then gate 1: write `docs/HANDOFF.md`, stop.

---

### Task 11: Tokens, themes, theme script and toggle

**Files:** `app/globals.css`, `app/[locale]/layout.tsx`, `components/theme-script.tsx`, `components/theme-toggle.tsx`. Test: `tests/ui/theme-script.test.ts` (`// @vitest-environment jsdom`).

**Interfaces:**
- Raw variables on `:root` (dark values, spec §7) and `:root[data-theme="light"]` (light values, builder-derived, each text/ground pair ≥ 4.5:1, documented in a comment), plus `@media (prefers-color-scheme: light) { :root:not([data-theme]) { …light } }` for no-JS: `--ground`, `--grid`, `--ink`, `--ink-2`, `--muted`, `--hairline`, `--hairline-strong`, `--panel`, `--panel-2`, `--accent`, `--accent-ink`, `--radius`.
- `@theme inline { --color-ground: var(--ground); --color-ink: var(--ink); … --font-sans: var(--font-inter); --font-mono: var(--font-jetbrains); --radius-panel: var(--radius); }`.
- Code theme switch: `html[data-theme="dark"] [data-rehype-pretty-code-figure] :is(code, span) { color: var(--shiki-dark) }` and the light equivalent; every theme selector scoped to `html[data-theme=…]`.
- Utility classes `.panel`, `.hairline`, `.callout`, `.mono-label`; body grid background 40px using `--grid`.
- Fonts in the locale layout: `Inter({ subsets: ['latin','vietnamese'], variable: '--font-inter', display: 'swap' })`, `JetBrains_Mono({ subsets: ['latin','latin-ext','vietnamese'], variable: '--font-jetbrains', display: 'swap' })`.
- `themeScript(): string` (try/catch around `localStorage`; stored `light|dark` wins; else `matchMedia('(prefers-color-scheme: dark)')`; sets `document.documentElement.dataset.theme`), rendered via `<script dangerouslySetInnerHTML>` in `<head>`.
- `ThemeToggle({ ariaLabel }: { ariaLabel: string })` (client): toggles `data-theme`, writes `localStorage.theme`, no transition.

- [ ] Failing tests: stored light + OS dark → `light`; nothing stored + OS dark → `dark`; `localStorage` getter throws + OS light → `light`.
- [ ] Implement; manual check in `pnpm dev` of both themes and reload without flash; commit.

---

### Task 12: Locale shell: dictionaries, header, language switch, root redirect

**Files:** `dictionaries/vi.json`, `dictionaries/en.json`, `lib/i18n.ts` (add `getDictionary`, `fmt`), `lib/site.ts`, `components/lang-switch.tsx`, `components/header.tsx`, `proxy.ts`, `app/[locale]/page.tsx` (render Header). Test: `tests/ui/i18n.test.ts`.

**Interfaces:**
- Dictionaries (nested JSON, identical key sets): `site.name` ("Hệ thống lớn" both), `site.tagline`, `nav.companies`, `nav.topics`, `nav.about`, `post.label` ("BÀI VIẾT" / "ARTICLE"), `post.byline` ("Biên tập: Ryan" / "Ryan"), `post.readMinutes` ("{n} phút đọc" / "{n} min read"), `post.keyNumbers`, `post.tldr`, `post.smallTeam` ("Cho team nhỏ" / "For a small team"), `post.deepRead` ("ĐỌC SÂU · {n} PHÚT" / "DEEP READ · {n} MIN"), `post.lessons`, `post.sources`, `post.aiLine` (exact strings from Global Constraints), `post.missingLocale` ("Bài này chưa có bản tiếng Anh." / "This post is not yet available in Vietnamese."), `post.toc` ("Mục lục" / "Contents"), `post.share` ("Sao chép link" / "Copy link"), `post.breadcrumbHome` ("Trang chủ" / "Home"), `caseType.migration|incident|design-decision|scaling`, `theme.toggle`, `lang.switch`.
- `getDictionary(l): Dictionary` (static imports; type from `vi.json`), `fmt(s, vars): string` replacing `{n}`.
- `lib/site.ts`: `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`.
- `LangSwitch({ locale, twinMissing }: { locale: Locale; twinMissing?: boolean })` (client): `usePathname()`; href = pathname with the first segment replaced by `otherLocale(locale)`, or `/${otherLocale(locale)}` when `twinMissing`.
- `Header({ locale, twinMissing })`: brand → `/${locale}`, nav links (companies, topics, about: may 404 until M2), `LangSwitch`, `ThemeToggle`. Every page renders `<Header>` itself (ruling: not the layout).
- `proxy.ts`: `export function proxy(req: NextRequest)`: pathname `/` → `NextResponse.redirect(new URL('/vi', req.url), 308)`; `export const config = { matcher: ['/'] }`.

- [ ] Failing tests: key sets identical; `fmt('{n} phút', {n: 3}) === '3 phút'`; `otherLocale`.
- [ ] Implement. Verify redirect: `pnpm build && (pnpm start &) && sleep 3 && curl -sI localhost:3000/ | head -3` → `308`, `location: /vi`; kill the server.
- [ ] Commit.

---

### Task 13: MDX compile pipeline and components

**Files:** `lib/mdx/compile.tsx`, `lib/mdx/remark-mermaid.ts`, `lib/mdx/remark-refs.ts`, `lib/mdx/rehype-sections.ts`, `components/mdx/components.tsx`, `components/mdx/mermaid.tsx`. Test: `tests/mdx/compile.test.tsx` (temp copy of `good-post`).

**Interfaces:**
- `compilePostBody(post: PostRecord, locale: Locale): Promise<{ content: React.ReactElement; headings: Array<{ id: string; text: string }> }>` via `compileMDX` from `next-mdx-remote/rsc`, `remarkPlugins: [remarkGfm, remarkRefs, [remarkMermaid, { post, locale }]]`, `rehypePlugins: [[rehypePrettyCode, { theme: { light: 'github-light', dark: 'github-dark-dimmed' }, keepBackground: false }], rehypeSections]`.
- `remarkMermaid`: replaces the i-th ```mermaid code node with `<Mermaid index={i} />` (mdxJsxFlowElement).
- `remarkRefs`: text `[S1 §2]` → `<Ref id="S1" locator="§2" />` rendered as `<a href="#S1" class="ref">[S1 §2]</a>`.
- `rehypeSections`: groups each `h2` and its following siblings (until the next `h2`) into `<section class="panel" id={slug(h2)}>`; collects headings; nothing before the first `h2` is wrapped.
- `Mermaid({ index })` (server): reads `svgName(locale, index)` from `post.dir`; if present and `readSvgHash === hashBlock(src)`, inlines the SVG in `<figure class="diagram">`; else `<pre class="diagram-fallback"><code class="language-mermaid">src</code></pre>`.
- Components: `a` (external → `rel="noopener noreferrer" target="_blank"`), inline `code` (mono), `pre` (hairline border, no panel fill), `table` wrapped in `.table-scroll`. No `img` component in M1 (deferred; no fixture has images).

- [ ] Failing tests: output contains `href="#S1"`; no SVG → contains `language-mermaid`; fresh SVG in the temp copy → contains `<svg`; two H2s → two `<section class="panel"`; headings length 2.
- [ ] Implement; pass; commit.

---

### Task 14: Post page to the direction contract

**Files:** `app/[locale]/posts/[slug]/page.tsx`, `components/post/*.tsx` (post-meta, tags-row, key-numbers, tldr, small-team, deep-divider, lessons, sources, byline, missing-locale-note), `components/toc.tsx`, `components/share-link.tsx`, `components/reading-progress.tsx`. Test: `tests/ui/post-page.test.tsx` (`// @vitest-environment jsdom`; `process.env.CONTENT_ROOT = 'tests/fixtures/posts'`; `const el = await Page({ params: Promise.resolve({ locale: 'vi', slug: 'good-post' }) })`; `renderToStaticMarkup(el)`; assertions on the HTML string).

**Interfaces:**
- `generateStaticParams()` from `listPosts()` for every `{locale, slug}` with `hasLocale`; `dynamicParams = false`.
- `generateMetadata`: `metadataBase: new URL(SITE_URL)`, `title`, `description` = summary, `alternates.canonical`, `alternates.languages` with keys for existing locales only and `x-default` only when `vi` exists, `openGraph.locale`.
- Order: `Header`; breadcrumb (`post.breadcrumbHome` → `/${locale}`, company name → `/${locale}/companies/${company}`); `TagsRow` (mono `post.label` + pills: company, topic, caseType); `<h1>`; solid 1px accent rule; summary (dek); `PostMeta` (monogram avatar "R", byline, publishedAt, whole minutes, mono); `KeyNumbers` (2–4 muted cells: mono value, label, `<a href="#Sx">`); `Tldr` panel; `SmallTeam` callout (accent left border, the only accent-bordered block); `DeepDivider` (`post.deepRead` with deep minutes); phone `Toc` as `<details>`; compiled body (sections as panels); `Lessons` if present; `Sources` (`<ol>`, each `<li id="S1">`: type label, title link, authors, publishedAt, locator, accessedAt) + AI line; `Byline`.
- Desktop (`lg:`): 720px column + 260px sticky rail with author card, `Toc` (client, IntersectionObserver marks the active heading with the accent), `ShareLink` (client, copies `location.href`, label `post.share`).
- `MissingLocaleNote` and `Header twinMissing` when `!hasLocale(post, otherLocale(locale))`.
- `ReadingProgress` (client): fixed 2px bar, width = scroll fraction via `requestAnimationFrame`, no stored state.

- [ ] Failing tests: document order h1 < summary < key-number values < tldr items < small-team items < deep-read label < first `<section class="panel"`; `id="S1"` present; AI line text; no Lessons heading when `lessons` absent; en draft copy → Vietnamese page contains `post.missingLocale`.
- [ ] Implement, matching the sketch at 390 wide (arrangement, palette, type, density; solid rule instead of the gradient) and the contract at 1440.
- [ ] `pnpm test`, `pnpm build` (six post routes static); commit.

---

### Task 15: Home as a plain list (M1 stand-in) and Analytics

**Files:** `app/[locale]/page.tsx`, `app/[locale]/layout.tsx`. Test: `tests/ui/home.test.tsx` (same invocation pattern as Task 14).

- [ ] Failing test: `vi` home lists the fixture titles in `publishedAt` desc order with company name, first key number (mono) and whole minutes; tagline present.
- [ ] Implement; add `<Analytics />` from `@vercel/analytics/next` to the locale layout; `pnpm build`; commit.

---

### Task 16: Deploy and finish review (M1 exit)

- [ ] Vercel: link and deploy with the `vercel` CLI if authenticated (`vercel whoami`); else open a `needs-human` issue with the exact steps and continue. Confirm the production URL serves both locales of the Discord post. Set `NEXT_PUBLIC_SITE_URL` in Vercel env and `.env.example`.
- [ ] Capture `desktop.png` (1440 full page) and `mobile.png` (390) of the Discord post in both themes into `.impeccable/review/`; run `impeccable detect --json app components` once; fix mechanical findings.
- [ ] Spawn the Impeccable finish reviewer with the request, the direction contract, the sketch, the screenshots, the craft references (Linear, Stripe, fly.io) and the detector output. One fix batch; recapture; verdict.
- [ ] Spawn the Impeccable documenter for `DESIGN.md` and `.impeccable/design.json`.
- [ ] Commit; mark M1 in `ROADMAP.md` when the disposition is `ship` and three posts are live; merge the PR.
