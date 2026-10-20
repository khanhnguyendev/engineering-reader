# M0 + M1: Foundation and Post Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A validated content repo with three real bilingual fixture posts (M0) and a deployed, static Next.js 16 site that renders the post page to the direction contract in both themes (M1).

**Architecture:** Content lives in `content/posts/<slug>/{post.json,vi.mdx,en.mdx}` and is loaded at build time by `lib/content`, validated by the same zod schemas the CLI validator uses (`prebuild`). MDX compiles server-side with `next-mdx-remote/rsc`; Mermaid blocks are rendered to committed SVGs by a CI script and inlined at build. All routes are static via `generateStaticParams` for `vi` and `en`.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, pnpm, Tailwind v4 (`@theme` tokens), zod, gray-matter, next-mdx-remote, remark-gfm, rehype-pretty-code + shiki, @mermaid-js/mermaid-cli (CI only), vitest, @vercel/analytics, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md` (sections 4, 5, 7, 8, 10). Direction contract: `.impeccable/surfaces/app-locale-posts-slug-page-tsx.md`. Chosen first-viewport sketch: `.impeccable/mocks/decision/pinned-neon-navy-carded.html`.

## Global Constraints

- Next.js 16, React 19, TypeScript strict, pnpm. Fully static output; no runtime file reads; no paid services; Vercel free tier.
- Locales: exactly `vi` and `en`. Every route under `/[locale]`. `/` redirects to `/vi` with 308.
- Top-layer order, everywhere it is rendered: title, summary, key numbers, TL;DR, "Cho team nhỏ" / "For a small team". Then the deep-read divider, deep layer, Lessons (optional), Sources with the AI line.
- Topics enum: `distributed-systems`, `data`, `realtime`, `infra`, `reliability`. caseType enum: `migration`, `incident`, `design-decision`, `scaling`. Tags 2 to 5 from `tags.json`. Key numbers 2 to 4.
- Reading time: 200 words/min Vietnamese, 230 words/min English (one constant each). Deep layer 6 to 10 min; whole post 8 to 12 min. Summary at most 160 characters.
- Sources primary only: company blog host from `companies.json` or a host in `content/source-hosts.json`. `talk` and `paper` sources must have a `locator`.
- Assets: 300 KB per image, 2 MB per post folder, no external image URL, alt text on every image in both locales.
- Monospace (JetBrains Mono) only for numbers, references, ASCII labels; never Vietnamese prose or headings. Inter with the Vietnamese subset for text. Body 16 to 18px, line-height 1.6 to 1.7.
- One accent only (`#6ee7b7` dark; a darkened derivative for light meeting WCAG AA). No gradients, no glow, no nested panels. Company brand colour only on logo marks on cards.
- Both themes complete from tokens; default follows `prefers-color-scheme`; toggle persists to `localStorage` key `theme`; applied before first paint.
- Byline: "Biên tập: Ryan" (vi) / "Ryan" (en). AI line beside Sources: vi "Soạn thảo với AI từ các nguồn trên, Ryan đọc lại và biên tập." en "Drafted with AI from the sources above, reviewed and edited by Ryan."
- Every git commit ends with the two attribution lines given in the session reminder (`Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and the `Claude-Session:` line). Shown once in Task 1; implied in every later commit step.
- The pipeline never runs Chromium; only CI renders Mermaid.

## Review Focus

1. A locale file with Windows line endings or a UTF-8 BOM must still parse and validate identically (Vietnamese authors paste from many editors). Test in Task 5.
2. A body that references `[S3]` when only `S1` and `S2` exist must fail with the reference named, not crash. Test in Task 5.
3. A Mermaid block edited after its SVG was rendered must fail `render-mermaid --check` (stale hash), and the page must fall back to the source code block when the SVG is missing. Tests in Tasks 6 and 11.
4. A source URL on a company's blog host but with `utm_` query parameters must still pass the primary-host check and normalize to the same `seen.json` key. Tests in Tasks 3 and 5.
5. Theme must not flash: with `localStorage.theme = "light"` and OS dark, the first paint is light. Test in Task 9 (DOM test of the inline script).

---

## File structure

```
package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, proxy.ts
.github/workflows/ci.yml
.gitignore
app/
  globals.css                       tokens for both themes, base typography
  layout.tsx                        passthrough root (no html element)
  [locale]/layout.tsx               <html lang data-theme> + theme script + fonts + Header
  [locale]/page.tsx                 plain post list (M1 only; M2 replaces)
  [locale]/posts/[slug]/page.tsx    post page
components/
  theme-script.tsx                  inline before-paint script
  theme-toggle.tsx                  client
  header.tsx                        brand, nav, locale switch, theme toggle
  reading-progress.tsx              client, scroll only
  post/key-numbers.tsx, tldr.tsx, small-team.tsx, deep-divider.tsx, lessons.tsx, sources.tsx, byline.tsx, post-meta.tsx
  mdx/mermaid.tsx, mdx/components.tsx
content/                            see spec §5
dictionaries/vi.json, en.json
lib/
  i18n.ts                           Locale type, LOCALES, dictionary loader
  content/schema.ts                 zod schemas + inferred types
  content/vocab.ts                  loads companies/topics/tags/series/source-hosts
  content/reading-time.ts
  content/refs.ts
  content/normalize-url.ts
  content/load.ts                   readPostFolder, listPosts, getPost
  content/validate.ts               rules → ValidationReport
  mdx/compile.tsx                   compileMDX wrapper with plugins
scripts/validate-content.ts, scripts/render-mermaid.ts
tests/                              vitest; tests/fixtures/ holds good and broken post folders
```

---

### Task 1: Scaffold, toolchain, CI skeleton

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `app/layout.tsx`, `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `app/globals.css`, `.github/workflows/ci.yml`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: scripts `pnpm dev|build|test|validate|render-mermaid`; `prebuild` runs `validate`. `app/[locale]/layout.tsx` with `generateStaticParams` returning `[{locale:'vi'},{locale:'en'}]`.

- [ ] **Step 1: Create the Next 16 app**

Run: `cd /Users/ryan/ws/5.vercel/engineering-reader && pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --use-pnpm --no-turbopack-prompt` (accept defaults if prompted; keep App Router, Tailwind v4, no `src/`). Then `git init -b main` if create-next-app did not.

- [ ] **Step 2: Add dependencies**

Run: `pnpm add zod gray-matter next-mdx-remote remark-gfm rehype-pretty-code shiki @vercel/analytics` and `pnpm add -D vitest @vitest/coverage-v8 tsx @types/node @mermaid-js/mermaid-cli`.

- [ ] **Step 3: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "prebuild": "pnpm validate",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "validate": "tsx scripts/validate-content.ts",
  "render-mermaid": "tsx scripts/render-mermaid.ts"
}
```

- [ ] **Step 4: Write `vitest.config.ts`** with `test.include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx']`, `environment: 'node'`, alias `@` to repo root.

