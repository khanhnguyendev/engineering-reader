# M7: Craft Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every built surface passes an Impeccable finish review (`disposition: ship`) in both themes at phone and desktop width, Lighthouse on phone scores at least 90 in every category on every surface, and DESIGN.md describes the world as built.

**Architecture:** Review-driven, not feature-driven. One capture packet of every surface, a finish review per surface group, one fix batch, one verdict pass, then the documenter. No new routes, no new dependencies.

**Tech Stack:** unchanged. Captures with the repo's puppeteer (`.impeccable/review/capture.mjs`), Lighthouse via `npx -y lighthouse@12` (tooling only, not a dependency).

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md` §7 (visual direction), §10 (M7). Direction contract `.impeccable/surfaces/app-locale-posts-slug-page-tsx.md`; system `DESIGN.md`; product `PRODUCT.md`.

## Global Constraints

- The world is user-pinned (spec §7, PRODUCT.md "Visual direction"): refinement only, never redesign. One accent (mint), no gradients, no glow, no second colour, Three Borders rule, no nested panels, no eyebrow/kicker labels, company colour only on card monograms.
- Both themes complete; light as intentional as dark.
- Vietnamese with full diacritics: monospace only for numbers, references and ASCII labels; line-height leaves room for stacked diacritics.
- Copy is product truth: fixes never change factual copy or add claims.
- Lighthouse target (ruling): mobile form factor, ≥ 90 in performance, accessibility, best practices and SEO on every surface, measured against the deployed preview or production.

## Surfaces

home (`/vi`, `/en`), post (`/vi/posts/discord-cassandra-to-scylladb`, `/en/posts/netflix-microservices-mastering-chaos`, `/vi/posts/cloudflare-control-plane-outage-2023` for Lessons omitted), companies index and company page (`/vi/companies`, `/vi/companies/discord`), topics index and topic page (`/vi/topics`, `/vi/topics/data`), tags index and tag page (`/vi/tags`, `/vi/tags/cassandra`), about (`/vi/about`, `/en/about`), search (`/vi/search` idle, `/vi/search?q=du%20lieu` results, `/en/search?q=zzzz` empty), 404 (`/vi/nope`). Series has no real series (`content/series.json` is `{}`), so it is covered by its unit tests only; recorded, not reviewed.

## Review Focus

1. Light theme parity on surfaces never reviewed in light before (tags, search empty state, en pages).
2. Phone width (390) on every listing page: wrapping chips, long Vietnamese titles, header nav wrap.
3. Empty or sparse states real content produces today: `featured.json` is `[]`, three posts total, tags with one post.
4. Focus visibility and contrast in light theme (accessibility score is necessary, not sufficient).
5. en pages with Vietnamese site name (accepted placeholder until M8; not a finding).

---

### Task 1: Capture packet and Lighthouse baseline

- [ ] For each surface path above, run `node .impeccable/review/capture.mjs https://engineering-reader.vercel.app <path> .impeccable/review/m7/<name>` (search results path passes wait selector `[data-search-state="results"]`, empty passes `[data-search-state="empty"]`). Names: `home-vi, home-en, post-vi, post-en, post-noLessons, companies, company, topics, topic, tags, tag, about-vi, about-en, search-idle, search-results, search-empty, notfound`. Each folder gets `desktop.png, mobile.png, desktop-light.png, mobile-light.png`.
- [ ] Lighthouse mobile JSON for each surface into `.impeccable/review/m7/lighthouse/<name>.json`; a summary table `.impeccable/review/m7/lighthouse.md` (four category scores, LCP, CLS, and the failing audits' ids for any score under 100).
- [ ] Verify every PNG opens, is non-blank and shows the document top. Report counts.

### Task 2 (controller): finish reviews

- [ ] Write `.impeccable/review/packet-m7.md` (format of `packet-m2.md`).
- [ ] Dispatch three finish reviewers in parallel (role file `degraded/finish-reviewer.md`): A post pages; B home, companies, company, topics, topic, tags, tag; C about, search ×3, 404. Each returns the disposition and five sections.

### Task 3: fix batch

- [ ] One implementer applies every material fix from all three reviews plus every Lighthouse audit under 90, in one batch, with tests where behaviour changes; `pnpm test`, `pnpm lint`, `pnpm build` green.

### Task 4: verdict pass

- [ ] Push; recapture the same files against the Vercel preview of the branch; rerun Lighthouse there. Reviewers score their fixes (verdict pass). Any remaining material finding gets one more fix and verdict round; then rulings.

### Task 5: DESIGN.md

- [ ] Documenter role (`degraded/documenter.md`) reconciles DESIGN.md with the built world (type ramp, components added in M2–M4, light theme values).

Done when every group's disposition is `ship` and every Lighthouse category on every surface is ≥ 90.
