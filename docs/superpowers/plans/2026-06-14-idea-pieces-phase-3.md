# Idea Pieces (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make two of the site's ideas *visible*: render the 6-Pack of Care as six small **bounded orbits** (many kami, each circling its own loop), and lay a wide arc densely studded with **people-nodes** behind the pullquote (the human ring, unrolled).

**Architecture:** (1) **Care-orbits** — a pure-CSS treatment of the existing six `.work-grid > .work-item`s: `::before` draws the ring, `::after` is a box with a rim node that rotates (the orbiting kami), with staggered periods per `:nth-child`. It replaces each item's `border-top: 3px solid var(--ink)`. No HTML/renderer change. (2) **People-arc** — one generated inline SVG (`{{svg:people-arc}}`, ~42 nodes on a shallow bezier arc) placed behind `.pullquote`, coloured by `orrery.css`. All CSS appends to `src/styles/orrery.css`; no new CSP hashes; no JS.

**Tech Stack:** Bun (`weave.ts` + `pre-commit.ts`), hand-authored HTML/CSS/SVG, no framework.

**Source of truth:** Phase 3 of `docs/superpowers/specs/2026-06-14-in-the-loop-of-humanity-design.md` (§5e care-orbits, §5f people-arc, §8 Phase-3 row). **Depends on Phases 1–2** (`src/styles/orrery.css`, `--orrery-line`/`--orrery-bright`).

