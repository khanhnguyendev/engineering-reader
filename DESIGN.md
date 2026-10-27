---
name: Engineering Reader
description: "Lessons from big systems, for small teams: a bilingual two-layer case reader on a navy docs grid."
colors:
  ground: "#0a111c"
  grid: "rgba(110, 231, 183, 0.07)"
  ink: "#eef0f1"
  ink-2: "#d4d9db"
  muted: "#9aa5ad"
  hairline: "rgba(148, 197, 180, 0.17)"
  hairline-strong: "rgba(148, 197, 180, 0.34)"
  panel: "rgba(255, 255, 255, 0.025)"
  panel-2: "rgba(255, 255, 255, 0.04)"
  accent: "#6ee7b7"
  accent-ink: "#04070a"
  ground-light: "#f2f4f3"
  grid-light: "rgba(15, 122, 90, 0.07)"
  ink-light: "#111827"
  ink-2-light: "#374151"
  muted-light: "#55606b"
  hairline-light: "rgba(15, 122, 90, 0.2)"
  hairline-strong-light: "rgba(15, 122, 90, 0.4)"
  panel-light: "#ffffff"
  panel-2-light: "#fbfcfb"
  accent-light: "#0f7a5a"
  accent-ink-light: "#ffffff"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  display-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  dek:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
  small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  numeral:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.08em"
  ref:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.78em"
    fontWeight: 400
    letterSpacing: "-0.02em"
rounded:
  inline: "4px"
  tag: "6px"
  segment: "7px"
  panel: "10px"
  full: "9999px"
spacing:
  hair: "1px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  grid: "40px"
  column: "720px"
  rail: "260px"
  container: "1200px"
components:
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "16px"
  panel-lg:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "24px"
  section-panel-lg:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "28px 32px"
  key-number-cell:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.panel}"
    padding: "16px"
  callout:
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  chip:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.tag}"
    padding: "3px 8px"
  chip-link:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.tag}"
    padding: "3px 8px"
  chip-link-hover:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
  chip-muted:
    textColor: "{colors.muted}"
    rounded: "{rounded.tag}"
    padding: "3px 8px"
  monogram:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    size: "32px"
  monogram-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    size: "24px"
  monogram-index:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    size: "40px"
  post-card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "16px"
  post-card-hover:
    backgroundColor: "{colors.panel-2}"
  search-input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "12px 16px"
  search-result-row:
    textColor: "{colors.ink}"
    padding: "16px 0"
  page-intro:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
  page-intro-dek:
    textColor: "{colors.ink-2}"
    typography: "{typography.dek}"
  section-heading:
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
  mono-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  deep-divider-label:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  ref:
    textColor: "{colors.accent}"
    typography: "{typography.ref}"
  button-outline:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.panel}"
    padding: "10px 12px"
  button-outline-hover:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
  segment-option:
    textColor: "{colors.muted}"
    rounded: "{rounded.segment}"
    padding: "6px 8px"
  segment-option-pressed:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
  toc-link:
    textColor: "{colors.muted}"
  toc-link-active:
    textColor: "{colors.accent}"
  skip-link:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.panel}"
    padding: "8px 12px"
  code-inline:
    backgroundColor: "{colors.hairline}"
    rounded: "{rounded.inline}"
    padding: "2px 4px"
---

# Design System: Engineering Reader

## Overview

**Creative North Star: "The Case File on the Grid"**

Every page is a case file laid on a faint drafting grid: a navy (dark, default) or paper (light twin) ground ruled every 40px, with the document set on it in quiet translucent panels. The file has two layers. The top layer is structured and stands alone on a phone: title over a single mint rule, a dek, three sourced number cells, a TL;DR panel and the one mint-edged "for a small team" callout. A mono divider ("ĐỌC SÂU · n PHÚT" / "DEEP READ · n MIN") marks where the second layer, the story, begins in a column of section panels.

