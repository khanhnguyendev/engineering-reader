# Repo setup

Executed by the controller with `gh` (Task 7b). Remaining items need a human or a later task.

Repo: https://github.com/khanhnguyendev/engineering-reader (public, personal).

## Done

- [x] Public repo `khanhnguyendev/engineering-reader` created and pushed
- [x] Branch protection on `main` requiring the check `ci`, no force push
- [x] Labels: `pipeline`, `content`, `needs-source`, `clean`, `needs-human`
- [x] Milestones M0 to M8
- [x] Draft PR #1 from `m0-m1/foundation`

## Remaining

- [x] Vercel project link and `NEXT_PUBLIC_SITE_URL` env var (Task 16; via CLI if authenticated, else `needs-human`)
- [x] Enable Vercel Analytics (confirmed: /_vercel/insights/script.js returns 200 on production, 2026-10-22)
- [ ] Project board with fields Milestone (M0 to M8), Type (code, content, pipeline, design), Locale (vi, en, both)
- [ ] One issue per milestone bullet
