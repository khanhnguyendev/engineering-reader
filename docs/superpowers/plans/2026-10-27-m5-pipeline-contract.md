# M5: Pipeline Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An outsider (the scheduled pipeline session in M6, or a human) can produce a post PR that passes CI with no special casing, and a dry-run script proves it by opening such a PR from a fixture.

**Architecture:**
- **Validator rules the pipeline needs.** Key-number values must be language-neutral (letter tokens only from a unit allowlist). `content/seen.json` gets a zod schema and is checked in `validateAll` (normalized keys, known company, picked entries point at a post).
- **One checklist source.** `lib/pipeline/checklist.ts` holds the spec §4 review checklist; `lib/pipeline/pr-body.ts` renders the pipeline PR body from it; a test pins the PR template to the same items.
- **Dry run.** `scripts/pipeline-dry-run.ts` copies the `good-post` fixture into `content/posts/<slug>` as a pipeline-authored post, records a `picked` entry in `seen.json`, prints the PR body, and with `--open-pr` branches `pipeline/dry-run-<date>`, commits, pushes and runs `gh pr create`.
- **Labeling.** A workflow adds the `pipeline` label to every PR whose head branch starts with `pipeline/`.
- **Docs.** `docs/pipeline.md` (contract for an outsider) and `docs/pipeline-prompt.md` (the prompt the M6 routine runs) are written by the controller after Tasks 1–4.

