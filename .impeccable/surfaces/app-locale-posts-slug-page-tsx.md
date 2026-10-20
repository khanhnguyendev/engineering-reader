---
version: 1
slug: "app-locale-posts-slug-page-tsx"
primary_target: "app/[locale]/posts/[slug]/page.tsx"
related_targets: []
---

# Surface: post page (/[locale]/posts/[slug])

Mode: Read. Audience: Vietnamese mid-level dev, phone skim first (2 min), laptop deep read second. Job: design review / interview prep. Content: top layer (title, summary, 2-4 key numbers with refs, TL;DR, Cho team nhỏ, in that order), deep layer (story H2s, Mermaid, inline refs), Lessons, Sources. Constraints: static Next.js, Vercel free tier, Vietnamese diacritics, no source images.

## Direction contract

THESIS: The post is a two-layer document on a dark docs ground: a phone reader gets the whole case above a labeled divider, a laptop reader gets the story below it. It refuses the reverse-chron dev-blog shape where the top of the page is a hero image and a date.

OWN-WORLD: Navy #0a111c ground with a 40px mint hairline grid at 7% opacity; one accent, mint #6ee7b7; ink #eef0f1, secondary #d4d9db, muted #9aa5ad; hairlines rgba(148,197,180,.17), panels rgba(255,255,255,.025-.04) with 8-10px radius; Inter for text, JetBrains Mono for labels, refs, numbers; outlined pill tags; mint-left-border callout as the only accent-bordered block; a mono divider "ĐỌC SÂU · n PHÚT" between layers. Light theme is a first-class twin built from the same tokens (paper ground, same grid at low opacity, same single mint-derived accent darkened for contrast, same hairline and panel roles); default follows prefers-color-scheme. With all content removed: navy grid, one mint rule under the title, three muted cells, one mint callout, one mono divider.

STORY: The reader lands from a shared link, sees company, title, three sourced numbers and a second-person "for a small team" box without scrolling past one screen; understands the case is worth a return; the divider tells them where the deep read starts; the TOC rail (desktop) and Sources at the end let them verify.

FIRST VIEWPORT (390 wide): top bar (brand, nav, locale); breadcrumb; mono label "BÀI VIẾT" + pill tags; title 24px/700 with mint gradient rule; dek; author meta (avatar, Ryan, date, read time); three muted number cells with ref; "Tóm tắt" panel; mint callout "Cho team nhỏ"; mono divider; first deep-layer H2 panel begins. Desktop (1440): 720px column left, 260px sticky rail right (author card, TOC with active mint, share), top layer identical.

FORM: User-pinned direction "Neon on Navy, carded" (200lab convention), chosen over the roll on seed key b304d227, re-roll round 1; not on the grounded list; the canon exit taken by the user.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved
- Craft bar: Linear, Stripe blog / Stripe Press, fly.io blog (confirmed 2026-10-21).
- Site name and domain.
- Home page and company/topic pages inherit this world; their composition is a later surface round.
