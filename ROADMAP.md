# Roadmap
Spec: docs/superpowers/specs/2026-10-21-engineering-reader-design.md §10.

| Milestone | Status | Done when |
|---|---|---|
| M0 Repo and contract | done 2026-10-21 ([PR #1](https://github.com/khanhnguyendev/engineering-reader/pull/1)) | `pnpm build` fails on a bad post, passes on the three fixtures |
| M1 Read a post, deploy | done 2026-10-22: finish review ship, final branch review fixed, three posts live at https://engineering-reader.vercel.app ([PR #1](https://github.com/khanhnguyendev/engineering-reader/pull/1)) | three posts live, Impeccable finish review ships |
| M2 Wayfinding | done 2026-10-22: every IA route 200 in both locales, localized 404, finish review ship ([PR #2](https://github.com/khanhnguyendev/engineering-reader/pull/2)) | every IA route resolves in both locales |
| M3 Discoverability | done 2026-10-22: Rich Results Test valid Article (vi + en), OG debugger correct cards, sitemap/feeds/llms.txt/.md live ([PR #3](https://github.com/khanhnguyendev/engineering-reader/pull/3), follow-up PR #4) | rich-results and OG debugger correct for both locales |
| M4 Search | done 2026-10-26: "du lieu" and "dữ liệu" return the Discord post on production; per-locale index, no cross-locale leak ([PR #5](https://github.com/khanhnguyendev/engineering-reader/pull/5)) | Vietnamese diacritic query returns the right post |
| M5 Pipeline contract | done 2026-10-27: `docs/pipeline.md`, validator rules, dry-run fixture PR #7 passed `ci` and Vercel with no human commit, label from CI ([PR #6](https://github.com/khanhnguyendev/engineering-reader/pull/6)) | fixture PR passes CI unchanged |
| M6 Pipeline | built 2026-10-27; routine scheduled (Mon/Wed/Fri 08:00 ICT), blocked until the cloud environment allows the feed hosts (needs Ryan, see HANDOFF); then shadow mode, `pnpm shadow-status` | shadow-status reports exit condition met |
| M7 Craft pass | done 2026-10-27: finish review ship on every surface group (posts, listings, about/search/404), both themes, 390 and 1440; Lighthouse mobile a11y 100 ([PR #9](https://github.com/khanhnguyendev/engineering-reader/pull/9)) | finish review ships on every surface |
| M8 Domain and launch | in progress: pipeline contract v1.1 merged (PR #11); 3 posts live + 3 in pipeline PR #10; site name, domain and redirect wait on Ryan | every v1 item ships |