**Tech Stack:** unchanged (Next.js 16.4.2, zod 4, tsx, vitest). No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-21-engineering-reader-design.md` §4 (checklist, source policy), §5 (seen.json, validation), §9 (pipeline contract), §10 (M5).

## Global Constraints

- Pipeline never needs Chromium or a build toolchain: everything it runs (`pnpm validate`, `pnpm normalize-url`, `pnpm pipeline:pr-body`) is pure TypeScript via tsx.
- Pipeline PRs are labeled `pipeline` and never auto-merge; branch protection on `main` (check `ci`) is unchanged.
- seen.json key normalization exactly as `normalizeSourceUrl` (spec §5): scheme and host lowercased, fragment stripped, `utm_*` removed, other params kept and sorted, trailing slash removed.
- seen.json `decision` is one of `picked`, `skipped`, `rejected`.
- Checklist wording is spec §4 verbatim (ten items, already in `.github/pull_request_template.md`).
- No change to published post content. Fixture `tests/fixtures/posts/good-post` key number "9 days" becomes "9 d" (matches the live post).

## Review Focus

1. A key-number value with a word in one language ("9 days", "3 ngày") must fail validation; a value with a unit token ("30M req/s", "p99 40–125 → 15 ms", "≈41 h", "4 / 10 min") must pass. Task 1 tests both lists against the live posts' values.
2. A seen.json key that is not already normalized (trailing slash, `utm_source`, uppercase host) must fail with the normalized form in the message, so the pipeline can fix it mechanically. Task 2.
3. Running the dry run twice on the same day must not silently double-write: it fails if the target post folder exists. Task 4.
4. The dry run must leave the repo as it found it when `--open-pr` fails (dirty tree refused up front; any later failure rolls back files and branch). Task 4.
5. A PR template edit that drops or rewords a checklist item must fail a test, so the pipeline's printed checklist and the human's template never drift. Task 3.

---

### Task 1: Language-neutral key-number values

**Files:**
- Create: `lib/content/key-number-units.ts`
- Modify: `lib/content/validate.ts` (add rule `key-number-words` inside `validatePost`, near the keyNumbers ref check)
- Modify: `tests/fixtures/posts/good-post/post.json` (`"9 days"` → `"9 d"`)
- Test: `tests/content/validate.test.ts`

**Interfaces:**
- Produces: `KEY_NUMBER_UNITS: readonly string[]`; `wordsIn(value: string): string[]` returns the letter tokens (regex `/\p{L}[\p{L}\p{N}]*/gu`) not in `KEY_NUMBER_UNITS` (case-sensitive).
- `KEY_NUMBER_UNITS` = `ns, µs, μs, us, ms, s, min, h, d, w, mo, y, k, K, M, B, T, KB, MB, GB, TB, PB, EB, KiB, MiB, GiB, TiB, bps, Kbps, Mbps, Gbps, Tbps, Hz, kHz, MHz, GHz, x, p50, p75, p90, p95, p99, p999, req, msg, rows, rps, qps, QPS, RPS, TPS, IOPS, ops, DAU, MAU, CPU, GPU, vCPU, RAM` (ruling: `rows`, `req`, `msg` are lingua-franca unit abbreviations, not prose).

- [ ] **Step 1: Failing tests** in `validate.test.ts`, `describe('key-number-words')`:
  - `it.each(['9 days', '3 ngày', '177 nodes', 'p99 fast'])` editJson sets `keyNumbers[2].value` to the value → `rules(run(dir))` contains `'key-number-words'`, and the finding message names the offending token (e.g. `"days"`).
  - `it.each(['9 d', '≈41 h', '4 / 10 min', '≈10%', '177 → 72', 'p99 40–125 → 15 ms', '99.99% × 10 → ~99.9%', '30M req/s', '1T'])` → no `'key-number-words'` rule.
  - Live posts: `validateAll(path.resolve(import.meta.dirname, '../../content/posts'), vocab, { today: TODAY })` has no `key-number-words` finding.
- [ ] **Step 2:** `pnpm vitest run tests/content/validate.test.ts` — new cases FAIL.
- [ ] **Step 3:** Implement. Rule is `error`, file `post.json`, message ``keyNumbers "<id>" value "<value>" contains words ("days", ...); values are shared by both locales, so use digits, symbols and these units: <KEY_NUMBER_UNITS joined by space>`` (each offending token in double quotes). Change the fixture to `"9 d"` and `tests/content/schema.test.ts` `'9 days'` to `'9 d'`. Add the rule to `docs/decisions.md` (one entry: what, why, cost if wrong).
- [ ] **Step 4:** `pnpm vitest run` all PASS; `pnpm validate` prints `✔ 3 posts valid`.
- [ ] **Step 5:** Commit `feat(validate): key-number values must be language-neutral`.

### Task 2: seen.json schema and validation, normalize-url CLI

**Files:**
- Modify: `lib/content/schema.ts` (add `SeenEntrySchema`, `SeenSchema`, types)
- Modify: `lib/content/validate.ts` (`validateAll` reads `<contentRoot>/seen.json` when present; rule `seen`)
- Create: `scripts/normalize-url.ts`; `package.json` script `"normalize-url": "tsx scripts/normalize-url.ts"`
- Test: `tests/content/schema.test.ts`, `tests/content/validate.test.ts`

**Interfaces:**
- Produces: `SeenEntrySchema` = strictObject `{ company: string, seenAt: YYYY-MM-DD, decision: 'picked'|'skipped'|'rejected', slug?: Slug, reason?: string(min 1) }` with refine: `picked` requires `slug`; `skipped` and `rejected` require `reason`. `SeenSchema = z.record(z.string(), SeenEntrySchema)`. `type SeenEntry`, `type Seen`.
- `validateAll` locates seen.json as `path.join(path.dirname(postsRoot), 'seen.json')`. Findings use `slug: 'seen'`, `file: 'seen.json'`, `rule: 'seen'`. A key that is not a URL (normalizeSourceUrl throws) is a `seen` finding, not a crash.
- Seed `content/seen.json` with three `picked` entries, one per live post: key `normalizeSourceUrl(post.sources[0].url)`, `company`, `seenAt: "2026-10-21"`, `slug`. Keys sorted, 2-space indent, trailing newline. So the first pipeline run cannot re-pick a published case.
- CLI: `pnpm normalize-url <url>` prints `normalizeSourceUrl(url)` and exits 0; invalid URL prints the error to stderr, exits 1.

- [ ] **Step 1: Failing tests.**
  - schema: picked without slug fails; skipped without reason fails; `decision: 'maybe'` fails; unknown key fails (strict); valid picked/skipped/rejected pass.
  - validate (tmp content root with `posts/good-post` and a written `seen.json`): key `https://Discord.com/blog/x/?utm_source=a` → `seen` error whose message contains `https://discord.com/blog/x`; company `"nope"` → `seen` error; picked slug `missing-post` → `seen` error; picked slug `good-post` with normalized key → no `seen` finding; key `not a url` → `seen` error; malformed JSON → `seen` error; absent seen.json → no finding; live `content/seen.json` (3 picked entries) → no finding. Every seen test uses its own nested root `<tmp>/<n>/posts` with `<tmp>/<n>/seen.json`, so seen files never leak between tests.
- [ ] **Step 2:** run, FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm vitest run` PASS; `pnpm normalize-url 'https://Discord.com/blog/x/?b=2&utm_medium=x&a=1#top'` prints `https://discord.com/blog/x?a=1&b=2`.
- [ ] **Step 5:** Add a `docs/decisions.md` entry (seen.json validated; seeded with the three live posts). Commit `feat(validate): seen.json schema and checks, normalize-url CLI`.

