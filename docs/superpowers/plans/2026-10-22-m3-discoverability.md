# M3: Discoverability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every page carries complete, correct metadata in both locales. The site also gets per-locale OG cards, JSON-LD `Article` with citations, per-locale RSS, a sitemap with hreflang, robots, `llms.txt`, and a Markdown route per post.

**Architecture:** All new outputs are static, built from the M1/M2 loaders (`listPosts`, `getPost`, `loadVocab`, `hasLocale`).
- One alias-free route module (`lib/content/routes.ts`) enumerates every page and endpoint. The sitemap, the redirects validator and the done-check all read it.
- OG cards are PNGs rendered at build by `next/og` route handlers at controlled URLs (`/og/<locale>/<card>.png`), with a font file from the repo. `buildMetadata` points every page at its card, so file-convention inheritance never decides the image.
- XML (RSS, sitemap) and Markdown (`.md`, `llms.txt`) are hand-built strings with one shared escaper. No new npm dependencies.

**Tech Stack:** unchanged from M2: Next.js 16.4.2 (route handlers with `generateStaticParams` + `dynamic = 'force-static'`), the built-in `next/og` `ImageResponse`, zod, vitest + jsdom (`DOMParser` for XML assertions).

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md`, §6 (IA routes, hreflang), §7 (OG images), §8 (SEO, RSS bullets), §10 M3. DESIGN.md is the visual authority for the OG card.

## Global Constraints

- Routes, verbatim from spec §6:
  - `/[locale]/posts/[slug].md` is the post as Markdown (top layer, body, sources).
  - `/[locale]/feed.xml` is RSS.
  - `/feed.xml` redirects 301 to `/vi/feed.xml`.
  - `/llms.txt` is the site index for agents, both locales.
  - `/sitemap.xml` and `/robots.txt`.
- "hreflang: emitted only for pairs that exist; `x-default` is `vi`." This applies to page metadata AND sitemap alternates.
- Spec §6: "the same order governs the `.md` route, the RSS item and the OG card, all above the deep-read divider". That order is summary, key numbers, TL;DR, For a small team.
- RSS: "static, summary plus link, not full content". The item never carries the deep layer.
- JSON-LD: "`Article` with `author`, `inLanguage`, and `citation` from sources".
- OG images: "generated at build per locale from post.json and the locale title (company mark, title, one key number large, tagline), light background regardless of theme, Vietnamese-capable font file loaded from the repo". The card is 1200×630.
- `generateMetadata` emits canonical, OG, Twitter card, and `alternates.languages` only for existing pairs. Every page goes through `buildMetadata` (`lib/metadata.ts`), the post page included.
- Static output only. Loaders read files at build. Every new dynamic route or route handler has `export const dynamicParams = false`, `generateStaticParams`, and `export const dynamic = 'force-static'` on handlers.
- Every URL in a feed, sitemap, robots, llms.txt, JSON-LD and OG tag is absolute, built from `SITE_URL` (`lib/site.ts`).
- No new npm dependencies. Font files are committed with their OFL licence.
- Dictionary keys identical across locales; no hard-coded English on vi output (feed titles, llms.txt section names and `.md` headings come from the dictionaries).
- New UI tests: `// @vitest-environment jsdom`, `vi.mock('server-only')`, `vi.mock('next/navigation')` where needed, temp `CONTENT_ROOT`/`VOCAB_ROOT` dirs holding all six vocab JSONs, `vi.resetModules()` before dynamic imports.
- Commit messages end with the session's two attribution lines.

## Review Focus

