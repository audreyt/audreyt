# Agent Notes

Woven site: `index.html` is assembled from `src/` parts by `bun weave.ts`. No frameworks, strict Content Security Policy (all inline scripts and styles are SHA-256 hashed).

## Source Layout

```
src/
├── index.template.html    ← authoring target: HTML structure + content sections
├── fonts/                 ← base64-encoded WOFF2 font data (one .b64 file per font)
│   ├── cormorant-garamond-bold-subset.woff2.b64   (~3 KB, nav-logo "Audrey Tang" only)
│   ├── cormorant-garamond-normal.woff2.b64        (full Latin)
│   ├── outfit.woff2.b64                           (body/nav-link)
│   └── cormorant-garamond-italic.woff2.b64        (pullquote)
├── styles/
│   ├── base.css           ← CSS reset, variables, LQIP rules, layout, Stage 1 font-face
│   ├── fonts-stage2.css   ← @font-face for full Cormorant Garamond normal weight
│   ├── components.css     ← all component styles, typography, Outfit + italic font-faces
│   └── noscript-reveal.css
└── scripts/
    ├── lang-detect.js     ← language detection (minified, runs in <head>)
    ├── image-probe.js     ← AVIF/WebP decode probe
    ├── image-upgrade.js   ← noscript → real <img> upgrade, video poster, lang toggle
    └── structured-data.json  ← JSON-LD (schema.org Person)
```

## Build Pipeline

```bash
bun weave.ts              # assemble index.html from src/ parts + compute CSP hashes
bun generate-readme.ts    # extract README.md and README.zh-TW.md from index.html
bun pre-commit.ts --force # full pipeline: LQIP + weave + README
```

The pre-commit hook (`pre-commit.ts`, symlinked from `.git/hooks/pre-commit`) runs automatically on commit:
1. **Phase 1 — LQIP**: recomputes `--lqip` values in `src/styles/base.css` for any changed images
2. **Phase 2 — Weave**: runs `bun weave.ts` to assemble `index.html` (includes CSP hash update)
3. **Phase 3 — README**: runs `bun generate-readme.ts` to sync READMEs from assembled HTML

## Weave Template Markers

The template `src/index.template.html` uses these inclusion markers:

| Marker | Resolves to |
|--------|-------------|
| `{{style:NAME}}` | Content of `src/styles/NAME.css` |
| `{{script:NAME}}` | Content of `src/scripts/NAME.js` |
| `{{json-ld:NAME}}` | Content of `src/scripts/NAME.json` |
| `{{font:NAME}}` | Raw base64 string from `src/fonts/NAME.woff2.b64` |

Font placeholders appear inside CSS `@font-face` rules:
```css
src: url('data:font/woff2;base64,{{font:cormorant-garamond-normal}}') format('woff2');
```

## Editing Workflow

- **Content changes**: edit `src/index.template.html` (section content is inline in the template)
- **Style changes**: edit files in `src/styles/` — the font data placeholder stays, only CSS changes
- **Script changes**: edit files in `src/scripts/`
- **Font updates**: replace the `.woff2.b64` file in `src/fonts/`
- **New images**: follow the image workflow below, then commit — LQIP + weave runs automatically
- **Do not edit `index.html` directly** — it is a generated artefact

## Image Format Negotiation

Every image is authored once inside a `<noscript>` tag with JPEG `src`/`srcset`:

```html
<noscript><img src="assets/au-ey.jpg"
     srcset="assets/au-ey-400.jpg 400w, assets/au-ey.jpg 800w"
     sizes="..." alt="..." width="800" height="600" loading="lazy"></noscript>
```

A tiny probe script in `<head>` tests actual AVIF and WebP decode support (catches Safari Lockdown Mode, which silently disables these codecs). At the bottom of `<body>`, a single upgrade script reads every `<noscript>`, swaps `.jpg` for the best supported format, and inserts the real `<img>`:

- **JS enabled** — AVIF (50-85% smaller than JPEG) or WebP fallback
- **JS disabled** — `<noscript>` renders the JPEG natively with full responsive `srcset`

No duplicate markup. The `<noscript>` tag is the single source of truth.

## CSS-Only LQIP

Low-Quality Image Placeholders using pure CSS, based on [leanrada.com/notes/css-only-lqip/](https://leanrada.com/notes/css-only-lqip/). Each image stores a single `--lqip` integer in its CSS rule (in `src/styles/base.css`):

```css
.hero-portrait                                       { --lqip: -174493; }
.dialogue-grid .dialogue-card:nth-child(1) .thumb img { --lqip:  169571; }
.gallery-inner figure:nth-child(1) img               { --lqip:   90595; }
```

The integer encodes a 3x2 grid of luminance values plus a base color (lightness, a, b in oklab). CSS `mod()` / `pow()` unpacks the bits into six radial gradients composited over a solid `oklab()` base, producing a blurred color preview with zero network requests. The background shows through until the real image loads.

## Two-Stage Font Loading

Eliminates swap flash on slow connections:

**Stage 1** (critical, in `<head>`): A ~3 KB subset of Cormorant Garamond containing only "Audrey Tang" glyphs with `unicode-range` scoping. The nav-logo renders instantly with the real typeface, zero swap.

**Stage 2** (deferred, after `<nav>`): Full inline base64 fonts. The browser seamlessly upgrades from the subset — same family name, same weight, so no visible reflow. Order matters:

1. Cormorant Garamond normal (full) — covers all Latin glyphs
2. Outfit — body/nav-link font, used immediately after nav
3. Cormorant Garamond italic — pullquote only, well below the fold

All are base64-inlined to avoid swap flash from external woff2 loads. Trade-off: ~125 KB base64 (compresses to ~95 KB gzip).

## Video Poster

The `<video>` element carries both `poster="...jpg"` (works without JS) and `data-poster="..."` (base path without extension). The upgrade script swaps the poster to AVIF/WebP after the probe resolves. Since the video uses `preload="none"`, the poster is not fetched until the element is near the viewport.

## CSP Hashes

The `<meta http-equiv="Content-Security-Policy">` contains SHA-256 hashes for every inline `<script>` and `<style>`. These are automatically recomputed by `weave.ts` during assembly. The comment `<!-- auto-rehashed by pre-commit book -->` marks the CSP meta tag.

## Adding a New Image

1. Place the JPEG source (e.g. `assets/foo.jpg`, `assets/foo-400.jpg`)
2. Generate AVIF: `avifenc -q 50 -s 4 assets/foo.jpg assets/foo.avif`
3. Generate WebP: `cwebp -q 75 assets/foo.jpg -o assets/foo.webp`
4. Repeat for each size variant
5. Add a `<noscript><img src="assets/foo.jpg" srcset="..." sizes="..." ...></noscript>` in `src/index.template.html` — the upgrade script handles the rest
