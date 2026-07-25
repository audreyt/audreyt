---
version: alpha
name: Civic Broadsheet
description: Editorial, multilingual long-form site for Audrey Tang's speeches, essays, and testimonies. Cream paper, ink type, sparing gold, set in Spectral + Source Sans 3 with Iansui/Kaiti TC siblings for zh-TW and Noto Serif/Sans JP for ja.
colors:
  primary: "#0f1923"
  secondary: "#5a6577"
  tertiary: "#7d6430"
  neutral: "#faf8f5"
  ink: "#0f1923"
  slate: "#5a6577"
  gold: "#7d6430"
  gold-light: "#c9a961"
  teal: "#2a7f8a"
  paper: "#faf8f5"
  warm: "#f4f1ec"
  surface: "#ffffff"
  text: "#2c3e50"
  muted: "#5f6a7d"
  border: "#e0ddd7"
typography:
  display-hero:
    fontFamily: Spectral
    fontSize: 6rem
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: -0.025em
  display:
    fontFamily: Spectral
    fontSize: 5rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline:
    fontFamily: Spectral
    fontSize: 2.8rem
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: -0.01em
  chapter-title:
    fontFamily: Spectral
    fontSize: 1.6rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  subtitle-italic:
    fontFamily: Spectral
    fontSize: 1.55rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.01em
  pullquote:
    fontFamily: Spectral
    fontSize: 1.9rem
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
  lede:
    fontFamily: Spectral
    fontSize: 1.2rem
    fontWeight: 400
    lineHeight: 1.85
  body-lg:
    fontFamily: Spectral
    fontSize: 1.1rem
    fontWeight: 400
    lineHeight: 1.85
  body-md:
    fontFamily: Spectral
    fontSize: 1.05rem
    fontWeight: 400
    lineHeight: 1.7
  name-lockup:
    fontFamily: Spectral
    fontSize: 1.02rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  eyebrow:
    fontFamily: Source Sans 3
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.2em
  crumb:
    fontFamily: Source Sans 3
    fontSize: 0.66rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.1em
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  2xl: 80px
  3xl: 120px
  gutter: 24px
  margin-mobile: 24px
  margin-desktop: 80px
  scroll-padding-top: 90px
rounded:
  xs: 3px
  sm: 4px
  full: 9999px
components:
  nav:
    backgroundColor: "#faf8f5"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    padding: 16px
  nav-link-hover:
    textColor: "{colors.gold}"
  hero:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    padding: 120px
  hero-label:
    typography: "{typography.eyebrow}"
    textColor: "{colors.gold-light}"
  lang-toggle:
    backgroundColor: "rgba(15,25,35,0.65)"
    textColor: "#ffffff"
    rounded: "{rounded.xs}"
    padding: 6px
  lang-toggle-scrolled:
    backgroundColor: "#faf8f5"
    textColor: "{colors.muted}"
    rounded: "{rounded.xs}"
  site-header:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    padding: 18px
  site-header-name:
    typography: "{typography.name-lockup}"
    textColor: "{colors.ink}"
  site-header-crumb:
    typography: "{typography.crumb}"
    textColor: "{colors.muted}"
  chapter-title:
    typography: "{typography.chapter-title}"
    textColor: "{colors.ink}"
  pullquote:
    typography: "{typography.pullquote}"
    textColor: "{colors.ink}"
  interlude-warm:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.text}"
    padding: 88px
  interlude-dark:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    padding: 88px
  closing:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    padding: 100px
  colophon:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.muted}"
    padding: 72px
  link:
    textColor: "{colors.teal}"
  link-hover:
    textColor: "{colors.gold}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  card-meta:
    textColor: "{colors.slate}"
    typography: "{typography.body-md}"
  skip-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 8px
  divider-hairline:
    backgroundColor: "{colors.border}"
    height: 1px
---

# DESIGN.md — Civic Broadsheet

Both the design system *and* the repo guide for `cyberambassador.tw` and its mirror `audreyt.org`. New essays, new speeches, and new components should land inside the conventions described here.

## Overview

A literary broadsheet that happens to be a website. Long-form testimony and essays sit on cream paper, in a single literary serif (Spectral) that carries both display and body, with a single warm-metal accent (gold) used sparingly enough that it still reads as ceremonial. The CJK companion type stacks (Iansui for zh-TW, Noto Serif JP for ja, with a brush-script Kaiti TC reserved for emphasis) mirror the same gravitas in Mandarin and Japanese, so all three language modes feel like they were typeset by the same editorial hand rather than translated through a templating engine.

The atmosphere is *quiet civic*: generous whitespace, deliberate asymmetry, the occasional always-dark island (`hero`, `interlude--dark`, `closing`) used to mark a turn in argument the way a chapter break does in a printed essay. Animations are present but restrained — staggered `fadeUp` reveals on first paint, a slowly orbiting hero emblem, scroll-triggered `.reveal` for chapter blocks. No bouncing, no parallax theatrics. The work is the work; the chrome stays out of the way.

The site has **no frameworks**, **no bundler**, and a **strict CSP** with SHA-256 hashes for every inline script and style. Page weight and decoding are budgeted carefully (`avif` → `webp` → `jpg` negotiation, two-stage font loading, CSS-only LQIP). Treat that minimalism as a feature: if a change adds a runtime dependency, it almost certainly does not belong here.

## Colors

The palette is rooted in a single warm neutral, a single deep neutral, and one accent. Everything else is a tuned utility tone.

