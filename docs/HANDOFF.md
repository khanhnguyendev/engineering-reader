# HANDOFF (2026-10-27, after M7 and M8a)

Not a gate. Everything the run can do without Ryan is done; what is left needs his decisions or his review.

## State
- `main`: M0–M7 merged and verified on https://engineering-reader.vercel.app; M8a (pipeline contract v1.1, PR #11) merged.
- M7: finish review returned ship on every surface group (posts; home and listings; about, search, 404) in both themes at 390 and 1440. Lighthouse mobile on production (median of 3): see `docs/RUNLOG.md`.
- Pipeline: contract `docs/pipeline.md` v1.1 (adds `deferred`), prompt `docs/pipeline-prompt.md`, routine "engineering-reader content pipeline (shadow mode)" (Mon/Wed/Fri 08:00 ICT) with the v1.1 prompt.
- The first real pipeline run was done by hand from the build session: PR #10, three posts (Discord voice outage, Discord voice to the edge, Netflix TimeSeries cold tier), green on `ci`, Vercel and label. Not merged: it is yours to review.
- Run ledgers: `docs/runs/`. Rulings: `docs/decisions.md`.

## For Ryan

1. **Review PR #10** (shadow mode): read both languages and the sources; edit on the branch if needed; merge; add the label `clean` only if `post.json` needed no edits and the MDX only minor prose edits. A merged pipeline PR without `clean` resets the streak. `pnpm shadow-status` tracks the exit condition (5 consecutive clean, 3 weeks).
   - In PR #10's `content/seen.json`, four items were marked `skipped` only because of the three-pick ceiling (the contract had no `deferred` yet). Change them to `"decision": "deferred"` before merging so a later run can pick them: "How Discord Indexes Trillions of Messages", "Tracing Discord's Elixir Systems", Cloudflare "Cross-request KV cache exposure in the GLM-5.3 Workers AI model", Netflix "Ads Event Pipeline for Live, Part II". Their reasons say "over the cap".
2. **Unblock the routine:** in the cloud environment ("Default") network settings on claude.ai, allow `discord.com`, `blog.cloudflare.com`, `netflixtechblog.com` and the hosts in `content/source-hosts.json` (or full network access). Then run it once from https://claude.ai/code/routines. It exits without doing anything while PR #10 is open, by design.
3. **M8 decisions only you can make:** the site name (placeholder "Hệ thống lớn": `site.name` and the feed titles in `dictionaries/vi.json` and `en.json`), the domain (a purchase; the stack is free-tier only), then the redirect from vercel.app. M8's "first ten posts" needs three to four more merged pipeline PRs at one in flight.
4. **Earlier items, still open:** About page copy is the run's draft; a no-JS visitor on an `/en/...` 404 sees Vietnamese; the en byline is "Ryan" per the spec (a finish review suggested "Edited by Ryan").

## Next
M8 Domain and launch, once the name and domain are chosen. M6 exits shadow mode when `pnpm shadow-status` says so.
