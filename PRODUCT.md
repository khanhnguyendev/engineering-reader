# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), deployed on Vercel free tier. Content is MDX in the repo under `content/posts/`; the repo is the database. Decided by the user before design work started.

## Users

Primary: Vietnamese software developers with roughly 2 to 6 years of experience, mid-level at product companies or outsourcing shops, on the senior or architect track. They read English engineering blogs slowly and skim them; nuance gets lost. (Experience band is an inference the user has not corrected.)

Situation: they meet a post through a shared link on a phone, read for about two minutes, and decide whether to return on a laptop for the deep read. Both moments matter; the phone skim is optimized first.

Job to be done: preparing for a design review at work or a system design interview. Not casual curiosity.

English edition: the same reader type outside Vietnam (South-East Asia and global mid-level developers) plus Vietnamese developers who prefer English at work. Same persona, different language. English is a full equivalent of Vietnamese, never a stub.

## Product Purpose

A curated, bilingual (Vietnamese primary, English equivalent) digest of engineering cases from large companies (Netflix, Uber, Meta, Cloudflare, Stripe, Discord, Grab and about twenty source blogs). Each post retells one real decision, incident, migration, or scaling problem in plain words, with concrete numbers, and translates it down to what a small team can do with it. Every post links to its primary sources.

Success: a reader can skim the top layer on a phone in under two minutes and leave with the story, two to four sourced numbers, and one thing to change next week; a returning reader can use the deep layer to prepare for a design review or interview.

Tagline: "Bài học từ hệ thống lớn, cho team nhỏ" / "Lessons from big systems, for small teams".

## Positioning

Case-based, not pattern-based (unlike ByteByteGo's generic patterns and interview diagrams). Opinionated with a "what you do with it" layer (unlike Quastor's neutral summaries). Architecture and operations, not industry reporting (unlike The Pragmatic Engineer). Vietnamese-first, which no comparable publication is.

The claim a neighbor cannot copy: every concrete number in every post is traceable to a named primary source with a locator, and every post ends with a second-person "for a small team" section that says what transfers and what does not.

## Operating Context

- Posts are drafted by a scheduled Claude pipeline that reads RSS feeds from `content/companies.json`, picks noteworthy posts against a selection bar (one great post beats three average ones; 2 to 3 posts per week is a ceiling, not a target), writes a post folder, updates `content/seen.json`, and opens one pull request per run. The user reviews by checklist and merges; Vercel deploys. Pipeline pull requests never auto-merge, so "reviewed by" is always true.
- A content validator runs in CI on every pull request: JSON schema for `post.json`, per-locale frontmatter schema, controlled vocabularies (companies, five topics, tags, four case types), source reference integrity, primary-source host allowlist (company blogs plus talk and paper hosts such as youtube.com, usenix.org, acm.org, dl.acm.org, arxiv.org, infoq.com, and conference sites), reading-time ceiling, asset size limits, rejection of external image URLs, and a warning when `publishedAt` is more than three days before merge.
- Post anatomy, identical in both languages. Top layer (structured, under two minutes, in this order): title, one-line summary, two to four key numbers each with a source reference, TL;DR bullets, "For a small team" in second person. Deep layer (prose, 6 to 10 minutes): story-driven headings chosen per case, inline source references, Mermaid diagrams authored per locale. Fixed ending: "Lessons" (about them, optional), "Sources" (structured, primary only: type, title, authors, publish date, URL, accessed date, locator). Whole post 8 to 12 minutes.
- Byline shows the accountable human ("Ryan" / "Biên tập: Ryan"). A small line next to Sources reads "Drafted with AI from the sources above, reviewed and edited by Ryan." The About page explains the full process; that page is where trust is built.
- Content model: one folder per post under `content/posts/<slug>/` with `post.json` (shared facts), `vi.mdx`, `en.mdx`, optional assets. Slug is shared across languages, English kebab-case, company first, never changed after merge.
- Information architecture: every route under a locale prefix (`/vi/...`, `/en/...`); root redirects to `/vi`. Routes in v1: home, post, companies index and page, topic page, about, RSS feed per locale. Home is not a reverse-chronological dump: tagline, three "start here" picks, latest cards, browse by company, browse by topic. Language toggle links to the same slug in the other locale; hreflang only for pairs that exist.
- Taxonomy: company (controlled list), topic (five shelves: distributed-systems, data, realtime, infra, reliability), caseType (migration, incident, design-decision, scaling), tags (controlled list, 2 to 5 per post, no pages in v1).

