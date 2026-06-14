# Hero Orrery (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the "In the Loop of Humanity" orrery — a zero-JS, CSS-animated inline-SVG instrument — behind the index hero, plus a real-text `.hero-loop` argument line, without breaking the CSP, the `--ink` always-dark rule, reduced-motion, print, or dark mode.

**Architecture:** A new `src/svg/orrery-hero.svg` (geometry + class names only, no colour) is woven into `.hero` via a `{{svg:orrery-hero}}` marker and coloured/animated by a new `src/styles/orrery.css` woven via a bare `<style>{{style:orrery}}</style>` block (the only new CSP style-src hash, 4→5). The argument text comes from a new line in `README.md` / `README.zh-TW.md` `section:HERO`, emitted as a localised `.hero-loop` element by a small `renderHero` extension. `components.css` lowers `.hero::after` to `z-index:0` so the orrery (`z-index:1`) sits between the vignette and the lockup (`z-index:2`).

**Tech Stack:** Bun (`weave.ts` build + `pre-commit.ts` hook), hand-authored HTML/CSS/SVG, no framework. The orrery SVG is produced by a committed deterministic generator (`tools/build-orrery-hero.mjs`) so its ~140 computed primitives are never hand-edited.

**Source of truth:** This implements **Phase 1** of `docs/superpowers/specs/2026-06-14-in-the-loop-of-humanity-design.md`. Read §3 (non-negotiables), §4 (ring vocabulary), §5a (hero orrery), §6 (pipeline), §7 (a11y/perf/i18n/print) before starting.

**Three deliberate divergences from the spec, validated during planning:**
1. **Print:** the spec (§7) renders the orrery as a print engraving. The live print stylesheet rebuilds `.hero` as a *compact two-column grid* (`components.css` `@media print`), where a full-bleed `position:absolute` instrument would overlap the printed layout. **Phase 1 hides the orrery in print** (`.orrery--hero{display:none}`); the argument still prints as `.hero-loop` real text. The engraving is deferred to a later print proof. (Adjusts spec success criterion #6.)
2. **SVG size:** the shipped SVG is **~6.3 KB raw / ≈1.8 KB gzipped** at **134 nodes** (people-nodes 40, ticks 60) — within the spec's ≤150-node budget and ≤2 KB gzipped. (An earlier 46-node/72-tick draft measured 152 nodes / 7.1 KB / 2044 B gzipped — over both budgets — so the counts were trimmed; the instrument reads identically, verified by render.)
3. **Geometry tuning (spec §10 anticipates this):** the generator uses boundary ring **r=206** (spec §4.1 table says 300), caption arc **r≈380** centred via `startOffset="50%"` (spec says r=214 with an explicit path), and graticule inner radius **132**. These reproduce the approved mockup; confirm on the live hero before merge, then update the spec §4.1 table to match what ships.
4. **Extra element `o-ai-halo`:** the generator draws a faint glow ring (`r=13`) around the AI planet, beyond spec §5a's disc/planet/ring set — it is part of the approved mockup. Class-scoped and coloured from `orrery.css` like everything else (no leak, within the node budget); add it to spec §5a on reconcile.

---

## File Map

| File | Action | Responsibility |
|:-----|:-------|:---------------|
| `tools/build-orrery-hero.mjs` | **create** | Deterministic generator that writes `src/svg/orrery-hero.svg` |
| `src/svg/orrery-hero.svg` | **create** (generated) | Geometry + class names only — no colour attributes |
| `src/styles/orrery.css` | **create** | All orrery colour, motion, halo stops, reduced-motion, mobile, print |
| `src/index.template.html` | **modify** | Add `{{svg:orrery-hero}}` wrapper in `.hero`; add `<style>{{style:orrery}}</style>` |
| `src/styles/components.css` | **modify** | Lower `.hero::after` to `z-index:0`; add `.hero-loop` rule |
| `weave.ts` | **modify** | `renderHero`: parse the pre-quote loop line, emit `.hero-loop` |
| `README.md` | **modify** | Add `AI in the loop of humanity` line in `section:HERO` |
| `README.zh-TW.md` | **modify** | Add `AI 進入人類迴圈` line in `section:HERO` |
| `index.html` | **generated** | Re-woven by `bun weave.ts` (never hand-edit) |

There is **no test framework** in this repo. "Verify" steps are real commands (`bun weave.ts`, `grep`, headless Chrome render) with exact expected output — treat a failed expectation exactly as a failing test.

---

## Task 0: Clean the tree, then branch

- [ ] **Step 0: Remove stray artefacts from a prior attempt** (a `.rej` for the very file Task 3 edits is present)

Run:
```bash
cd /Users/au/w/cyberambassador.tw
rm -f src/index.template.html.orig src/index.template.html.rej z
git diff --quiet src/index.template.html && echo "template pristine" || echo "WARNING: template has uncommitted changes — investigate before editing"
```
Expected: `template pristine` (so the Task 3 Find/Replace anchors apply cleanly).

- [ ] **Step 1: Create a feature branch** (do not work on `main`)

Run:
```bash
git checkout -b design/hero-orrery
```
Expected: `Switched to a new branch 'design/hero-orrery'`

---

## Task 1: The orrery generator and SVG

**Files:**
- Create: `tools/build-orrery-hero.mjs`
- Create (generated): `src/svg/orrery-hero.svg`

- [ ] **Step 1: Create the generator** `tools/build-orrery-hero.mjs`

```js
// Generates src/svg/orrery-hero.svg — an "orrery of democracy".
// Geometry + class names ONLY; every colour comes from src/styles/orrery.css.
// Run: bun tools/build-orrery-hero.mjs   (deterministic; seeded RNG)
import { writeFileSync } from "node:fs";

const cx = 410, cy = 456, R = 362;
const pol = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

// seeded RNG (mulberry32) so node jitter is identical every run
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let ticks = "";
for (let i = 0; i < 60; i++) {
  const a = (2 * Math.PI * i) / 60;
  const [x1, y1] = pol(R, a);
  const [x2, y2] = pol(R - (i % 5 === 0 ? 11 : 6), a);
  ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
}

const rand = rng(7);
let nodes = "";
for (let i = 0; i < 40; i++) {
  const a = (2 * Math.PI * i) / 40 + (rand() - 0.5) * 0.024;
  const [x, y] = pol(R, a);
  const r = (1.6 + rand() * 1.5).toFixed(2);
  nodes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`;
}

