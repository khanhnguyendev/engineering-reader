# HANDOFF (2026-10-27, after M5 and M6 build)

Not a gate. The run continues with M7.

## State
- `main`: M0–M4 as before; M5 (PR #6) merged and verified; M6 (PR #8) merged, routine scheduled but blocked on the environment allowlist (below).
- M5 delivered: `docs/pipeline.md` (the contract), `docs/pipeline-prompt.md` (the routine prompt), validator rules (language-neutral key numbers, `seen.json` checks), `pnpm normalize-url`, `pnpm pipeline:pr-body`, `pnpm pipeline:dry-run`, and the `label` workflow. Done-when verified: dry-run PR #7 passed `ci` and Vercel with no human commit and got its label from CI; closed unmerged.
- M6 delivered: `pnpm shadow-status`; the routine "engineering-reader content pipeline (shadow mode)" at https://claude.ai/code/routines (Mon/Wed/Fri 08:00 ICT, Opus 5.5, no connectors). Its first run followed the contract but could not read any feed (see below).
- Run ledgers: `docs/runs/`. Rulings: `docs/decisions.md`.

## For Ryan

**Needed to start the pipeline (blocks M6):** the routine's cloud environment ("Default") refuses outbound connections to the feed hosts. In the environment's network settings on claude.ai, allow `discord.com`, `blog.cloudflare.com`, `netflixtechblog.com` and the hosts in `content/source-hosts.json` (or choose full network access). Then run the routine once from https://claude.ai/code/routines and check that it opens a `pipeline/...` PR.

**Per pipeline PR (shadow mode):** read the whole post in both languages and the sources; edit on the branch if needed; merge; if the merge needed zero `post.json` edits and only minor prose edits, add the label `clean`. Any edit to a number or source means no label. A merged pipeline PR without `clean` resets the streak, so label or don't, deliberately. `pnpm shadow-status` says when shadow mode can end (5 consecutive clean merges, at least 3 weeks). Close a bad PR unmerged: its picks become `rejected` and are never picked again unless you delete their `seen.json` entries.

**Earlier items, still open:**
- About page copy (`content/pages/about.*.mdx`) is the run's draft.
- Key-number values are language-neutral by rule now ("9 d", "99.99% × 10 → ~99.9%").
- Site name "Hệ thống lớn" is still a placeholder (M8).
- A no-JS visitor on an `/en/...` 404 sees Vietnamese (static root not-found).

## Next
M7 Craft pass (spec §10): Impeccable finish review on every surface, DESIGN.md from the built world, Lighthouse on phone, both themes audited against the craft references. Plan to be written at the start of M7.