- [ ] **Step 5: Write the smoke test** `tests/smoke.test.ts`: `expect(1 + 1).toBe(2)`.

- [ ] **Step 6: Run `pnpm test`**. Expected: 1 passed.

- [ ] **Step 7: Replace the generated app with the locale skeleton**

`app/layout.tsx`: `export default function RootLayout({children}) { return children }`.
`app/[locale]/layout.tsx`: `export const dynamicParams = false; export function generateStaticParams() { return [{locale:'vi'},{locale:'en'}] }`; renders `<html lang={locale}><body>{children}</body></html>` (params is a Promise in Next 16: `const {locale} = await params`).
`app/[locale]/page.tsx`: renders `<h1>Hệ thống lớn</h1>`.
`app/globals.css`: `@import "tailwindcss";` only for now.

- [ ] **Step 8: Write placeholder `scripts/validate-content.ts`** that prints `validate: no rules yet` and exits 0, so `pnpm build` runs.

- [ ] **Step 9: Run `pnpm build`**. Expected: build succeeds, output lists `/vi` and `/en` as static.

- [ ] **Step 10: Write `.github/workflows/ci.yml`**: on `pull_request` and `push` to `main`; ubuntu-latest; pnpm via `pnpm/action-setup`; Node 22; steps `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm validate`, `pnpm build`. (Task 7 adds the Mermaid step.)

- [ ] **Step 11: `.gitignore`** adds `.superpowers/`, `.impeccable/review/`, `.next/`, `node_modules/`, `.env*`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next 16 app, toolchain, CI skeleton

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LaKJt5FibpbGVQpy31eJ4G"
```

---

### Task 2: Vocabulary files and zod schemas

**Files:**
- Create: `content/companies.json`, `content/topics.json`, `content/tags.json`, `content/series.json`, `content/featured.json`, `content/redirects.json`, `content/seen.json`, `content/source-hosts.json`, `lib/content/schema.ts`, `lib/content/vocab.ts`
- Test: `tests/content/schema.test.ts`

**Interfaces:**
- Produces (`lib/content/schema.ts`): `PostJsonSchema`, `LocaleFrontmatterSchema`, `CompaniesSchema`, `TopicsSchema`, `TagsSchema`, `SeriesSchema`, `SourceHostsSchema`, and types `PostJson`, `LocaleFrontmatter`, `Company`, `Source`, `KeyNumber`. Constants `TOPICS`, `CASE_TYPES`, `LOCALES = ['vi','en'] as const`, `Locale`.
- Produces (`lib/content/vocab.ts`): `loadVocab(root = 'content'): Vocab` where `Vocab = { companies: Company[]; topics: Topic[]; tags: Tag[]; series: Record<string, Series>; sourceHosts: string[] }`.

- [ ] **Step 1: Write the vocabulary files**

`companies.json`: array of `{slug,name,blogUrl,feedUrl,brandColor,logo}`. Seed with at least: discord, cloudflare, netflix, uber, meta, stripe, grab, figma, shopify, airbnb, linkedin, pinterest, dropbox, slack, github, spotify, twitter, instagram, doordash, canva (use each company's real engineering blog URL and RSS URL; `logo` is `public/logos/<slug>.svg` and may not exist yet). `topics.json`: the five topics with `{slug, vi, en}`. `tags.json`: 30 starter tags with `{slug, vi, en}` including cassandra, scylladb, postgres, sharding, kafka, rust, data-center, control-plane, chaos-engineering, microservices, storage, performance, request-coalescing, hot-partition, high-availability. `series.json`: `{}`. `featured.json`: `[]`. `redirects.json`: `[]`. `seen.json`: `{}`. `source-hosts.json`: `["youtube.com","www.youtube.com","youtu.be","www.infoq.com","infoq.com","www.usenix.org","usenix.org","dl.acm.org","acm.org","arxiv.org","www.arxiv.org","qconferences.com","qconsf.com","qconlondon.com","www.cncf.io","kccnc.io"]`.

- [ ] **Step 2: Write failing schema tests** `tests/content/schema.test.ts`:

```ts
test('PostJsonSchema accepts the Discord fixture shape', () => {
  expect(PostJsonSchema.safeParse(discordPostJson).success).toBe(true) })