let rad = "";
for (let i = 0; i < 12; i++) {
  const a = (2 * Math.PI * i) / 12;
  const [x1, y1] = pol(132, a);
  const [x2, y2] = pol(R - 2, a);
  rad += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
}

const capR = R + 18;
const [ax1, ay1] = pol(capR, Math.PI * 0.74);
const [ax2, ay2] = pol(capR, Math.PI * 0.26);
const capPath = `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} A ${capR} ${capR} 0 0 1 ${ax2.toFixed(1)} ${ay2.toFixed(1)}`;

const svg = `<svg class="orrery-svg" viewBox="0 0 1440 913" preserveAspectRatio="xMidYMid slice"
     fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="orrery-halo" cx="${cx}" cy="${cy}" r="360" gradientUnits="userSpaceOnUse">
      <stop class="o-halo-0" offset="0"/><stop class="o-halo-1" offset="0.55"/><stop class="o-halo-2" offset="1"/>
    </radialGradient>
    <path id="orrery-cap" d="${capPath}"/>
  </defs>
  <circle class="o-boundary" cx="${cx}" cy="${cy}" r="206"/>
  <g class="o-graticule">${rad}</g>
  <g class="o-civic">
    <circle cx="${cx}" cy="${cy}" r="${R}"/>
    <g class="o-ticks">${ticks}</g>
    <g class="o-people">${nodes}</g>
  </g>
  <rect class="o-halo" x="0" y="0" width="1440" height="913" fill="url(#orrery-halo)"/>
  <g class="o-ai">
    <circle class="o-ai-ring" cx="${cx}" cy="${cy}" r="120"/>
    <circle class="o-ai-disc" cx="${cx}" cy="${cy}" r="120"/>
    <circle class="o-ai-planet" cx="${cx}" cy="${cy - 120}" r="6"/>
    <circle class="o-ai-halo" cx="${cx}" cy="${cy - 120}" r="13"/>
  </g>
  <circle class="o-centre" cx="${cx}" cy="${cy}" r="2.6"/>
  <text class="o-caption" aria-hidden="true"><textPath href="#orrery-cap" startOffset="50%" text-anchor="middle" aria-hidden="true">AI · IN · THE · LOOP · OF · HUMANITY</textPath></text>
</svg>
`;
writeFileSync(new URL("../src/svg/orrery-hero.svg", import.meta.url), svg);
console.log("wrote src/svg/orrery-hero.svg", svg.length, "bytes");
```
> Writing this file creates the new `tools/` directory; the generator's target `src/svg/` already exists.

- [ ] **Step 2: Generate the SVG**

Run:
```bash
bun tools/build-orrery-hero.mjs
```
Expected: `wrote src/svg/orrery-hero.svg 64xx bytes` (~6400–6500; 134 nodes total, ≈1.8 KB gzipped).

- [ ] **Step 3: Verify the SVG carries NO colour** (the §3 var()/attribute rule)

Run:
```bash
grep -oE 'var\(|stroke="#|fill="#|stop-color' src/svg/orrery-hero.svg || echo CLEAN
```
Expected: `CLEAN`. The only colour-ish attributes the generator emits are `fill="none"` (root) and `fill="url(#orrery-halo)"` (halo rect), which this hex-anchored, only-matching pattern correctly ignores. Any `stroke="#…"`, `fill="#…"`, `stop-color`, or `var(` would be a real leak — fix the generator. (The SVG is one physical line, so a broad `grep` would dump the whole blob; this pattern prints nothing on success.)

- [ ] **Step 4: Commit**

```bash
git add tools/build-orrery-hero.mjs src/svg/orrery-hero.svg
git commit -m "feat(orrery): generator + hero SVG (geometry only, no colour)"
```

---

## Task 2: The orrery stylesheet

**Files:**
- Create: `src/styles/orrery.css`

- [ ] **Step 1: Create** `src/styles/orrery.css`

```css
/* orrery.css — every orrery colour, motion, and the ink halo live here.
   The SVG carries geometry + class names only (var() does not resolve in SVG
   presentation attributes; see DESIGN spec §3). */
:root { --orrery-line: var(--gold); --orrery-bright: var(--gold-light); }

/* hero wrapper: between the ink vignette (z0) and the lockup (z2) */
.orrery--hero { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.orrery--hero .orrery-svg { width: 100%; height: 100%; display: block; }

/* strata — colour sourced here, never from SVG attributes */
.orrery-svg .o-civic > circle { stroke: var(--orrery-bright); stroke-opacity: .55; }
.orrery-svg .o-ticks line     { stroke: var(--orrery-bright); stroke-opacity: .30; stroke-width: .8; }
.orrery-svg .o-people circle  { fill:   var(--orrery-bright); fill-opacity: .70; }
.orrery-svg .o-boundary       { stroke: var(--orrery-line);   stroke-opacity: .18; stroke-dasharray: 2 8; }
.orrery-svg .o-graticule line { stroke: var(--orrery-line);   stroke-opacity: .10; }
.orrery-svg .o-ai-ring        { stroke: var(--orrery-bright); stroke-opacity: .55; stroke-width: 1.3; }
.orrery-svg .o-ai-disc        { fill:   var(--orrery-bright); fill-opacity: .05; }
.orrery-svg .o-ai-planet      { fill:   var(--orrery-bright); fill-opacity: .95; }
.orrery-svg .o-ai-halo        { stroke: var(--orrery-bright); stroke-opacity: .40; stroke-width: .9; }
.orrery-svg .o-centre         { fill:   var(--orrery-bright); fill-opacity: .85; }
.orrery-svg .o-caption        { fill:   var(--orrery-bright); fill-opacity: .55;
                                font-family: var(--sans); font-size: 11px; letter-spacing: 6px; }

/* ink halo — gradient stops coloured from CSS (a stop-color="var(--ink)" ATTRIBUTE would not resolve) */
.orrery-svg .o-halo-0 { stop-color: var(--ink); stop-opacity: .82; }
.orrery-svg .o-halo-1 { stop-color: var(--ink); stop-opacity: .30; }
.orrery-svg .o-halo-2 { stop-color: var(--ink); stop-opacity: 0; }

/* motion — transform-only on three groups */
.orrery-svg .o-civic     { animation: orrery-spin 360s linear infinite; }
.orrery-svg .o-graticule { animation: orrery-spin 240s linear infinite reverse; }
.orrery-svg .o-ai        { animation: orrery-spin 48s  linear infinite; }
.orrery-svg .o-civic,
.orrery-svg .o-graticule,
.orrery-svg .o-ai { transform-box: fill-box; transform-origin: center; will-change: transform; }
@keyframes orrery-spin { to { transform: rotate(360deg); } }

/* reduced motion — a still engraving */
@media (prefers-reduced-motion: reduce) {
  .orrery-svg .o-civic,
  .orrery-svg .o-graticule,
  .orrery-svg .o-ai { animation: none; }
}

/* mobile — simplify behind the centred lockup; mirror the portrait's 0.25 veil */
@media (max-width: 768px) {
  .orrery--hero { opacity: .25; }
  .orrery-svg .o-ticks,
  .orrery-svg .o-graticule,
  .orrery-svg .o-boundary { display: none; }
  .orrery-svg .o-people circle:nth-of-type(n+17) { display: none; }
}

/* print — the live print hero is a compact redesigned grid; a full-bleed decorative
   instrument would overlap it, so hide it. The argument still prints as .hero-loop text.
   (Spec §7's print engraving is deferred to a later print proof.) */
@media print { .orrery--hero { display: none !important; } }
```
> **Reduced-motion is already enforced globally.** `components.css` (~line 1061) carries `* { animation: none !important; transition: none !important; }` under `prefers-reduced-motion` — that `!important` rule is the actual enforcer and beats this block. The `@media (prefers-reduced-motion: reduce)` block above is kept as defensive, self-documenting redundancy so `orrery.css` is legible standalone (and Task 7 Step 7's count of 2 depends on it existing).
> **Mobile note.** `opacity: .25` is applied across all `≤768px` (a deliberate simplification of the spec's portrait-only veil). `.o-people circle:nth-of-type(n+17)` is safe to hide because `.o-people` contains only `<circle>` children.

- [ ] **Step 2: Verify token references exist** (orrery.css depends on `--gold`, `--gold-light`, `--ink`, `--sans` from `base.css`)

Run:
```bash
grep -nE -- '--gold:|--gold-light:|--ink:|--sans:' src/styles/base.css
```
Expected: all four present in the `:root` block (lines ~11–26).

- [ ] **Step 3: Commit**

```bash
git add src/styles/orrery.css
git commit -m "feat(orrery): orrery.css — colour, motion, halo, reduced-motion, mobile, print"
```

---

## Task 3: Wire markers into the template

**Files:**
- Modify: `src/index.template.html`

- [ ] **Step 1: Add the orrery wrapper inside `.hero`, before `.hero-content`**

Find (the credit span just before the content div, ~line 82–83):
```html
    <span class="hero-portrait-credit" aria-hidden="true">Kaii Chiang · CC BY-NC-SA 4.0</span>
    <div class="hero-content">
```
Replace with:
```html
    <span class="hero-portrait-credit" aria-hidden="true">Kaii Chiang · CC BY-NC-SA 4.0</span>
    <div class="orrery orrery--hero" aria-hidden="true">{{svg:orrery-hero}}</div>
    <div class="hero-content">
```

- [ ] **Step 2: Add the orrery `<style>` block after the components style block**

Find (the components style block, ~line 70–72):
```html
<style>
{{style:components}}
</style>
```
Replace with:
```html
<style>
{{style:components}}
</style>
<style>
{{style:orrery}}
</style>
```
> The new `<style>` is **bare** (no attributes) so `weave.ts` `computeHashes("style")` hashes it (style-src 4→5). Do **not** add attributes to this tag.
> (For reference, the existing 4 style-src hashes are `base`, `fonts-stage2`, `components` — three bare `<style>` blocks — plus the `<noscript><style>{{style:noscript-reveal}}</style></noscript>` on template line 36, which `computeHashes` also matches. Adding `orrery` makes 5, not 4.)

- [ ] **Step 3: Verify the markers are present and well-formed**

Run:
```bash
grep -nE '\{\{svg:orrery-hero\}\}|\{\{style:orrery\}\}' src/index.template.html
```
Expected: exactly two matches — the `{{svg:orrery-hero}}` inside `.orrery--hero` and `{{style:orrery}}` inside a bare `<style>`.

- [ ] **Step 4: Commit**

```bash
git add src/index.template.html
git commit -m "feat(orrery): weave the orrery SVG + stylesheet into the hero"
```

---

## Task 4: Stacking + `.hero-loop` styling in components.css

**Files:**
- Modify: `src/styles/components.css`

- [ ] **Step 1: Lower the hero vignette below the orrery**

Find (`.hero::after`, ~line 24–36 — the `z-index: 1` line inside it):
```css
        rgba(15,25,35,0.1) 100%
    );
    z-index: 1;
}
```
Replace with:
```css
        rgba(15,25,35,0.1) 100%
    );
    z-index: 0;
}
```
> Paint order after this edit, bottom→top: portrait (auto) → `.hero::after` vignette (0) → `.orrery--hero` (1) → `.hero-content` (2). The `.hero-content` `z-index: 2` (~line 79) is unchanged.

- [ ] **Step 2: Add the `.hero-loop` rule** (it lands after the `@keyframes fadeUp { … }` block at real-file lines ~140–143, which itself follows the `.hero-quote` block)

Find:
```css
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
```
Replace with:
```css
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.hero-loop {
    margin-top: 28px;
    font-family: var(--sans);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold-light);
    opacity: 0.7;
}

