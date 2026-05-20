---
version: alpha
name: Civic Broadsheet
description: Editorial, multilingual long-form site for Audrey Tang's speeches, essays, and testimonies. Cream paper, ink type, sparing gold, set in Cormorant Garamond + Outfit with sibling Noto Serif/Sans for zh-TW and ja.
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
    fontFamily: Cormorant Garamond
    fontSize: 6rem
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: -0.025em
  display:
    fontFamily: Cormorant Garamond
    fontSize: 5rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline:
    fontFamily: Cormorant Garamond
    fontSize: 2.8rem
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: -0.01em
  chapter-title:
    fontFamily: Cormorant Garamond
    fontSize: 1.6rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  subtitle-italic:
    fontFamily: Cormorant Garamond
    fontSize: 1.55rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.01em
  pullquote:
    fontFamily: Cormorant Garamond
    fontSize: 1.9rem
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
  lede:
    fontFamily: Cormorant Garamond
    fontSize: 1.2rem
    fontWeight: 400
    lineHeight: 1.85
  body-lg:
    fontFamily: Outfit
    fontSize: 1.1rem
    fontWeight: 400
    lineHeight: 1.85
  body-md:
    fontFamily: Outfit
    fontSize: 1.05rem
    fontWeight: 400
    lineHeight: 1.7
  name-lockup:
    fontFamily: Cormorant Garamond
    fontSize: 1.02rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  eyebrow:
    fontFamily: Outfit
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.2em
  crumb:
    fontFamily: Outfit
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

A literary broadsheet that happens to be a website. Long-form testimony and essays sit on cream paper, in a refined Renaissance serif (Cormorant Garamond), with a single warm-metal accent (gold) used sparingly enough that it still reads as ceremonial. The CJK companion type stacks (Noto Serif TC, Noto Serif JP, with a brush-script Kaiti TC reserved for emphasis) mirror the same gravitas in Mandarin and Japanese, so all three language modes feel like they were typeset by the same editorial hand rather than translated through a templating engine.

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

Three Latin faces and three CJK fallback stacks share the page:

- **Cormorant Garamond** — display face. Headlines, hero, pullquote, chapter title, name lockup. A high-contrast Renaissance serif with a calligraphic italic. Variable weights 300 / 400 / 600 / 700; italic at 400. Used at sizes from 1.02 rem (name lockup) up to a hero clamp ceiling of 6 rem.
- **Outfit** — body face. A geometric humanist sans, weights 300–600 (variable), used for body copy, navigation, eyebrow labels, breadcrumbs, lang toggle. Renders calmly at long reading lengths without competing with the serif display.
- **Noto Serif TC** — Mandarin display counterpart. Paired with Cormorant Garamond at the same heading sizes so zh-TW mode looks typeset, not transliterated. Stack: `'Noto Serif TC', 'Songti TC', 'PMingLiU', Georgia, serif`.
- **Noto Sans TC** (with PingFang TC / Microsoft JhengHei fallbacks) — Mandarin body face.
- **Kaiti TC** (`'Kaiti TC', 'DFKai-SB', 'BiauKai', 'STKaiti'`) — a brush-script cursive reserved for `<em>` and `<blockquote>` in zh-TW mode. Substitutes for Latin italic emphasis, which Mandarin does not idiomatically take.
- **Noto Serif JP / Noto Sans JP** — Japanese counterparts. Used on `collaborative-immune-system.html` and any other page that ships a ja mode. Bold (700) substitutes for italic emphasis.

### Two-stage font loading (index only)

The woven `index.html` ships fonts in two waves to eliminate FOIT/FOUT on the nav-logo:

1. **Stage 1 (in `<head>`):** a ~3 KB Cormorant Garamond Bold subset containing only the glyphs in "Audrey Tang" (`AT a d e g n r u y`), declared with `font-display: block` and a `unicode-range` so the nav-logo paints in the real face on first byte.
2. **Stage 2 (after `<nav>`):** full Cormorant Garamond normal, Outfit (300–600 variable), and Cormorant Garamond italic, all inlined as base64. Same family/weight as Stage 1, so the hand-off is invisible.

Stand-alone essay pages load the same families from Google Fonts (`<link>` to fonts.googleapis.com). Acceptable because those pages are visited from links rather than referenced as a brand-anchored homepage.

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