test('rejects unknown topic', () => {
  const r = PostJsonSchema.safeParse({...discordPostJson, topic: 'performance'})
  expect(r.success).toBe(false) })
test('rejects 1 key number and 5 key numbers', ...)
test('rejects talk source without locator', ...)
test('LocaleFrontmatterSchema rejects summary over 160 chars', ...)
test('LocaleFrontmatterSchema requires keyNumberLabels record', ...)
```
`discordPostJson` is the object from spec §5 with `keyNumbers` ids `messages`, `nodes`, `latency`.

- [ ] **Step 3: Run `pnpm test tests/content/schema.test.ts`**. Expected: FAIL, module not found.

- [ ] **Step 4: Implement `lib/content/schema.ts`**

Schemas per spec §5. `SourceSchema` with `type: z.enum(['blog','talk','paper'])` and a `superRefine` requiring `locator` when type is `talk` or `paper`. `PostJsonSchema.keyNumbers` min 2 max 4, `tags` min 2 max 5, dates as `YYYY-MM-DD` strings (regex), `updatedAt` nullable, `series` nullable string, `author` string, `reviewedBy` string. `LocaleFrontmatterSchema`: `title` min 1, `summary` max 160, `tldr` min 3 max 5, `keyNumberLabels` `z.record(z.string(), z.string())`, `smallTeam` min 2 max 4, `lessons` optional min 2 max 3, `draft` optional boolean.

- [ ] **Step 5: Implement `lib/content/vocab.ts`** `loadVocab(root)` reading the six JSON files with `fs.readFileSync` and parsing with the schemas; throws with the file name on failure.

- [ ] **Step 6: Run the tests**. Expected: all pass.

- [ ] **Step 7: Commit** `feat(content): vocabulary files and zod schemas`.

---

### Task 3: Pure utilities: reading time, references, URL normalization

**Files:**
- Create: `lib/content/reading-time.ts`, `lib/content/refs.ts`, `lib/content/normalize-url.ts`
- Test: `tests/content/utils.test.ts`

**Interfaces:**
- `readingTime(text: string, locale: Locale): { words: number; minutes: number }` (minutes rounded up; words counted on whitespace after stripping fenced code blocks and frontmatter).
- `WPM: Record<Locale, number> = { vi: 200, en: 230 }`.
- `extractRefs(body: string): Array<{ id: string; locator?: string; raw: string }>` matching `[S1]`, `[S2 §3]`, `[S3 @12:40]`, `[S4 p.7]`.
- `normalizeSourceUrl(url: string): string` lowercases scheme and host, strips fragment, removes `utm_*` and empty query, drops trailing slash, keeps other query params sorted.
- `hostOf(url: string): string`.

- [ ] **Step 1: Write failing tests**

```ts
test('readingTime vi: 1000 words = 5 minutes', () => expect(readingTime(words(1000),'vi').minutes).toBe(5))
test('readingTime en: 1000 words = 5 minutes (230 wpm, ceil)', () => expect(readingTime(words(1000),'en').minutes).toBe(5))
test('readingTime ignores fenced code', ...)
test('extractRefs finds id and locator', () => expect(extractRefs('x [S1] y [S2 §3] z [S3 @12:40]')).toEqual([{id:'S1',raw:'[S1]'},{id:'S2',locator:'§3',raw:'[S2 §3]'},{id:'S3',locator:'@12:40',raw:'[S3 @12:40]'}]))
test('normalizeSourceUrl strips utm and trailing slash', () => expect(normalizeSourceUrl('https://Discord.com/blog/x/?utm_source=a#top')).toBe('https://discord.com/blog/x'))
test('hostOf', () => expect(hostOf('https://www.youtube.com/watch?v=CZ3wIuvmHeM')).toBe('www.youtube.com'))
```

- [ ] **Step 2: Run tests**. Expected: FAIL.
- [ ] **Step 3: Implement the three modules.**
- [ ] **Step 4: Run tests**. Expected: PASS.
- [ ] **Step 5: Commit** `feat(content): reading time, refs, url normalization`.

---

### Task 4: Post loader

**Files:**
- Create: `lib/content/load.ts`, `lib/i18n.ts`
- Test: `tests/content/load.test.ts`, fixtures `tests/fixtures/posts/good-post/{post.json,vi.mdx,en.mdx}` (a minimal valid post with one mermaid block and refs)

**Interfaces:**
- `lib/i18n.ts`: `export const LOCALES = ['vi','en'] as const; export type Locale; export function isLocale(x: string): x is Locale; export function otherLocale(l: Locale): Locale; export async function getDictionary(l: Locale): Promise<Dictionary>` (Dictionary type generated from `dictionaries/vi.json` keys).
- `lib/content/load.ts`:
  - `type PostRecord = { slug: string; dir: string; meta: PostJson; locales: Partial<Record<Locale, LocaleDoc>> }`
  - `type LocaleDoc = { frontmatter: LocaleFrontmatter; body: string; readingTime: { deep: number; whole: number }; refs: Ref[]; mermaidBlocks: string[] }`
  - `readPostFolder(dir: string): PostRecord` (throws on schema failure with file name)
  - `listPosts(root = 'content/posts'): PostRecord[]` sorted by `publishedAt` desc, excluding locales marked draft
  - `getPost(root, slug): PostRecord | undefined`
  - `hasLocale(p: PostRecord, l: Locale): boolean`
  - `listPostsBy(root, filter: { company?: string; topic?: string; tag?: string; series?: string }): PostRecord[]` (same sort; M2 consumes it, M1 implements it with a test)
- Whole reading time = deep + top layer words (summary, tldr, smallTeam, lessons, keyNumberLabels) at the locale WPM.

- [ ] **Step 1: Write the fixture post** under `tests/fixtures/posts/good-post/` (company `discord`, topic `data`, caseType `migration`, two key numbers, one blog source, body with `[S1]` and one ```mermaid block, both locales).
- [ ] **Step 2: Write failing tests**: `listPostsBy(root,{company:'discord'})` returns 1 and `{topic:'infra'}` returns 0; `readPostFolder` returns both locales, `mermaidBlocks.length === 1`, refs include `S1`, `readingTime.deep > 0`; `listPosts` on `tests/fixtures/posts` returns 1; `getPost(root,'good-post')` defined; a copy with `draft: true` in `en.mdx` yields `hasLocale(p,'en') === false`.
- [ ] **Step 3: Run tests**. Expected: FAIL.
- [ ] **Step 4: Implement `lib/i18n.ts` and `lib/content/load.ts`** (gray-matter for frontmatter; `mermaidBlocks` via regex on ```mermaid fences).
- [ ] **Step 5: Run tests**. Expected: PASS.
- [ ] **Step 6: Commit** `feat(content): post loader`.

---

### Task 5: Validator rules and CLI

**Files:**
- Create: `lib/content/validate.ts`, replace `scripts/validate-content.ts`
- Test: `tests/content/validate.test.ts`, fixtures `tests/fixtures/posts/bad-*` (one folder per rule, built in the test by copying `good-post` into a temp dir and mutating)

**Interfaces:**
- `type Finding = { level: 'error'|'warn'; rule: string; slug: string; file?: string; message: string }`
- `validatePost(p: PostRecord, vocab: Vocab, opts: { today: string }): Finding[]`
- `validateAll(root: string, vocab: Vocab, opts): { findings: Finding[]; ok: boolean }` (`ok` is false when any error)
- CLI: `tsx scripts/validate-content.ts [root]` prints findings grouped by slug, exits 1 on any error. Errors and warnings exactly as spec §5 "Validation". Rule ids: `schema`, `enum`, `labels`, `refs`, `source-host`, `locator`, `image-external`, `asset-size`, `alt-text`, `mermaid-count`, `reading-time`, `summary-length`, `locales`, `published-at` (warn), `lessons-omitted` (warn).

- [ ] **Step 1: Write failing tests**, one per rule, each mutating a temp copy of `good-post` and asserting a finding with that `rule`, plus: `good-post` yields zero errors; CRLF + BOM copy of `vi.mdx` yields zero errors (Review Focus 1); `[S3]` with two sources yields `refs` error whose message contains `S3` (Review Focus 2); a source URL `https://discord.com/blog/x?utm_source=rss` passes `source-host` (Review Focus 4); reading-time error when the deep layer is 300 words; `published-at` warn when `publishedAt` is 4 days before `today`.
- [ ] **Step 2: Run tests**. Expected: FAIL.
- [ ] **Step 3: Implement `lib/content/validate.ts`** (strip BOM and normalize CRLF in the loader before parsing; asset size via `fs.statSync`; image rules by scanning `![alt](src)` and `<img>` in the body).
- [ ] **Step 4: Implement the CLI** and point `prebuild` at it (already wired).
- [ ] **Step 5: Run tests and `pnpm validate`** (content/posts is still empty: expected `ok`, 0 posts). Expected: PASS.
- [ ] **Step 6: Commit** `feat(content): validator rules and CLI`.

---

### Task 6: Mermaid render script

**Files:**
- Create: `scripts/render-mermaid.ts`, `lib/content/mermaid.ts`
- Test: `tests/content/mermaid.test.ts`

**Interfaces:**
- `lib/content/mermaid.ts`: `hashBlock(src: string): string` (sha256 hex, first 12), `svgName(locale: Locale, index: number): string` = `${locale}-diagram-${index+1}.svg`, `readSvgHash(svg: string): string | null` (reads `<!-- mermaid:<hash> -->` on the first line), `planRenders(p: PostRecord): Array<{ locale; index; src; file; status: 'missing'|'stale'|'fresh' }>`.
- CLI: `tsx scripts/render-mermaid.ts [--check] [root]`. Without `--check`: for each `missing|stale`, write src to a temp `.mmd`, run `mmdc -i tmp.mmd -o <file> --backgroundColor transparent`, prepend the hash comment. With `--check`: exit 1 listing any `missing|stale`. SVG colours: pass `--configFile` with `theme: 'base'` and `themeVariables` mapped to CSS variables (`primaryColor: 'var(--panel)'`, `lineColor: 'var(--ink)'`, `textColor: 'var(--ink)'`, `fontFamily: 'Inter'`); if mmdc rejects var() values, the builder post-processes the SVG replacing the literal theme colours with the variables.

- [ ] **Step 1: Write failing tests**: `hashBlock` stable; `planRenders` on `good-post` with no SVG returns one `missing`; after writing an SVG with the right hash comment, `fresh`; after changing the block, `stale` (Review Focus 3).
- [ ] **Step 2: Run tests**. Expected: FAIL.
- [ ] **Step 3: Implement `lib/content/mermaid.ts` and the CLI.**
- [ ] **Step 4: Run tests**. Expected: PASS. Run `pnpm render-mermaid --check tests/fixtures/posts`; expected exit 1 naming `good-post vi-diagram-1.svg missing`.
- [ ] **Step 5: Commit** `feat(content): mermaid render script with staleness check`.

---

### Task 7: CI Mermaid step and branch protection notes

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `docs/repo-setup.md`

- [ ] **Step 1: Add to CI** after install: `pnpm exec puppeteer browsers install chrome` (mermaid-cli depends on puppeteer), then `pnpm render-mermaid --check`. Keep order: test, validate, render-mermaid --check, build.
- [ ] **Step 2: Write `docs/repo-setup.md`**: create a public repo under Ryan's personal account; push `main`; enable branch protection on `main` requiring the `ci` check, no auto-merge, no force push; connect Vercel (framework Next.js, root `/`), enable Vercel Analytics; add labels `pipeline`, `content`, `needs-source`, `clean`; create Milestones M0 to M8; create the Project board with fields Milestone, Type, Locale. These are manual steps for Ryan; mark each with a checkbox.
- [ ] **Step 3: Commit** `ci: mermaid check; docs: repo setup checklist`.

---

### Task 8: Fixture post 1, Discord (migration, data, Mermaid)

**Files:**
- Create: `content/posts/discord-cassandra-to-scylladb/{post.json,vi.mdx,en.mdx}`

**Interfaces:** must pass `pnpm validate` with zero errors; `render-mermaid --check` may report missing SVGs until CI renders them (the implementer runs `pnpm render-mermaid content/posts` locally and commits the SVGs).

Source (verified 2026-10-21): S1 blog, "How Discord Stores Trillions of Messages", Bo Ingram, 2023-03-06, `https://discord.com/blog/how-discord-stores-trillions-of-messages`. Numbers from S1: 12 Cassandra nodes in 2017; 177 Cassandra nodes early 2022; 72 ScyllaDB nodes after; historical read p99 40–125 ms → 15 ms; insert p99 5–70 ms → 5 ms; migration estimated 3 months with Spark, done in about 9 days after rewriting the migrator in Rust, up to 3.2 million rows/s; cutover May 2022.

- [ ] **Step 1: Write `post.json`** with `topic: data`, `caseType: migration`, `tags: [cassandra, scylladb, rust, hot-partition, request-coalescing]`, `publishedAt` = today, `sourcePublishedAt: 2023-03-06`, `author: ryan`, `reviewedBy: ryan`, keyNumbers `messages` ("1T", S1), `nodes` ("177 → 72", S1), `latency` ("p99 125 → 15 ms", S1), and the S1 source with `accessedAt` = today.
- [ ] **Step 2: Draft `vi.mdx`** per spec §4: frontmatter (title, summary ≤160, 3–5 tldr, keyNumberLabels for the three ids, 2–4 smallTeam in second person, 2–3 lessons), deep layer 1200–2000 words in story H2s, every number with an inline `[S1 §…]`, one ```mermaid flowchart (gateway → data service (Rust, request coalescing) → ScyllaDB) with Vietnamese labels. Technical terms stay English.
- [ ] **Step 3: Draft `en.mdx`** as a full equivalent (same H2 count, same single Mermaid block with English labels, same refs).
- [ ] **Step 4: Run `pnpm validate`**. Expected: zero errors; fix until clean. Run `pnpm render-mermaid content/posts` and `pnpm render-mermaid --check content/posts`. Expected: fresh.
- [ ] **Step 5: Commit** `content: fixture post discord-cassandra-to-scylladb` including the two SVGs. Open the PR for Ryan's hand edit; merge after his edit.

---

### Task 9: Fixture post 2, Cloudflare (incident, reliability, Lessons omitted)

**Files:**
- Create: `content/posts/cloudflare-control-plane-outage-2023/{post.json,vi.mdx,en.mdx}`

Source (verified): S1 blog, "Post mortem on the Cloudflare Control Plane and Analytics Outage", Matthew Prince, 2023-11-04, `https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/`. Numbers from S1: outage 2023-11-02 11:43 UTC to 2023-11-04 04:25 UTC; three data centers near Hillsboro; Cloudflare about 10% of PDX-04 capacity; UPS batteries lasted about 4 minutes against a 10-minute design.

- [ ] **Step 1: Write `post.json`**: `topic: reliability`, `caseType: incident`, `tags: [data-center, control-plane, high-availability, chaos-engineering]`, keyNumbers `duration` ("≈41 h", S1), `ups` ("4 min / 10 min", S1), `share` ("≈10%", S1).
- [ ] **Step 2: Draft `vi.mdx` and `en.mdx`**: no `lessons` key. `smallTeam` carries the weight: a five-person team has no second data center; what this says about single points of failure in their own control plane (one admin box, one CI runner, one DNS account). One Mermaid sequence or flowchart of the failure chain is allowed but not required.
- [ ] **Step 3: Run `pnpm validate`**. Expected: zero errors, one `lessons-omitted` warning.
- [ ] **Step 4: Commit** `content: fixture post cloudflare-control-plane-outage-2023`. PR body states: "Lessons omitted deliberately: the source lists its own under 'Lessons and Remediation'."

---

### Task 10: Fixture post 3, Netflix talk (design-decision, reliability, timestamp locators)

**Files:**
- Create: `content/posts/netflix-microservices-mastering-chaos/{post.json,vi.mdx,en.mdx}`

Sources (verified 2026-10-21): S1 talk, "Mastering Chaos - A Netflix Guide to Microservices", Josh Evans, QCon San Francisco 2016, `https://www.youtube.com/watch?v=CZ3wIuvmHeM`, locator required (`@mm:ss` of each claim). S2 talk page, same title, `https://www.infoq.com/presentations/netflix-chaos-microservices/` (InfoQ blocks non-browser fetches; the implementer reads it in a browser or via the transcript on YouTube).

- [ ] **Step 1: Watch or read the transcript; collect 2–4 concrete numbers with timestamps** (candidates: number of microservices, request fan-out, availability targets, the Chaos Monkey / FIT stats he quotes). Record each as a key number with `ref: S1` and a locator in the source `locator` field (`"@mm:ss"` for the headline number) plus inline `[S1 @mm:ss]` for every number in the body.
- [ ] **Step 2: Write `post.json`**: `caseType: design-decision`, `topic: reliability`, tags from `[microservices, chaos-engineering, high-availability, ...]`.
- [ ] **Step 3: Draft `vi.mdx` and `en.mdx`** with lessons present.
- [ ] **Step 4: Run `pnpm validate`**. Expected: zero errors (proves the talk-host allowlist and locator rules).
- [ ] **Step 5: Commit** `content: fixture post netflix-microservices-mastering-chaos`.

M0 done when: `pnpm build` passes on the three posts, and fails when one post is copied with a number reference removed (verify once, do not commit the broken copy).

---

### Task 11: Tokens, themes, theme script and toggle

**Files:**
- Modify: `app/globals.css`, `app/[locale]/layout.tsx`
- Create: `components/theme-script.tsx`, `components/theme-toggle.tsx`
- Test: `tests/ui/theme-script.test.ts` (jsdom)

**Interfaces:**
- CSS variables under `@theme` and per-theme blocks: `--ground`, `--grid`, `--ink`, `--ink-2`, `--muted`, `--hairline`, `--panel`, `--panel-2`, `--accent`, `--accent-ink` (text on accent), `--font-sans`, `--font-mono`, `--radius`. Dark values from spec §7. Light values builder-derived, each text/ground pair ≥ 4.5:1 (document in a comment).
- `themeScript(): string` returns the inline JS: read `localStorage.theme`; if `light|dark` set `document.documentElement.dataset.theme`; else set from `matchMedia('(prefers-color-scheme: dark)')`. Rendered in `<head>` via `<script dangerouslySetInnerHTML>` before any CSS-dependent paint.
- `ThemeToggle` (client): button with `aria-label` from dictionary, toggles `data-theme` and writes `localStorage.theme`. No transition on switch (state snaps).
- Fonts: `next/font/google` Inter `subsets: ['latin','vietnamese']`, JetBrains Mono `subsets: ['latin']`, exposed as `--font-sans`, `--font-mono`.

- [ ] **Step 1: Write failing test**: evaluate `themeScript()` in jsdom with `localStorage.theme='light'` and `matchMedia` mocked dark; expect `document.documentElement.dataset.theme === 'light'` (Review Focus 5). Second case: no stored value, mock dark → `'dark'`.
- [ ] **Step 2: Run test**. Expected: FAIL.
- [ ] **Step 3: Write `globals.css`** tokens, base typography (body 17px/1.65 phone, 18px/1.7 desktop; headings Inter 700, tracking no tighter than -0.02em), the 40px grid background on `body` using `--grid`, panel and hairline utility classes (`.panel`, `.hairline`, `.callout`, `.mono-label`).
- [ ] **Step 4: Implement theme script, toggle, fonts, and wire into `app/[locale]/layout.tsx`**.
- [ ] **Step 5: Run tests and `pnpm dev`**; toggle both themes manually; check no flash on reload. Expected: PASS.
- [ ] **Step 6: Commit** `feat(ui): tokens, both themes, before-paint theme script, toggle`.

---

### Task 12: Locale shell: dictionaries, header, language switch, root redirect

**Files:**
- Create: `dictionaries/vi.json`, `dictionaries/en.json`, `components/header.tsx`, `proxy.ts`
- Modify: `app/[locale]/layout.tsx`, `lib/i18n.ts`
- Test: `tests/ui/i18n.test.ts`

**Interfaces:**
- Dictionary keys (both files, same keys): `site.name`, `site.tagline`, `nav.companies`, `nav.topics`, `nav.about`, `post.byline` ("Biên tập: Ryan" / "Ryan"), `post.readMinutes` ("{n} phút đọc" / "{n} min read"), `post.tldr`, `post.keyNumbers`, `post.smallTeam` ("Cho team nhỏ" / "For a small team"), `post.deepRead` ("ĐỌC SÂU · {n} PHÚT" / "DEEP READ · {n} MIN"), `post.lessons`, `post.sources`, `post.aiLine` (exact strings from Global Constraints), `post.missingLocale` ("Bài này chưa có bản tiếng Anh." / "This post is not yet available in Vietnamese."), `theme.toggle`, `lang.switch`.
- `Header({ locale, altHref }: { locale: Locale; altHref: string })`: brand (links to `/${locale}`), nav links (companies, topics, about; M2 routes may 404 until M2, that is accepted), `VI | EN` linking to `altHref`, `ThemeToggle`.
- `proxy.ts`: `export function proxy(req)`: if pathname is `/`, `NextResponse.redirect(new URL('/vi', req.url), 308)`; `config.matcher = ['/']`.

- [ ] **Step 1: Write failing test**: both dictionaries have identical key sets; `otherLocale('vi') === 'en'`.
- [ ] **Step 2: Run test**. Expected: FAIL (files missing).
- [ ] **Step 3: Write dictionaries, `getDictionary`, `Header`, `proxy.ts`; mount Header in the locale layout** (layout computes `altHref` as the same path under the other locale; the post page overrides it when the twin is missing).
- [ ] **Step 4: Run tests; `curl -I localhost:3000/`** → `308` with `location: /vi`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): locale shell, header, language switch, root redirect`.

---

### Task 13: MDX compile pipeline and components

**Files:**
- Create: `lib/mdx/compile.tsx`, `components/mdx/components.tsx`, `components/mdx/mermaid.tsx`
- Test: `tests/mdx/compile.test.tsx`

**Interfaces:**
- `compilePostBody(doc: LocaleDoc, post: PostRecord, locale: Locale): Promise<React.ReactElement>` using `compileMDX` from `next-mdx-remote/rsc` with `remarkPlugins: [remarkGfm]`, `rehypePlugins: [[rehypePrettyCode, { theme: { light: 'github-light', dark: 'github-dark-dimmed' }, keepBackground: false }]]`, `components` from `components/mdx/components.tsx`.
- Mermaid handling: a remark plugin in `compile.tsx` replaces each ```mermaid code node with an MDX JSX node `<Mermaid index={i} />`; `Mermaid` reads `post.dir/<locale>-diagram-<i+1>.svg` at build; if present and its hash matches `hashBlock(src)`, inlines the SVG (`<figure class="diagram">`); otherwise renders `<pre><code class="language-mermaid">` with the source (Review Focus 3).
- Components: `a` (external links `rel="noopener"`), `code` inline (mono), `pre` (panel), `table` (wrapped for horizontal scroll), `img` (uses `next/image` with `unoptimized` for SVG, enforces alt), `Ref` span for `[S1 §2]` patterns rendered as `<a href="#S1" class="ref">` (a remark text transform).