html:has(#lang-zh:checked) .hero-loop { font-family: var(--cjk); letter-spacing: 0.1em; }
```
> The `.hero-loop` colour is `--gold-light` (scheme-invariant), so it reads on `--ink` in both schemes with no flip. The `:has()` rule swaps to CJK type for the zh line, matching how the repo handles `.essay-card` CJK.

- [ ] **Step 3: Verify edits**

Run:
```bash
grep -nE 'z-index: 0;|\.hero-loop \{' src/styles/components.css
```
Expected: the lowered `z-index: 0;` (inside `.hero::after`) and the new `.hero-loop {` rule.

- [ ] **Step 4: Commit**

```bash
git add src/styles/components.css
git commit -m "feat(orrery): pin orrery between vignette and lockup; style .hero-loop"
```

---

## Task 5: `renderHero` emits the `.hero-loop` argument

**Files:**
- Modify: `weave.ts` (function `renderHero`, lines ~233–294)

- [ ] **Step 1: Capture the pre-quote loop line in `parseHero`**

Find (inside `parseHero`, the subtitle block ending with the return, ~lines 250–260):
```ts
    // Subtitle: non-heading, non-quote, non-rule, non-empty lines after the quote
    const subtitleLines: string[] = [];
    let pastQuote = false;
    for (const line of content.split("\n")) {
      if (line.startsWith("> ")) pastQuote = true;
      else if (pastQuote && line.trim() && !line.startsWith("#") && line.trim() !== "****") {
        subtitleLines.push(line.trim());
      }
    }

    return { name, quoteLines, subtitleLines };
```
Replace with:
```ts
    // Subtitle: non-heading, non-quote, non-rule, non-empty lines after the quote
    const subtitleLines: string[] = [];
    let pastQuote = false;
    for (const line of content.split("\n")) {
      if (line.startsWith("> ")) pastQuote = true;
      else if (pastQuote && line.trim() && !line.startsWith("#") && line.trim() !== "****") {
        subtitleLines.push(line.trim());
      }
    }

    // Loop line: non-heading, non-rule, non-quote, non-empty lines BEFORE the quote.
    // (Currently the only such line is the new "AI in the loop of humanity" argument;
    // renderHero previously dropped this slot entirely.)
    const loopLines: string[] = [];
    let reachedQuote = false;
    for (const line of content.split("\n")) {
      if (line.startsWith("> ") || line === ">") reachedQuote = true;
      else if (!reachedQuote && line.trim() && !line.startsWith("#") && line.trim() !== "****") {
        loopLines.push(line.trim());
      }
    }

    return { name, quoteLines, subtitleLines, loopLines };
```

- [ ] **Step 2: Emit the localised `.hero-loop` after the quote blocks**

Find (the end of `renderHero`, ~lines 289–293):
```ts
  lines.push(`${I}<blockquote class="hero-quote" lang="zh-TW">`);
  lines.push(`${I}    ${zhH.quoteLines.join("<br>")}`);
  lines.push(`${I}</blockquote>`);

  return lines.join("\n");
}
```
Replace with:
```ts
  lines.push(`${I}<blockquote class="hero-quote" lang="zh-TW">`);
  lines.push(`${I}    ${zhH.quoteLines.join("<br>")}`);
  lines.push(`${I}</blockquote>`);

  // Loop argument — the real-text equivalent of the decorative SVG caption (a11y).
  if (enH.loopLines.length)
    lines.push(`${I}<p class="hero-loop" lang="en-GB">${enH.loopLines.join(" ")}</p>`);
  if (zhH.loopLines.length)
    lines.push(`${I}<p class="hero-loop" lang="zh-TW">${zhH.loopLines.join(" ")}</p>`);

  return lines.join("\n");
}
```
> `loopLines` is guarded so removing the README line cleanly removes the element rather than emitting an empty `<p>`. Both `<p class="hero-loop">` tags are always in the DOM; the toggle is a single `#lang-zh` checkbox — `base.css` line 2 hides `[lang="zh-TW"]` unless it is checked, line 3 hides `[lang="en-GB"]` when it is checked (an asymmetric single-checkbox pair, not a symmetric en/zh pair). This is exactly how `.hero-subtitle`/`.hero-quote` already behave.

