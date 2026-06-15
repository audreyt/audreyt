# Loop Grammar (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spread the loop motif from the hero into a quiet page-wide *grammar* — a tiny orbit glyph on every section eyebrow, and four signature arc-segment dividers at the major band transitions that draw themselves on as you scroll.

**Architecture:** Two primitives, both layered onto the existing structure with near-zero new surface. (1) The **section orbit-glyph** is a pure-CSS `::before` on `.section-label` (a `border` ring + a `radial-gradient` rim node) — no HTML change, no new SVG, no renderer edits. (2) The **arc-segment divider** is one tiny inline SVG (`{{svg:divider-arc}}`) inserted at four `<!-- section -->` boundaries; its `pathLength="1"` path draws on via a CSS scroll-driven animation (`@supports (animation-timeline: view())`) and is statically drawn everywhere else. All CSS appends to the existing `src/styles/orrery.css`; no new CSP hashes.

**Tech Stack:** Bun (`weave.ts` + `pre-commit.ts`), hand-authored HTML/CSS/SVG, no framework, no JS added.

**Source of truth:** This implements **Phase 2** of `docs/superpowers/specs/2026-06-14-in-the-loop-of-humanity-design.md` (§5b glyph, §5c divider, §5d reveal-as-draw, §8 Phase-2 row). It **depends on Phase 1** (`src/styles/orrery.css`, `--orrery-line`/`--orrery-bright` aliases) being present.

**Four deliberate divergences from the spec, validated during planning:**
1. **Glyph is pure CSS, not an SVG marker.** Spec §5b proposed `{{svg:glyph-orbit}}` inserted into each renderer. There are **ten** `.section-label` emit lines in `weave.ts` (five en/zh label pairs — Bio About/Roles, Dialogue, Recognition, Civic AI, Case-study, Film, Essays, Publications, Background; Connect has none), and CSP `img-src 'self'` forbids a `data:` SVG mask — so a single `.section-label::before` rule (ring via `border-radius`+`border`, rim node via `radial-gradient`) is dramatically DRYer, CSP-clean, and needs zero renderer/template edits. The bare `.section-label` selector also catches the nested Civic-AI `.case-study .section-label` (on `--surface`, reads gold-on-cream — fine). **No `glyph-orbit.svg` / `{{svg:glyph-orbit}}` is created.**
2. **Dividers draw-on via scroll-timeline only (static-drawn fallback), not the `.reveal` IO path.** The `.reveal`/`.visible` system also runs an opacity+translate *fade*, which fights "draw, not fade" (spec §5d). So the divider uses `@supports (animation-timeline: view())` for the draw (Chromium/Safari) and is **statically drawn** elsewhere (Firefox, no-JS) — never invisible. It does **not** take the `.reveal` class.
3. **Glyph scope = section eyebrows only.** `.section-label` (the section eyebrows) get the glyph; card-level metas (`.dialogue-body .meta`, `.essay-card .meta`, `.pub-venue`) and the hero's own `.hero-label` (a distinct class, already carrying the flag) do **not** — keeping the motif at section scale, restrained.
4. **Divider class names + draw mechanism.** The spec's single `.divider-arc` SVG class becomes `.divider-arc-svg` (on the `<svg>`) plus `.divider-arc` (on the new wrapper `<div>`); the path is `.d-arc`. The draw uses `pathLength="1"` + `stroke-dasharray: 1` (keyframe `draw-arc`) instead of spec §5d's measured `var(--len)` + keyframe `draw` — equivalent geometry, with no length to compute.

**Divider placement (the approved "signature few" — tunable):** four arcs, each a sibling element on the body's paper background *between* bands, at the transitions into **Bio**, **Pullquote**, **Film**, and **Gallery**. Because each sits on `--paper`, all four use the single light treatment (gold on cream) — no dark variant needed.

---

## File Map

| File | Action | Responsibility |
|:-----|:-------|:---------------|
| `src/styles/orrery.css` | **modify (append)** | Glyph `::before`, `.film` dark override, divider + scroll-draw rules, print/reduced-motion |
| `src/svg/divider-arc.svg` | **create** | One shallow `pathLength="1"` arc path, class names only |
| `src/index.template.html` | **modify** | Four `<div class="divider-arc">{{svg:divider-arc}}</div>` at the Bio/Pullquote/Film/Gallery markers |
| `index.html` | **generated** | Re-woven by `bun weave.ts` |

