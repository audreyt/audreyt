---
spec: In the Loop of Humanity
status: Approved design — ready for implementation
date: 2026-06-14
supersedes: nothing (the earlier unshipped gold line-field texture sketch is demoted to optional seasoning; see §9)
applies-to: cyberambassador.tw and its mirror audreyt.org
companion-to: DESIGN.md
phases: 5 (each independently shippable and cherry-pickable; Phase 4 split into 4a/4b)
tokens-touched: --gold (#7d6430 / dark #c9a961), --gold-light (#c9a961, scheme-invariant), --ink (#0f1923, always-dark literal — never flipped)
new-files-by-phase:
  phase-1: src/svg/orrery-hero.svg, src/styles/orrery.css
  phase-2: src/svg/glyph-orbit.svg, src/svg/divider-arc.svg, rules added to src/styles/orrery.css
  phase-3: src/svg/care-orbits.svg, src/svg/people-arc.svg, rules added to src/styles/orrery.css (+ src/styles/essay.css if essays share)
  phase-4a: rules added to src/styles/orrery.css (orbital timeline, CSS-only)
  phase-4b: rules added to src/styles/orrery.css (care expansion + essay heroes); src/scripts/orrery.js only if JS proves unavoidable
csp-impact:
  phase-1: +1 style-src sha256 (orrery.css) and a re-hash of components.css (one edited existing style-src, count unchanged by that edit). Net style-src count 4 -> 5. 0 script-src.
  phase-2: 0 new hashes (rules fold into orrery.css; inline SVG is never hashed).
  phase-3: 0 new hashes.
  phase-4a: 0 new hashes (CSS-only; styles append to orrery.css).
  phase-4b: 0 new hashes if interaction is CSS-only (:has()/:focus-within — the target). +1 script-src sha256 ONLY if src/scripts/orrery.js proves unavoidable, and only as a bare <script>.
---

# In the Loop of Humanity — Design Spec

> A companion to **DESIGN.md**. Read DESIGN.md first; this document extends its vocabulary with a single new grammar — the **loop** — and tells you exactly where each piece slots into the weave pipeline. Everything in DESIGN.md still holds: no frameworks, strict CSP, `--ink` is always-dark, `index.html` is generated, sync is cherry-pick-only.

## 0. Reconciliation note (what actually shipped)

This document is the original design *intent*. The system was built across five phases on `design/finale` (2026-06-14); the **authoritative record of what shipped — and where it deliberately diverged from this spec — lives in the five phase plans** under `docs/superpowers/plans/2026-06-14-*.md`, each carrying a "deliberate divergences" list. The most load-bearing divergences, all validated and code-verified:

- **Ring-and-dot marks ship as pure CSS, not SVG markers.** The section orbit-glyph (§5b) is `.section-label::before`; the 6-Pack of Care (§5e) is `.work-grid > .work-item` `::before`/`::after`. No `{{svg:glyph-orbit}}` / `{{svg:care-orbits}}` markers exist — CSP forbids `data:` masks and the pure-CSS form is DRYer. The **five real markers** are `{{svg:orrery-hero}}`, `{{style:orrery}}`, `{{svg:divider-arc}}`, `{{svg:people-arc}}`, `{{svg:constellation-arc}}`; all post-Phase-1 CSS appends to `orrery.css` (style-src 4→5, script-src 3).
- **Hero geometry** (§4.1): boundary ring r=206, caption arc r≈380 via `startOffset="50%"`, graticule inner 132; the hero SVG is generated (~134 nodes). The `.o-ai` group rotates about `transform-origin: 410px 456px` (`view-box`), not its bbox centre (R1 wobble fix); mobile re-centres + scales it (`translateX(50%) scale(.55)`) so the bounded geometry stays on-screen at 390px.
- **People-arc** (§5f) backs the *geothermal-democracy* pullquote; "We the People are the superintelligence" is the section:DIALOGUE heading, not the pullquote.
- **Plurality of registers** (§5g): essays **keep** their bespoke crystal/emblem heroes (no orrery imposed); the care "expansion" is a decorative hover *polish*, not a content reveal; essays join the grammar only via their `.divider-mark` becoming an orbit-ring.
- **Print** (§7): every decorative orrery element is **hidden** in print (the shipped, consistent decision), not engraved.
- The **favicon** is the orrery distilled, with a crack in the civic ring (butt-capped + widened so it survives 16px) — "that's how the light gets in."

Where the prose below still states the original numbers, the plan + code win.

## 1. Status

| Field | Value |
|:------|:------|
| Concept | **In the Loop of Humanity** — an orrery of democracy |
| Status | Approved design; this is the implementation contract |
| Date | 2026-06-14 |
| Supersedes | Nothing. The earlier, unshipped *gold line-field texture* idea (a generative canvas of faint gold lines) is **demoted** to an optional faint seasoning (§9), not the spine. This is a soft demotion of an idea sketch, not a supersession of any shipped doc. |
| Scope | `cyberambassador.tw`; mirrored to `audreyt.org` by cherry-pick (§6, §8) |

> *Naming note.* "Weave" in this repo is the **build pipeline** (`weave.ts`, the `{{...}}` markers, "the weave pipeline" in AGENTS.md). This spec does **not** touch or rename the pipeline. The thing being demoted in §9 is an unrelated visual idea — the gold line-field texture — and is referred to by that descriptive name only, never as "Weave".

## 2. North Star — the loop as argument

The site already carries the line, in `README.md` section:DIALOGUE — the *Geothermal Democracy* entry, whose section heading reads **"Spotlight Addresses: We the People are Truly the Superintelligence"**, and whose body says *"On moving from 'human in the loop of AI' to 'AI in the loop of humanity'."*

This spec makes that sentence **visible as geometry**. The hero — and, progressively, the whole page — is built from concentric rings: an **orrery**, a clockwork model of a small system. The conceptual payload is **containment**:

- The **outer ring is humanity** — wide, studded with people-nodes and civic tick-marks, the measure by which everything inside is judged. *We the People are the superintelligence.*
- The **inner orbit is AI** — small, bright, fast, and *bounded*: it travels only within the human ring. A faint translucent disc marks its reach. AI is held inside the loop of humanity, not the reverse. The argument is drawn rather than asserted.

This is plurality-as-design: a vocabulary, not one logo stamped everywhere. An eyebrow gains a tiny orbit glyph; a hairline divider becomes an arc cut from one great circle that conceptually runs the length of the page; scroll reveals *draw* their arcs on; the 6-Pack of Care becomes six bounded orbits (many bounded agents); the superintelligence pullquote becomes a densely-studded people-arc; honours become points to scan along an orbital timeline. The film band keeps its own warmer register — a plurality of registers, deliberately not monotone.

The instrument must read as bespoke editorial craft, never as a flashy web template. The constraints are the brand: it is built from CSS-animated inline SVG with **zero hero JavaScript**, it honours reduced-motion by becoming a still engraving, and it prints as a clean line drawing.

### 2.1 Where the argument lives as real text (load-bearing a11y fact)

The decorative curved caption `AI · IN · THE · LOOP · OF · HUMANITY` is `aria-hidden` and is **never** the sole carrier of meaning. Two real-text equivalents back it:

1. **Page-level (already present):** the section:DIALOGUE heading and body (above) carry the full argument in real, localised text further down the page. This satisfies page-level accessibility today.
2. **Hero-local (new, Phase 1):** the woven hero `.hero-quote` is *"I want to be a good enough ancestor for future generations,"* and the `.hero-subtitle` is the laureate/fellow lines — **neither contains the loop phrase.** So that the `aria-hidden` SVG caption has a genuine text equivalent *in the hero region itself*, Phase 1 adds **one real (non-`aria-hidden`) hero text element**, `.hero-loop`, woven from a new README section:HERO line, reading *"AI in the loop of humanity."* It is visually muted (small, gold, low-emphasis) but present in the DOM and the accessibility tree, and localised into all language modes (en-GB / zh-TW, plus ja if/when the hero goes trilingual). See §5a.

This corrects the earlier draft's incorrect claim that the phrase already lives in the hero subtitle/quote — it does not.

## 3. Non-negotiables

These are Do/Don't rules in the spirit of DESIGN.md's *Do's and Don'ts*. A change that violates one is a regression.

- **Do** keep the hero **100% JavaScript-free.** All motion is CSS `@keyframes` on SVG `<g>` groups. Phase 4b may introduce the *only* JS in this spec, and only as progressive enhancement over a complete no-JS DOM.
- **Do** treat `--ink` as a **literal always-dark surface.** The orrery on `.hero` / essay heroes / `.interlude--dark` / `.closing` is gold-on-ink; on light sections it is gold-on-cream. **Never** add `--ink` (or a `--paper-dark-surface` swap) to any `prefers-color-scheme: dark` `:root` block. (Regression history: 2026-05 white-on-cream hero.)
- **Do** put the *argument* in real HTML text (§2.1). The argument lives page-wide in section:DIALOGUE and, from Phase 1, locally in the hero as `.hero-loop`. The curved SVG caption is decorative reinforcement only and is `aria-hidden`. Never let the SVG be the sole carrier of meaning.
- **Do** colour every SVG element from `orrery.css` via class selectors. **`var()` is forbidden inside SVG presentation attributes** (`stroke="var(--…)"`, `fill="var(--…)"`, `stop-color="var(--…)"`): custom properties do **not** resolve as presentation-attribute values in any engine, so such elements render with no/default colour. This matches the repo's own convention (the `.hero-emblem` SVG hard-codes `rgba(201,169,97,…)` inline and only ever uses `var()` through CSS *rules* targeting classes). See §4.2.
- **Do** add every inline `<style>`/`<script>` through the weave pipeline so the pre-commit hook recomputes the CSP SHA-256 hashes. **Don't** hand-edit `index.html` — it is generated and your edits stale the hashes.
- **Don't** put a bare `<style>` or `<script>` element *inside* any orrery SVG file. The CSP hasher scans the fully-woven HTML for bare `<style>…</style>` / `<script>…</script>` and would hash an embedded one, injecting a phantom hash (and an embedded SVG `<script>` would also be CSP-blocked). All orrery styling lives in `orrery.css`; the SVGs carry geometry only.
- **Don't** introduce a framework, bundler, preprocessor, runtime CDN, `<source>` image tags, `loading="lazy"` polyfills, box-shadows outside the four state-change cases, or corner radii > 4px. The orrery uses none of these.
- **Don't** animate anything but `transform` and `opacity` in a continuous loop. No animating `stroke-dashoffset`, `fill`, `x/y/width/height`, `viewBox`, filters, blurs, or drop-shadows in a perpetual `@keyframes` — they force per-frame paint/layout. (Draw-on reveals that touch `stroke-dashoffset` are *one-shot on entry*, never perpetual; §5d.)
- **Don't** reference any external resource from an orrery SVG (`<image href>`, external `<use href>`): those hit `img-src`/`default-src 'self'` and break the self-contained, hash-free guarantee. Keep every orrery SVG fully self-contained.
- **Don't** copy files to `../audreyt.org/`. **Cherry-pick the commit** (§8).

## 4. The ring vocabulary

### 4.1 Geometry — one instrument, one great circle

The hero orrery is authored in a fixed **`viewBox="0 0 1440 913"`** with centre **`cx=410 cy=456`**. Radii (SVG user units):

| Element | Radius | Role |
|:--------|:-------|:-----|
| Civic ring (humanity) | **362** | outer ring; carries tick-marks + people-nodes |
| Boundary ring | **300** | faint dashed circle = the bound humanity sets |
| AI orbit | **120** | small bounded orbit, held well inside the civic ring |
| AI disc | **120** | translucent fill marking AI's reach |
| Centre mark | **6** | the still point |
| Caption arc | **214** | invisible path the `textPath` rides |

The **arc-segment dividers (§5c) are slices of this same circle** at radius 362, conceptually the civic ring continuing down the page. Reuse `cx/cy/r` as documented constants so every arc on the index belongs to one instrument. (Care-orbits and the people-arc have their own centres — see their sections; the "one great circle" is the conceptual through-line, not a literal single coordinate for every primitive.)

### 4.2 Strokes, opacity, colour — colour comes from `orrery.css`, never from SVG attributes

Define two aliases in `orrery.css` over the **two scheme-invariant gold tokens** so the instrument never has to flip:

```css
:root {
  --orrery-line:   var(--gold);        /* #7d6430 light · #c9a961 dark — auto-flips; correct on light sections */
  --orrery-bright: var(--gold-light);  /* #c9a961 — scheme-invariant; correct on always-dark surfaces */
}
```

**Every SVG element is given a class and coloured from `orrery.css`.** The SVG files contain geometry and class names only — no `stroke=`, `fill=`, or `stop-color=` carrying `var()`. Illustrative `orrery.css` rules:

```css
.orrery-svg .o-civic > circle { stroke: var(--orrery-bright); stroke-opacity: 0.55; }
.orrery-svg .o-ticks  line     { stroke: var(--orrery-bright); stroke-opacity: 0.30; }
.orrery-svg .o-people circle   { fill:   var(--orrery-bright); fill-opacity: 0.70; }
.orrery-svg .o-boundary        { stroke: var(--orrery-line);   stroke-opacity: 0.18; stroke-dasharray: 4 8; }
.orrery-svg .o-graticule line  { stroke: var(--orrery-line);   stroke-opacity: 0.10; }
.orrery-svg .o-ai-ring         { stroke: var(--orrery-bright); stroke-opacity: 0.40; }
.orrery-svg .o-ai-disc         { fill:   var(--orrery-bright); fill-opacity: 0.06; }
.orrery-svg .o-ai-planet       { fill:   var(--orrery-bright); fill-opacity: 0.95; }
.orrery-svg .o-centre          { fill:   var(--orrery-bright); fill-opacity: 0.85; }
.orrery-svg .o-caption         { fill:   var(--orrery-bright); fill-opacity: 0.50; }
```

| Stratum | Colour source | Opacity |
|:--------|:--------------|:--------|
| Civic ring | `--orrery-bright` | 0.55 |
| Tick-marks (~72) | `--orrery-bright` | 0.30 |
| People-nodes (~46) | `--orrery-bright` (fill) | 0.70 |
| Boundary ring (dashed) | `--orrery-line` | 0.18 |
| Radial graticule | `--orrery-line` | 0.10 |
| AI orbit ring | `--orrery-bright` | 0.40 |
| AI disc | `--orrery-bright` (fill) | 0.06 |
| AI planet node | `--orrery-bright` (fill) | 0.95 |
| Caption textPath | `--orrery-bright` (fill) | 0.50 |

**On always-dark surfaces** (`.hero`, essay heroes, `.interlude--dark`, `.closing`) primary strokes use `--orrery-bright` (`#c9a961`) — it never changes between schemes and reads on ink in both. **On light sections** (glyphs, dividers, care-orbits, timeline) primary strokes use `--orrery-line` (`var(--gold)`), which darkens on cream in light mode and lightens in dark. No new hex literals; both are existing tokens.

**The ink halo.** A soft radial ink halo behind the hero lockup guarantees name-over-rings contrast. It is an SVG `<radialGradient>` painted over the rings (not a CSS box-shadow, which is barred and which print strips). **Its gradient stops are coloured from `orrery.css`, not from `stop-color="var(--ink)"` attributes** (which would not resolve). Give the stops classes:

```css
/* orrery.css */
.orrery-svg .o-halo-0 { stop-color: var(--ink); stop-opacity: 0.85; }
.orrery-svg .o-halo-1 { stop-color: var(--ink); stop-opacity: 0.35; }
.orrery-svg .o-halo-2 { stop-color: var(--ink); stop-opacity: 0; }
```

If a future engine is found not to honour CSS on gradient stops, the documented fallback is to hard-code the literal `#0f1923` in the SVG with a `<!-- mirrors --ink -->` comment — the single sanctioned hex exception, exactly as `.hero-emblem` hard-codes its gold. Verify the halo actually paints in light and dark before claiming contrast is guaranteed.

> **Halo paint order (fidelity fix).** The halo must brighten the centre for the hero *text* lockup, but it must **not** be a full-strength disc painted over the bright AI planet, caption, and centre mark. Paint the halo **before** (under) `.o-ai`, `.o-centre`, and `.o-caption` in document order, so those bright nodes still read above it; the halo's job is contrast for the separate `.hero-content` DOM element that sits above the whole SVG, not to dim the instrument's own foreground. Verify the AI planet and caption survive the halo in both schemes.

### 4.3 Motion rates

| Group | Period | Direction |
|:------|:-------|:----------|
| Civic ring + people-nodes | **360s** | clockwise (barely perceptible drift) |
| Radial graticule | **240s** | counter-clockwise |
| AI orbit (planet) | **48s** | clockwise |

All three are pure rotation on a `<g>`. Per the WebKit 16-era bug, **combine every transform function into a single `transform`** (here, a single `rotate()`), never separate `rotate`/`scale` longhands.

**Rotation origin — per group, robust pattern.** Use `transform-box: fill-box; transform-origin: center` on each rotating `<g>` so it rotates about *its own* bounding-box centre, regardless of where it sits in the viewBox. This is the cross-browser-robust pattern (keyword `center` + `fill-box` sidesteps the Firefox/Chrome percentage-origin divergence) and — critically — it is the **only** origin rule that also works for the reused care-orbit and divider primitives, which do **not** share the hero's `cx=410/cy=456`. Do **not** hard-code a single `transform-origin: 410px 456px`: that is correct only for hero groups concentric with the hero centre and silently wrong for every off-centre primitive. (Note: `transform-box: view-box` is already the SVG default, so naming it adds nothing; `fill-box` is the deliberate change.)

## 5. Components

For each: purpose · markup approach · colour source · motion · reduced-motion · a11y · light/dark · mobile.

### 5a. Hero orrery (Phase 1 — the flagship)

**Purpose.** The instrument behind the index hero lockup; the containment argument made visible.

**Markup.** A single inline SVG injected by a **`{{svg:orrery-hero}}`** marker, placed inside `.hero` *before* `.hero-content` in `src/index.template.html`. The wrapper is positioned and explicitly stacked (see *Stacking*). The SVG root carries **`aria-hidden="true"` and `focusable="false"`** (no `role`; with `aria-hidden` a `role="presentation"` is redundant — match the repo's existing emblems, which use `aria-hidden` and no role). No `<title>`/`<desc>`. Element budget ≤ 150 nodes (§7).

```html
<!-- src/index.template.html, inside <header class="hero">, before .hero-content -->
<div class="orrery orrery--hero" aria-hidden="true">{{svg:orrery-hero}}</div>
```

```xml
<!-- src/svg/orrery-hero.svg (illustrative, not exhaustive) — NO colour attributes; classes only -->
<svg class="orrery-svg" viewBox="0 0 1440 913" preserveAspectRatio="xMidYMid slice"
     fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="orrery-halo" cx="410" cy="456" r="360" gradientUnits="userSpaceOnUse">
      <stop class="o-halo-0" offset="0"/>
      <stop class="o-halo-1" offset="0.7"/>
      <stop class="o-halo-2" offset="1"/>
    </radialGradient>
    <path id="orrery-caption" d="M 196 456 A 214 214 0 0 1 624 456"/>
  </defs>

  <!-- faint structure -->
  <circle class="o-boundary" cx="410" cy="456" r="300"/>
  <g class="o-graticule">…12 radial spokes (line)…</g>

  <!-- humanity: the larger loop -->
  <g class="o-civic">
    <circle cx="410" cy="456" r="362"/>
    <g class="o-ticks">…~72 short radial ticks (line)…</g>
    <g class="o-people">…~46 small filled circles on r=362…</g>
  </g>

  <!-- halo painted UNDER the bright foreground nodes -->
  <rect class="o-halo" width="1440" height="913" fill="url(#orrery-halo)"/>

  <!-- AI: bounded inside -->
  <g class="o-ai">
    <circle class="o-ai-ring"  cx="410" cy="456" r="120"/>
    <circle class="o-ai-disc"  cx="410" cy="456" r="120"/>
    <circle class="o-ai-planet" cx="530" cy="456" r="7"/>
  </g>

  <circle class="o-centre" cx="410" cy="456" r="6"/>
  <text class="o-caption" aria-hidden="true">
    <textPath href="#orrery-caption" aria-hidden="true">AI · IN · THE · LOOP · OF · HUMANITY</textPath>
  </text>
</svg>
```

(Real `<text>`/`<textPath>` is announced by screen readers by default even under an `aria-hidden` ancestor in some engines, so the caption nodes also carry their own `aria-hidden="true"` — belt and braces.)

**Stacking (pinned).** The hero stacking context today is: `.hero { position: relative; overflow: hidden }`, `.hero::after` vignette gradient at `z-index: 1`, `.hero-content` at `z-index: 2`, `.hero-portrait-picture` at auto (paints below the `z-index:1` vignette). The BRIEF wants the orrery **between the vignette and the text, with the ink halo providing legibility.** Two equal `z-index:1` siblings do **not** guarantee order — pin it concretely:

- Add to `orrery.css`: `.orrery--hero { position: absolute; inset: 0; z-index: 1; pointer-events: none; }`
- Edit `components.css` (it is editable source, woven via `{{style:components}}`, auto-rehashed): lower `.hero::after` to **`z-index: 0`**.

Result paint order, bottom→top: portrait (auto) → `.hero::after` vignette (0) → orrery + halo (1) → `.hero-content` lockup (2). The orrery now reads above the vignette; its internal halo darkens the centre so the name lockup stays legible over the rings. (The portrait still sits below the vignette, unchanged.) Verify in both schemes that the rings read through and the name has contrast.

```
z 2  .hero-content  (name / subtitle / quote / .hero-loop)   ← real text, incl. the argument
z 1  .orrery--hero  (rings + bright nodes + ink halo)        ← decorative SVG, aria-hidden
z 0  .hero::after   (135° ink vignette)                      ← lowered from 1 to 0 in components.css
auto .hero-portrait-picture                                  ← unchanged, behind the vignette
```

**The hero argument text (`.hero-loop`).** Add a new line to README section:HERO so weave emits a real, non-`aria-hidden` hero element carrying *"AI in the loop of humanity."* Style it muted in `components.css` (small caps or small gold, low emphasis) so it reinforces the curved caption without competing with the name. Localise it (en-GB / zh-TW; the zh-TW README already renders the concept as「AI 進入人類迴圈」). This is the hero-local text equivalent required by §2.1; do **not** ship the curved SVG caption as the only hero instance of the phrase.

**Colour source.** All strokes/fills and the halo stops from `orrery.css` classes (§4.2). No colour attributes in the SVG.

**Motion.** In `src/styles/orrery.css`:

```css
.orrery-svg .o-civic     { animation: orrery-spin 360s linear infinite; }
.orrery-svg .o-graticule { animation: orrery-spin 240s linear infinite reverse; }
.orrery-svg .o-ai        { animation: orrery-spin 48s  linear infinite; }
.orrery-svg .o-civic,
.orrery-svg .o-graticule,
.orrery-svg .o-ai {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;            /* ONLY these 3 rotating groups */
}
@keyframes orrery-spin { to { transform: rotate(360deg); } }
```

Only these three groups get `will-change` (promoting ~150 primitives exhausts VRAM).

**Reduced-motion.** Inside `@media (prefers-reduced-motion: reduce)` set `animation: none` on the three groups. Their resting transform is identity, so no pinning is needed (unlike the essay `.hero-crystal`, which keeps `translateY(-55%)`). Result: a static engraving.

**a11y.** SVG fully `aria-hidden` + `focusable="false"`; caption nodes additionally `aria-hidden`. The argument is real text in `.hero-loop` (hero-local) and section:DIALOGUE (page-level). No focus stops introduced.

**Light/dark.** `.hero` is always-dark via `--ink`; the orrery is `--orrery-bright` on ink in both schemes. No flip logic.

**Mobile.** At `≤768px` the SVG simplifies: hide `.o-ticks`, `.o-graticule`, and thin the people-nodes to ~16 via `.o-people > :nth-child(n+17){display:none}`; centre the instrument behind the now-centred hero text; cap opacity at `0.25` in portrait (mirroring the existing `.hero-portrait` 0.25 treatment, components.css ~line 1013). The civic ring + AI orbit + centre + caption remain — the containment reading survives the shrink.

### 5b. Section orbit-glyph (Phase 2)

**Purpose.** A tiny ring-and-dot prefixing each eyebrow (`.section-label` / `.hero-label`) — the section marker in the loop grammar.

**Markup.** A 1em inline SVG via **`{{svg:glyph-orbit}}`**, inserted at the start of the relevant `.section-label`/eyebrow in the `{{content:…}}` renderers (or once per section in the template). On essays it is hand-inlined identically. **Colour via `orrery.css` classes only — no `var()` in attributes.**

```xml
<!-- src/svg/glyph-orbit.svg ~6 nodes, classes only -->
<svg class="glyph-orbit" viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none">
  <circle class="g-ring" cx="8" cy="8" r="6"/>
  <circle class="g-dot"  cx="14" cy="8" r="1.6"/>
</svg>
```
```css
/* orrery.css */
.glyph-orbit .g-ring { stroke: var(--orrery-line); stroke-opacity: 0.5; }
.glyph-orbit .g-dot  { fill:   var(--orrery-line); }
```

**Motion.** None (a 1em spinning dot would be noise). **a11y.** `aria-hidden`. **Light/dark.** `var(--orrery-line)` (= `var(--gold)`) flips correctly. **Mobile.** Scales with `1em`; no change.

### 5c. Arc-segment divider (Phase 2)

**Purpose.** Replace straight `--border` hairlines between sections with a shallow arc cut from the r=362 great circle.

**Markup.** **`{{svg:divider-arc}}`** inside an existing `.divider`/section break. A wide, short SVG drawing one shallow arc; **colour from `orrery.css`.**

```xml
<svg class="divider-arc" viewBox="0 0 1200 40" aria-hidden="true" focusable="false"
     fill="none" preserveAspectRatio="none">
  <path class="d-arc draw-arc" d="M 0 38 A 4000 4000 0 0 1 1200 38"/>
</svg>
```
```css
/* orrery.css */
.divider-arc .d-arc { stroke: var(--orrery-line); stroke-opacity: 0.35; }
```

**Motion.** None by default; participates in draw-on (§5d) when revealed. **a11y.** `aria-hidden`; replaces a decorative rule. **Light/dark.** `var(--orrery-line)` flips. **Mobile.** `preserveAspectRatio="none"` lets it span any width; flatten further at `≤480px`. **Print.** Restyle to `--print-line` (§7).

### 5d. Reveal-as-draw (Phase 2)

**Purpose.** Arcs (dividers, people-arc, care-orbits, timeline) stroke themselves on as they enter view — a draw-in, not a fade.

**Mechanism — three tiers, progressive enhancement.** This is the most error-prone piece; the recon flags two reveal regimes and a non-automatic scroll-timeline fallback.

**Cascade invariant (read first).** An arc is set to its *undrawn* state (`stroke-dashoffset: var(--len)`) **only inside a context that is guaranteed to draw it.** The unconditional default is the *drawn* state (`stroke-dashoffset: 0`). This way no combination of unsupported features can strand an arc invisible.

1. **Best: CSS scroll-driven animation** (`animation-timeline: view()`). Supported in Chromium 115+ and Safari 26+; **Firefox still ships it disabled by default** as of 2026-06-14 (~83% global, *not* Baseline). It **must** be `@supports`-guarded — an unsupported browser does **not** freeze the keyframes; it reattaches them to the document timeline and plays once, which can leave an arc stuck at full `stroke-dashoffset` (invisible).

```css
/* default = drawn; never strands invisible */
.draw-arc { stroke-dashoffset: 0; }

@supports (animation-timeline: view()) {
  .draw-arc {
    animation: draw linear both;
    animation-timeline: view();       /* declared AFTER the animation shorthand, which resets it */
    animation-range: entry 0% cover 35%;
  }
}
@keyframes draw { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }
```

2. **Middle: the existing IntersectionObserver `.reveal`/`.visible` system.** The two regimes differ and must be handled separately:
   - **Index.** `.reveal` is hidden **only under `.js .reveal`** (`components.css` ~line 974) and un-hidden by the observer in `src/scripts/image-upgrade.js` (`threshold:0.01, rootMargin:'0px 0px -60px 0px'`), which **has a no-IO fallback** (`else { reveals.forEach(el => el.classList.add('visible')) }`). On the index you may gate the undrawn state behind `.js`, mirroring the existing pattern:
     ```css
     .js .reveal .draw-arc            { stroke-dashoffset: var(--len); }
     .js .reveal.visible .draw-arc    { stroke-dashoffset: 0; transition: stroke-dashoffset 1.2s ease; }
     ```
     The undrawn state is scoped to `.js .reveal`, so when JS is off the unconditional `stroke-dashoffset: 0` default wins (drawn).
   - **Essays.** Bare `.reveal` is hidden unconditionally (`essay.css` ~line 75) and the per-essay observer (`threshold:0.08, rootMargin:'0px 0px -40px 0px'`) has **no no-IO fallback** — so on an essay with JS on but IO unsupported, anything gated behind `.reveal` stays hidden forever. **Therefore on essays do NOT gate `.draw-arc` behind `.reveal` at all.** Use tier 1 (`@supports view()`) with the unconditional `stroke-dashoffset: 0` default as the sole fallback. The arc is then either drawn-on (supported) or statically drawn (unsupported) — never stranded.

3. **Static.** No JS, no scroll-timeline: the unconditional resting state is the fully-drawn arc (`stroke-dashoffset: 0`). Also covered by `noscript-reveal.css` (`.reveal{opacity:1!important;transform:none!important}`) and by reduced-motion.

**Reduced-motion (pinned).** The global `* { animation: none !important; transition: none !important }` (`components.css` ~line 1061) kills both the scroll-timeline animation and the IO transition. To guarantee the arc lands *drawn* even if `.visible` is never added (e.g. JS on, reduced-motion on, element above the fold), add an explicit override:

```css
@media (prefers-reduced-motion: reduce) {
  .draw-arc { stroke-dashoffset: 0 !important; }
}
```

This mirrors the `noscript-reveal.css` philosophy and removes the only remaining corner where an index draw-arc could land undrawn.

**Note on the no-animate-stroke rule.** Draw-on touches `stroke-dashoffset` (a repaint) but is **one-shot on entry**, not a perpetual loop. The §3 ban is on *continuous* stroke animation only.

### 5e. 6-Pack of Care orbits (Phase 3)

**Purpose.** Render the six principles of care as **six small bounded orbits**, each a kami/agent circling within its own loop — many bounded agents, the plural counterpart to the single hero instrument.

> *Placement note.* The care content is rendered within an existing section renderer (see §6 / Residual question R1 — confirm whether it lives in `{{content:CIVIC_AI}}` or its own marker before implementation; the markup target is whichever block carries the six care principles).

**Markup.** **`{{svg:care-orbits}}`** producing six self-contained mini-instruments. Stack **six separate inline `<svg>` elements** (Chrome never layers a single SVG into multiple GPU layers; separate SVGs composite better for the rotating dots). Each: a faint ring + one orbiting node + **the principle label as real HTML text beside it** (the no-JS baseline — the orbit is decoration). **Colour from `orrery.css` classes only.**

**Motion.** Each node orbits at a slightly different slow period (e.g. 60–96s, staggered) so the six read as an ensemble, not one synchronised clock. `transform-box: fill-box; transform-origin: center; transform: rotate()` (single function); `will-change` only on the six orbiting nodes, never on the rings. **Reduced-motion.** All stop; rings + dots remain as a static diagram. **a11y.** SVGs `aria-hidden`; the principle text is the content. **Light/dark.** `--orrery-line` on the light care section. **Mobile.** Drop to a single column; each orbit shrinks but keeps one ring + one dot. **Hover/focus expansion is deferred to Phase 4b** (§5g).

### 5f. Pullquote people-arc (Phase 3)

**Purpose.** The "We the People are the superintelligence" pullquote (`{{content:PULLQUOTE}}`; the `.pullquote` aside opens at `src/index.template.html` line 111) gains a wide arc densely studded with people-nodes — the human ring, unrolled.

**Markup.** **`{{svg:people-arc}}`** placed inside the `.pullquote` aside, behind/above the quote text. ~40 small filled nodes spaced along one shallow arc. **Colour from `orrery.css` classes only.**

**Motion.** Static, or a single one-shot draw-on via §5d when `.pullquote.reveal` becomes `.visible`. **a11y.** `aria-hidden`; the quote text carries the meaning. **Light/dark.** This is a *light* section — `--orrery-line`. **Mobile.** Thin to ~20 nodes, flatten the arc. **Print.** The index print stylesheet **hides `.pullquote`** (`components.css` ~line 1115), so the people-arc never prints — no print work needed for it.

### 5g. Orbital timeline + care expansion + essay heroes (Phase 4 — the substance, split 4a/4b)

**Purpose.** Turn Honours + Background into an orbital timeline; let the care-orbits expand on hover/focus; and give essay heroes their own orrery. These are **three distinct workstreams**, split across two sub-phases so each PR is bounded and cherry-pickable:

- **Phase 4a — Orbital timeline (CSS-only).** Honours (`{{content:RECOGNITION}}`) + Background (`{{content:BACKGROUND}}`) become an orbital timeline: years as points to scan along a great arc. **All content — every year and label — is real text in the existing renderers;** the orbital layout is a CSS skin (no new DOM, no JS, no new hashes). This sub-phase also resolves the interaction-architecture question for 4b (spike `:has()`/`:focus-within` here).
- **Phase 4b — Care expansion + essay heroes.** (1) The six care-orbits expand on hover/focus to reveal their principle. (2) Each stand-alone essay hero gets the orrery.

**Care expansion — interaction, two tiers.**
- **CSS-only first (the target).** Position each principle as a node; on `:hover`/`:focus-within` reveal the detail via `max-height`/`opacity` transition. `:focus-within` over a real focusable `<a>`/`<button>` already in the DOM gives keyboard parity with **zero JS and zero new hashes.** This is the intended outcome.
- **JS only if unavoidable.** If measured geometry is genuinely required, add **one** script via **`{{script:orrery}}`** → `src/scripts/orrery.js`, written as a **bare `<script>`** (the CSP hasher matches `<script>…</script>` with no attributes; an attribute-bearing tag gets no hash and is blocked). It must degrade to the CSS-only/no-JS baseline (content already visible). Resolve this fork in 4a's spike before 4b starts, so the implementer is not deciding architecture mid-plan.

**Essay heroes get the orrery (Phase 4b).** Replicate the hero instrument into each stand-alone essay. **Do NOT reuse the `.hero-crystal` class verbatim**: `.hero-crystal { display: none }` at `≤768px` (e.g. transparent-horse.html ~line 474) — reusing it would make the essay orrery vanish on phones, violating success criterion #7 and the BRIEF's "must define a real mobile treatment." Instead give the essay orrery a **distinct class** (e.g. `.hero-orrery`) with its own `≤768px` rule that keeps a simplified instrument visible at ≤0.25 opacity (same node-thinning as §5a mobile). Reuse the crystal's *reduced-motion pin* only as a pattern: the existing crystal animates via `animation: driftIn 2s ease 1.6s forwards` and under reduced-motion is pinned to `transform: translateY(-55%) !important` (do **not** reset to `none`, because its resting transform is a centring offset). If the essay orrery has a non-identity resting transform, pin it the same way; if it rests at identity (like the index hero), `animation: none` is enough. Essays carry **no CSP meta**, so inline `<style>`/`<script>`/SVG are free there; shared CSS goes through `src/styles/essay.css` (§6).

**Reduced-motion / a11y / mobile.** Expansions use opacity/height transitions (killed under reduced-motion, leaving everything expanded-and-readable — never collapsed-and-lost). Focus-visible rings preserved. On mobile the timeline becomes a vertical list of year-nodes; hover collapses to tap/focus.

## 6. Build-pipeline integration

The pipeline (verified in `weave.ts:1297–1417`, `pre-commit.ts`) resolves markers in this order: `{{content:}}` → `{{style:}}` → `{{script:}}` → `{{json-ld:}}` → `{{font:}}` → `{{svg:}}`, **then** CSP rehash last (so hashes always reflect final inlined content).

**Markers → source files (all must exist before commit, or `weave` aborts with `weave: missing src/…` and the commit is blocked):**

| Marker | File | Phase |
|:-------|:-----|:------|
| `{{svg:orrery-hero}}` | `src/svg/orrery-hero.svg` | 1 |
| `{{style:orrery}}` | `src/styles/orrery.css` | 1 (extended 2, 3, 4a, 4b) |
| `{{svg:glyph-orbit}}` | `src/svg/glyph-orbit.svg` | 2 |
| `{{svg:divider-arc}}` | `src/svg/divider-arc.svg` | 2 |
| `{{svg:care-orbits}}` | `src/svg/care-orbits.svg` | 3 |
| `{{svg:people-arc}}` | `src/svg/people-arc.svg` | 3 |
| `{{script:orrery}}` | `src/scripts/orrery.js` | 4b — **only if JS proves unavoidable** |

There is **no `orrery-substance.css` and no `{{style:orrery-substance}}` marker.** All Phase-2/3/4 styles **append to `src/styles/orrery.css`**, so no phase after Phase 1 adds a style-src hash. (This deletes the earlier draft's self-contradiction, which simultaneously mandated a new style file and told you to fold it away.)

**The new `<style>` wrapper (Phase 1).** Add `{{style:orrery}}` inside a **bare** `<style>…</style>` in `src/index.template.html`, alongside the existing component styles (`{{style:components}}` at template line 71). The hasher sha256's only the **inner text** (exact whitespace); the `<style>` tags live in the template, and `orrery.css` contains CSS body only. This adds exactly **one** style-src hash, raising the count from 4 to **5**.

**Phase-1 also edits `components.css`.** Lowering `.hero::after` to `z-index:0` (§5a stacking) changes the inner text of the existing `{{style:components}}` block, so weave recomputes that one style-src hash automatically. The **count** of style-src hashes is unchanged by that edit (still the same block); only its value updates. No action needed beyond letting the hook re-weave.

**Inline SVG adds zero hashes — for the right reason.** Inline SVG is part of the document DOM; the weave hasher only sha256's the inner text of bare `<script>`/`<style>` tags, so inline SVG markup is simply never hashed. (It is **not** "governed by img-src" — `img-src` governs externally-referenced image resources and `<img>`/SVG `<image href>`, not inline `<svg>`. Any external resource referenced *from* the SVG would hit `img-src`/`default-src 'self'` and break — keep the orrery self-contained, §3.) The corollary: an orrery SVG must contain **no bare `<style>` or `<script>`** (would create a phantom hash / be blocked). Use CSS classes + `orrery.css`, never inline `style="…"` attributes on SVG nodes (a `style` *attribute* would require `'unsafe-hashes'`).

**Pre-commit behaviour.** The hook (`.git/hooks/pre-commit` → `pre-commit.ts`, a bun script — no husky) re-weaves when any staged path is under `src/` (or `weave.ts`/`README*`), runs `bun weave.ts`, then `git add index.html`. **You must `git add` the new `src/svg/*` and `src/styles/*` files** or `hasSrcChanges` is false, the page is not re-woven, the markers stay literal, and the CSP stays stale. Run `bun weave.ts` (or `./pre-commit -f`) manually to verify before committing. LQIP (Phase 1 of the hook) only touches the hardcoded image map in `base.css` and will not interfere.

**Essays.** Stand-alone essays are single-file HTML; they carry **no CSP meta**, so they can inline `<script>`/`<style>`/SVG freely without rehashing. Shared orrery CSS that essays use goes into `src/styles/essay.css` (inlined by pre-commit Phase 3 between `/* essay:base */` … `/* /essay:base */`). Per-essay hero orrery markup goes inline **after** the closing sentinel. Do **not** hand-edit the inlined `essay.css` copy inside an essay.

## 7. Accessibility, performance, i18n, print

**Accessibility.**
- Every **decorative orrery SVG** introduced by this spec (hero, glyph, divider, care-orbits, people-arc): `aria-hidden="true"` + `focusable="false"`, no `<title>`/`<desc>`; strip any stray design-tool `<title>` nodes. **This rule is scoped to the orrery family only — it does NOT apply to existing semantic SVGs** such as the inline `flag-tw` emblem (template line 84), which intentionally carries `role="img"` + `aria-label` + `<title>Taiwan</title>`; leave that title in place.
- Real SVG `<text>`/`<textPath>` (the hero caption) is announced by default in some engines even under an `aria-hidden` ancestor — give those nodes their own `aria-hidden="true"`.
- The argument is duplicated as real HTML text: hero-local in `.hero-loop` (§2.1, §5a) and page-level in section:DIALOGUE. The SVG is never the sole carrier.
- Preserve `:focus-visible` rings on any Phase-4b interactive node.
- WCAG note: a perpetually-rotating decorative graphic does not, by the media query alone, satisfy 2.2.2 *Pause/Stop/Hide* (Level A). Our motion is ~360s/240s/48s drift (sub-threshold, decorative) and fully stopped under reduced-motion; if review deems a control necessary, add a no-JS `:has()`-toggled pause checkbox in Phase 4b — not before.

**Performance budgets.**
- Hero SVG markup **2–4 KB**, no images, no hero JS. Element count **≤ 150** primitives.
- Continuous animation is **transform-only** on **≤ 3** groups (hero) / ≤ 6 nodes (care). `will-change: transform` on **those rotating groups/nodes only** — never on the ~150 primitives.
- No filters/blurs/masks/drop-shadows in any perpetual loop. The halo is a static SVG gradient, not a CSS shadow.
- Verify GPU compositing with DevTools Rendering → paint-flashing (no flashes = composited) before shipping each phase.

**i18n of the caption.** The orrery and glyphs are language-neutral. **Recommendation: keep the curved hero caption as a universal Latin motif** — `AI · IN · THE · LOOP · OF · HUMANITY` — across all language modes, justified because (a) the caption is decorative (`aria-hidden`) and its *meaning* is localised in real text (`.hero-loop` carries「AI 進入人類迴圈」in zh-TW; section:DIALOGUE carries the full localised line), (b) "AI" is the one shared Latin token and a curved caption on an always-dark decorative band reads as a universal motif, and (c) a curved CJK `textPath` would need per-glyph rotation tuning and a separate path per language for marginal gain. (Note: the full phrase is **not** rendered identically across languages — the zh-TW README translates the surrounding words; only "AI" is shared. The recommendation rests on the caption being decorative with meaning carried in localised real text, not on cross-language identity of the whole phrase.) If a localised curved variant is ever wanted, author `src/svg/orrery-hero.zh.svg` and gate via the existing `:has(#lang-zh:checked)` toggle — but the default ships one universal Latin arc.

All *new readable strings* (`.hero-loop`, Phase-4 timeline labels, care principles) **must** be localised with `<span lang="en-GB">/<span lang="zh-TW">` (and `<span lang="ja">` if the surface is trilingual) and matching `:has(#lang-zh:checked)` / `:has(#lang-ja:checked)` CJK typography overrides; `em` is italic in en, Kaiti (`font-style:normal`) in zh-TW, bold(700) in ja.

**Print.** The print path **removes dark surfaces** (`.hero { background: none !important }`, hides `.hero::after`; essays neutralise `.closing`/`.colophon`) and forces `print-color-adjust:exact`, killing box-shadow/text-shadow globally. A gold-on-ink orrery would become gold-on-white (near-invisible). Critically, **there is no universal `* { animation: none }` in `@media print`** — that rule exists only under `prefers-reduced-motion` (`components.css` ~line 1061), which does **not** fire on a plain print. So the orrery's perpetual rotation is **not** auto-stopped when printing; its resting frame would be undefined. Therefore add explicit print rules:

```css
@media print {
  .orrery--hero, .glyph-orbit, .divider-arc, .care-orbits, .people-arc { /* whatever exists in scope */ }
  .orrery-svg .o-civic,
  .orrery-svg .o-graticule,
  .orrery-svg .o-ai,
  .care-orbits * { animation: none !important; }                /* pin the engraving frame */
  .orrery-svg [class^="o-"], .glyph-orbit *, .divider-arc *,
  .care-orbits *, .people-arc * { stroke: var(--print-line) !important; }   /* #c7b9a6 */
  .orrery-svg .o-people circle, .orrery-svg .o-ai-planet,
  .orrery-svg .o-centre { fill: var(--print-accent) !important; }           /* #7b5f34 */
  .orrery-svg .o-halo { display: none !important; }              /* halo off in print */
}
```

- The instrument prints as a clean `--print-line`/`--print-accent` engraving at the pinned resting frame.
- `.pullquote` and `.film`/`.gallery` are print-hidden already, so §5f's people-arc and any film-band texture need no further print rules.
- Do **not** rely on shadow/glow for any print-relevant arc.

## 8. Phasing / rollout

Each phase is one PR, independently shippable, independently cherry-pickable to `audreyt.org`. After each lands on `cyberambassador.tw`:

```bash
cd ../audreyt.org
git fetch /Users/au/w/cyberambassador.tw main      # one-shot if not fetched recently
git cherry-pick <sha>                               # never copy files directly
```

Do **not** cherry-pick the per-domain default-language or `og:image` commits. An `add/add` conflict means the file already arrived under another hash — abort and re-pick only the new commits.

| Phase | Scope | New src files | CSP impact | Cherry-pick |
|:------|:------|:--------------|:-----------|:------------|
| **1 — Hero orrery** | `orrery-hero.svg` behind index hero; ink halo (CSS-driven stops); 3 rotating groups; `.hero-loop` real-text argument (new README:HERO line); `.hero::after` lowered to z-index:0; reduced-motion/print/mobile; `{{svg}}`+`{{style}}` markers in template | `src/svg/orrery-hero.svg`, `src/styles/orrery.css` | +1 style-src (4→5); components.css block re-hashed (count unchanged); 0 script-src | one commit |
| **2 — Grammar primitives** | orbit-glyph on eyebrows; arc-segment dividers; reveal-as-draw (3-tier `@supports`/IO/static with cascade invariant) | `src/svg/glyph-orbit.svg`, `src/svg/divider-arc.svg`; rules appended to `orrery.css` | 0 new hashes | one commit |
| **3 — Idea pieces** | 6 care-orbits; pullquote people-arc; warmer film register left untouched | `src/svg/care-orbits.svg`, `src/svg/people-arc.svg`; rules in `orrery.css` (+ `essay.css` if essays share) | 0 new hashes | one commit |
| **4a — Orbital timeline** | Honours + Background relaid as an orbital timeline (CSS-only); spike + resolve the care-expansion CSS-vs-JS fork here | rules appended to `orrery.css` | 0 new hashes | one commit |
| **4b — Care expansion + essay heroes** | care-orbit hover/focus expand (`:has()`/`:focus-within` first; JS only if the 4a spike proved it unavoidable); each stand-alone essay hero gets the orrery (distinct `.hero-orrery` class, real mobile rule, reduced-motion pin) | none, unless JS unavoidable → `src/scripts/orrery.js` (bare tag) | 0 new hashes if CSS-only (the target); +1 script-src only if `orrery.js` is unavoidable | one commit; replicate essay changes per-file then cherry-pick |

## 9. Optional seasoning — the gold line-field texture

The earlier, unshipped idea of a generative gold line-field (a faint canvas of thin gold lines) is **not** the spine of this system and is **not** part of any required phase. If desired later, it may return only as an optional faint background texture behind a single section — authored as a static inline SVG (no JS, no canvas, no animation), at very low opacity, coloured from `orrery.css`, and subject to every §3/§7 rule (no filters, print-safe, reduced-motion-safe). It is mentioned here for completeness; do not build it unless explicitly asked.

## 10. Risks / open decisions

- **Intensity calibration.** Opacities in §4.2 are a starting register tuned to "ceremonial, not neon." Expect one round of visual tuning on the live hero in both schemes before Phase 1 merges; treat the table as the ceiling, dial down if it competes with the name lockup.
- **Caption localisation.** Recommended: one universal Latin arc (§7), backed by the localised `.hero-loop` real text. Open only if review insists on a zh-TW *curved* variant — then the `:has()`-gated second SVG path is the route, accepted as Phase-1.5 work, not blocking.
- **`.hero-loop` styling.** The new hero argument line must reinforce, not compete with, the name. Confirm its muted treatment (size, gold, placement) on the live hero before Phase 1 merges.
- **Halo on gradient stops.** Verify CSS `stop-color` on `<stop class="o-halo-*">` actually paints in Safari and Firefox; if any engine ignores it, switch that file to the sanctioned hard-coded `#0f1923` exception (§4.2).
- **Phase-4 JS.** The target is **zero JS** via `:has()`/`:focus-within`. Resolve the fork in the 4a spike; the single `orrery.js` hash is a last resort, must be a bare `<script>`, and must degrade to a complete no-JS DOM.
- **Mobile simplification** (§5a, §5g essay) needs a real device pass: confirm the simplified node count keeps the containment reading (civic ring + bounded AI orbit both survive the shrink) on both index and essay heroes.
- **Essay reveal trap.** The essay IntersectionObserver has **no no-IO fallback**; essay draw-arcs **must not** be gated behind `.reveal` — rely on `@supports view()` with the unconditional `stroke-dashoffset: 0` default (§5d).
- **Firefox.** `animation-timeline` is disabled-by-default as of 2026-06-14; the `@supports` guard is mandatory.
- **Working-tree artefacts.** `src/index.template.html.orig`, `.rej`, and `z` are stray; ignore them. The live template is `src/index.template.html`.

## 11. Success criteria

A phase is done when **all** applicable hold:

1. **Screenshot test.** The rendered hero matches the approved mockup register (outer civic ring + people-nodes, bounded inner AI orbit + planet, centre, curved caption, ink halo behind the lockup) in light and dark, with the `.hero-loop` text legible.
2. **CSP clean.** `bun weave.ts` regenerates `index.html`; style-src hash count is exactly **5** after Phase 1 (4 existing + orrery), and stays 5 through Phases 2–4 (no new style block). script-src stays **3** unless Phase 4b ships `orrery.js` (then 4). No console CSP violations in Chromium, Safari, Firefox.
3. **Zero hero JS.** No script added in Phases 1–3 or 4a; Phase-4b JS (if any) is bare-tagged, hashed, and the page is fully usable with JS off.
4. **Reduced-motion.** With `prefers-reduced-motion: reduce`, every rotation stops to a static engraving; no element is stuck invisible; every `.draw-arc` is forced `stroke-dashoffset: 0`.
5. **Light / dark.** `.hero`/`.interlude--dark`/`.closing` remain dark with `#fff`/`--gold-light` text; `--ink` never flipped; light sections render gold-on-cream.
6. **Print.** Instrument prints as a clean `--print-line`/`--print-accent` engraving via the explicit `@media print` rules (§7); rotations pinned by the explicit print `animation: none` (there is no universal print animation kill in the codebase); no white-on-white; existing print hide-list (`.pullquote`, `.film`, `.hero::after`) intact.
7. **Mobile.** Orrery scales/simplifies behind centred hero text, ≤0.25 opacity in portrait, on both index and essay heroes (essay orrery uses a distinct class, never `.hero-crystal`, so it does not vanish at ≤768px); containment still legible.
8. **Performance.** Hero SVG 2–4 KB, ≤150 nodes; DevTools paint-flashing shows the rotating groups composited (no per-frame paint); Lighthouse/CLS unchanged from baseline.
9. **a11y.** Decorative orrery SVGs absent from the accessibility tree; the "AI in the loop of humanity" argument present as real text both hero-local (`.hero-loop`) and page-level (section:DIALOGUE); the semantic `flag-tw` `<title>` untouched; focus-visible preserved.
10. **No `var()` in SVG attributes.** Every orrery SVG colour resolves via an `orrery.css` class selector; no `stroke=/fill=/stop-color="var(--…)"` anywhere in `src/svg/*`.
11. **Clean cherry-pick.** The phase commit applies to `../audreyt.org` with `git cherry-pick`, no `add/add` conflict, no per-domain patch dragged across.