## Capabilities and Constraints

- Vercel free tier: static generation preferred, no paid services, no runtime database.
- Images from source posts are never used, not even redrawn. Prose describes them and points to the original figure. Our own diagrams are Mermaid in the MDX body with translated labels per locale; hand-drawn SVGs allowed only in human-written posts. Cover and Open Graph images are generated at build from `post.json` (company logo, title, one key number), per locale. Company logos live via `companies.json`. Asset limits: 300 KB per image, 2 MB per post, alt text in both locales.
- v1 is the complete product (decided 2026-10-21): build-time Mermaid SVG committed into the post folder (source stays in MDX, SVG regenerated on change, code-block fallback if missing), Pagefind search per locale, tag pages, both themes complete with persisted toggle, llms.txt and per-post .md route, series (series.json, prev/next), redirects.json wired into next.config, reading progress indicator, JSON-LD with citations, sitemap, robots, hreflang, RSS per locale. Content validation runs before every build.
- Out of v1, undecided product features: comments, newsletter, bookmarks, any paid or external service beyond Vercel Analytics.
- Technical terms stay in English inside Vietnamese prose (sharding, consistent hashing); no forced Vietnamese translations of jargon.
- Site name and domain: undecided.

## Brand Commitments

- Tagline: "Bài học từ hệ thống lớn, cho team nhỏ" / "Lessons from big systems, for small teams".
- Voice: a colleague explaining at lunch. Direct, concrete, numbers early, zero hype, trade-offs admitted, short sentences. "Lessons" is about them (opinion allowed); "For a small team" is about you, in second person.
- Non-goals: not a translation and never reproduces the original; no news coverage, tutorials, tooling reviews, or interview-question lists.
- Visual direction (user-pinned, 2026-10-21): the dark developer-docs convention, as 200lab.io renders it, executed at full craft. Navy ground, faint mint hairline grid, one mint accent, Inter body with a monospace for labels and code, sticky table-of-contents rail on desktop, muted section panels with the "Cho team nhỏ" callout as the only accent-bordered block, and a labeled divider where the deep layer begins. Differentiation comes from content structure (sourced numbers, small-team section), not from the look. Both themes are built from tokens on day one; the default follows prefers-color-scheme, and light must look as intentional as dark (the product is closer to an engineering magazine than to developer-tool docs). Company colours appear only on logo marks on cards; the page accent never changes. Craft references: Linear (dark done right, hairlines, panels), Stripe blog and Stripe Press (long-form typography and rhythm), fly.io blog (readable technical voice with numbers).

## Evidence on Hand

None yet. No posts, no logos, no screenshots, no traffic data. Demonstration content for design work must be authored and labeled synthetic, and no real company number may be invented. The Discord Cassandra-to-ScyllaDB case used in mockups is illustrative and must be re-sourced before publication.

## Product Principles

1. The top layer stands alone: a phone skim must deliver the story, sourced numbers, and one action.
2. Every number carries a source; if it cannot be traced, it is not used.
3. Vietnamese is the primary audience, English is a full equivalent; structure is enforced by schema, not prose.
4. The repo is the database and the pipeline is a contributor: everything is diffable, validated, and reviewable in a pull request.
5. One great post beats three average ones.

## Accessibility & Inclusion

Long-form reading in Vietnamese with full diacritics: fonts must cover Vietnamese, line height must leave room for stacked diacritics, and all reading surfaces must work at phone width.
