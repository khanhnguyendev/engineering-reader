# Decisions log

Format: date, decision, alternatives, why.

- 2026-10-21 — Work on branch `m0-m1/foundation`, PR to `main` per milestone pair M0+M1 (one PR), later milestones one PR each. Alt: one PR per task. Why: M1 cannot deploy without M0; task-level PRs add CI noise with no reviewer.
- 2026-10-21 — `LOCALES`/`Locale` live only in `lib/i18n.ts`; schema imports them. Alt: duplicate in schema. Why: one source of truth.
- 2026-10-21 — Header is rendered by each page (not the locale layout) so the post page can point the language switch at the right twin. Alt: context/slot plumbing. Why: static, simplest.
- 2026-10-21 — Plan revision 2 after review: language switch is a client component using `usePathname`; every page renders its own Header; RSC page tests call the page function directly and `renderToStaticMarkup`; content root from `CONTENT_ROOT` env; Tailwind tokens via `@theme inline`; mono font gets latin-ext + vietnamese subsets and short uppercase labels are an allowed mono exception; CI renders Mermaid and commits SVGs to the PR branch (spec §8 reworded; §9's "CI renders and commits" wins over §8's "fail if missing"); URL normalization keeps non-utm query params (spec §5 reworded); Discord fixture drops "1T" (not a number in the source); Netflix fixture cites YouTube only; fixtures are committed to the branch and hand-edited at gate 1, not via per-post PRs. Alt: keep plan v1. Why: reviewer showed v1 stalls at Task 1 and Tasks 12/14 were unbuildable.
- 2026-10-21 — Task 1 minors deferred to final review: duplicate build-approval lists (package.json vs pnpm-workspace.yaml), validate runs twice in CI, unstyled 404 with fixed lang, `@` alias untested, `@types/node` ^20. Prebuild hook verified to fire under pnpm 11.