**Three deliberate divergences from the spec, validated during planning:**
1. **Care-orbits are pure CSS, not six inline SVGs.** Spec §5e proposed six `{{svg:care-orbits}}` SVGs. The six principles already render as six `.work-grid > .work-item`s (verified `weave.ts` `renderCivicAI`), so a `::before`+`::after` per item is DRYer, needs zero renderer edits, and animates the orbiting node with one `@keyframes`. No `care-orbits.svg` / marker is created. This follows the house pattern set in Phase 2 — ring-and-dot glyphs ship as pure-CSS pseudo-elements (the `.section-label::before` glyph already on this branch); only genuinely arc/multi-node shapes (the divider, the people-arc) are authored as self-contained SVG.
2. **Care-orbits scoped to `.work-grid > .work-item`.** The trailing "civic.ai →" / "pi.audreyt.org →" links also render as `.work-item` (with `--spaced`/`--paired`) **outside** the grid; the child combinator excludes them so only the six care principles get an orbit.
3. **People-arc placement = the actual `.pullquote`** (the geothermal-democracy quote). Spec §5f names "We the People are the superintelligence", but that line is the *Dialogue* section heading, not the pullquote (verified `README.md`). The people-arc — the collective rendered as nodes — sits behind the pullquote regardless; the quote it backs is the geothermal one. It is **static** (the spec's "static or one-shot draw-on" — static chosen for restraint).

---

## File Map

| File | Action | Responsibility |
|:-----|:-------|:---------------|
| `src/styles/orrery.css` | **modify (append)** | Care-orbit rules (scoped, staggered, reduced-motion, print) + people-arc rules |
| `tools/build-people-arc.mjs` | **create** | Deterministic generator → `src/svg/people-arc.svg` |
| `src/svg/people-arc.svg` | **create (generated)** | ~42 nodes on a shallow bezier arc, classes only |
| `src/index.template.html` | **modify** | One `<div class="people-arc">{{svg:people-arc}}</div>` inside the `.pullquote` aside |
| `index.html` | **generated** | Re-woven by `bun weave.ts` |

No test framework — "verify" steps are real commands with exact expected output.

---

## Task 0: Branch from Phase 2

- [ ] **Step 1: Branch** (Phase 3 needs `orrery.css` from `design/loop-grammar`)

Run:
```bash
cd /Users/au/w/cyberambassador.tw
git checkout design/loop-grammar && git checkout -b design/idea-pieces
```
Expected: `Switched to a new branch 'design/idea-pieces'`. (If Phases 1–2 are already on `main`, branch off `main` instead and confirm `src/styles/orrery.css` exists.)

- [ ] **Step 2: Confirm dependencies present**

Run:
```bash
grep -q -- '--orrery-line' src/styles/orrery.css && grep -q 'class="work-grid"' weave.ts && echo "deps present"
```
Expected: `deps present`.

---

## Task 1: Care-orbits (pure CSS)

**Files:** Modify `src/styles/orrery.css` (append).

- [ ] **Step 1: Append the care-orbit rules** to the end of `src/styles/orrery.css`

```css

/* ─── Idea pieces: 6-Pack of Care as bounded orbits (Phase 3) ─────────── */
/* The six grid items become bounded orbits — a kami circling each loop.
   Scoped with the child combinator so the trailing link-items (outside the
   grid) keep their own style. Replaces each item's 3px ink border-top. */
.work-grid > .work-item { position: relative; border-top: none; padding-top: 46px; }
.work-grid > .work-item::before {
  content: ""; position: absolute; top: 0; left: 0;
  width: 28px; height: 28px; border: 1px solid var(--orrery-line); border-radius: 50%; opacity: .7;
}
.work-grid > .work-item::after {
  content: ""; position: absolute; top: 0; left: 0;
  width: 28px; height: 28px; border-radius: 50%; transform-origin: center;
  will-change: transform;
  animation: kami 72s linear infinite;
  background: radial-gradient(circle 2.4px at 50% 0%, var(--orrery-line) 99%, transparent 100%);
}
/* staggered periods + directions so the six read as an ensemble, not one clock */
.work-grid > .work-item:nth-child(1)::after { animation-duration: 66s; }
.work-grid > .work-item:nth-child(2)::after { animation-duration: 78s; }
.work-grid > .work-item:nth-child(3)::after { animation-duration: 90s; animation-direction: reverse; }
.work-grid > .work-item:nth-child(4)::after { animation-duration: 84s; animation-direction: reverse; }
.work-grid > .work-item:nth-child(5)::after { animation-duration: 72s; }
.work-grid > .work-item:nth-child(6)::after { animation-duration: 96s; animation-direction: reverse; }
@keyframes kami { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .work-grid > .work-item::after { animation: none; } }
/* print: drop the orbit; the existing print stylesheet restores .work-item's
   ink border-top (!important at components.css ~1432) */
@media print { .work-grid > .work-item::before, .work-grid > .work-item::after { content: none; } }
```
> `--orrery-line` (= `var(--gold)`) flips light/dark; the Civic-AI band is a light section. `will-change: transform` is scoped to the six tiny `::after` nodes (well under any VRAM concern, per spec §5e). In print the orbit `border-top: none` (no `!important`) is overridden anyway by the print stylesheet's full-panel `.work-item` border (`!important`, components.css ~1428–1433), so print is unaffected beyond nulling the pseudo-elements via `content: none`.

- [ ] **Step 2: Sanity-check**

Run:
```bash
grep -c 'work-grid > .work-item' src/styles/orrery.css
```
Expected: `11` — `grep -c` counts lines: base item, `::before`, `::after`, six `:nth-child` lines, the reduced-motion line, the print line = 11.

- [ ] **Step 3: Commit**

```bash
git add src/styles/orrery.css
git commit -m "feat(orrery): 6-Pack of Care as six bounded orbits (pure CSS, staggered kami)"
```

---

## Task 2: People-arc generator + SVG

**Files:** Create `tools/build-people-arc.mjs`; create (generated) `src/svg/people-arc.svg`.

- [ ] **Step 1: Create the generator** `tools/build-people-arc.mjs`

```js
// Generates src/svg/people-arc.svg — a wide shallow arc studded with ~42
// people-nodes (the human ring, unrolled). Geometry + classes only.
// Run: bun tools/build-people-arc.mjs   (deterministic; seeded RNG)
import { writeFileSync } from "node:fs";

const P0 = [70, 178], PC = [600, -86], P2 = [1130, 178];      // quad bezier control points
const bez = (t) => {
  const mt = 1 - t;
  return [
    mt * mt * P0[0] + 2 * mt * t * PC[0] + t * t * P2[0],
    mt * mt * P0[1] + 2 * mt * t * PC[1] + t * t * P2[1],
  ];
};
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(11);
const N = 42;
let nodes = "";
for (let i = 0; i < N; i++) {
  const [x, y] = bez(i / (N - 1));
  const yy = y + (rand() - 0.5) * 6;
  const r = (1.3 + rand() * 1.7).toFixed(2);
  nodes += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${r}"/>`;
}
const arc = `M ${P0[0]} ${P0[1]} Q ${PC[0]} ${PC[1]} ${P2[0]} ${P2[1]}`;
const svg = `<svg class="people-arc-svg" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none"><path class="pa-arc" d="${arc}"/><g class="pa-nodes">${nodes}</g></svg>
`;
writeFileSync(new URL("../src/svg/people-arc.svg", import.meta.url), svg);
console.log("wrote src/svg/people-arc.svg", svg.length, "bytes,", N, "nodes");
```

- [ ] **Step 2: Generate**

Run:
```bash
bun tools/build-people-arc.mjs
```
Expected: `wrote src/svg/people-arc.svg 18xx bytes, 42 nodes` (~1850–1900).

- [ ] **Step 3: Verify no colour in the SVG**

Run:
```bash
grep -oE 'var\(|stroke="#|fill="#|stop-color' src/svg/people-arc.svg || echo CLEAN
grep -qE '<style|<script' src/svg/people-arc.svg && echo 'PHANTOM-HASH RISK' || echo 'no embedded style/script'
```
Expected: `CLEAN` (the only colour-ish attr is the root `fill="none"`, which this pattern ignores), then `no embedded style/script` (a bare `<style>`/`<script>` inside the SVG would inject a phantom CSP hash — the generator emits neither).

- [ ] **Step 4: Commit**

```bash
git add tools/build-people-arc.mjs src/svg/people-arc.svg
git commit -m "feat(orrery): people-arc generator + SVG (42 nodes on a shallow arc)"
```

---

## Task 3: People-arc CSS + template placement

**Files:** Modify `src/styles/orrery.css` (append); modify `src/index.template.html`.

- [ ] **Step 1: Append the people-arc rules** to the end of `src/styles/orrery.css`

```css