- [ ] **Step 1: Write failing tests** with `good-post`: compiled output contains a `.ref` anchor for `[S1]`; with no SVG present, output contains `language-mermaid`; after writing a fresh SVG, output contains `<svg`.
- [ ] **Step 2: Run**. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run tests**. Expected: PASS.
- [ ] **Step 5: Commit** `feat(mdx): compile pipeline, refs, mermaid inline with fallback`.

---

### Task 14: Post page to the direction contract

**Files:**
- Create: `app/[locale]/posts/[slug]/page.tsx`, `components/post/post-meta.tsx`, `components/post/key-numbers.tsx`, `components/post/tldr.tsx`, `components/post/small-team.tsx`, `components/post/deep-divider.tsx`, `components/post/lessons.tsx`, `components/post/sources.tsx`, `components/post/byline.tsx`, `components/reading-progress.tsx`
- Test: `tests/ui/post-page.test.tsx` (render with `good-post` via React Testing Library + jsdom)

**Interfaces:**
- `generateStaticParams()` returns every `{locale, slug}` where `hasLocale`. `dynamicParams = false`.
- `generateMetadata`: `title`, `description` = summary, `alternates.languages` only for existing twin (`vi`/`en` keys plus `x-default: vi`), `openGraph.locale`.
- Page order (Global Constraints): breadcrumb (`/[locale]/companies/[company]` link, company name), `<h1>`, `PostMeta` (byline, publishedAt, whole minutes, topic, caseType, mono labels), summary (dek), `KeyNumbers` (2–4 muted cells: mono value, label from `keyNumberLabels`, `<a href="#Sx">` ref), `Tldr` panel, `SmallTeam` callout (the only accent border), `DeepDivider` (mono: dictionary `post.deepRead` with deep minutes), compiled body (each H2 section wrapped in a `.panel`, done by the `h2` MDX component opening/closing sections or by a rehype plugin that groups siblings; no nested panels), `Lessons` (only if present), `Sources` (ordered list with `id="S1"`…: type label, title link, authors, publishedAt, locator, accessedAt) followed by the AI line, `Byline` block.
- Missing twin: when `!hasLocale(post, otherLocale)`, Header `altHref` is `/${other}` and the page shows `post.missingLocale`.
- `ReadingProgress` (client): fixed 2px bar at top, width = scroll fraction, uses `requestAnimationFrame`, no stored state.
- Desktop layout: `max-w-[720px]` column plus `w-[260px]` sticky rail (`lg:` and up) holding the author card and a table of contents built from H2 texts (ids slugified); phone: single column, TOC as `<details>` after the top layer.