The look is the dark developer-docs convention (user-pinned "Neon on Navy, carded") executed with restraint: one accent, hairlines instead of shadows, Inter for everything that is read and JetBrains Mono only for what is counted, cited or labeled. Differentiation comes from content structure, not ornament, so the system stays flat and quiet and lets numbers and references carry the accent. The light theme is a first-class twin built from the same roles, not an inversion: paper ground, white panels lifting off it, the mint darkened to a forest green that passes contrast.

Density is reading density: a 720px column, 17px body on phones and 18px from 1024px, line heights of 1.65 to 1.7 to leave room for stacked Vietnamese diacritics. On desktop a 260px sticky rail carries the author card, the table of contents with its mint active item, and the share control.

**Key Characteristics:**
- Navy or paper ground with a 40px hairline grid at 7% accent opacity.
- One accent (mint in dark, forest green in light); it never changes per company or topic.
- Flat: depth is panel tint and hairline, never shadow, glow or gradient fill.
- Inter for prose and headings; JetBrains Mono for numbers, references and short uppercase labels.
- Two-layer post anatomy separated by a mono deep-read divider.
- Three border roles: hairline, panel, callout.

## Colors

A cool, near-monochrome ground and ink scale with a single mint accent, defined once as roles and set twice (dark default, light twin).

### Primary
- **Signal Mint** (accent, dark): the only chromatic voice. Title rule (1px), the callout edge, tint and heading, inline references and source ids, the deep-read divider label, the active TOC item, the reading-progress bar (2px), the author avatar letter, link-hover underline, focus ring and text selection.
- **Forest Mint** (accent-light): the same role in the light theme, darkened for 4.8:1 on the paper ground and 5.3:1 on white panels.
- **Accent Ink** (accent-ink / accent-ink-light): text on a solid accent fill; used only by selection and the skip link.

### Neutral
- **Night Navy** (ground) / **Cool Paper** (ground-light): the page ground under the grid.
- **Grid Mint** (grid / grid-light): the 40px ground lines; the accent at 7% opacity.
- **Ink** (ink / ink-light): titles, headings, body, numbers.
- **Ink Secondary** (ink-2 / ink-2-light): dek, tag text, labels and supporting copy inside cells, blockquotes, the current breadcrumb.
- **Muted Slate** (muted / muted-light): meta, breadcrumbs, mono labels, inactive TOC items, list markers, the AI-drafting line.
- **Hairline** (hairline / hairline-light): panel borders, header rule, separators, figure rules inside sections, inline-code tint.
- **Strong Hairline** (hairline-strong / hairline-strong-light): outlined controls (tags, share, theme toggle), the divider rules, link underlines at rest, the avatar ring, the blockquote edge, the scrollbar thumb.
- **Panel / Panel Raised** (panel, panel-2 and their light twins): a barely-there white veil in dark (2.5% and 4%); solid white and near-white in light, where panels lift off the paper ground. Panel-2 is for key-number cells, pressed and hover states and the targeted source.

### Named Rules
**The One Accent Rule.** The page has exactly one accent hue per theme. Company colours appear only on the monogram letter (mixed toward ink); no secondary or status hues enter the reading surface.

**The Twin Rule.** Every colour is a role with a dark value and a light value. A new surface adds a role to both themes (and the no-JS `prefers-color-scheme` block) or adds nothing.

**The Accent-Means-Signal Rule.** The accent marks what is cited, current, focused or the one action for the reader. It is never a background fill for a panel or a decorative wash.

## Typography

**Body Font:** Inter (with system-ui, sans-serif), loaded with the latin and vietnamese subsets.
**Display Font:** Inter at weight 700, tracked -0.02em.
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace), latin, latin-ext and vietnamese subsets.

**Character:** a neutral, highly legible sans for long-form Vietnamese and English, paired with a monospace that reads as instrument data: numbers, citations and labels look measured, everything else reads as prose.