No test framework — "verify" steps are real commands (`bun weave.ts`, `grep`, headless render) with exact expected output.

---

## Task 0: Branch from Phase 1

- [ ] **Step 1: Branch off the Phase-1 work** (Phase 2 needs `orrery.css` from `design/hero-orrery`)

Run:
```bash
cd /Users/au/w/cyberambassador.tw
git checkout design/hero-orrery && git checkout -b design/loop-grammar
```
Expected: ends `Switched to a new branch 'design/loop-grammar'`. (If Phase 1 was already merged to `main`, branch off `main` instead — `git checkout main && git checkout -b design/loop-grammar` — and confirm `src/styles/orrery.css` exists.)

- [ ] **Step 2: Confirm Phase 1 is present**

Run:
```bash
test -f src/styles/orrery.css && grep -q -- '--orrery-line' src/styles/orrery.css && echo "phase 1 present"
```
Expected: `phase 1 present`.

---

## Task 1: Section orbit-glyph (pure CSS)

**Files:** Modify `src/styles/orrery.css` (append).

- [ ] **Step 1: Append the glyph rules** to the end of `src/styles/orrery.css`

```css

/* ─── Loop grammar: section orbit-glyph (Phase 2) ─────────────────────── */
/* A tiny ring + one rim node before every section eyebrow. Pure CSS — no
   SVG, no marker, no renderer edits. CSP-safe (no data: mask). */
.section-label { position: relative; padding-left: 1.7em; }
.section-label::before {
  content: "";
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 0.95em; height: 0.95em;
  border: 1px solid var(--orrery-line); border-radius: 50%;
  background: radial-gradient(circle 1.4px at 88% 50%, var(--orrery-line) 99%, transparent 100%);
  opacity: 0.85;
}
/* always-dark sections (the film band) need the scheme-invariant bright gold */
.film .section-label::before { border-color: var(--orrery-bright);
  background: radial-gradient(circle 1.4px at 88% 50%, var(--orrery-bright) 99%, transparent 100%); }
/* print: drop the glyph so the print eyebrows stay flush (the elaborate print
   stylesheet re-lays section labels; a ring there adds nothing) */
@media print { .section-label { padding-left: 0; } .section-label::before { content: none; } }
```
> The glyph attaches to the existing `.section-label` elements (both the `lang="en-GB"` and `lang="zh-TW"` copies — the hidden one is `display:none`, so its `::before` never paints). `--orrery-line` = `var(--gold)` flips light/dark; `.film` is always-dark so it uses `--orrery-bright`.

- [ ] **Step 2: Sanity-check the rule is well-formed**

