# Roadmap
Spec: docs/superpowers/specs/2026-10-21-engineering-reader-design.md §10.

| Milestone | Status | Done when |
|---|---|---|
| M0 Repo and contract | done 2026-10-21 ([PR #1](https://github.com/khanhnguyendev/engineering-reader/pull/1)) | `pnpm build` fails on a bad post, passes on the three fixtures |
| M1 Read a post, deploy | done 2026-10-22: finish review ship, final branch review fixed, three posts live at https://engineering-reader.vercel.app ([PR #1](https://github.com/khanhnguyendev/engineering-reader/pull/1)) | three posts live, Impeccable finish review ships |
| M2 Wayfinding | done 2026-10-22: every IA route 200 in both locales, localized 404, finish review ship ([PR #2](https://github.com/khanhnguyendev/engineering-reader/pull/2)) | every IA route resolves in both locales |
| M3 Discoverability | done 2026-10-22: Rich Results Test valid Article (vi + en), OG debugger correct cards, sitemap/feeds/llms.txt/.md live ([PR #3](https://github.com/khanhnguyendev/engineering-reader/pull/3), follow-up PR #4) | rich-results and OG debugger correct for both locales |
| M4 Search | done 2026-10-26: "du lieu" and "dữ liệu" return the Discord post on production; per-locale index, no cross-locale leak ([PR #5](https://github.com/khanhnguyendev/engineering-reader/pull/5)) | Vietnamese diacritic query returns the right post |
| M5 Pipeline contract | next | fixture PR passes CI unchanged |
| M6 Pipeline | planned | shadow-status reports exit condition met |
| M7 Craft pass | planned | finish review ships on every surface |
| M8 Domain and launch | planned | every v1 item ships |