### Hierarchy
- **Display** (700, 25px phone, 40px from 1024px, line-height 1.25 / 1.18, balanced): the post title and every list-page H1 (PageIntro), always followed by the 1px accent rule.
- **Headline** (700, 20px phone, 26px from 1024px): section H2s inside deep-layer panels and list-page section headings (SectionHeading); Lessons and Sources use 20px / 24px.
- **Title** (700, 15 to 19px): top-layer block headings (TL;DR, the callout heading), H3s inside sections (17px / 19px), PostCard titles (17px) and the company and topic shelf titles (17px / 19px).
- **Dek** (400, 16px phone, 19px from 1024px, line-height 1.6, ink-2): the one-line summary under the title rule, on posts and on every list page (PageIntro).
- **Small** (400 or 600, 15px, line-height 1.4 to 1.6): supporting text one step under body: the byline, the series-nav title and neighbour links, shelf deks on the topics page.
- **Body** (400, 17px phone, 18px from 1024px, line-height 1.65 / 1.7): prose and lists, column capped at 720px.
- **Meta** (400, 12 to 14px): breadcrumbs, TOC links (14px), source details (14px), PostCard company name and key-number label (13px), chips and tags (12px).
- **Numeral** (JetBrains Mono 600, 15px phone row, 18px from 640px, 24px from 1024px, -0.02em): key-number values; the PostCard's lead number sits at 18px.
- **Label** (JetBrains Mono 400, 11px, 0.08em, uppercase): nav items, TOC heading, share, language switch, source type lines; the deep-read divider label opens to 0.12em.
- **Ref** (JetBrains Mono, 0.78em of its context, accent): inline `[S1 locator]` references and the ref under each key number.

### Named Rules
**The Ramp-Is-Closed Rule.** Sizes come from the ramp above: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 25, 26, 40px. A new surface picks a step; it does not add one.

**The Mono-Is-Measured Rule.** JetBrains Mono is used only for numbers (key numbers, dates, reading time, locators), references and short uppercase labels. Never for a heading, a sentence or a paragraph.

**The Diacritics Rule.** Body line height stays at 1.6 or more and every face loads its vietnamese subset; a font without Vietnamese coverage does not enter the system.

## Layout

The ground is a 40px square grid drawn in the grid colour on every page. Content sits in a 1200px container with 16px side gutters (24px from 640px). From 1024px the post becomes two columns: a reading column up to 720px and a 260px rail that sticks 32px from the top, 40px apart; below 1024px the rail disappears and a collapsed TOC panel sits under the deep-read divider.

The post is a fixed vertical sequence: breadcrumb, tag row, title, accent rule, dek, meta line, key numbers, TL;DR panel, the callout, the deep-read divider, (phone) TOC, section panels, then Lessons, Sources and byline, each set off by a top hairline rather than a panel. From 1024px the rail card names the author, so the end byline shows below that width only; the AI-drafting line under Sources is always visible. The header tag row holds only the three plain chips; the post's own tags close the article as a "Tags" SectionHeading and CHIP_LINK chips (name only) to their tag pages, just before Related.

Key numbers are stacked rows (value | label | ref) on phones and become 2 to 4 equal cells from 640px. Spacing is a small step scale (6, 8, 12, 16, 24, 32px); panels pad 16px on phones and 24px from 1024px (section panels 28px by 32px); blocks are 12 to 16px apart inside the top layer and 40px before end matter.

List pages (home, companies, topics, tags, series, about) open with PageIntro in a 720px measure. Home, companies, topics, tags and series then set their sections off by SectionHeading rows 40px (56px from 1024px) apart; on the company, topic and tag pages the posts H2 is screen-reader only, and their dek is a sentence ("2 posts that name Kafka."). About is the exception: its sections are `.panel` blocks like a post's section panels, under the same PageIntro, with no SectionHeading rows. Case lists are PostLists: two-up from 640px by default, three-up from 1024px only for the home "Start here" row, 16px gaps, one column on phones. A list with exactly one card is one column capped at 720px at every width. A post ends with the series nav panel (when it belongs to a series) and a "Related" PostList, 32px and 48px below the preceding block.