Run:
```bash
grep -c 'section-label::before' src/styles/orrery.css
```
Expected: `3` — `grep -c` counts **lines**: the base rule, the `.film` override, **and** the `@media print { … content: none }` line all contain the substring. (Keep the base rule and `.film` override on separate lines; if reflowed onto one, this and Task 4 Step 2 drop to `2`/`2`.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/orrery.css
git commit -m "feat(orrery): section orbit-glyph on every eyebrow (pure CSS ::before)"
```

---

## Task 2: Arc-segment divider — SVG + CSS

**Files:** Create `src/svg/divider-arc.svg`; modify `src/styles/orrery.css` (append).

- [ ] **Step 1: Create** `src/svg/divider-arc.svg` (geometry + classes only, no colour)

```xml
<svg class="divider-arc-svg" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none"><path class="d-arc" pathLength="1" d="M0 38 A 4000 4000 0 0 1 1200 38"/></svg>
```
> One shallow arc (radius 4000 over 1200 width → a faint upward bow) from a straight hairline's place. `pathLength="1"` normalises the path so the draw-on needs no measured length. `preserveAspectRatio="none"` lets it span any width.

- [ ] **Step 2: Append the divider + scroll-draw rules** to the end of `src/styles/orrery.css`

```css

/* ─── Loop grammar: arc-segment divider + draw-on (Phase 2) ───────────── */
.divider-arc { max-width: 1200px; margin: 0 auto; padding: 0 80px; }
.divider-arc .divider-arc-svg { width: 100%; height: 40px; display: block; overflow: visible; }
.divider-arc .d-arc {
  stroke: var(--orrery-line); stroke-opacity: 0.4; stroke-width: 1;
  stroke-dasharray: 1; stroke-dashoffset: 0;            /* default = fully drawn */
}
/* draw-on where supported (Chromium/Safari); elsewhere it stays statically drawn */
@supports (animation-timeline: view()) {
  .divider-arc .d-arc {
    animation: draw-arc linear both;
    animation-timeline: view();                          /* declared AFTER the shorthand, which resets it */
    animation-range: entry 0% cover 35%;
  }
}
@keyframes draw-arc { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .divider-arc .d-arc { stroke-dashoffset: 0 !important; } }
@media (max-width: 768px) { .divider-arc { padding: 0 24px; } }
/* load-bearing: the Pullquote/Film/Gallery bands are display:none in print
   (components.css ~1127), but these divider divs are their SIBLINGS, not
   children, so they survive — hide them explicitly or they print as orphan bows. */
@media print { .divider-arc { display: none !important; } }
```
> Cascade invariant (spec §5d): the unconditional default is **drawn** (`stroke-dashoffset: 0`); the only place it starts undrawn is *inside* the `@keyframes`, which only runs where `animation-timeline: view()` is supported. No combination of unsupported features can strand the arc invisible.

- [ ] **Step 3: Sanity-check**

Run:
```bash
grep -oE 'var\(|stroke="#|fill="#|stop-color' src/svg/divider-arc.svg || echo CLEAN
grep -c 'divider-arc' src/styles/orrery.css
```
Expected: `CLEAN`, then `7` — `grep -c` counts **lines**, and `divider-arc` appears on 7: the wrapper, `.divider-arc-svg`, the base `.d-arc`, the `@supports` `.d-arc`, the reduced-motion `.d-arc`, the mobile wrapper, and the print wrapper.

- [ ] **Step 4: Commit**

```bash
git add src/svg/divider-arc.svg src/styles/orrery.css
git commit -m "feat(orrery): arc-segment divider SVG + draw-on (scroll-timeline, static fallback)"
```

---

## Task 3: Place the four signature dividers

**Files:** Modify `src/index.template.html`.

Insert `<div class="divider-arc">{{svg:divider-arc}}</div>` immediately **before** each of the four section comment markers. Each sits on the body's paper background between bands.

- [ ] **Step 1: Bio transition** (hero → bio)

Find:
```html
<main id="main" tabindex="-1">
<!-- ════════ BIO ════════ -->
```
Replace with:
```html
<main id="main" tabindex="-1">
<div class="divider-arc">{{svg:divider-arc}}</div>
<!-- ════════ BIO ════════ -->
```

- [ ] **Step 2: Pullquote transition**

Find:
```html
<!-- ════════ PULLQUOTE ════════ -->
<aside class="pullquote reveal">
```
Replace with:
```html
<div class="divider-arc">{{svg:divider-arc}}</div>
<!-- ════════ PULLQUOTE ════════ -->
<aside class="pullquote reveal">
```

- [ ] **Step 3: Film transition**

Find:
```html
<!-- ════════ FILM ════════ -->
<section class="film">
```
Replace with:
```html
<div class="divider-arc">{{svg:divider-arc}}</div>
<!-- ════════ FILM ════════ -->
<section class="film">
```

- [ ] **Step 4: Gallery transition**

Find:
```html
<!-- ════════ GALLERY ════════ -->
<div class="gallery reveal" id="gallery">
```
Replace with:
```html
<div class="divider-arc">{{svg:divider-arc}}</div>
<!-- ════════ GALLERY ════════ -->
<div class="gallery reveal" id="gallery">
```

- [ ] **Step 5: Verify four insertions**

Run:
```bash
grep -c '<div class="divider-arc">{{svg:divider-arc}}</div>' src/index.template.html
```
Expected: `4`.

- [ ] **Step 6: Commit**

```bash
git add src/index.template.html
git commit -m "feat(orrery): four signature arc dividers at major band transitions"
```

---

## Task 4: Weave, verify, render

- [ ] **Step 1: Re-weave**

Run:
```bash
bun weave.ts
```
Expected: exit 0, no `weave:` errors.

- [ ] **Step 2: Verify dividers + glyph CSS inlined; markers resolved**

Run:
```bash
grep -c 'class="divider-arc"' index.html        # the four wrapper divs
grep -c 'class="d-arc"' index.html               # the four inlined arc paths
grep -c 'section-label::before' index.html       # glyph CSS inlined from orrery.css (3 lines)
grep -c '{{' index.html                          # markers fully resolved
```
Expected: `4`, `4`, `3`, `0`.

- [ ] **Step 3: Verify CSP is unchanged** (Phase 2 adds no hashes — inline SVG isn't hashed, orrery.css is re-hashed in place)

Run:
```bash
grep -o "style-src [^;]*" index.html | grep -o 'sha256-' | wc -l   # still 5
grep -o "script-src [^;]*" index.html | grep -o 'sha256-' | wc -l  # still 3
```
Expected: `5`, `3`.

- [ ] **Step 4: Render light + confirm** (zero new JS; the glyph/dividers are static under reduced-motion, which the harness emulates)

Run:
```bash
(python3 -m http.server 8815 >/dev/null 2>&1 &) ; sleep 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --hide-scrollbars --window-size=1440,2600 \
  --screenshot=/tmp/p2-check.png "http://127.0.0.1:8815/index.html" 2>/dev/null
pkill -f "http.server 8815"; ls -la /tmp/p2-check.png
```
Expected: a PNG exists. Open it: every section eyebrow shows a tiny gold orbit-ring glyph; a shallow gold arc sits at the Bio / Pullquote / Film / Gallery transitions. (Use HTTP — `file://` blocks the portrait via `img-src 'self'`. For the draw-on motion, scroll a real Chromium/Safari; a static shot shows the resting drawn arc.)

- [ ] **Step 5: Verify reduced-motion + print**

Run:
```bash
grep -c 'prefers-reduced-motion: reduce' index.html    # 3 = components.css + orrery.css P1 + orrery.css P2 draw-arc (essay.css is essay-only, never woven into index.html)
grep -o '@media print { .divider-arc' index.html | head -1
grep -o '.section-label::before { content: none' index.html | head -1
```
Expected: `3`; then the divider print-hide and the glyph print-`content:none` lines echoed.

- [ ] **Step 6: Commit the regenerated page**

```bash
git add index.html
git commit -m "build(orrery): re-weave index.html with Phase-2 loop grammar"
```
> (If the pre-commit hook already re-wove and staged `index.html` into a prior `src/`/template commit, this is a no-op — end with a clean `git status` and an up-to-date `index.html`.)

---

## Task 5: Final review + cherry-pick

- [ ] **Step 1: Visual + behaviour pass (both schemes)**

Open `index.html`. Confirm: (a) glyphs read on light sections (gold-on-cream) and on the dark `.film` eyebrow (bright gold-on-ink); (b) the four arcs read on the paper gaps; (c) in Chromium/Safari the arcs draw on as they scroll into view, and snap to drawn under `prefers-reduced-motion`; (d) language toggle still fine (glyph is language-neutral); (e) print preview — no glyphs, no arcs, layout intact.

- [ ] **Step 2: Cherry-pick to audreyt.org** (per AGENTS.md — never copy files)

After Phase 1's commits are on `audreyt.org`, cherry-pick Phase 2's commits. List exactly which ones first — there are **4 or 5** depending on whether the pre-commit hook folded the re-weave into the source commits:
```bash
git log --oneline design/hero-orrery..design/loop-grammar   # the Phase-2 commits (oldest last)
cd ../audreyt.org
git fetch /Users/au/w/cyberambassador.tw design/loop-grammar
git cherry-pick <those SHAs, oldest → newest>
bun weave.ts                 # confirm the mirror regenerates cleanly
```
An `add/add` conflict means the file already arrived — abort and re-pick only new commits.

---

## Self-Review (run by the planner)

**Spec coverage (Phase 2 row):** orbit-glyph → Task 1 ✓; arc-segment divider → Tasks 2–3 ✓; reveal-as-draw → Task 2 (scroll-timeline + static fallback + reduced-motion) ✓. Divergences (glyph-as-CSS, scroll-timeline-only draw, signature-few placement) declared up top.

**Placeholder scan:** none — every file's content is shown in full.

**Type/name consistency:** `divider-arc` / `divider-arc-svg` / `d-arc` match across the SVG (Task 2 Step 1), the CSS (Task 2 Step 2), and the template wrapper (Task 3). `--orrery-line` / `--orrery-bright` are the Phase-1 aliases. `draw-arc` keyframes name matches its `animation`. The `@keyframes draw-arc` is referenced only inside the `@supports` block.

**Open items (non-blocking):** divider placement is the approved "signature few" — confirm the four spots read well on the live page and adjust count/positions to taste (the pattern is one reusable element, trivially added/removed). Glyph rim-node size (`1.4px`) and opacity (`0.85`) are a starting register; tune on the live hero.

---

## Execution Handoff

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review. **2. Inline Execution** — batch with checkpoints.