- [ ] **Step 3: Type-check the edit** (`bun build` strips types and would print OK even on a bad property reference — use `tsc`; there is no `tsconfig.json`, so pass flags explicitly)

Run from the repo root (so `node_modules/@types/bun` resolves):
```bash
bunx tsc --noEmit --skipLibCheck --target esnext --module esnext --moduleResolution bundler --types bun weave.ts && echo OK
```
Expected: no diagnostics, then `OK`. This genuinely fails if `loopLines` is not wired into the `parseHero` return consumed by `enH`/`zhH`. (The runtime safety net is `bun weave.ts` in Task 7 Step 1, which a reviewer confirmed produces the two `.hero-loop` `<p>` elements with no empty tag.)

- [ ] **Step 4: Commit**

```bash
git add weave.ts
git commit -m "feat(orrery): renderHero emits localised .hero-loop argument line"
```

---

## Task 6: Add the argument line to both READMEs

**Files:**
- Modify: `README.md` (`section:HERO`)
- Modify: `README.zh-TW.md` (`section:HERO`)

- [ ] **Step 1: English** — insert the line between `****` and the quote

Find (top of `README.md`, lines ~1–6):
```markdown
<!-- section:HERO -->
# Audrey Tang

****

> "I want to be a good enough ancestor
```
Replace with:
```markdown
<!-- section:HERO -->
# Audrey Tang

****

AI in the loop of humanity

> "I want to be a good enough ancestor
```