- [ ] **Step 1: Write failing tests**: rendered page contains, in document order, h1, summary, key-number values, tldr items, small-team items, the deep-read label, then the first H2; Sources list has `id="S1"`; the AI line text matches the dictionary; a post without `lessons` renders no Lessons heading; with `en.mdx` marked draft, the Vietnamese page shows `post.missingLocale`.
- [ ] **Step 2: Run**. Expected: FAIL.
- [ ] **Step 3: Implement the components and page**, matching `pinned-neon-navy-carded.html` for arrangement, palette, type and density at 390 wide, and the contract's desktop layout at 1440.
- [ ] **Step 4: Run tests and `pnpm build`**. Expected: PASS; six post routes static.
- [ ] **Step 5: Commit** `feat(post): post page to the direction contract`.

---

### Task 15: Home as a plain list (M1 stand-in) and Analytics

**Files:**
- Modify: `app/[locale]/page.tsx`, `app/[locale]/layout.tsx`
- Test: `tests/ui/home.test.tsx`

**Interfaces:**
- Home lists posts with `hasLocale`, newest first: company name, title (link), first key number (mono) and whole read minutes. Tagline under the site name.
- `<Analytics />` from `@vercel/analytics/next` in the locale layout.

- [ ] **Step 1: Write failing test**: home for `vi` lists three fixture titles in `publishedAt` desc order.
- [ ] **Step 2: Run**. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run tests and `pnpm build`**. Expected: PASS.
- [ ] **Step 5: Commit** `feat(home): plain post list; analytics`.

---

### Task 16: Deploy and finish review (M1 exit)

**Files:**
- Create: `.impeccable/review/` captures (gitignored), `DESIGN.md` (written by the Impeccable documenter at the end)

- [ ] **Step 1: Ryan completes `docs/repo-setup.md`** (push, branch protection, Vercel connect). Confirm the production URL serves `/vi/posts/discord-cassandra-to-scylladb` and `/en/...`.
- [ ] **Step 2: Capture `desktop.png` (1440 full page) and `mobile.png` (390)** of the Discord post in both themes into `.impeccable/review/`; run `/Users/ryan/.claude/skills/impeccable/scripts/impeccable detect --json app components` once; fix mechanical findings.
- [ ] **Step 3: Spawn the Impeccable finish reviewer** with the request, the direction contract, the sketch, the screenshots, the craft references (Linear, Stripe, fly.io), and the detector output. Apply one fix batch; recapture; verdict.
- [ ] **Step 4: Spawn the Impeccable documenter** to write `DESIGN.md` and `.impeccable/design.json` from the built world.
- [ ] **Step 5: Commit** `chore: finish review fixes; docs: DESIGN.md`. M1 done when the reviewer's disposition is `ship` and three posts are live.