1. **A post with only one locale** (the other missing or `draft: true`) is handled consistently. The sitemap entry lists only the existing locale, with no `x-default` when vi is missing. The other locale's feed and llms.txt section omit the post. Its `.md` and OG card in the missing locale are not generated, so they 404. Tests: Task 2 (sitemap/routes), Task 4 (feed), Task 6 (llms, md).
2. **Text with XML-special characters** produces well-formed XML that a parser accepts. Examples are `&`, `<`, `>`, quotes, and a Vietnamese title with `&` in a summary. Test in Task 4 (feed) and Task 2 (sitemap) with a fixture whose summary contains `R&D <fast> "quoted"`, parsed by `DOMParser` with no `parsererror`.
3. **No URL in generated output is relative or points at localhost** when `NEXT_PUBLIC_SITE_URL` is set. Tests stub the env to `https://example.test` and assert every `<loc>`, `<link>`, `url`, `og:image` starts with it. Task 8 greps the production build output for `localhost`.
4. **The longest real title wraps inside the OG card without clipping.** The test case is the Cloudflare vi title, 113 chars in frontmatter. Vietnamese diacritics must render with no tofu boxes. Covered by the Task 3 visual check of `/og/vi/cloudflare-control-plane-outage-2023.png` and the en twin.
5. **An unknown slug or a missing locale on `.md` returns 404**, not the HTML page. A real `.md` responds `text/markdown; charset=utf-8` with NFC Vietnamese text intact. Tests in Task 6 plus a curl in Task 8.

---

## File structure

```
lib/content/routes.ts            alias-free: pageEntries(posts, vocab, opts?), endpointRoutes(posts)
lib/content/redirects.ts         staticRoutes() rebuilt from routes.ts; schema gains optional statusCode
lib/metadata.ts                  buildMetadata + twitter card, og image, article times, rss alternate
lib/xml.ts                       escapeXml(s)
lib/og/card.tsx                  OgCard element tree (satori-safe inline styles), loadOgFonts()
assets/og/                       Inter-Regular.ttf, Inter-Bold.ttf, JetBrainsMono-Bold.ttf, OFL.txt
app/og/[locale]/[card]/route.tsx OG PNGs: site.png + <slug>.png per locale
app/[locale]/feed.xml/route.ts   RSS 2.0 per locale
lib/feed.ts                      buildFeed(locale, posts, vocab, dict): string
components/post/json-ld.tsx      <script type="application/ld+json"> Article
lib/json-ld.ts                   articleJsonLd(post, locale, vocab, dict, siteUrl)
app/sitemap.ts, app/robots.ts
lib/markdown.ts                  postMarkdown(post, locale, vocab, dict, siteUrl); llmsTxt(posts, vocab, dicts, siteUrl)
app/[locale]/md/[file]/route.ts  the .md route (rewritten from /:locale/posts/:slug.md)
app/llms.txt/route.ts
next.config.ts                   rewrites() for .md
content/redirects.json           /feed.xml → /vi/feed.xml (301)
components/nav-link.tsx, components/header.tsx, app/not-found.tsx   (Task 1, M2 carry-over)
```

---

### Task 1: M2 carry-overs (NavLink on the root 404, header hydration test)

**Files:** `components/header.tsx`, `components/nav-link.tsx`, `app/not-found.tsx`, `tests/ui/header.test.tsx`, `tests/ui/not-found.test.tsx`.

**Interfaces:** Produces `Header({ locale, twinMissing?, pathless?: boolean })` and `NavLink({ href, section, locale, serverPath?: string, children })`. `serverPath` of `""` means "server path unknown, mark nothing current". `undefined` means "use `usePathname()`".

- [ ] Failing tests:
  - In `tests/ui/header.test.tsx`, set the mocked `usePathname` to `/_not-found`, then `renderToString(<Header locale="vi" twinMissing pathless />)`. Switch the mocked path to `/vi/companies/nope`, `window.history.pushState({}, '', '/vi/companies/nope')`, and `hydrateRoot` inside `act`, with a `console.error` spy and an `onRecoverableError` spy. Assert neither spy was called. React reports attribute mismatches through `console.error`.
  - On a normal page (`/vi/companies`, no `pathless`), `renderToStaticMarkup` still emits `aria-current="page"` on Companies.
  - In `tests/ui/not-found.test.tsx`, after hydrating at `/en/nope`, the wrapper `div` has `lang="en"`.
