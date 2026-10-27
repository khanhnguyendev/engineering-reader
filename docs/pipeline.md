# Content pipeline

This document is the contract for anyone who adds posts to this repo without a person writing them: the scheduled Claude Code routine (M6), or a person who wants to do the same job by hand. It assumes no knowledge of the conversation that built the site. If this document and the spec disagree, the spec wins (`docs/superpowers/specs/2026-10-21-engineering-reader-design.md` §4, §5, §9) and this document is fixed.

## What the site is

A bilingual (Vietnamese first, English full equivalent) digest of engineering cases from large companies. Each post retells one real decision, incident, migration or scaling problem in our own words, with concrete numbers traced to primary sources, and says what a small team can do with it. The reader is a mid-level Vietnamese developer preparing for a design review or a system design interview.

## What the pipeline does, once per run

1. **Start clean.** Clone or fetch the repo, check out `main`, and install without a browser: `PUPPETEER_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile`. Nothing in the pipeline needs Chromium, Next.js or a build.
2. **Exit if a pipeline PR is open.** (Every `gh` command in this document has an equivalent in the GitHub tools a cloud session provides; use those when `gh` is unauthenticated.) `gh pr list --label pipeline --state open`. If anything is listed, stop. At most one pipeline PR is in flight.
3. **Build the ledger.** Start from `content/seen.json` on `main`. Then, for every PR from a branch named `pipeline/*` (except `pipeline/dry-run-*`) that was closed without merging in the last 90 days (`gh pr list --label pipeline --state closed --search "is:unmerged closed:>=<date 90 days ago>" --limit 200 --json number,headRefName`, dropping any `headRefName` that starts with `pipeline/dry-run-`), read its `content/seen.json` from the PR head, which survives branch deletion (`git fetch origin pull/<n>/head` then `git show FETCH_HEAD:content/seen.json`). Any key found there and not on `main` is added to this run's ledger once (the first PR found wins) as `{ "company": <copied from that entry>, "seenAt": <today>, "decision": "rejected", "reason": "closed unmerged in PR #<n>" }`, with no `slug`. Two more cases from the same PR heads: a key that is `deferred` on `main` but `picked` in that PR head is also rewritten to `rejected` (same reason), because that draft was turned down; a key that is `deferred` in that PR head and not on `main` is added as `deferred` (copy its entry, `seenAt` today), because it was never drafted. A rejected draft is never picked again unless a human deletes its entry.
4. **Read feeds.** `content/companies.json` lists each company's `feedUrl`. Fetch each feed. For every item, normalize its link with `pnpm -s normalize-url <item link>` (for a whole feed at once: one link per line into `pnpm -s normalize-url -`, which prints one output line per non-blank input line, in order) and skip it if the result is a key in the ledger, unless that entry's decision is `deferred` (see step 5). That normalized feed link is the item's ledger key for this whole run, picks included, even when the post later cites a cleaner URL for the same article (Medium feeds, for example, add a `source` parameter). Using any other key would let the next run see the item as new.
5. **Re-decide deferred entries, then decide each unseen item.** The selection bar is below. First, every `deferred` entry in the ledger is re-decided, oldest `seenAt` first, and deferred entries take pick slots before new items: rewrite it to `picked` (add `slug`, set `seenAt` to today) or `skipped` (new `reason`), or leave the entry unchanged if it still meets the bar but there is no slot. A deferred entry whose `seenAt` is more than 90 days old is rewritten to `skipped` with reason `stale`. A deferred item no longer in its feed is read from its key URL. These are the only rewrites a run may make. Then every unseen item gets a ledger entry, with a one-line reason for anything not picked. At most three picks per run, counting re-decided ones; that is a ceiling, not a target, and zero picks is a normal run. An item that meets the bar but does not fit under the ceiling is `deferred` (reason: why it meets the bar), not skipped.
6. **Write each pick.** Create `content/posts/<slug>/post.json`, `vi.mdx` and `en.mdx` (formats below). Write Mermaid as fenced ` ```mermaid ` blocks only. Never write or edit `.svg` files: CI renders diagrams and commits them to the PR branch.
7. **Validate.** `pnpm validate` must exit 0 (`0 error(s)`; or `✔ N posts valid` when there are no warnings either). Fix every `✖` error. Warnings (`⚠`), such as an old `publishedAt` on an existing post, are allowed.
8. **Self-check.** Go through the review checklist below for each pick, honestly. Tick an item only if the post meets it. An unticked item is allowed and tells the reviewer where to look; a false tick is not allowed.
9. **Open one PR.** If `content/seen.json` is unchanged from `main` (no new keys and no re-decided `deferred` entry), open no PR and report `nothing new`. Otherwise branch `pipeline/<YYYY-MM-DD>` (or `pipeline/ledger-<YYYY-MM-DD>` when there are no picks); if that branch already exists on `origin`, append `-2`, `-3`, and so on. Commit the posts and `content/seen.json` together and push. Write the body to a file with `pnpm -s pipeline:pr-body <slug...> > "$TMPDIR/body.md"` (no slugs for a ledger-only run; it reads the base ledger from `origin/main`, so fetch first). Tick verified items only inside each post's own `### <slug>` block (the ten lines repeat per post). Then `gh pr create --base main --body-file "$TMPDIR/body.md" --title "content: <slugs or ledger> <YYYY-MM-DD>"`. The `label` workflow adds the `pipeline` label. Never merge, never enable auto-merge, never push to `main`.