### Named Rules
**The Two-Layer Rule.** Every post renders its structured top layer, then the mono deep-read divider, then the prose layer. Nothing from the deep layer moves above the divider, and the top layer must stand alone in one phone screen and a short scroll.

**The 40px Ground Rule.** The grid is the ground of every page, set on the body, never re-drawn inside a panel, never resized per surface.

## Elevation & Depth

The system is flat. There are no box-shadows, glows or gradient fills anywhere; depth is a two-step tonal layer (panel, then panel-2) bounded by a hairline. In the dark theme panels are translucent veils over the grid; in the light theme they are white and near-white sheets that lift off the paper ground by tone alone. The only fixed layer is the 2px reading-progress bar at the top edge.

### Named Rules
**The No-Shadow Rule.** No box-shadow, text-shadow, glow or gradient fill. If something needs to stand forward, it moves from panel to panel-2 or gains a hairline-strong border.

**The No-Nesting Rule.** Panels never nest. Code blocks, Mermaid diagrams and tables inside a section panel lose their box and are set off by a hairline above and below; they get a bordered box only outside a panel.

## Shapes

One radius does almost all the work: 10px on panels, the callout, cells, code and diagram boxes outside sections, the share button and the theme toggle frame. Chips are outlined at 6px, the pressed toggle segment at 7px, inline code at 4px; only the author avatar is a full circle. The company monogram is the one 6px exception to the 10px container radius: a small rounded square (24px in a card, 32px on the home company row, 40px on the companies index) that reads as a mark, not a panel. Borders are 1px throughout, in three roles: hairline (structure), hairline-strong (interactive outlines and the divider), and the callout's accent edge. Figures inside sections are square, rule-bounded strips. The Mermaid fallback is the one dashed border, signalling a missing render.

### Named Rules
**The Three Borders Rule.** A border is a hairline (structure), a strong hairline (something you can press or a divider), or the callout. There is no fourth border role.

**The One Callout Rule.** The callout is the only accent-bordered block on a page, and a post has one: "Cho team nhỏ" / "For a small team".

## Components

### Buttons
Outlined, quiet and labeled in mono; they never take a solid accent fill.
- **Shape:** gently rounded (10px), 1px strong-hairline outline.
- **Outline (share):** full rail width, mono label in ink-2, 10px by 12px padding; hover lifts to panel-2 with ink text over 150ms; the label swaps in place to "copied" or "failed" for 2s.
- **Segmented (theme toggle):** a 10px outlined frame with 2px inset holding two short-word options; the pressed option sits on panel-2 in ink, the other is muted.
- **Focus:** a 2px accent outline at 2px offset on every focusable element.

### Chips
One strong-hairline base for every chip: transparent fill, 1px strong-hairline outline, 6px radius, Inter 12px (line-height 1.35), 3px by 8px padding. Three variants share it.
- **CHIP (plain):** ink-2 text, static; the post tag row's company, topic and case type, and the topic label in a PostCard footer.
- **CHIP_LINK:** a link carrying a name and a count, 8px apart on the baseline; hover fills panel-2 and lifts text to ink over 150ms. The home topic and tag rows, the tags index and the search browse block use it with a count; the post's own tags use it as a name only, in the end-of-article Tags row.
- **CHIP_MUTED:** a non-link chip with a count, text in muted; used for a zero-count topic on the home row. Tags with no post in the locale are not shown at all (home, tags index) and have no page.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** panel; key-number cells and a targeted source use panel-2.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 16px phone, 24px from 1024px; deep-layer sections 16px phone, 28px by 32px from 1024px.

