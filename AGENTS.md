# Agent Notes

Single-file site (`index.html`) with no build step, no frameworks, and a strict Content Security Policy (all inline scripts and styles are SHA-256 hashed).

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

Low-Quality Image Placeholders using pure CSS, based on [leanrada.com/notes/css-only-lqip/](https://leanrada.com/notes/css-only-lqip/). Each image stores a single `--lqip` integer in its CSS rule:

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

The `<meta http-equiv="Content-Security-Policy">` on line 28 contains SHA-256 hashes for every inline `<script>` and `<style>`. When editing any inline script or style block, recompute its hash and update the CSP meta tag. A pre-commit hook (`auto-rehashed by pre-commit book`) may do this automatically.

## Adding a New Image

1. Place the JPEG source (e.g. `assets/foo.jpg`, `assets/foo-400.jpg`)
2. Generate AVIF: `avifenc -q 50 -s 4 assets/foo.jpg assets/foo.avif`
3. Generate WebP: `cwebp -q 75 assets/foo.jpg -o assets/foo.webp`
4. Repeat for each size variant
5. Add a `<noscript><img src="assets/foo.jpg" srcset="..." sizes="..." ...></noscript>` in the HTML — the upgrade script handles the rest
