# HANDOFF: gate 1 (M0 fixtures drafted)

Date: 2026-10-21. Branch `m0-m1/foundation`, draft PR #1: https://github.com/khanhnguyendev/engineering-reader/pull/1 (CI green on every push).

## What shipped since the start (M0)
- Next.js 16 scaffold, pnpm, vitest, ESLint; CI job `ci` (install, Chrome headless shell, Mermaid render-and-commit, committed-state check, test, validate, build) with a status posted on bot-pushed SHAs so branch protection stays real.
- Content contract: zod schemas (`lib/content/schema.ts`), vocab files (`content/*.json`), loader (`lib/content/load.ts`), validator with 15 rules as `prebuild` and CLI (`pnpm validate`), Mermaid render script with hash-based freshness and CSS-variable theming (`pnpm render-mermaid`).
- PR template with the spec §4 review checklist; repo, labels, milestones, branch protection; `docs/decisions.md`, `docs/RUNLOG.md`, `ROADMAP.md`.
- Three real fixture posts, both locales, validator-clean, each reviewed by an independent reviewer with fix rounds:
  - `content/posts/discord-cassandra-to-scylladb` (migration, data, Mermaid) — 5 fix rounds on paraphrase.
  - `content/posts/cloudflare-control-plane-outage-2023` (incident, reliability, Lessons omitted deliberately: the source lists its own under "Lessons and Remediation") — 2 fix rounds.
  - `content/posts/netflix-microservices-mastering-chaos` (design-decision, reliability, talk source with `@mm:ss` locators) — 1 fix round.
- M0 done-check verified: the validator rejects a copy with a bad key-number ref; `pnpm build` passes on the three posts.

## What you must do now (hand edit, not checklist review)
Edit the three posts by hand in both locales. The validator will tell you if you break a rule (`pnpm validate`). Watch the lengths: Vietnamese deep layers sit at the 10-minute ceiling (Discord 1951 words, Cloudflare 1926, Netflix 1847 of 2000), so additions in vi must be paid for with cuts. Reading times: `pnpm exec tsx -e "import {readRawPost,parsePost} from './lib/content/load'; for (const s of ['discord-cassandra-to-scylladb','cloudflare-control-plane-outage-2023','netflix-microservices-mastering-chaos']) { const p=parsePost(readRawPost('content/posts/'+s)); console.log(s, JSON.stringify(Object.fromEntries(Object.entries(p.post!.locales).map(([l,d])=>[l,d.readingTime])))) }"`.

Items the reviewers parked for you (one phrase each):
- Discord tldr line 6: "skipped"/"bị bỏ qua" overstates the source's "cut down on" → "some routine maintenance was dropped" / "một số việc bảo trì định kỳ đã bị bỏ".
- Discord lessons line 18: "in the plan from the start" adds a timing claim the source does not make.
- Netflix line 82 (both locales): "repeat reads inside one request never leave the process" claims more than the talk; use "reuse the first result [S1 @32:44]". Lines 32 and 90 tell the 2012 ELB story twice; trim line 90 if you like.
- All posts: check the qualitative mechanics against the sources once; every number is referenced, but prose claims were judged by reviewers from memory of the sources.
- Mermaid diagrams render with mermaid's "neo" look (drop shadow, gradient stroke); a follow-up before the M1 finish review switches to `look: classic`. No action needed from you.

If you edit a Mermaid block, run `pnpm render-mermaid` and commit the SVGs (CI would do it for you on push, but local is faster). Commit your edits on `m0-m1/foundation`.

## Status
Gate 1 was skipped on Ryan's instruction (2026-10-21, see docs/decisions.md). The run continued into M1 with the drafted fixtures. The parked items above remain for whenever Ryan edits.