### Post Card
The case in a list: the whole panel is the link (panel, 10px radius, 1px hairline, 16px padding, 24px from 1024px; hover goes to panel-2 with a strong-hairline border over 150ms). Top to bottom: the title (Title, 17px, ink), the lead key number (mono 18px ink over a 13px muted label) when the post has one, then a footer pinned to the bottom with the company (Monogram at 24px, the name in 13px ink-2, a muted middle dot, the topic as a plain chip) on the left and the mono 12px muted reading time on the right. Nothing sits above the title: no eyebrow, no kicker.

### Post List
A grid of Post Cards on a 16px gap: one column on phones, two-up from 640px, three-up from 1024px only where the caller asks (the home "Start here" row). A locale with no posts shows a single muted line, never an empty box.

### Search
A quiet field over a hairline list: no panels, no highlight, no excerpt. The search page is a 720px measure under PageIntro.
- **Input:** full width, panel fill, 1px strong-hairline border, 10px radius, 12px by 16px padding, text in 17px ink, placeholder in muted, accent caret. The WebKit cancel glyph is removed. Focus is the system accent ring (2px, accent).
- **Status line:** an aria-live line under the input that renders only after a search and takes no space while idle. Only the results count and "searching" are a mono label in muted (Label role). The empty, unavailable and error sentences are Inter 15px ink-2 (line-height 1.55, 16px above), because they are sentences, not measurements.
- **Result row:** an ordered list closed by hairlines; each row sits between a top hairline and the next, 16px (20px from 1024px) vertical padding, 12px between parts. In order: the title (Title role, 17px 700, ink, balanced) as the link; the lead key number in mono 18px 600 ink over its 13px muted label (omitted when the post has none); the summary in 15px ink-2, capped at 65ch; a footer of the 24px Monogram and the company name in 13px ink-2. The row never shows a Pagefind excerpt; it is built from result metadata only.
- **Row link:** the title link is stretched over the whole row by its `::after`, which extends 8px past the row on each side. Hover is the title's accent underline (offset 4px, 150ms) and nothing else; there is no hover fill. Keyboard focus draws a rounded 10px, 2px accent outline at 2px offset on that `::after`, so the ring wraps the row.
- **Browse block:** while idle and after a search with no match, a 15px ink-2 lead-in line, then the non-empty topics only, as CHIP_LINK with a mono 12px muted count. The block leaves the page while results or the searching line show.

### Topic Shelf
The topics index renders each topic as a panel link (title, shelf dek, count). A topic with no posts is the muted variant: the same panel as a non-link `div`, no hover, title and dek in muted and the "0 posts" line kept. Its page still exists and shows the empty state.