- **Two-language essays (`transparent-horse`, `good-enough-ancestor`):** single `<label>` linked to a hidden `<input type="checkbox" id="lang-zh">`. The label shows `華文` or `EN` depending on which language is active.
- **Three-language essays (`collaborative-immune-system`):** three `<label>`s linked to a hidden `<input type="radio" name="lang">` triad (`lang-en`, `lang-zh`, `lang-ja`).

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
├── svg/                          ← inline SVG markup
├── fonts/                        ← base64-encoded WOFF2 (one .b64 per face)
├── styles/
│   ├── base.css                  ← reset, :root tokens, LQIP rules, nav, Stage 1 font-face
│   ├── fonts-stage2.css          ← @font-face for full Cormorant Garamond normal
│   ├── components.css            ← all component styles, typography, Outfit + italic font-faces
│   └── noscript-reveal.css
└── scripts/
    ├── lang-detect.js            ← language detection (minified, runs in <head>)
    ├── image-probe.js            ← AVIF/WebP decode probe
    ├── image-upgrade.js          ← noscript → real <img> upgrade, video poster, lang toggle
    └── structured-data.json      ← JSON-LD (schema.org Person)
index.html                        ← GENERATED. Do not edit by hand.
collaborative-immune-system.html  ← stand-alone essay (en/zh/ja), single-file
good-enough-ancestor.html         ← stand-alone essay (en/zh), single-file
transparent-horse.html            ← stand-alone essay (en/zh), single-file
pi-ds4.html                       ← stand-alone redirect → pi.audreyt.org
weave.ts                          ← homepage build script
pre-commit.ts                     ← LQIP + weave pipeline (symlinked to .git/hooks/pre-commit)
```

The **index** is woven from `README.md` + `src/`; the **essays** are single-file HTML documents that are hand-edited directly. The two architectures coexist deliberately — essays are reading documents that benefit from being one self-contained `.html` per piece (easy to mirror, archive, port).

## Build Pipeline

```bash
bun weave.ts              # assemble index.html (template + content + CSP hashes)
bun pre-commit.ts --force # full pipeline: LQIP + weave
```

The pre-commit hook (`pre-commit.ts`, symlinked from `.git/hooks/pre-commit`) runs automatically:

1. **Phase 1 — LQIP**: recomputes `--lqip` values in `src/styles/base.css` for any changed image (one integer per image, encoding a 3×2 luminance grid + oklab base colour, unpacked by CSS `mod()`/`pow()` into six composited radial gradients — zero network requests).
2. **Phase 2 — Weave**: runs `bun weave.ts` to assemble `index.html`. Triggered by changes to `src/`, `weave.ts`, `README.md`, or `README.zh-TW.md`. Recomputes every inline `<script>` / `<style>` SHA-256 and rewrites the CSP `<meta>` (marked by `<!-- auto-rehashed by pre-commit book -->`).

### Weave template markers

| Marker | Resolves to |
|:-------|:------------|
| `{{style:NAME}}` | Content of `src/styles/NAME.css` |
| `{{script:NAME}}` | Content of `src/scripts/NAME.js` |
| `{{json-ld:NAME}}` | Content of `src/scripts/NAME.json` |
| `{{font:NAME}}` | Raw base64 string from `src/fonts/NAME.woff2.b64` |
| `{{svg:NAME}}` | Content of `src/svg/NAME.svg` |
| `{{content:NAME}}` | Rendered bilingual HTML from README section `<!-- section:NAME -->` |

Font markers appear *inside* `@font-face` rules: `src: url('data:font/woff2;base64,{{font:cormorant-garamond-normal}}') format('woff2');`

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
| Essay style | The essay's inline `<style>` |
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
# Source JPEG and resized variants in assets/
avifenc -q 50 -s 4 assets/foo.jpg assets/foo.avif
cwebp -q 75 assets/foo.jpg -o assets/foo.webp
# Repeat for each size variant; then reference inside <noscript><img> in the template
```

### Adding a new essay page

1. Copy an existing essay (e.g. `transparent-horse.html`) as the starting skeleton — its CSS and `<head>` markup are the closest baseline.
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