A run with no picks but new skip or deferred decisions, or re-decided deferred entries, still opens the ledger-only PR, so those decisions reach `main`.

## Reading sources

Read the whole source before writing. Some sites make that harder:
- Medium-hosted blogs (Netflix) answer 403 to plain HTTP clients. The feed item's `content:encoded` field carries the full article text and is an acceptable full-text source; cite the article URL.
- Discord's blog pages put only the intro inside `<article>`; the rest of the text sits outside it. Read the whole page text, not just that element.

## The selection bar

Pick a source only if all of these hold:
- It is a primary source: the company's own engineering blog, a talk by its engineers, or a paper. Its host is the company's blog host or in `content/source-hosts.json`.
- It tells a real decision, incident, migration or scaling problem, not a product announcement, a tutorial, a tool release or a hiring post.
- It has concrete numbers (two to four that matter), each one stated in the source.
- A small team can learn something specific from it.

One great post beats three average ones. When in doubt, skip with a reason.

Secondary summaries (newsletters, Reddit, Hacker News) may inform you, but are never cited and never the source of a number. A number that cannot be traced to a source is not used.

## File formats

### `content/posts/<slug>/post.json`

```json
{
  "slug": "discord-cassandra-to-scylladb",
  "company": "discord",
  "topic": "data",
  "caseType": "migration",
  "tags": ["cassandra", "scylladb", "storage"],
  "series": null,
  "publishedAt": "2026-10-27",
  "updatedAt": null,
  "sourcePublishedAt": "2023-03-06",
  "featured": false,
  "author": "pipeline",
  "reviewedBy": "ryan",
  "keyNumbers": [
    { "id": "nodes", "value": "177 → 72", "ref": "S1" },
    { "id": "migration", "value": "9 d", "ref": "S1" }
  ],
  "sources": [
    {
      "id": "S1",
      "type": "blog",
      "title": "How Discord Stores Trillions of Messages",
      "authors": ["Bo Ingram"],
      "publishedAt": "2023-03-06",
      "url": "https://discord.com/blog/how-discord-stores-trillions-of-messages",
      "accessedAt": "2026-10-27",
      "locator": null
    }
  ]
}
```

- `slug`: English, kebab-case, company slug first, then the case in four to six words, no dates. It never changes after merge.
- `company`: a `slug` in `content/companies.json`. `topic`: one of `distributed-systems`, `data`, `realtime`, `infra`, `reliability`. `caseType`: one of `migration`, `incident`, `design-decision`, `scaling`. `tags`: 2 to 5 slugs from `content/tags.json`. `series`: a key in `content/series.json` or `null`.
- `author` is `pipeline`; `reviewedBy` is `ryan`; `publishedAt` is the run date.
- `keyNumbers`: 2 to 4, prefer 3. `value` is shared by both languages, so it holds digits, symbols and units only (`9 d`, `30M req/s`, `p99 40–125 → 15 ms`), never words such as "days" or "ngày". The validator lists the allowed unit tokens. Labels go in each locale's frontmatter.
- `sources`: primary only. `talk` and `paper` sources need a `locator` (a section like `§3` or a timestamp like `@12:40`).

If the company is not in `companies.json`, the source is not a pick; skip it with the reason `company not in companies.json`. Adding a company is a human decision.

### `vi.mdx` and `en.mdx`

```yaml
---
title: "Discord chuyển kho tin nhắn từ Cassandra sang ScyllaDB"
summary: "One line, at most 160 characters; it is also the meta description."
tldr:
  - "3 to 5 bullets: problem, what they did, outcome."
keyNumberLabels:
  nodes: "Số node database"
  migration: "Thời gian chuyển dữ liệu"
smallTeam:
  - "2 to 4 bullets, second person: what you change next week, what does not transfer from their scale."
lessons:
  - "Optional, 2 to 3 bullets about them: what they would do differently, what the case proves."
---
```