- [ ] **Step 2: Traditional Chinese** — insert the localised line in the same slot

Find (top of `README.zh-TW.md`, lines ~1–6):
```markdown
<!-- section:HERO -->
# 唐鳳

****

> 我願作後代子孫夠好的祖先。
```
Replace with:
```markdown
<!-- section:HERO -->
# 唐鳳

****

AI 進入人類迴圈

> 我願作後代子孫夠好的祖先。
```

- [ ] **Step 3: Confirm the line lands in the loop slot, not the subtitle**

The line sits *before* the `>` quote, so `parseHero`'s subtitle scan (which only collects lines *after* the quote) ignores it, and the new `loopLines` scan (lines *before* the quote, excluding `#`/`****`/blank) collects exactly it. Verified by render in Task 7, Step 3.

- [ ] **Step 4: Commit**

```bash
git add README.md README.zh-TW.md
git commit -m "content(hero): add 'AI in the loop of humanity' argument line (en + zh)"
```

---

## Task 7: Weave, then verify everything

**Files:** none created; this regenerates `index.html` and checks it.

- [ ] **Step 1: Re-weave**

Run:
```bash
bun weave.ts
```
Expected: completes with no `weave: …` error lines and exit code 0 (it rewrites `index.html`). If it prints `weave: missing src/…`, a source file is misnamed.