/* ─── Idea pieces: people-arc behind the pullquote (Phase 3) ──────────── */
.pullquote { position: relative; overflow: hidden; }
.pullquote .people-arc { position: absolute; left: 0; right: 0; bottom: 18px; height: 170px;
  z-index: 0; pointer-events: none; }
.pullquote .people-arc .people-arc-svg { width: 100%; height: 100%; display: block; }
.pullquote .people-arc .pa-arc { stroke: var(--orrery-line); stroke-opacity: .22; stroke-width: 1; }
.pullquote .people-arc .pa-nodes circle { fill: var(--orrery-line); fill-opacity: .55; }
.pullquote blockquote, .pullquote cite { position: relative; z-index: 1; }
```
> `.pullquote` is `display:none` in print already (components.css ~1115), so the people-arc never prints — no print rule needed. `.pullquote` is a `--paper` section, so `--orrery-line` reads gold-on-cream in both schemes.

- [ ] **Step 2: Place the people-arc inside the pullquote aside**

Find (in `src/index.template.html`):
```html
<aside class="pullquote reveal">
{{content:PULLQUOTE}}
</aside>
```
Replace with:
```html
<aside class="pullquote reveal">
    <div class="people-arc">{{svg:people-arc}}</div>
{{content:PULLQUOTE}}
</aside>
```

- [ ] **Step 3: Verify placement**

Run:
```bash
grep -c '<div class="people-arc">{{svg:people-arc}}</div>' src/index.template.html
```
Expected: `1`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/orrery.css src/index.template.html
git commit -m "feat(orrery): place people-arc behind the pullquote"
```

---

## Task 4: Weave, verify, render

- [ ] **Step 1: Re-weave**

Run:
```bash
bun weave.ts
```
Expected: exit 0, no `weave:` errors.

- [ ] **Step 2: Verify inlined output + markers resolved**

Run:
```bash
grep -c 'work-grid > .work-item' index.html        # care-orbit CSS inlined (11)
grep -c 'class="people-arc"' index.html             # the pullquote wrapper div
grep -c 'class="pa-nodes"' index.html               # the inlined people-arc group
grep -c '{{' index.html                             # markers fully resolved
```
Expected: `11`, `1`, `1`, `0`.

- [ ] **Step 3: Verify CSP unchanged** (no new hashes)