The body below the frontmatter is the deep layer: free `##` headings that follow the story (where they started, what broke, options, what they built, what it cost, what went wrong after), 6 to 10 minutes of reading; the whole post 8 to 12 minutes (200 words per minute in Vietnamese, 230 in English). Inline references look like `[S1]`, `[S2 §3]`, `[S3 @12:40]`; every source is referenced at least once in prose. References inside fenced code blocks (``` or ~~~), Mermaid labels included, do not count, so cite in the prose next to a diagram. Both locales have the same structure, the same key-number ids and the same number of Mermaid blocks, with labels translated. No images from sources, not even redrawn; no external image URLs.

Vietnamese is written with full diacritics and reads as written by a Vietnamese engineer, not translated. English is a full equivalent, not a summary.

Subject rule: Lessons is about them; For a small team is about you. A bullet that fits both goes to For a small team.

Never paraphrase so closely that the text reproduces the original. Retell in your own words.

### `content/seen.json`

Keyed by the normalized feed item link (`pnpm -s normalize-url <item link>` prints it; the validator rejects keys that are not normalized). The three posts published before the pipeline are keyed by their cited source URL.

```json
{
  "https://discord.com/blog/how-discord-stores-trillions-of-messages": {
    "company": "discord", "seenAt": "2026-10-27", "decision": "picked", "slug": "discord-cassandra-to-scylladb"
  },
  "https://netflixtechblog.com/some-post": {
    "company": "netflix", "seenAt": "2026-10-27", "decision": "skipped", "reason": "tooling announcement, no numbers"
  }
}
```

`decision` is `picked` (needs `slug`, and the post must exist), `skipped`, `deferred` or `rejected` (each needs `reason`; `deferred` has no `slug`). Entries are never removed by the pipeline, and only `deferred` entries are ever rewritten (to `picked` or `skipped`). A human deleting an entry re-queues that URL.

## Review checklist

The PR body carries this list once per post (it comes from `lib/pipeline/checklist.ts`, the same list as `.github/pull_request_template.md`):

- Functional and non-functional requirements stated.
- Scale estimate present with numbers.
- Bottleneck named explicitly.
- At least one trade-off with both sides.
- At least one failure mode or lesson from failure.
- Every number has a source reference.
- For a small team is specific, not a platitude.
- Subject check: Lessons is about them, For a small team is about you.
- Nothing paraphrased so closely it reproduces the original.
- Same diagram count and shape across locales.

## Commands

| Command | What it does |
|---|---|
| `PUPPETEER_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile` | install without Chromium |
| `pnpm -s normalize-url <url>` | print the normalized ledger key for a URL |
| `pnpm -s normalize-url - < links.txt` | normalize many links, one per line; invalid lines print `ERROR <input>` and the exit code is 1 |
| `pnpm validate` | validate every post and `seen.json`; exit 1 on errors |
| `pnpm -s pipeline:pr-body [slug...]` | print the PR body for this run's picks |
| `pnpm pipeline:dry-run [--open-pr]` | maintainers only: prove the contract with a fixture post |

## What CI does with a pipeline PR

- The `label` workflow adds the `pipeline` label to any PR from a `pipeline/*` branch.
- The `ci` workflow renders Mermaid diagrams, commits the SVGs back to the branch, then runs tests, validation and the build. Its status is the required check on `main`.
- Vercel builds a preview of the PR.
- Nothing merges automatically. Ryan reviews and merges.

## The routine

The pipeline runs as a Claude Code scheduled cloud routine, "engineering-reader content pipeline (shadow mode)" (`trig_01MokJR3KWo4a9w25ao2d2ig`), on Ryan's account: cron `0 1 * * 1,3,5` (08:00 Asia/Saigon, Monday, Wednesday, Friday), model Claude Opus 5.5, tools Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, no MCP connectors. Its prompt is `docs/pipeline-prompt.md` below the `---`, copied verbatim; when that file changes, update the routine too. Pause, edit or run it at https://claude.ai/code/routines.

The routine's cloud environment ("Default") must allow outbound HTTPS to every company blog host in `content/companies.json` (today `discord.com`, `blog.cloudflare.com`, `netflixtechblog.com`) and every host in `content/source-hosts.json`, or be set to full network access. The first run (2026-10-27) could not load any feed because the environment's proxy refused those hosts; it reported that and opened no PR, as designed. In that environment `gh` is installed but its token is rejected; the run used the session's GitHub tools to list PRs, which can also open them.

## Shadow mode

Until the exit condition holds, Ryan reads every pipeline PR in full before merging. He labels a merged PR `clean` when it merged with zero edits to `post.json` and only minor prose edits in MDX; any edit to a number or a source resets the count. `pnpm shadow-status` (`scripts/shadow-status.ts`) counts consecutive `clean` merges and the days since the first pipeline PR. Exit: 5 consecutive clean PRs and at least 3 weeks. After exit, review is by the printed checklist and the sources block.

## Never

- Merge, enable auto-merge, push to `main`, or force-push.
- Open a second pipeline PR while one is open.
- Edit an existing post, `companies.json`, `tags.json`, `topics.json`, `series.json`, `featured.json`, `redirects.json`, `source-hosts.json`, code, CI or this document. If a pick needs a new tag, use the closest existing tags and say so in the PR summary.
- Write `.svg` files or run the Mermaid renderer.
- Cite a secondary source, or use a number that is not in a cited source.
- Remove an existing `seen.json` entry, or rewrite one that is not `deferred`.
- Push to the PR branch after opening the PR: CI may commit rendered diagrams to it, and a later push is then rejected, and force-push is forbidden.