- [ ] **Step 2: Verify the SVG and stylesheet inlined**

Run:
```bash
grep -c 'class="orrery-svg"' index.html; grep -c 'class="orrery orrery--hero"' index.html; grep -c 'o-ai-planet' index.html
```
Expected: `1`, `1`, `1` (the SVG and the wrapper div each appear once; `o-ai-planet` once). Then confirm markers fully resolved: `grep -c '{{' index.html` → `0`. (Anchor on `class="orrery orrery--hero"`, not a bare `orrery--hero`, because the inlined `orrery.css` selectors also contain that substring — a bare match would return ~5.)

- [ ] **Step 3: Verify the `.hero-loop` argument is present and localised**

Run:
```bash
grep -c 'class="hero-loop"' index.html
grep -o 'AI in the loop of humanity' index.html | head -1
grep -o 'AI 進入人類迴圈' index.html | head -1
```
Expected: `2` (one en, one zh), then each phrase echoed once. If `class="hero-loop"` is `0`, `renderHero` did not emit it; if the en phrase appears inside a `hero-subtitle`, the README line landed in the wrong slot.

- [ ] **Step 4: Verify the CSP recomputed correctly — style-src 4→5, script-src unchanged**

Run:
```bash
grep -o "style-src [^;]*" index.html | grep -o 'sha256-' | wc -l
grep -o "script-src [^;]*" index.html | grep -o 'sha256-' | wc -l
```
Expected: **`5`** style-src hashes and **`3`** script-src hashes. If style-src is not 5, the orrery `<style>` was not bare (check for attributes) or weave did not run.