- [ ] Implement:
  - `Header` passes `serverPath={pathless ? "" : undefined}` to each `NavLink`.
  - `NavLink` uses `useSyncExternalStore(noop, () => window.location.pathname, () => serverPath ?? usePathname())`, with `usePathname()` called unconditionally above it.
  - `app/not-found.tsx` renders `<Header locale="vi" twinMissing pathless />`.
- [ ] Run `pnpm test`, then commit.

### Task 2: Route registry, metadata builder, post page on buildMetadata

**Files:**
- Create `lib/content/routes.ts`.
- Modify `lib/content/redirects.ts`, `lib/content/validate.ts`, `lib/metadata.ts`, `app/[locale]/posts/[slug]/page.tsx`, and every page's `generateMetadata` only if its call shape changes.
- Tests: `tests/routes.test.ts`, `tests/metadata.test.ts`, `tests/redirects.test.ts`, `tests/ui/post-page.test.tsx`.

**Interfaces:**

Produces in `lib/content/routes.ts`, with relative imports only (it is in `next.config.ts`'s chain). Derive a post's locales from `Object.keys(post.locales)`, and do not import any module whose own chain uses `@/`. `lib/content/load.ts` imports `@/lib/i18n`, so do not import it. Define a local structural type `RoutePost = { slug: string; locales: Partial<Record<Locale, unknown>>; meta: { company: string; topic: string; tags: string[]; series: string | null; publishedAt: string; updatedAt: string | null } }`, which both `PostRecord` and the test fixtures satisfy. `redirects.ts` imports it from `./routes` and replaces its own narrower `RoutePost`.
- `type PageEntry = { path: string; locales: Locale[]; lastModified?: string }`
  - `path` has no locale and is `''` for home.
  - `locales` lists the locales the page exists in.
  - `lastModified` is an ISO date for posts: `updatedAt ?? publishedAt`.
- `pageEntries(posts, vocab, opts?: { nonEmptyOnly?: boolean }): PageEntry[]` covers home, about, the companies, topics and tags indexes, every company/topic/tag/series page, and every post.
  - Post `locales` are the locales the post has (`hasLocale`).
  - With `nonEmptyOnly`, a company/topic/tag/series page keeps only the locales in which it has at least one post, and is dropped when none remain.
- `endpointRoutes(posts): string[]` returns, for each locale: `/${l}/feed.xml`, `/${l}/posts/${slug}.md` (posts having `l`), `/og/${l}/site.png` and `/og/${l}/${slug}.png` (posts having `l`). It also returns `/llms.txt`, `/sitemap.xml`, `/robots.txt` and `/feed.xml`.

Produces in `lib/content/redirects.ts`:
- `staticRoutes(posts, vocab)` = `/` + every `/${l}${path}` from `pageEntries(posts, vocab)` + `endpointRoutes(posts)`, with `/feed.xml` excluded.
  - Excluding `/feed.xml` keeps the redirect `from` legal.
  - The set stays lowercased the way M2's validator compares it.
- The schema gains `statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).optional()`.
- `toNextRedirects` emits `statusCode` instead of `permanent` when it is set. A test asserts the output has exactly one of the two keys.

Produces in `lib/metadata.ts`:
- `buildMetadata({ locale, path, title, description, type?, locales?, image?, publishedTime?, modifiedTime? })` adds the following to today's output:
  - `openGraph.images: [{ url: image ?? \`/og/${locale}/site.png\`, width: 1200, height: 630, alt: title }]`
  - `openGraph.publishedTime` / `modifiedTime` when given (article only)
  - `twitter: { card: 'summary_large_image', title, description, images: [same url] }`
  - `alternates.types: { 'application/rss+xml': [{ url: \`/${locale}/feed.xml\`, title: dict.feed.title }] }`, where the dictionary is read inside via `getDictionary(locale)`.

Post page: `generateMetadata` calls `buildMetadata` with:
- `type: 'article'`
- `path: \`/posts/${slug}\``
- `locales` = the post's existing locales
- `image: \`/og/${locale}/${slug}.png\``
- `publishedTime: post.meta.publishedAt`, and `modifiedTime: post.meta.updatedAt ?? undefined`

Add dictionary keys to both locales: `feed.title` = `"Hệ thống lớn: bài mới"` / `"Hệ thống lớn: new posts"`, and `feed.description` = the tagline.

- [ ] Failing tests:
  - Routes:
    - `pageEntries` on the M2 fixture set returns home `''` with `['vi','en']`.
    - A vi-only post has `locales: ['vi']`.
    - With `nonEmptyOnly`, an unused tag is absent and a company with vi-only posts lists only `vi`.
    - `endpointRoutes` contains `/vi/posts/<slug>.md` but not `/en/posts/<vi-only-slug>.md`.
  - Redirects:
    - A redirect `{ from: '/feed.xml', to: '/vi/feed.xml', statusCode: 301 }` validates, and `toNextRedirects` yields `{ source: '/feed.xml', destination: '/vi/feed.xml', statusCode: 301 }`.
    - A `from` of `/vi/feed.xml` is rejected as a live route.
  - Metadata:
    - `buildMetadata({ locale:'en', path:'/about', ... })` has `twitter.card === 'summary_large_image'`, `openGraph.images[0].url === '/og/en/site.png'`, and an rss alternate `/en/feed.xml`.
    - With `locales: ['vi']` there is no `en` and `x-default` is `/vi...`.
    - With `locales: ['en']` there is no `x-default`.
  - Post page: the generated metadata for the fixture vi post has `openGraph.type === 'article'`, an image of `/og/vi/<slug>.png`, and `publishedTime`.
- [ ] Implement; `pnpm build` passes; commit.

### Task 3: OG cards

**Files:**
- Create `assets/og/{Inter-Regular.ttf,Inter-Bold.ttf,JetBrainsMono-Bold.ttf,OFL.txt}`, `lib/og/card.tsx` and `app/og/[locale]/[card]/route.tsx`.
- Tests: `tests/og.test.tsx`.

**Fonts:**
- Download static TTFs that include the Vietnamese range (U+1EA0–1EF9):
  - Inter 4.x static Regular and Bold from the rsms/inter GitHub release zip.
  - JetBrains Mono Bold from the JetBrains/JetBrainsMono release.
- Commit them with the OFL text.
- Satori needs TTF/OTF, not woff2.
- Verify coverage with `fc-query` or by rendering "Một data center ở Oregon" and checking the PNG visually.

**Interfaces:**
- `loadOgFonts(): { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]` reads `assets/og/*` with `fs.readFileSync(path.join(process.cwd(), 'assets/og', f))` at build.
- `OgCard({ kind: 'post' | 'site', locale, title, companyName?, brandColor?, keyNumber?: { value: string; label: string }, tagline, siteName }): JSX.Element` returns the satori-safe element. It uses flex layout only and inline styles only, with no Tailwind.
- Route `GET(_req, { params }: { params: Promise<{ locale: string; card: string }> })` takes `card` ∈ `site.png` ∪ `${slug}.png`. Data sources:
  - `title` = the locale frontmatter title.
  - `companyName` and `brandColor` = `loadVocab().companies` entry for `post.meta.company`.
  - `keyNumber` = `post.meta.keyNumbers[0]` value + `frontmatter.keyNumberLabels[id]`. The schema requires at least 2, so it is never absent.
  - `tagline` and `siteName` = `getDictionary(locale).site`.
  - Tests call `GET(new Request('http://x'), { params: Promise.resolve({ locale: 'vi', card: '<slug>.png' }) })` against a temp `CONTENT_ROOT`/`VOCAB_ROOT`. Fonts are read from the repo through `process.cwd()`, which vitest sets to the repo root.
- The route It returns `new ImageResponse(<OgCard …/>, { width: 1200, height: 630, fonts: loadOgFonts() })`. `generateStaticParams` takes locales × (site + each post having that locale), with `dynamicParams = false` and `dynamic = 'force-static'`.

**Card design** (DESIGN.md light tokens, regardless of theme):
- Ground `#f2f4f3` with a white panel inset 48px, 10px radius and a 1px strong hairline.
- Post card:
  - Top-left: a monogram rounded square, 6px radius, hairline border. The company letter is in the brand colour mixed 70% toward ink, precomputed in JS because satori has no `color-mix`. The company name sits beside it in Inter 600 ink-2. Nothing else sits above the title.
  - Title: Inter 700, 56px, ink, letter-spacing -0.02em. It wraps to at most 3 lines; at 4+ lines the size drops to 48px. Nothing is clipped.
  - Key number: the first key number in JetBrains Mono Bold 64px ink, with its label (Inter 400, 24px, ink-2) below.
  - Footer row: the tagline (Inter 400, 22px, muted) on the left and the 1px accent rule (`#0f7a5a`) above the footer.
- Site card: site name (Inter 700, 64px), tagline (Inter 400, 32px, ink-2), the accent rule, and no number.

Steps:
- [ ] Failing tests:
  - `OgCard` for the Cloudflare fixture returns a tree containing the title text, the first key number value and the tagline.
  - Its root style `backgroundColor` is `#f2f4f3` for both locales (theme-independent).
  - `generateStaticParams` yields `{ locale:'vi', card:'site.png' }` and `{ locale:'vi', card:'<slug>.png' }`, and no en card for a vi-only post.
  - Calling `GET` for a fixture card returns `content-type: image/png` with the PNG signature. If `next/og` cannot run under vitest, record that in the report and cover it with the curl in step 3.
- [ ] Implement. Run `pnpm build`, then `pnpm start`. `curl -sI /og/vi/site.png` returns 200 image/png. Save `/og/vi/cloudflare-control-plane-outage-2023.png`, `/og/en/cloudflare-control-plane-outage-2023.png`, `/og/vi/discord-cassandra-to-scylladb.png` and `/og/vi/site.png` to `.impeccable/review/og/`. View each one: no clipping, diacritics intact, light ground.
- [ ] Commit (fonts + code).

### Task 4: RSS per locale

**Files:**
- Create `lib/xml.ts`, `lib/feed.ts` and `app/[locale]/feed.xml/route.ts`.
- Modify `content/redirects.json`, `dictionaries/{vi,en}.json` and `app/[locale]/about/page.tsx`.
- Tests: `tests/feed.test.ts` (`// @vitest-environment jsdom` for `DOMParser`).

**Interfaces:**
- `escapeXml(s: string): string` escapes `& < > " '`.
- `buildFeed(locale, posts, vocab, dict, siteUrl): string` returns RSS 2.0 with `xmlns:atom`. Channel:
  - `title` = `dict.feed.title`, `link` = `${siteUrl}/${locale}`, `description` = `dict.feed.description`
  - `language` = `vi` / `en`
  - `atom:link rel="self"` pointing at the feed
  - `lastBuildDate` = the newest item date
- Items: the newest 20 posts having the locale, newest first.
  - `title`, `link` and `guid isPermaLink="true"` (the post URL)
  - `pubDate` (RFC 822 from `publishedAt`)
  - `category` (the topic label in the locale)
  - `description`: escaped HTML of the top layer in spec §6 order:
    1. `<p>` summary
    2. `<ul>` key numbers, `value label`
    3. `<p><strong>` TL;DR heading from the dictionary, then a `<ul>` of bullets
    4. `<p><strong>` small-team heading from the dictionary, then a `<ul>` of bullets
    5. a `<p><a>` link labelled `dict.feed.readMore`
  - No deep layer.
- Route: `generateStaticParams` over locales, `dynamic = 'force-static'`, `Content-Type: application/rss+xml; charset=utf-8`.
- `content/redirects.json`: `[{ "from": "/feed.xml", "to": "/vi/feed.xml", "statusCode": 301 }]`.
- New dictionary keys: `feed.readMore` ("Đọc toàn bài" / "Read the full post"). Reuse the TL;DR and small-team headings from the existing `post.*` keys.
- About page: `about.rss` becomes a sentence with a link to `/${locale}/feed.xml`. Add the key `about.rssLink` for the link label. The text is no longer "coming".

Steps:
- [ ] Failing tests:
  - `buildFeed('vi', …)` over a temp fixture set parses with `DOMParser(..., 'application/xml')` and has no `parsererror`.
  - The Review Focus 2 fixture summary `R&D <fast> "quoted"` round-trips: after parsing, the item description text contains it.
  - The en feed omits the vi-only post (Review Focus 1).
  - Every `<link>` starts with `https://example.test` (`vi.stubEnv('NEXT_PUBLIC_SITE_URL', …)`, Review Focus 3).
  - The description contains the summary and the TL;DR bullets, and contains no deep-layer H2 text.
  - Items are newest first and capped at 20.
  - The about page links to `/vi/feed.xml`.
- [ ] Implement. `pnpm build`, then `curl -sI localhost:3000/feed.xml` shows 301 with Location `/vi/feed.xml`, and `xmllint --noout` on both feeds passes. Commit.

### Task 5: JSON-LD Article

**Files:**
- Create `lib/json-ld.ts` and `components/post/json-ld.tsx`.
- Modify `app/[locale]/posts/[slug]/page.tsx`.
- Tests: `tests/json-ld.test.ts`, and extend `tests/ui/post-page.test.tsx`.

**Interfaces:**
- `articleJsonLd(post, locale, vocab, dict, siteUrl): Record<string, unknown>` returns:
  - `@context: 'https://schema.org'`, `@type: 'Article'`
  - `headline` = the title, trimmed to 110 characters with `…` if longer
  - `description` = the summary
  - `inLanguage` = `vi` / `en`
  - `datePublished` = `publishedAt`; `dateModified` = `updatedAt ?? publishedAt`
  - `mainEntityOfPage` = the absolute post URL
  - `image: [\`${siteUrl}/og/${locale}/${slug}.png\`]`
  - `author: { '@type': 'Person', name: 'Ryan', url: \`${siteUrl}/${locale}/about\` }`
  - `publisher: { '@type': 'Organization', name: dict.site.name, url: siteUrl }`
  - `about` = the company name
  - `keywords` = the tag labels in the locale
  - `citation` = sources mapped to `{ '@type': 'CreativeWork', name: title, url, author: authors.map(n => ({ '@type': 'Person', name: n })), datePublished: publishedAt }`
- `JsonLd({ data })` renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />`.
- Mount it once in the post page `<article>`.

Steps:
- [ ] Failing tests:
  - For the fixture: `@type` is Article, `inLanguage` is `vi`, and `citation.length` equals the number of sources with each URL equal to the source URL.
  - `image[0]` is absolute.
  - A title of 120 characters yields a `headline` of 110 or fewer.
  - The rendered post page contains exactly one `application/ld+json` script whose JSON parses.
  - A summary containing `</script>` does not terminate the tag early: the parsed JSON equals the input.
- [ ] Implement; commit.

### Task 6: Markdown route and llms.txt

**Files:**
- Create `lib/markdown.ts`, `app/[locale]/md/[file]/route.ts` and `app/llms.txt/route.ts`.
- Modify `next.config.ts` (rewrites), `app/[locale]/posts/[slug]/page.tsx` (alternate link), `lib/metadata.ts` (`markdown?: string`) and `dictionaries/{vi,en}.json`.
- New keys:
  - `llms.intro`: vi "Case study về hệ thống lớn, kể lại từ nguồn kỹ thuật gốc, mỗi bài có lớp đọc nhanh và lớp đọc sâu." / en "Case studies of large systems, retold from primary engineering sources, each with a quick top layer and a deep layer."
  - `llms.section`: vi "Tiếng Việt" / en "English".
  - Add any heading key the `.md` output needs that the `post.*` keys lack, with the same text the post page shows.
- Tests: `tests/markdown.test.ts` and `tests/metadata.test.ts`. `buildMetadata({ …, markdown: '/vi/posts/x.md' })` yields `alternates.types['text/markdown'] === '/vi/posts/x.md'`.

**Interfaces:**

`postMarkdown(post, locale, vocab, dict, siteUrl): string` returns, in spec §6 order:
1. `# {title}`
2. `> {summary}`
3. a metadata line: company · topic label · published date · `{siteUrl}/{locale}/posts/{slug}`
4. `## {key numbers heading}` followed by `- **{value}** {label} [{ref}]`
5. `## {TL;DR heading from the dictionary}` bullets
6. `## {small-team heading}` bullets
7. `---`
8. the deep-layer body verbatim. Mermaid fences stay as fences.
9. `## {lessons heading}` when present
10. `## {sources heading}` followed by `- [{id}] {title}, {authors}, {publishedAt}. {url}` plus the locator when set
11. the AI line from the dictionary

All headings come from the dictionary of the locale. Reuse existing post-page keys; add only what is missing to both files.

`llmsTxt(posts, vocab, dicts: Record<Locale, Dictionary>, siteUrl): string` follows the llmstxt.org shape:
- `# {vi site.name}`, then `> {vi tagline} / {en tagline}`, then one short paragraph saying where posts come from (primary sources, two layers). The paragraph comes from a new dictionary key `llms.intro`, vi then en.
- `## Tiếng Việt` and `## English` sections, both from the dictionaries (`llms.section`). Each lists the posts in that locale, newest first, as `- [{title}]({siteUrl}/{l}/posts/{slug}.md): {summary}`.
- `## Optional` with the two feeds and the sitemap.

`.md` route:
- `app/[locale]/md/[file]/route.ts` has `generateStaticParams` = locales × `${slug}.md` for posts having the locale, with `dynamicParams = false` and `dynamic = 'force-static'`.
- Response headers:
  - `Content-Type: text/markdown; charset=utf-8`
  - `X-Robots-Tag: noindex`
  - `Link: <{html url}>; rel="canonical"`
- `next.config.ts` adds `async rewrites() { return [{ source: '/:locale(vi|en)/posts/:file([a-z0-9-]+\\.md)', destination: '/:locale/md/:file' }] }`. Verify that the rewrite matches. If the regex form fails at build, fall back to `beforeFiles` rewrites and record which form worked.

`llms.txt` route: `dynamic = 'force-static'`, `Content-Type: text/plain; charset=utf-8`.

Post page: add `alternates.types['text/markdown']` = `/${locale}/posts/${slug}.md` through `buildMetadata` (extend it with `markdown?: string`).

Steps:
- [ ] Failing tests:
  - The vi fixture markdown section order is title < summary < key numbers < TL;DR < small team < `---` < first body H2 < sources. Compare indexes.
  - Vietnamese text in the output equals its `.normalize('NFC')`.
  - `llmsTxt` lists the vi-only post under `## Tiếng Việt` only (Review Focus 1), and every link ends in `.md` and is absolute.
  - The route `generateStaticParams` has no en entry for the vi-only post.
- [ ] Implement. `pnpm build`, then `pnpm start`:
  - `curl -s -D- /vi/posts/discord-cassandra-to-scylladb.md` returns 200 `text/markdown` and starts with `# `.
  - `/en/posts/does-not-exist.md` returns 404 (Review Focus 5).
  - `/llms.txt` returns 200.
- [ ] Commit.

### Task 7: Sitemap and robots

**Files:** create `app/sitemap.ts` and `app/robots.ts`. Tests: `tests/sitemap.test.ts`.

**Interfaces:**
- `sitemap(): MetadataRoute.Sitemap` builds from `pageEntries(listPosts(), loadVocab(), { nonEmptyOnly: true })`. It emits one entry per (entry, locale):
  - `url` = `${SITE_URL}/${l}${path}`
  - `lastModified` when the entry has one
  - `alternates.languages` = every locale of the entry, plus `x-default` → vi only when vi exists
- `robots(): MetadataRoute.Robots` returns `{ rules: [{ userAgent: '*', allow: '/' }], sitemap: \`${SITE_URL}/sitemap.xml\`, host: SITE_URL }`.
  - Nothing is disallowed. Social crawlers such as Twitterbot honour robots.txt when they fetch the `/og/` cards, and M3 is done only when an OG debugger shows them.
  - `.md` pages stay out of search through their `noindex` header, not robots.

Steps:
- [ ] Failing tests:
  - `robots()` has no `disallow` entry that matches `/og/`.
  - The sitemap for a fixture set with a vi-only post has a vi entry for it whose alternates have no `en`.
  - No entry exists for an unused tag.
  - Every URL starts with the stubbed `https://example.test`.
  - Home appears twice (vi, en), each with both alternates and `x-default`.
- [ ] Implement. `pnpm build` and `curl /sitemap.xml | xmllint --noout -`. Commit.

### Task 8: Done-check, docs, merge

- [ ] Branch `m3/discoverability` already exists. The controller opens draft PR #3 after Task 1 and pushes after every task, so CI and Vercel previews run.
- [ ] Run `NEXT_PUBLIC_SITE_URL=https://engineering-reader.vercel.app pnpm build && pnpm start` and curl each of these. Tasks 3–7 run their curl checks the same way. All must return 200 with the right content type:
  - `/vi/feed.xml` and `/en/feed.xml`
  - `/feed.xml` (301 to `/vi/feed.xml`)
  - `/sitemap.xml`, `/robots.txt`, `/llms.txt`
  - `/vi/posts/<slug>.md` for each post
  - `/og/{vi,en}/site.png` and each post card
- [ ] View the post page source for vi and en. It has one `application/ld+json`, `og:image` absolute, `twitter:card` = `summary_large_image`, `link rel="alternate" hreflang` only for existing pairs, and a `link rel="alternate" type="application/rss+xml"`.
- [ ] Metadata audit across page types: for `/vi`, `/en/companies`, `/vi/topics/data`, `/en/tags/cassandra`, `/vi/about`, a post in each locale and `/vi/nope`, check the HTML for canonical, `og:title`, `og:description`, `og:url`, `og:locale` (`vi_VN`/`en_GB`), an absolute `og:image`, `twitter:card`, and hreflang only for existing pairs.
- [ ] Grep `.next/server/app` output for `localhost`. Expect nothing when `NEXT_PUBLIC_SITE_URL` is set for the build (Review Focus 3).
- [ ] Merge PR #3 after CI is green and the final whole-branch review is clean. Then on production (`https://engineering-reader.vercel.app`):
  - Run Google's Rich Results Test (https://search.google.com/test/rich-results) on one vi and one en post URL. Expect "Article" detected with no errors.
  - Run an OG debugger (https://www.opengraph.xyz/ or https://metatags.io/) on the same two URLs plus `/vi` and `/en`. Expect the correct card image, title and description.
  - Drive both with the Chrome browser tools. Save screenshots to `.impeccable/review/m3/`.
  - If a tool is unreachable, record that and validate the JSON-LD against schema.org's validator (https://validator.schema.org/) instead.
- [ ] Mark ROADMAP M3 done, add a RUNLOG line, and update HANDOFF (next: M4 Search).