Run:
```bash
grep -o "style-src [^;]*" index.html | grep -o 'sha256-' | wc -l    # 5
grep -o "script-src [^;]*" index.html | grep -o 'sha256-' | wc -l   # 3
```
Expected: `5`, `3`.

- [ ] **Step 4: Render + confirm** (orbits/people-arc are visible static under reduced-motion, which the harness emulates)

Run:
```bash
(python3 -m http.server 8817 >/dev/null 2>&1 &) ; sleep 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --hide-scrollbars --window-size=1440,3400 \
  --screenshot=/tmp/p3-check.png "http://127.0.0.1:8817/index.html" 2>/dev/null
pkill -f "http.server 8817"; ls -la /tmp/p3-check.png
```
Expected: a PNG exists. Open it: each of the six Civic-AI care principles carries a small gold orbit ring above its title; a wide studded arc of nodes sits behind the pullquote. (The orbiting-node motion needs a real Chromium/Safari scroll; a static shot shows the resting node on each ring.)

- [ ] **Step 5: Verify reduced-motion + print**

Run:
```bash
grep -c 'prefers-reduced-motion: reduce' index.html      # 4 (components, orrery P1, orrery P2, orrery P3 kami)
grep -o '@media print { .work-grid > .work-item' index.html | head -1
```
Expected: `4`; then the care-orbit print line echoed.

- [ ] **Step 6: Commit the regenerated page**

```bash
git add index.html
git commit -m "build(orrery): re-weave index.html with Phase-3 idea pieces"
```
> No-op if the pre-commit hook already folded the re-weave into a prior commit — end with a clean `git status` and an up-to-date `index.html`.

---

## Task 5: Final review + cherry-pick

- [ ] **Step 1: Visual + behaviour pass (both schemes)**

Open `index.html`. Confirm: (a) six care-orbits read on the light Civic-AI band (gold rings), and in Chromium/Safari the orbiting node circles each ring at staggered rates; (b) the people-arc reads behind the pullquote without crowding the quote text (z-index keeps text above), and the bottom row of nodes isn't clipped by `.pullquote { overflow: hidden }` under the `preserveAspectRatio="none"` vertical scale — check desktop **and** 1-column mobile; (c) `prefers-reduced-motion` freezes the orbiting nodes; (d) language toggle fine; (e) print preview — no orbit pseudo-elements (work-items show their normal print border), pullquote (and its people-arc) absent as before; (f) on the narrowest mobile layout the 28px orbit doesn't crowd the `.work-item` h3.

- [ ] **Step 2: Cherry-pick to audreyt.org** (per AGENTS.md — never copy files)

After Phases 1–2 are on `audreyt.org`, list and pick the Phase-3 commits:
```bash
git log --oneline design/loop-grammar..design/idea-pieces   # the Phase-3 commits (oldest last)
cd ../audreyt.org
git fetch /Users/au/w/cyberambassador.tw design/idea-pieces
git cherry-pick <those SHAs, oldest → newest>
bun weave.ts                 # confirm the mirror regenerates cleanly
```
An `add/add` conflict means the file already arrived — abort and re-pick only new commits.

---

## Self-Review (run by the planner)

**Spec coverage (Phase 3 row):** 6-Pack of Care orbits → Task 1 ✓; pullquote people-arc → Tasks 2–3 ✓. Divergences (pure-CSS orbits, `.work-grid >` scope, pullquote placement + static) declared up top.

**Placeholder scan:** none — every file's content is shown in full or generated by the committed `tools/build-people-arc.mjs`.

**Type/name consistency:** `work-grid`/`work-item`/`kami` (Task 1) match the existing markup + new keyframe; `people-arc`/`people-arc-svg`/`pa-arc`/`pa-nodes` match across generator (Task 2), CSS (Task 3 Step 1), and template wrapper (Task 3 Step 2). `--orrery-line` is the Phase-1 alias.

**Open items (non-blocking):** orbit ring size (28px), node radius (2.4px), and stagger periods are a starting register — tune on the live band. People-arc opacity (.22 stroke / .55 nodes) and `bottom: 18px` placement likewise. Confirm the orbit doesn't crowd the `.work-item` h3 on the narrowest (1-column) mobile layout.

---

## Execution Handoff

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review. **2. Inline Execution** — batch with checkpoints.