- **Primary / Ink (#0f1923):** The page's voice — headlines, body type, and the *always-dark surface* used by `.hero`, `.interlude--dark`, and `.closing`. Never let dark mode swap this for the cream; those sections hard-code `color: #fff` and depend on this token staying dark.
- **Secondary / Slate (#5a6577):** A cool quiet hue reserved for utility moments where `muted` is too dim and `text` is too warm. Used sparingly.
- **Tertiary / Gold (#7d6430):** The sole interaction colour. Hover for navigation, anchors, and the name lockup. Strong on cream, dignified, never neon.
- **Gold Light (#c9a961):** The companion accent for active states on dark surfaces — selected lang button, `.hero-label`, the `.cc0-mark` border, the dot in `.hero-label`.
- **Teal (#2a7f8a):** Link colour. A blue-green with enough chroma to identify hyperlinks at a glance, faded to ~35% on the underline so the line reads as a hint rather than a stamp.
- **Neutral / Paper (#faf8f5):** Page background. A warm off-white that softens the ink. Pure white is reserved for `surface` (cards) where a hard step up in lightness signals "this is a separate object."
- **Warm (#f4f1ec):** The lifted band — `.bio`, `.interlude--warm`, `.colophon`. One tonal step warmer than paper, enough to register as its own surface without needing borders.
- **Surface (#ffffff):** Card/skip-link surface. The only pure white in the system.
- **Text (#2c3e50):** Body type. Slightly cooler than ink so paragraph copy reads as content, not headline.
- **Muted (#5f6a7d):** Captions, crumbs, colophon copy, secondary metadata.
- **Border (#e0ddd7):** Hairline rules. Warm enough to disappear into paper, dark enough to register when needed.

### Dark mode

The site flips most tokens for `@media (prefers-color-scheme: dark)`, but with **one strict carve-out: `--ink` stays `#0f1923`**. `.hero / .interlude--dark / .closing` use `var(--ink)` as a literal "always-dark surface" name, not a semantic foreground colour, and their text is hard-coded `#fff`. Swapping `--ink` to cream in dark mode renders those sections as white-on-cream and is a regression. See *Do's and Don'ts*.

Dark-mode replacements used by the index template (`src/styles/base.css`):

| Token | Light | Dark |
|:------|:------|:-----|
| paper | `#faf8f5` | `#111820` |
| warm | `#f4f1ec` | `#161e28` |
| surface | `#ffffff` | `#1c2535` |
| heading | `#0f1923` | `#e8e4dc` |
| text | `#2c3e50` | `#b8b4ac` |
| muted | `#5f6a7d` | `#8a96a8` |
| border | `#e0ddd7` | `rgba(255,255,255,0.1)` |
| gold | `#7d6430` | `#c9a961` |
| teal | `#2a7f8a` | `#4bc3d4` |

Stand-alone essay pages (`transparent-horse.html`, `collaborative-immune-system.html`, `good-enough-ancestor.html`) inline an equivalent dark map. **Do not include `--ink` or `--paper-dark-surface` swaps for `.hero / .interlude--dark / .closing`** — they are always-dark by design.

## Typography

Two Latin faces and the CJK companion stacks share the page:

- **Spectral** — the sole Latin face, doing display *and* body. Headlines, hero, pullquote, chapter title, name lockup, and paragraph copy. Weights 300 / 400 / 500 / 600 / 700 with italics at 400–600. Used at sizes from 1.02 rem (name lockup) up to a hero clamp ceiling of 6 rem.
- **Source Sans 3** — utility sans. Navigation, eyebrow labels, breadcrumbs, lang toggle, scroll cue. Weights 400–600.
- **Iansui** — the zh-TW companion for both display and body (`--serif-cjk`, `--cjk`), with PingFang TC / Microsoft JhengHei / Noto Sans TC fallbacks. Self-hosted subsets on the index; Google Fonts on stand-alone essays.
- **Kaiti TC** (`'Kaiti TC', 'DFKai-SB', 'BiauKai', 'STKaiti'`) — a brush-script cursive reserved for `<em>` and `<blockquote>` in zh-TW mode. Substitutes for Latin italic emphasis, which Mandarin does not idiomatically take.
- **Noto Serif JP / Noto Sans JP** — Japanese counterparts. Used on `collaborative-immune-system.html` and any other page that ships a ja mode. Bold (700) substitutes for italic emphasis.
- The **reprint idiom** (`humanist-review.html`, see *Reprint Idiom*) carries its own stack — Noto Serif TC 400–900 for display and body, Spectral as Latin companion, Red Hat Mono for labels — because the host publication's identity leads there.

### Two-stage font loading (index only)

The woven `index.html` serves fonts from **`/fonts/`** (cacheable WOFF2/TTF files at repo root). No Google Fonts on the homepage; CSP `font-src` is `'self'` only.

1. **Preloads (in `<head>`):** `spectral-700.woff2` (nav-logo) and the Iansui **critical** file (`iansui-critical.*` — extension comes from `src/fonts/iansui-index.meta.json`).
2. **Stage 1 CSS (`base.css`):** Spectral 700 for `.nav-logo`, `font-display: block`, `url('/fonts/spectral-700.woff2')`.
3. **Iansui (`iansui.css`):** two non-overlapping `@font-face` rules (critical + rest/index) with `unicode-range` woven from meta; `var(--cjk)` is `'Iansui', …` fallbacks.
4. **Stage 2 (after `<nav>`, `fonts-stage2.css`):** Spectral 300/400/600, Source Sans 3, plus italic faces in `components.css` — all `url('/fonts/…')`.
5. **`fonts-load.js`:** preloads the Iansui rest file after first paint.

Glyph harvest + subset build: `tools/glyph-harvest.ts` (linkedom DOM walk), `tools/build-iansui.ts` (GF `&text=` fetch; detects woff2 vs truetype), `tools/build-fonts.ts`. Manifest SHA-256 in `iansui-index.meta.json`; `weave.ts` substitutes `{{iansui-*}}` placeholders via `tools/iansui-format.ts` **before** CSP hash recompute.

Stand-alone essay pages may still load display faces from Google Fonts where not yet migrated.

### Typography levels

| Token | Usage |
|:------|:------|
| `display-hero` | Stand-alone essay hero (`<header class="hero"> h1`). Clamp ceiling 6 rem. |
| `display` | Index hero. Clamp ceiling 5 rem. |
| `headline` | `section h2`. |
| `chapter-title` | Essay `.chapter-title`. |
| `subtitle-italic` | `.hero-subtitle` on essays and index. |
| `pullquote` | `.interlude blockquote`, `.chapter-body blockquote`. |
| `lede` | `.hero-lede` on essays. |
| `body-lg` | Essay `.chapter-body p` (1.1rem / 1.85). |
| `body-md` | Index `.section p` and default body (1.05rem / 1.7). |
| `name-lockup` | `header.site .name`. |
| `eyebrow` | `.hero-label`, `.section-label`. Always `text-transform: uppercase`, ~0.2em tracking, paired with `gold` or `gold-light`. |
| `crumb` | `header.site .crumbs`. Smaller, tighter tracking than `eyebrow`. |

Font sizes are tokenised in `rem` for clarity, but in CSS they are wrapped in `clamp(min, viewport, max)` so the display sizes scale fluidly. The `rem` value in the YAML is the **upper bound (max)** of that clamp.

### CJK overrides per language

The stand-alone essay pages contain blocks of the form `html:has(#lang-zh:checked) .hero h1 { font-family: var(--serif-cjk); ... }`. When you add a new typography rule, give it the matching `:has(#lang-zh:checked)` and `:has(#lang-ja:checked)` overrides; otherwise zh-TW and ja modes will fall back to the Latin face's CJK fallback (usable but not typeset).

## Layout

A single fluid column, breakpointed at 1024 / 768 / 480 px, with max-widths chosen for the *kind* of content rather than a universal grid:

- **1200 px** — `.nav-content`, `.section` (index hero, sectioned home page). The widest container.
- **860 px** — `.chapter`, `header.site`. The reading lane of essays. Matches the breadcrumb lockup so navigation aligns with prose.
- **800 px** — `.section-narrow`, `.interlude blockquote`.
- **680 px** — `.chapter-body`, `.divider`, `.closing .chapter-body`. The body text lane.
- **640 px** — `.hero-lede`. Slightly narrower than body so the opening paragraph centers visually under the hero h1.
- **620 px** — `.hero-content` (index). Asymmetric: hero portrait occupies the right 65%, content the left 620 px.

### Section padding scale

Stand-alone essays use clamp-based padding throughout (no per-breakpoint overrides for most spacing). Index uses explicit breakpoints because the nav must compress at 1024 / 768.

| Scale | Use |
|:------|:----|
| `xs: 4px` | Micro-rhythm (hero-label dot spacing, cc0-mark internal). |
| `sm: 8px` | Inline gap, lang toggle internal padding (~6–10px). |
| `md: 16px` | Default paragraph margin, gallery gap. |
| `lg: 24px` | Mobile gutter; `header.site` mobile padding. |
| `xl: 48px` | Standard horizontal page padding; `.chapter` padding. |
| `2xl: 80px` | Desktop horizontal page padding; `.nav-content`, `.section`. |
| `3xl: 120px` | Hero vertical breathing room. |

Mobile breakpoints collapse the desktop scale: nav and section paddings drop from 80 → 48 → 24 px at 1024 / 768.

## Elevation & Depth

The system is **predominantly flat**. Depth comes from tonal layering, not shadow:

- `paper` (background) → `warm` (`.bio`, `.colophon`, `.interlude--warm`) → `surface` (cards) is the tonal ladder.
- The always-dark island (`ink` background) is the strongest "depth" signal — a section that is structurally below paper but ceremonially above.

Real shadows are reserved for **state changes only**:

- `nav.scrolled` — `box-shadow: 0 2px 16px rgba(0,0,0,0.06)` (hairline lift on scroll).
- `.nav-links.open` (mobile dropdown) — `box-shadow: 0 8px 24px rgba(0,0,0,0.08)`.
- `.lightbox` (gallery zoom) — heavier modal shadow.
- Dark-mode `.image-illustration img` — `box-shadow: 0 10px 30px rgba(0,0,0,0.35)`.

If a new component "needs a shadow," prefer adding a hairline border in `--border` or tonal step in `--warm` first.

## Shapes

Architectural sharpness throughout. Corner radii are deliberately minimal so the page reads as typography on paper rather than as a UI:

- `xs: 3px` — `.lang-toggle`, `.cc0-mark`, hero `.lang-btn`.
- `sm: 4px` — `.skip-link`, `.lang-toggle` (essays), `.image-illustration img`.
- `full: 9999px` — none used.

Hero portraits, illustration tiles, video posters, and gallery figures are all sharp-cornered. Do not introduce pill shapes or rounded buttons without strong justification.

## Components

Document each by its purpose and the tokens it draws on. New components should compose existing tokens before introducing literal values.

### `nav` (index only)

Fixed top bar. `backdrop-filter: blur(16px)` over `--nav-bg` (paper at 96% alpha). Gains a hairline `border-bottom` and a soft shadow on scroll (`nav.scrolled`). Logo is `name-lockup` weight (700 subset). Links use `body-md`; hover is `gold`.

### `hero` (always-dark)

`background: var(--ink)`, `color: #fff`, `min-height: 100svh`. Composed of:

- `.hero-label` — `eyebrow`, colour `gold-light`.
- `h1` — `display-hero` (essays) or `display` (index).
- `.hero-subtitle` — `subtitle-italic`, colour `rgba(255,255,255,0.6)`.
- `.hero-lede` — `lede`, colour `rgba(255,255,255,0.72)`.
- Decorative: `.hero-year` (huge clamp-sized gold-tinted year, ~3.5% opacity, bottom-right), `.hero-emblem` or `.hero-crystal` (SVG line drawing with a slowly orbiting child ring), `.hero-portrait` (index only, 65% right column).
- Reveal sequence: `fadeUp` animation with staggered `animation-delay` (0.3 → 0.5 → 0.7 → 0.95 s). The `.hero-emblem`/`.hero-crystal` drifts in later (`driftIn` keyframe at 1.6 s).

### `lang-toggle`

Two variants depending on page:

- **Index (`cyberambassador.tw`):** hidden `#lang-zh` — unchecked = EN, checked = 中文. EN print: `html:not(:has(#lang-zh:checked))` except `#publications`. **audreyt.org** index uses `#lang-en` (zh default); do not copy lang selectors across repos.
- **Two-language essays:** hidden `#lang-zh` checkbox + label.
- **Three-language essays (`collaborative-immune-system`):** radio triad `lang-en`, `lang-zh`, `lang-ja`.

Both variants are positioned `fixed; top: 24px; right: 24px;`, render against the hero on the dark background, and switch to a `scrolled` palette via JS once the user moves past the hero (`.lang-toggle.scrolled` swaps to paper background, muted text, with the same active highlighting in `gold`).

### `site-header` (essays)

Top-of-page breadcrumb lockup, links back to `/`. Pattern:

```html
<header class="site">
  <a class="name" href="/">Audrey&nbsp;Tang <span class="cjk">唐鳳</span></a>
  <div class="crumbs">
    <span>Essay Title</span>
    <span class="cjk-tag">
      <span lang="en-GB">Testimony</span>
      <span lang="zh-TW">證詞</span>
      <span lang="ja">証言</span>     <!-- omit if essay is bilingual -->
    </span>
  </div>
</header>
```

CSS in each essay file under `/* ── SITE HEADER (links back to homepage, matching pi.audreyt.org / audreyt.box) ── */`. The `name` uses `name-lockup` typography, the `crumbs` use `crumb`. The header is `max-width: 860px` to align with `.chapter`. It is hidden in print and given a tighter mobile padding at the 768 px breakpoint.

### `chapter`, `chapter-head`, `chapter-body`

Essay narrative block. `.chapter` is 860 px max, padded by `xl`. `.chapter-head` carries the `chapter-num` (large script numeral in serif 300 weight) and `chapter-title` (semibold serif). `.chapter-body` is 680 px max, body type at `body-lg`.

`em` inside `.chapter-body` is **italic in en/ja, brush-script in zh-TW** (`font-family: var(--cursive); font-style: normal`). Blockquotes follow the same substitution.

### `pullquote` / `interlude`

`.interlude` is a full-bleed band between chapters, padded `88px lg`. Two variants:

- `.interlude--warm` — `warm` background, hairline borders top and bottom. For reflective beats inside the narrative.
- `.interlude--dark` — `ink` background, white text. For tonal-shift moments. **Treats `--ink` as always-dark; see *Do's and Don'ts*.**

The blockquote inside is `pullquote` typography, italic in Latin, Kaiti in zh-TW, bold in ja.

### `closing`

The final dark island at the end of each essay. `ink` background, white text, `100px lg` padding. Often paired with `.closing-final` (a centred italic sign-off in `pullquote` typography).

### `colophon`

Page-foot metadata block. `warm` background, `muted` text, `eyebrow` `cc0-mark` (gold border, uppercase). Carries the licence statement and the publication date.

### `card` (index)

Used by `.award-card`, `.case-study`, `.work-item`, `.featured-outlet`. All flat: `surface` or `warm` background, hairline `border`, minimal padding, hover lifts colour or border to `gold` rather than introducing shadow.

### `link`

`color: teal; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);` Hover transitions colour to `gold` over 0.2s.

## Reprint Idiom (humanist-review.html)

`humanist-review.html` introduces a second, deliberately separate page idiom: the **magazine reprint** — a single-language zh-TW translation of a piece published elsewhere, where the host publication's identity (not Civic Broadsheet's) leads the design. It is fully self-contained and lives **outside** the `essay:base` weave: no sentinel comments, its own tokens, its own chrome. To build the next reprint, copy `humanist-review.html` as the skeleton — this section is the map; the file is the template.

### Publication-specific (do not port into Broadsheet essays)

- Palette: coral / peach / plum on warm paper (`--coral`, `--peach`, `--plum`, `--cream`, `--shell`) — The Humanist Review's identity, not ours.
- Type: Noto Serif TC at weight 900 for display, Red Hat Mono for labels.
- The plum always-dark closing band and the vertical-rl finale with Kaiti signature.
- `em` rendered as 著重號 text-emphasis dots — in the reprint's coral. Broadsheet essays choose per page between Kaiti substitution (`good-enough-ancestor`, `collaborative-immune-system`) and gold 著重號 (`transparent-horse`); pick ONE per page, never both.

### Reader aids (now standard on Broadsheet essays)

Originally reprint chrome; per Audrey's 2026-07-21 steer, the reader-aid set is now ported into every Broadsheet essay in the house skin (gold/ink tokens, Source Sans 3 labels). The per-essay `<script>` holds a `SECS` array (`[id, numeral, EN title, zh title(, ja title)]`); the rail and readbar key off it, and the lang-change handler calls `renderLoc()` so titles follow the toggle. All JS-gated and no-JS safe; everything below is print-hidden.

- **rail** — fixed left scrollspy dots with numeral labels (≥1180 px only); every chapter `<section>` carries an `id`.
- **readbar** — floating bottom pill: numeral chip + language-following section title, tabular-nums read %, copy-link (anchors to the current section). Appears past the hero.
- **totop** — round back-to-top button, honours reduced motion.
- **legible contrast** — light `--text` `#2a3644`; dark `--text` `#c9c4bb`, `--muted` `#96a1b2`; `hero-lede` 0.8 / closing body 0.85 / colophon 0.55 white alphas.
- **zh serif body** — zh mode swaps `--serif`/`--serif-cjk`/`--cjk` to `'Noto Serif TC', 'Songti TC', …` (the `--serif` override is REQUIRED — Han glyphs fall through the body's `--serif` before ever reaching `--cjk`), 700 headings, body 1.1rem/2.05 at 0.035em.
- **author block** — signature SVG (`assets/humanist-review-audrey-tang-signature.svg`) linked to `/`, warm band, bilingual/trilingual bio, dark-mode `filter: invert(0.88) sepia(0.14)`; `reveal`-gated before the colophon.
- **favicon** — every essay carries the same three `<link rel="icon">`/`apple-touch-icon` lines as the index and the reprint.
- **divider-mark orbit** — the tiny orrery dot between chapters rotates (36 s linear, `@media (prefers-reduced-motion: no-preference)`); lives in `essay.css` baseline.
- **living hero SVG** — each essay's hero decoration gets a slow breathe + staggered glint set, strictly motion-opt-in (transparent-horse's crystal is the reference).

Still reprint-only (not ported): TOC grid, three-mode theme switcher (Broadsheet stays media-query dark), plink/`:target` flash, ghost numerals, JSON-LD `translationOfWork`.

### Ported back into the Broadsheet: CJK typesetting

The reprint's CJK typesetting craft is idiom-independent and is now part of the shared baseline, not per-essay CSS. It lives in `src/styles/essay.css` under `/* ── CJK TYPESETTING (zh-TW / ja modes) ── */` and is inlined into every essay by pre-commit Phase 3 — new essays inherit it automatically:

- `hanging-punctuation: first allow-end last` on the `:has(#lang-zh:checked)` / `:has(#lang-ja:checked)` root (Safari-only for now).
- `text-spacing-trim: trim-start` on `body` (Chromium 123+).
- `.chapter-body` / `.hero-lede`: `text-align: justify; text-justify: inter-ideograph; line-break: strict`, with `letter-spacing: 0.03em` (zh-TW) / `0.02em` (ja).

The selectors are inert on pages without the matching lang input, and every declaration is a progressive enhancement — unsupporting browsers render exactly as before. The index carries the same treatment in `src/styles/base.css` scoped to its long-prose lanes (`.bio-text`, `.section-narrow p`). Do not re-declare these rules in a per-essay block; the baseline owns them.

### If reprints multiply

At n = 1 the copy-skeleton approach wins. If a second reprint lands, extract the shared chrome into `src/styles/reprint.css` with its own sentinel pair (`/* reprint:base */ … /* /reprint:base */`) and teach pre-commit Phase 3 the second sentinel — the same mechanism as `essay.css`, no new machinery.
### `orrery` — the live instrument (index)

Three mounts share one hand-written WebGL2 point-sprite renderer, `src/scripts/orrery-gl.js` (no library, no bundler — the geometry, the 4×4 maths, and both shaders are in the file):

| Mount | Attribute | Register |
|:------|:----------|:---------|
| Hero | `data-orrery="hero"` on `.orrery--hero` | light on ink — **additive** blend, brass ring + steel dust |
| 6-Pack of Care dial | `data-orrery="care"` on `.care-map-dial` | ink on paper — **premultiplied over**, the cycle turning |
| Footer | `data-orrery="footer"` on `.orrery--footer` | the hero instrument at ¾ density, as a closing bookend |

**Every particle is one orbit.** A single interleaved `STATIC_DRAW` buffer carries `(radius, θ₀, spin, pulse-gain)`, the two basis vectors of the particle's plane, an RGB, `(size, alpha, seed, flare)`, and a group index. The vertex shader integrates the orbit, so a frame is one `drawArrays` and the CPU only touches uniforms. ~4 300 points (hero), ~3 800 (care), ~3 200 (footer).

**Design decisions worth keeping:**

- The civic great circle stays **flat and circular** — it is the favicon mark, and an ellipse would break the brand read. Depth comes from the two armillary bands and the tilted AI orbit, whose planet genuinely passes behind the civic plane once every 48 s.
- **The civic ring is inscribed to the left edge of the frame: `R === cx === 410`.** This is load-bearing geometry, not a look. The hero lockup lives in a *fixed* 80 px gutter, but the orrery is `slice`-scaled, so as the window widens the ring grows while the type does not — at the original `R = 362` the left arc swung up through "CYBER AMBASSADOR" at every width (measured: it needed 371 at 1280 px, rising to 383 at 3440 px, asymptotic to `cx`). With `R = cx` the arc's centre line lands on viewBox `x = 0`, so it can never enter the gutter, and clearance *grows* with width (40 px at 1280, 65 px at 3440). `R` lives in `tools/build-orrery-hero.mjs` (every other radius there is the original hand-tuned drawing scaled by `K = R/362`) and is mirrored by `unit` in `heroSpec`. **Change one and you must change the other**, then re-run `bun tools/build-orrery-hero.mjs`, which nothing else invokes.
- Type still carries its own veil. The AI orbit and the dust shell legitimately pass behind the lockup, so `.hero-content` defines `--hero-veil` / `--hero-veil-soft` (both derived from `--ink`) and every lockup line takes a soft `text-shadow` from them. Invisible against plain ink; it simply lets anything crossing read as *behind* the type. Print strips `text-shadow` wholesale, so it costs nothing there.
- The crack (open upper-right, −68°…−22°, "that's how the light gets in") is baked at build time: particles inside it are never emitted, and their edges are alpha-feathered.
- `u_flow` is a travelling light. Ring particles carry a pulse gain; the shader brightens them by `exp(-Δθ · u_tail)` behind the head. Group **7** takes its angle from `u_flow` instead of its own clock, so the care comet's head is a real bead on the ring rather than a gradient.
- The care dial's four arcs stay **registered with their chips** — this is a diagram before it is a picture. Only the tilt (≈0) and a whisper of pointer parallax give it dimension.
- The diagram narrates itself. `draw()` reports which arc the head has entered (`onArc`); JS toggles `.is-lit` on that pack's chip and its card index. Tint only — no shadow, no movement — because the loop repeats every few seconds; suppressed entirely under reduced motion. Hovering or focusing a chip (or its card) parks the head on that quadrant, blooms its arc and dims the rest; `#care-pack-N` in the URL pins the same state.
- Colour is never hard-coded. `hue()` resolves any CSS expression (`var()`, `color-mix()`) against the mount through a probe element, so token edits and scheme flips carry through; `prefers-color-scheme` changes rebuild the buffer in place.

Tokens live in `orrery.css`'s `:root`: `--orrery-line` / `--orrery-bright` for the instrument, `--care-p1`…`--care-p6` for the six packs, and `--care-spark` — the colour the travelling light drives toward, written as one `color-mix(in srgb, var(--heading) 55%, var(--gold))` so it is dense ink on paper and warm near-white on ink without a media query. `--care-p2` is deliberately *not* bare `--gold-light`: pale gold cannot hold a stroke on cream, so it is pulled 30% toward `--gold`.

**Projection is derived from the SVG it replaces.** `layout()` re-runs the same `viewBox` + `preserveAspectRatio` (`slice` / `meet`) arithmetic, so world radius 1.0 lands exactly on the SVG's ring radius. That is why the hero's `AI · IN · THE · LOOP · OF · HUMANITY` arc-set caption still aligns, and why responsive transforms must be applied to `.orrery-svg` **and** `.orrery-gl` together (see the 768 px and 1024 px blocks in `orrery.css`).

**Fallback contract.** The SVG under each mount is the source of truth. JS adds `.is-live` *only after a context is acquired*; `@media screen` then retires the strata the GPU took over (`.o-civic`, `.o-graticule`, `.o-boundary`, `.o-ai`, `.o-centre`; `.care-map-arc`, `.care-map-field`, `.care-map-centre`). No JS, no WebGL2, print, or a lost context → the engraving comes straight back. Context loss is **not** recovered: GL objects are gone, so the instrument retires for good rather than leaving a blank canvas.

**Motion budget.** `prefers-reduced-motion: reduce` draws exactly one still frame and never starts a rAF (resize and scheme changes redraw that frame). `IntersectionObserver` skips off-screen instruments; `visibilitychange` stops the loop. DPR capped at 2. `gl_PointSize` is clamped to `ALIASED_POINT_SIZE_RANGE` with energy compensation, so halos do not silently thin out on drivers that cap at 63 px.

## Do's and Don'ts

The non-negotiable rules. Most originate from past incidents.

- **Do** treat `--ink` as a literal "always-dark surface" token. **Never** swap it in the dark-mode `:root` block; `.hero / .interlude--dark / .closing` use it as a background and depend on it staying dark. (Regression history: 2026-05 white-on-white hero.)
- **Do** add the `header.site` lockup to every new essay page (see *Components → site-header*). It is the only way a reader gets back to `/` on stand-alone pages.
- **Do** add new inline `<script>` and `<style>` blocks via the weave pipeline (`bun weave.ts`) so their SHA-256 hashes are recomputed in the CSP `<meta>`. **Don't** edit `index.html` directly — it is a generated artefact, and your hand edits will be overwritten.
- **Do** use the `<noscript><img …></noscript>` + upgrade-script pattern for every new image. The JPG inside `<noscript>` is the single source of truth; AVIF / WebP are decoded probes-then-upgrades. **Don't** ship multiple `<source>` markup tags or `loading="lazy"` polyfills.
- **Do** keep new CSS values inside the existing token vocabulary (`var(--ink)`, `var(--gold)`, the typography clamps already used). **Don't** introduce a literal hex or unique font stack without first checking whether an existing token covers the intent.
- **Do** localise new strings into all three modes (en-GB, zh-TW, and ja if the page is trilingual). Use `<span lang="en-GB">…</span>` / `<span lang="zh-TW">…</span>` / `<span lang="ja">…</span>` so the existing CSS `:has(#lang-…:checked)` toggle mechanics show/hide automatically.
- **Don't** introduce a JavaScript framework, a bundler, a CSS preprocessor, or a runtime CDN. The site is hand-authored on purpose.
- **Don't** copy files between `cyberambassador.tw` and `audreyt.org` directly. Always cherry-pick the commit. See *Cross-site Sync* below.
- **Don't** add rounded corners larger than 4 px without a strong, design-justified reason. The system is intentionally sharp-cornered.
- **Don't** add box-shadows outside the state-change list (`nav.scrolled`, `.nav-links.open`, `.lightbox`, dark-mode illustration). Reach for `--warm` tonal lift or a `--border` hairline first.
- **Do** gate every progressive-enhancement layer behind a class the enhancement itself adds (`.is-live` for the WebGL orreries), and scope the "hide the fallback" rules to `@media screen`. **Don't** hide an SVG on the assumption that a canvas will paint — print, no-JS, no-WebGL and lost contexts all have to land on the engraving.
- **Don't** put a `style="…"` attribute in the template. The CSP hashes `<style>` *elements* only; an inline style attribute needs `'unsafe-hashes'` and is silently dropped. Give the element a class (see `.o-symbols`).

---

# Repo Guide

Everything below this line is the operational guide. It is preserved by the DESIGN.md linter as unknown sections.

## Architecture

```
README.md, README.zh-TW.md       ← content source of truth (en-GB / zh-TW) for the woven homepage,
                                   delimited by <!-- section:X --> markers
src/
├── index.template.html           ← skeleton with {{content:X}}, {{style:X}}, {{script:X}},
│                                   {{font:X}}, {{svg:X}}, {{json-ld:X}} markers
├── thumbs.json                   ← dialogue thumbnail metadata
├── styles/
│   ├── base.css                  ← reset, tokens, LQIP, nav, Stage 1 Spectral
│   ├── iansui.css                ← Iansui @font-face ({{iansui-*}} placeholders)
│   ├── fonts-stage2.css          ← Spectral + Source Sans 3 → /fonts/
│   ├── components.css            ← index components, print, italic faces
│   ├── orrery.css                ← orrery + care-map + loop-grammar; .is-live cutover
│   ├── essay.css                 ← essay baseline (pre-commit Phase 3)
│   └── noscript-reveal.css
├── fonts/                        ← *.woff2.b64 inputs; iansui-index.meta.json
└── scripts/
    ├── lang-detect.js
    ├── fonts-load.js             ← preload Iansui rest
    ├── image-probe.js
    ├── image-upgrade.js
    ├── orrery-gl.js              ← WebGL2 point-sprite orrery (hero / care / footer)
    └── structured-data.json
fonts/                            ← committed WOFF2/TTF at /fonts/ (Latin + Iansui)
tools/                            ← build-fonts, build-iansui, glyph-harvest, iansui-format/manifest, build-image-variants
index.html                        ← GENERATED. Do not edit by hand.
collaborative-immune-system.html  ← stand-alone essay (en/zh/ja), single-file
good-enough-ancestor.html         ← stand-alone essay (en/zh), single-file
humanist-review.html              ← stand-alone reprint (zh-TW), reprint idiom — outside essay:base weave
transparent-horse.html            ← stand-alone essay (en/zh), single-file
pi-ds4.html                       ← stand-alone redirect → pi.audreyt.org
weave.ts                          ← homepage build script
pre-commit.ts                     ← LQIP + weave pipeline (symlinked to .git/hooks/pre-commit)
dev.ts                            ← local preview server: watches src/+READMEs, runs weave.ts to rebuild index.html on change (same write as `bun weave.ts`); reload-script injection is response-only, never written to disk
```

The **index** is woven from `README.md` + `src/`; the **essays** are single-file HTML documents that are hand-edited directly. The two architectures coexist deliberately — essays are reading documents that benefit from being one self-contained `.html` per piece (easy to mirror, archive, port). The pre-commit hook does inline `src/styles/essay.css` into each essay (between `essay:base` sentinel comments) so the shared color/typography/header baseline lives in one source-of-truth file, but the deployed essay is still a single self-contained HTML.

## Build Pipeline

```bash
bun weave.ts              # assemble index.html (template + content + CSP hashes)
bun pre-commit.ts --force # full pipeline: LQIP + weave
bun dev.ts                # local preview: watch src/ + READMEs, rebuild + live-reload on :4321
```

The pre-commit hook (`pre-commit.ts`, symlinked from `.git/hooks/pre-commit`) runs automatically:

1. **Phase 1 — LQIP**: recomputes `--lqip` values in `src/styles/base.css` for any changed image (one integer per image, encoding a 3×2 luminance grid + oklab base colour, unpacked by CSS `mod()`/`pow()` into six composited radial gradients — zero network requests).
2. **Phase 2 — Weave**: runs `bun weave.ts` to assemble `index.html`. Triggered by changes to `src/`, `weave.ts`, `README.md`, or `README.zh-TW.md`. Recomputes every inline `<script>` / `<style>` SHA-256 and rewrites the CSP `<meta>` (marked by `<!-- auto-rehashed by pre-commit book -->`).
3. **Phase 3 — Essay weave**: inlines `src/styles/essay.css` into each stand-alone essay HTML, between the `/* essay:base */` and `/* /essay:base */` sentinel comments. Triggered by changes to `src/styles/essay.css` or any essay HTML. Means the shared color tokens, dark-mode block, typography stack, `@keyframes fadeUp`, `.reveal`, and `header.site` lockup all live in one source file rather than three. Per-essay specifics (lang-toggle UI, CJK / ja overrides, hero decorations, print hide list) stay inline in each essay file *after* the closing sentinel.

### Weave template markers

| Marker | Resolves to |
|:-------|:------------|
| `{{style:NAME}}` | Content of `src/styles/NAME.css` |
| `{{script:NAME}}` | Content of `src/scripts/NAME.js` |
| `{{json-ld:NAME}}` | Content of `src/scripts/NAME.json` |
| `{{svg:NAME}}` | Content of `src/svg/NAME.svg` |
| `{{content:NAME}}` | Rendered bilingual HTML from README section `<!-- section:NAME -->` |

After markers resolve, `weave.ts` runs `substituteIansuiPlaceholders()` for `{{iansui-*}}` tokens (from `src/fonts/iansui-index.meta.json`). Index Latin/Iansui use `url('/fonts/…')` in CSS. Legacy `{{font:NAME}}` still expands `src/fonts/NAME.woff2.b64` if used.

`weave.ts` flags: `--skip-font-check`, `--glyph-out=PATH`, `--check-fonts`. Iansui regen: *AGENTS.md*.

`bun tools/build-fonts.ts` decodes Latin `.b64` → `fonts/`; `--regen` fetches Iansui subsets (network).

## Editing Workflow

| Change | File(s) |
|:-------|:--------|
| Index content (bilingual) | `README.md`, `README.zh-TW.md` — delimited by `<!-- section:X -->` |
| Index structural | `src/index.template.html` |
| Index style | `src/styles/*.css` |
| Index script | `src/scripts/*.js` |
| Index font | `src/fonts/*.woff2.b64` (replace the encoded file) |
| Dialogue thumbnails | `src/thumbs.json` (keyed by YouTube video ID) |
| Essay content | The essay's `.html` directly (single source of truth, multilingual via `<span lang="…">`) |
| Essay style (shared) | `src/styles/essay.css` — color tokens, dark-mode block, typography, `@keyframes fadeUp`, `.reveal`, `header.site`. Inlined into each essay by pre-commit Phase 3. |
| Essay style (per-page) | The essay's inline `<style>` *after* the `/* /essay:base */` sentinel — lang-toggle UI, CJK/ja overrides, hero decorations, chapter/interlude/closing tweaks, print rules. |
| New image | Add to `assets/`, generate AVIF and WebP variants, reference inside `<noscript><img …></noscript>` — pre-commit LQIP + weave handles the rest |

### Image format negotiation

Every image is authored once inside a `<noscript>` tag with JPEG `src` / `srcset`:

```html
<noscript><img src="assets/foo.jpg"
     srcset="assets/foo-400.jpg 400w, assets/foo.jpg 800w"
     sizes="…" alt="…" width="800" height="600" loading="lazy"></noscript>
```

A probe script in `<head>` tests AVIF and WebP decode (catches Safari Lockdown Mode, which silently disables these codecs). At the bottom of `<body>`, an upgrade script reads every `<noscript>`, swaps `.jpg` for the best-supported format, and inserts the real `<img>`:

- **JS enabled** — AVIF (50–85% smaller than JPEG) or WebP fallback.
- **JS disabled** — `<noscript>` renders the JPEG natively with full responsive `srcset`.

No duplicate markup. The `<noscript>` tag is the single source of truth.

### Adding a new image

```bash
# Source JPEG (or PNG) and resized variants in assets/
bun tools/build-image-variants.ts assets/foo.jpg assets/foo-400.jpg   # one call per size variant
# --scan backfills every missing sibling under assets/ + thumbs/; --force re-encodes existing ones
# Then reference inside <noscript><img> in the template
```

Uses Bun's built-in `Bun.Image` (no `avifenc`/`cwebp` binaries needed) at the
same quality targets as before (AVIF q50, WebP q75). AVIF encode is
platform-dependent per Bun's docs — verified working on macOS arm64; if it
fails on another machine, fall back to the CLI tools for that one file:

```bash
avifenc -q 50 -s 4 assets/foo.jpg assets/foo.avif
cwebp -q 75 assets/foo.jpg -o assets/foo.webp
```

### Adding a new essay page

1. Copy an existing essay (e.g. `transparent-horse.html`) as the starting skeleton — its CSS and `<head>` markup are the closest baseline. For a magazine reprint (single-language translation of an externally published piece), copy `humanist-review.html` instead — see *Reprint Idiom*.
2. Update `<title>`, `<meta name="description">`, `og:*` tags. If the essay will live on `audreyt.org` too, leave `og:image` pointing at `https://cyberambassador.tw/…` here; the cherry-picked variant on `audreyt.org` will substitute `https://audreyt.org/…` itself.
3. Write content directly inline. Use `<span lang="en-GB">…</span>` / `<span lang="zh-TW">…</span>` / `<span lang="ja">…</span>` for each language variant; the existing CSS `html:has(#lang-…:checked)` rules handle visibility.
4. Add the `header.site` lockup (see *Components → site-header*).
5. Confirm the hero, interlude--dark, and closing all read in **both** light and dark mode before committing. The `--ink` always-dark token catches most regressions; eyeballing dark mode catches the rest.

## Cross-site Sync

`cyberambassador.tw` and `audreyt.org` mirror each other: the same essays, the same component conventions, with **opposite default languages** (`cyberambassador.tw` defaults to en-GB, `audreyt.org` defaults to zh-TW) and **per-domain OG URLs**.

**Never copy files directly**. Always cherry-pick the commit:

```bash
cd ../audreyt.org
git fetch /Users/au/w/cyberambassador.tw main        # one-shot if you haven't fetched recently
git cherry-pick <sha-from-cyberambassador.tw>
```

When the essay does not yet exist on the other side, cherry-pick the full creation history (original `Add …` commit + any subsequent fixes), then the per-domain default-language commit, then any further structural commits. The per-domain language defaults and OG URLs are repo-specific patches that should not be cherry-picked across.

If the cherry-pick reports an `add/add` conflict, the file is already present under a different commit hash on the other side (cleanly cherry-picked earlier). Abort and re-pick only the new commits.