- [ ] **Step 5: Verify no colour leaked into the woven SVG**

Run:
```bash
grep -o 'class="orrery-svg".*</svg>' index.html | grep -oE 'stroke="#|fill="#|stop-color|var\(' || echo "CLEAN"
```
Expected: `CLEAN`.

- [ ] **Step 6: Render the hero, light and dark, and eyeball it** (zero-JS, so a static headless shot is faithful)

Run (creates two PNGs; new-headless captures the viewport):
```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --hide-scrollbars --window-size=1440,900 \
  --screenshot=/tmp/orrery-check-light.png "file://$PWD/index.html" 2>/dev/null
echo "light shot:"; ls -la /tmp/orrery-check-light.png
```
Expected: a PNG exists. Open it and confirm against `docs/superpowers/specs/…`/the approved mockup register: outer civic ring with people-nodes, bounded inner AI orbit + planet, centre dot, curved `AI · IN · THE · LOOP · OF · HUMANITY` caption, soft ink halo behind a legible name lockup, and the muted `.hero-loop` line. (For authored dark-mode + reduced-motion + mobile emulation, use DevTools' "Rendering" → Emulate CSS media, or the CDP `Emulation.setEmulatedMedia` harness from planning; a plain headless shot is light-scheme, motion-on.)

- [ ] **Step 7: Verify reduced-motion and mobile rules exist in the woven output**

Run:
```bash
grep -c 'prefers-reduced-motion: reduce' index.html         # expect 2 (1 existing in components + 1 in orrery)
grep -c 'max-width: 768px' index.html                       # expect 9 (8 existing + 1 orrery mobile block)
grep -o '@media print { .orrery--hero' index.html | head -1 # orrery print-hide present
```
Expected: `2`, then `9`, then the orrery print-hide line echoed. (Baselines verified against the current build: 1 `prefers-reduced-motion: reduce` and 8 `max-width: 768px` occurrences before this change.)

- [ ] **Step 8: Commit the regenerated page**

```bash
git add index.html
git commit -m "build(orrery): re-weave index.html with Phase-1 hero orrery + CSP rehash"
```
> If you run the pre-commit hook instead (`git commit` triggers `pre-commit.ts`), it re-weaves and `git add index.html` for you — but only because the staged paths are under `src/`/`README*`. Either way, end with a clean `git status` and a re-woven `index.html`.

---

## Task 8: Final review and cherry-pick to audreyt.org

- [ ] **Step 1: Full visual regression pass (manual, both schemes)**

Open `index.html` in a browser. Confirm: (a) light + dark hero both correct; (b) toggle the language — the `.hero-loop` swaps en↔zh and uses CJK type in zh; (c) `prefers-reduced-motion` (OS setting or DevTools) freezes the orrery to a still; (d) narrow the window to ≤768px — the orrery simplifies to ≤0.25 opacity behind centred text and the containment still reads; (e) print preview — the orrery is absent, the `.hero-loop` text prints, nothing is white-on-white.

- [ ] **Step 2: Squash-or-keep decision, then cherry-pick**

Phase 1 is one logical change. Either keep the per-task commits or squash them to one before syncing:
```bash
# (optional) squash design/hero-orrery into one commit for a clean cherry-pick
git rebase -i main          # mark Task-1..7 commits as 'squash' onto the first
```
Then, **per AGENTS.md — never copy files; cherry-pick**:
```bash
cd ../audreyt.org
git fetch /Users/au/w/cyberambassador.tw design/hero-orrery
git cherry-pick <sha…>      # the Phase-1 commit(s)
```
Expected: applies cleanly. An `add/add` conflict means a file already arrived under another hash — abort and re-pick only new commits. Do **not** drag across any per-domain default-language/`og:image` commit.

- [ ] **Step 3: Verify the mirror re-weaves**

In `../audreyt.org`, run `bun weave.ts` and confirm its `index.html` regenerates with the orrery and a clean CSP (its default language is zh-TW, so confirm the `.hero-loop` shows `AI 進入人類迴圈` by default there).

---

## Self-Review (run by the planner)

**Spec coverage (Phase 1 rows of spec §8):**
- Orrery SVG behind hero → Tasks 1, 3. ✓
- Ink halo via CSS-driven stops → Task 2 (`.o-halo-*`), validated in Chromium during planning. ✓
- 3 rotating groups, transform-only, `fill-box`/`center` origin → Task 2. ✓
- `.hero-loop` real-text argument (R2 resolved: pre-quote slot + `renderHero` + README lines) → Tasks 4–6. ✓
- `.hero::after` → `z-index:0` → Task 4. ✓
- reduced-motion / mobile / print → Task 2. ✓
- CSP rehash (style-src 4→5, script-src 3) → Task 7 Steps 4. ✓
- Cherry-pick sync → Task 8. ✓

**Placeholder scan:** no TBD/TODO; every file's content is given in full or generated by the committed `tools/build-orrery-hero.mjs`. ✓

**Type/name consistency:** classes match across SVG generator, `orrery.css`, and the template wrapper (`orrery-svg`, `orrery--hero`, `o-civic`, `o-ticks`, `o-people`, `o-boundary`, `o-graticule`, `o-ai`, `o-ai-ring`, `o-ai-disc`, `o-ai-planet`, `o-ai-halo`, `o-centre`, `o-caption`, `o-halo`, `o-halo-0/1/2`). `loopLines` defined in `parseHero` return and consumed in `renderHero`. Markers `orrery-hero`/`orrery` match file names `src/svg/orrery-hero.svg` / `src/styles/orrery.css`. ✓

**Open items carried from spec §10 (not blockers for Phase 1):** halo `stop-color` confirmed in Chromium only — Task 8 Step 1 must confirm Safari/Firefox; intensity opacities are a starting register; `.hero-loop` placement/wording is tunable.

---

## Execution Handoff

After review, choose execution:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks.
**2. Inline Execution** — run tasks here with checkpoints.