### Task 3: Review checklist source and PR body

**Files:**
- Create: `lib/pipeline/checklist.ts`, `lib/pipeline/pr-body.ts`, `scripts/pipeline-pr-body.ts`; `package.json` script `"pipeline:pr-body": "tsx scripts/pipeline-pr-body.ts"`
- Test: `tests/pipeline/pr-body.test.ts`

**Interfaces:**
- Produces: `CHECKLIST: readonly string[]` (the ten template lines, text after `- [ ] `, verbatim).
- `type PrPost = { slug: string; company: string; titles: Record<Locale, string>; sources: Source[]; lessonsOmitted: Locale[]; mermaidBlocks: number }`
- `type LedgerCounts = { picked: number; skipped: number; rejected: number }`
- `prBody(posts: PrPost[], ledger: LedgerCounts, note?: string): string` — sections in order: `## Summary` (one line per post: `` `<slug>` (<company>): <vi title> / <en title> ``; or `No picks this run.` when empty, followed by the ledger line `Ledger: N picked, N skipped, N rejected.`; `note` appended as its own paragraph when given), `## Review checklist` (for each post a `### <slug>` subheading then the ten items as `- [ ] <item>`; omitted when no posts), `## Sources` (per post subheading, one line per source: `` - `S1` (blog): <title>, <url>, locator: <locator or —> ``), `## Lessons omitted?` (per post: `N/A` or `omitted in <locales>`), `## Mermaid` (`Mermaid source only; CI renders and commits the SVGs.` plus per-post block count).
- `postToPrPost(raw: RawPost): PrPost` (from `lib/content/load` types; mermaid count = fenced ```mermaid blocks in vi body).
- `ledgerCounts(current: Seen, base: Seen): LedgerCounts` counts entries whose key is in `current` and not in `base`, by decision (this run's additions).
- CLI: `pnpm pipeline:pr-body [slug...] [--note <text>]` reads `content/posts/<slug>`, `content/seen.json` and the base ledger from `git show origin/main:content/seen.json` (exit 1 with that command's stderr if it fails), prints `prBody(posts, ledgerCounts(current, base), note)` to stdout.

- [ ] **Step 1: Failing tests.**
  - Every `CHECKLIST` item appears in `.github/pull_request_template.md` as the exact line `- [ ] <item>`, and the template has exactly `CHECKLIST.length` checkbox lines under `## Review checklist`.
  - `CHECKLIST.length === 10` and its first item is `Functional and non-functional requirements stated.`
  - `prBody` with the good-post fixture (via `postToPrPost(readRawPost(GOOD))`) contains `### good-post`, ten `- [ ] ` lines, `` - `S1` (blog): How Discord Stores Trillions of Messages, https://discord.com/blog/how-discord-stores-trillions-of-messages, locator: — ``, `Ledger: 1 picked, 0 skipped, 0 rejected.`, and the five headings in order.
  - `prBody([], {picked:0, skipped:4, rejected:0})` contains `No picks this run.` and no `## Review checklist`.
  - A post with `lessons` removed from en.mdx frontmatter → `omitted in en`.
  - `ledgerCounts({a:picked,b:skipped,c:skipped}, {a:picked})` → `{picked:0, skipped:2, rejected:0}`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; `pnpm pipeline:pr-body discord-cassandra-to-scylladb` prints a body.
- [ ] **Step 5:** Commit `feat(pipeline): review checklist source and PR body generator`.

### Task 4: Dry-run script and pipeline labeler

**Files:**
- Create: `lib/pipeline/dry-run.ts`, `scripts/pipeline-dry-run.ts`, `.github/workflows/pipeline-label.yml`; `package.json` script `"pipeline:dry-run": "tsx scripts/pipeline-dry-run.ts"`
- Test: `tests/pipeline/dry-run.test.ts`

**Interfaces:**
- Consumes: `prBody`, `postToPrPost` (Task 3); `SeenSchema` (Task 2); `normalizeSourceUrl`.
- Produces: `prepareDryRun(o: { fixtureDir: string; contentRoot: string; slug: string; today: string }): { postDir: string; seenKey: string }` — throws `Error('<postDir> already exists')` if the target exists; copies `post.json`, `vi.mdx`, `en.mdx` only (no SVGs, so CI renders them); rewrites post.json `slug`, `author: "pipeline"`, `reviewedBy: "ryan"`, `publishedAt: today`, `featured: false`, and `sources[0].url` to `<url>?dry-run=<slug>` (a unique ledger key; same host, so `source-host` holds); adds `seen.json[normalizeSourceUrl(newUrl)] = { company, seenAt: today, decision: "picked", slug }`, throwing `Error('seen.json already has <key>')` if the key exists (never overwrite a ledger entry); writes seen.json with 2-space indent, trailing newline, keys sorted.
- CLI defaults: fixture `tests/fixtures/posts/good-post`, content root `content`, `today` = local `en-CA` date, slug `dry-run-<today>`. Flags: `--slug <s>`, `--open-pr`.
  - Without `--open-pr`: prepare, run `pnpm validate` (inherit stdio; exit non-zero on failure), print the PR body. Leaves files for the user to inspect.
  - With `--open-pr`: refuse (exit 1, message `working tree is not clean`) if `git status --porcelain` is non-empty; `--base <branch>` (default `main`). Record the current branch, `git switch -c pipeline/dry-run-<today>`, prepare, validate, `git add content`, `git commit -m "content: pipeline dry run <slug>"` plus `-m "$GIT_TRAILERS"` when that env var is set, `git push -u origin HEAD`, `gh pr create --base <base> --title "content: pipeline dry run <slug>" --body <body>` where body = `prBody` with note `Dry run from tests/fixtures/posts/good-post. Do not merge; close after CI.` and no `--label` (the label must come from the workflow). Print the PR URL, then switch back to the recorded branch. On any failure after the switch: remove the post folder, `git checkout -- content/seen.json` (or reset the commit), switch back, delete the local branch, exit 1.
- `pipeline-label.yml`: on `pull_request` types `[opened, reopened]`, `if: startsWith(github.head_ref, 'pipeline/') && github.event.pull_request.head.repo.full_name == github.repository`, permissions `pull-requests: write`, permissions also `issues: write`; step `gh api -X POST repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/labels -f 'labels[]=pipeline'` with `GH_TOKEN: ${{ github.token }}`. Job name `label` (not `ci`).

- [ ] **Step 1: Failing tests** (tmp content root: copy `content/companies.json` etc. not needed; write `seen.json` `{}`):
  - `prepareDryRun` writes `posts/dry-run-x/{post.json,vi.mdx,en.mdx}` and no `.svg`; post.json has `slug: "dry-run-x"`, `author: "pipeline"`, `publishedAt: "2026-10-27"`.
  - seen.json gains key `https://discord.com/blog/how-discord-stores-trillions-of-messages` with `{ company: "discord", seenAt: "2026-10-27", decision: "picked", slug: "dry-run-x" }`; existing entries are kept; file ends with `\n`.
  - Second call with the same slug throws `already exists`.
  - `validateAll(<tmp>/x/posts, loadVocab(), { today: '2026-10-27' })` returns `ok: true` (post, seen key and slug agree).
  - With seen.json already holding the dry-run key, `prepareDryRun` throws `already has`.
  - The prepared `sources[0].url` is `https://discord.com/blog/how-discord-stores-trillions-of-messages?dry-run=dry-run-x`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** `pnpm vitest run` PASS; `pnpm lint` clean; `pnpm pipeline:dry-run --slug dry-run-local` prints `✔ 4 posts valid` and a body; run `pnpm build` with it present (passes); then remove `content/posts/dry-run-local` and `git checkout content/seen.json`.
- [ ] **Step 5:** Commit `feat(pipeline): dry-run script and pipeline PR labeler`.

### Task 5 (controller): docs and the fixture PR

- [ ] `docs/pipeline.md` for an outsider: purpose, the selection bar, inputs (companies.json feeds, seen.json from main and `pipeline/*` branches; ignore `pipeline/dry-run-*`), steps per spec §9, file formats with an example, commands (`PUPPETEER_SKIP_DOWNLOAD=1 pnpm install`, `pnpm normalize-url`, `pnpm validate`, `pnpm pipeline:pr-body`), the checklist, ledger rules, what never to do, shadow mode.
- [ ] `docs/pipeline-prompt.md`: the self-contained prompt the M6 routine runs.
- [ ] Add the `key-number-words` and `seen` rules to spec §5 Validation.
- [ ] After the M5 PR merges, from an up-to-date `main`: `pnpm pipeline:dry-run --open-pr`. Done when: the PR diff is only `content/posts/dry-run-<date>/` and `content/seen.json` (plus the bot's SVG commit); the bot SHA carries `ci` success and Vercel success on the final SHA; the `label` workflow run succeeded and the `pipeline` label is on the PR. Record in RUNLOG, close the PR unmerged, delete the branch.