### Figure Caption
A Mermaid figure may carry a caption, set in the fence meta (```` ```mermaid caption="…" ````): Inter 13px, line-height 1.45, muted, 8px under the diagram, inside the figure. It describes what the figure shows; it adds no number or claim. The render hash covers the diagram source only, so a caption edit never re-renders the SVG. No caption, no element. The SVG is centred and never wider than its box.

### Monogram
A company mark: a rounded square (6px) on the panel tint with a 1px hairline border; the border never takes colour. The initial is Inter 700 at half the box. With a brand colour the letter alone is tinted, mixed toward ink by `--monogram-mix` (85% brand in dark, 70% in light) so every brand clears contrast on the panel; without one, or on the home company row, the letter is plain ink.

### Page Intro
The head of every list page: the H1 (Display, 25px phone, 40px from 1024px, Inter 700, balanced, ink), then one 1px accent rule, then an optional dek in ink-2 (16px, 19px from 1024px). It never carries an eyebrow, a count badge or a brand colour; the rule is the page's only accent mark.

### Section Heading
An H2 row (Headline, 20px, 26px from 1024px) with an optional right-aligned mono "all" link in muted that turns ink on hover. Nothing sits above the heading. The home By company, By topic and By tag rows carry it ("All companies", "All topics", "All tags"), with no arrow glyph. By tag is the last home section: the tags that have posts, most used first, as CHIP_LINK.

### Navigation
- **Header:** brand in Inter 600 ink, four mono-label links (companies, topics, about, search) in muted that turn ink on hover; the item for the current section carries `aria-current="page"` and sits in ink, the language switch (`VI | EN`, current in ink) and the theme toggle; a hairline rule closes it. On phones the nav wraps to its own full-width line.
- **TOC rail:** a panel with a mono label heading and 14px links in muted; the section on screen is accent and medium weight, changing colour over 150ms.
- **TOC (phone):** a collapsible panel whose mono summary carries a 12px chevron that rotates 180° over 200ms.
- **Breadcrumb:** 13px muted, current page in ink-2, truncated.
- **Skip link:** the one solid accent fill, accent-ink text, revealed on focus.

### Series Nav
A panel under the post: the series title in Small 600 with a mono "part i of n" in muted, a right-aligned mono link to the series index (strong-hairline underline that turns accent on hover), and below a hairline the previous and next case titles in Small ink, each over a mono muted "previous" or "next" label; the underline appears in accent on hover. It renders only for a post that is listed in a series.

### Callout (signature)
The "for a small team" block: accent tinted at 7% over the ground, 1px border of accent at 35%, a 3px solid accent left edge, 10px radius, 16px (24px from 1024px) padding, heading and list markers in accent, body in ink.

### Key-Number Cell (signature)
A panel-2 cell holding the mono value in ink, an Inter label in ink-2 and an accent `[S1]` reference pinned to the bottom; rows on phones, 2 to 4 equal cells from 640px.

### Deep-Read Divider (signature)
Two strong-hairline rules flanking an accent mono label, 11px, 0.12em, uppercase, carrying the deep-read minutes.

### Inline Reference
Mono at 0.78em in accent, `[S1 locator]`, with the `[S1` part unbreakable; underline appears on hover at a 3px offset. It jumps to the source entry, which highlights on panel-2 with a strong-hairline outline.

### Section Permalink
A muted mono `#` after each H2, hidden until the heading row is hovered or focused (fade over 150ms), shown at 60% on touch devices.

## Do's and Don'ts

### Do:
- **Do** take every colour from a role token and set it in both themes and the no-JS light block.
- **Do** keep the accent to signals: the title rule, refs, the active TOC item, the divider label, focus, selection, progress and the one callout.
- **Do** set numbers, dates, reading time, locators, refs and short uppercase labels in JetBrains Mono; set everything else in Inter.
- **Do** separate figures inside a panel with a hairline above and below (12px vertical padding, 16px margin).
- **Do** use the 10px radius for every container and outlined control unless it is a chip or a company monogram (6px).
- **Do** build every chip from the one strong-hairline base: plain, link with count, or muted for a zero count that is not a link.
- **Do** open every list page with PageIntro (H1, one accent rule, ink-2 dek) and put a card's company in its footer.
- **Do** put a company's brand colour on the monogram letter only, mixed toward ink by `--monogram-mix`.
- **Do** mark the current header item with `aria-current="page"` and ink.
- **Do** render the top layer, the mono deep-read divider, then the deep layer, in that order.

### Don't:
- **Don't** add a second accent hue, per-company page colours, or status colours to the reading surface.
- **Don't** use box-shadows, glows, or gradient fills; the 1px title rule is a flat accent line.
- **Don't** put a panel, bordered code block, diagram box or table box inside another panel.
- **Don't** give any block other than the one callout an accent border.
- **Don't** set headings, sentences or paragraphs in mono.
- **Don't** place eyebrow or kicker labels above titles or card titles; the tag row is the only element between breadcrumb and a post title, and the company row lives in the card footer.
- **Don't** tint a monogram border or fill with a brand colour, or let a brand colour touch anything but the monogram letter.
- **Don't** link a chip that has nothing to open; a zero-count chip is the muted, non-link variant.
- **Don't** add a font size outside the ramp, or a fourth chip look.
