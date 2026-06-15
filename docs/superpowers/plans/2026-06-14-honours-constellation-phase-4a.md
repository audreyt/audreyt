# Constellation of Honours (Phase 4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Join the Honours to the loop grammar without disturbing its strong 2×2 grid — mark each award-year as a small orbit-node and hang the four awards beneath a faint "arc of time" (a constellation), CSS + one tiny inline SVG, no JS.

**Architecture:** (1) Each `.award-year` gains a pure-CSS `::before` orbit-node (ring + rim dot). (2) A small inline SVG (`{{svg:constellation-arc}}` — one shallow arc + a few star-points) is emitted once, just above `.awards-grid`, by a one-line addition to `weave.ts` `renderRecognition` (the marker resolves in weave's svg pass, which runs after content rendering). All styling appends to `src/styles/orrery.css`; **no new CSP hashes, no JS, no animation** (so the reduced-motion count is unchanged at 4). Background stays prose — it has no years to plot.

**Tech Stack:** Bun (`weave.ts` + `pre-commit.ts`), hand-authored HTML/CSS/SVG, no framework.

**Source of truth:** Phase 4a of `docs/superpowers/specs/2026-06-14-in-the-loop-of-humanity-design.md` (§5g, §8 Phase-4a row). **Depends on Phases 1–3** (`src/styles/orrery.css`, `--orrery-line`).

**Four deliberate divergences from the spec, validated during planning:**
0. **Print hides the constellation** (`display: none`) rather than engraving it per spec §7 — matching the actual Phase-1/2/3 precedent in `orrery.css` (every decorative orrery element is hidden in print); a faint gold arc on white would be near-invisible anyway. Also note: `renderRecognition` emitting a `{{svg:}}` marker is the first **renderer-emitted** SVG marker (all prior ones are template-level) — it works because the content pass mutates `html` before the svg pass runs (verified end-to-end).
1. **"Constellation", not a re-laid timeline.** Spec §5g imagined "years as points along a great arc", implying a re-flow. Honours is **four** awards in a 2×2 grid (verified `renderRecognition`); re-laying four points onto a line would damage an already-good layout. Instead the grid stays, each year becomes a node, and a faint arc-of-time sits above — the timeline reading without the re-flow. (User-approved.)
2. **Background is excluded.** Spec §5g pairs "Honours **+ Background**"; Background (`renderBackground`) is narrative prose with no year-structure, so it gets no timeline. Phase 4a touches Honours only.
3. **Star-points are decorative, not 1:1 with awards.** The arc carries ~5 evenly-spaced stars (the awards sit in a 2×2 grid, not a row, so precise per-award alignment is impossible and unnecessary). The arc reads as "an arc of time above the honours", and the per-award nodes are the real grammar tie-in.

---

## File Map

| File | Action | Responsibility |
|:-----|:-------|:---------------|
| `src/svg/constellation-arc.svg` | **create** | One shallow arc + ~5 star-points, classes only |
| `src/styles/orrery.css` | **modify (append)** | Constellation arc styling + award-year orbit-node + print |
| `weave.ts` | **modify** | `renderRecognition`: emit `{{svg:constellation-arc}}` above the grid |
| `index.html` | **generated** | Re-woven by `bun weave.ts` |

No test framework — "verify" steps are real commands with exact expected output.

---

## Task 0: Branch from Phase 3

- [ ] **Step 1: Branch** (needs `orrery.css` from `design/idea-pieces`)

Run:
```bash
cd /Users/au/w/cyberambassador.tw
git checkout design/idea-pieces && git checkout -b design/honours-constellation
```
Expected: `Switched to a new branch 'design/honours-constellation'`. (If Phases 1–3 are already on `main`, branch off `main`.)

- [ ] **Step 2: Confirm dependencies**

Run:
```bash
grep -q -- '--orrery-line' src/styles/orrery.css && grep -q 'class="awards-grid"' weave.ts && echo "deps present"
```
Expected: `deps present`.

---

## Task 1: The constellation-arc SVG

**Files:** Create `src/svg/constellation-arc.svg`.

- [ ] **Step 1: Create** `src/svg/constellation-arc.svg` (geometry + classes only, no colour)

```xml
<svg class="constellation-arc" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none"><path class="c-arc" d="M40 40 A 5200 5200 0 0 1 1160 40"/><circle class="c-star" cx="40" cy="40" r="2.4"/><circle class="c-star" cx="320" cy="22" r="2.4"/><circle class="c-star" cx="600" cy="16" r="2.4"/><circle class="c-star" cx="880" cy="22" r="2.4"/><circle class="c-star" cx="1160" cy="40" r="2.4"/></svg>
```
> One very shallow arc (radius 5200 over 1200 width) with five star-points; `preserveAspectRatio="none"` lets it span the section width. Colour comes from `orrery.css`.

- [ ] **Step 2: Verify no colour in the SVG**

Run:
```bash
grep -oE 'var\(|stroke="#|fill="#|stop-color' src/svg/constellation-arc.svg || echo CLEAN
grep -qE '<style|<script' src/svg/constellation-arc.svg && echo 'PHANTOM-HASH RISK' || echo 'no embedded style/script'
```
Expected: `CLEAN`, then `no embedded style/script`.

- [ ] **Step 3: Commit**

```bash
git add src/svg/constellation-arc.svg
git commit -m "feat(orrery): constellation-arc SVG (arc of time + star-points)"
```

---

## Task 2: Constellation + award-year node CSS

**Files:** Modify `src/styles/orrery.css` (append).

- [ ] **Step 1: Append** to the end of `src/styles/orrery.css`

```css

/* ─── Substance: Constellation of Honours (Phase 4a) ──────────────────── */
/* The four awards keep their 2x2 grid; an arc of time sits above, and each
   award-year becomes a node in the loop grammar. No animation. */
.constellation { display: block; margin: 8px 0 0; }
.constellation .constellation-arc { display: block; width: 100%; height: 46px; overflow: visible; }
.constellation .c-arc  { stroke: var(--orrery-line); stroke-opacity: .30; stroke-width: 1; }
.constellation .c-star { fill: var(--orrery-line); fill-opacity: .60; }
.constellation + .awards-grid { margin-top: 14px; }
.award-year { position: relative; display: inline-block; padding-left: 34px; margin-bottom: 0; }
.award-year::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; border: 1px solid var(--orrery-line); border-radius: 50%;
  background: radial-gradient(circle 1.6px at 86% 50%, var(--orrery-line) 99%, transparent 100%); opacity: .8;
}
@media print { .constellation { display: none; } .award-year { padding-left: 0; } .award-year::before { content: none; } }
```
> `--orrery-line` (= `var(--gold)`) flips light/dark; Honours is a light section. `.constellation + .awards-grid { margin-top: 14px }` neutralises the grid's existing `margin-top: 48px` so the arc tucks between the heading and the grid. No animation → reduced-motion untouched. `<time class="award-year">` becomes `inline-block` so the absolute `::before` and `padding-left` resolve — and because that would otherwise **activate the previously-inert `margin-bottom: 12px`** on the inline `<time>` (components.css) and grow the year→name gap by ~12px, the rule sets `margin-bottom: 0` to preserve the original spacing.

- [ ] **Step 2: Sanity-check**

Run:
```bash
grep -c 'award-year::before' src/styles/orrery.css
grep -c '\.constellation' src/styles/orrery.css
```
Expected: `2` (`grep -c` counts lines: the base `::before` rule + the `@media print` line that also nulls it). Then `6` (five rule lines — `.constellation`, `.constellation .constellation-arc`, `.c-arc`, `.c-star`, `.constellation + .awards-grid` — **plus** the `@media print` line, which also contains `.constellation`).

- [ ] **Step 3: Commit**

```bash
git add src/styles/orrery.css
git commit -m "feat(orrery): award-year orbit-nodes + constellation arc styling"
```

---

## Task 3: Emit the constellation in renderRecognition

**Files:** Modify `weave.ts` (function `renderRecognition`, ~line 613–616).

- [ ] **Step 1: Add the constellation marker before the awards grid**

Find:
```ts
  const enAwards = parseAwards(enP.body, entEn);
  const zhAwards = parseAwards(zhP.body, entZh);

  lines.push(`${I}<div class="awards-grid">`);
```
Replace with:
```ts
  const enAwards = parseAwards(enP.body, entEn);
  const zhAwards = parseAwards(zhP.body, entZh);

  // Constellation of Honours: a faint arc of time above the awards (Phase 4a)
  lines.push(`${I}<div class="constellation" aria-hidden="true">{{svg:constellation-arc}}</div>`);
  lines.push(`${I}<div class="awards-grid">`);
```
> `renderRecognition` runs in weave's content pass; the literal `{{svg:constellation-arc}}` it emits is resolved by the later `{{svg:NAME}}` pass (weave.ts ~1341), which reads `src/svg/constellation-arc.svg`. No CSP impact (inline SVG is never hashed).

- [ ] **Step 2: Type-check**

Run from the repo root:
```bash
bunx tsc --noEmit --skipLibCheck --target esnext --module esnext --moduleResolution bundler --types bun weave.ts && echo OK
```
Expected: no diagnostics, then `OK`.

- [ ] **Step 3: Commit**

```bash
git add weave.ts
git commit -m "feat(orrery): renderRecognition emits the constellation arc above the awards"
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
grep -c 'class="constellation"' index.html      # the wrapper div
grep -c 'class="constellation-arc"' index.html   # the inlined SVG
grep -c 'award-year::before' index.html          # the node CSS (base + print = 2)
grep -c '{{' index.html                          # markers fully resolved
```
Expected: `1`, `1`, `2`, `0`.

- [ ] **Step 3: Verify CSP unchanged + reduced-motion unchanged**

Run:
```bash
grep -o "style-src [^;]*" index.html | grep -o 'sha256-' | wc -l    # 5
grep -o "script-src [^;]*" index.html | grep -o 'sha256-' | wc -l   # 3
grep -c 'prefers-reduced-motion: reduce' index.html                 # still 4 (no new animation)
```
Expected: `5`, `3`, `4`.

- [ ] **Step 4: Render + confirm**

Run:
```bash
(python3 -m http.server 8819 >/dev/null 2>&1 &) ; sleep 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --hide-scrollbars --window-size=1440,3400 \
  --screenshot=/tmp/p4a-check.png "http://127.0.0.1:8819/index.html" 2>/dev/null
pkill -f "http.server 8819"; ls -la /tmp/p4a-check.png
```
Expected: a PNG exists. Open it: the Honours section shows a faint gold arc of time above the 2×2 award grid, and each award-year (2025/2025/2023/2019) carries a small gold orbit-node ring. The grid is otherwise unchanged.

- [ ] **Step 5: Commit the regenerated page**

```bash
git add index.html
git commit -m "build(orrery): re-weave index.html with the honours constellation"
```
> No-op if the pre-commit hook already folded the re-weave into a prior commit — end with clean `git status` and an up-to-date `index.html`.

---

## Task 5: Final review + cherry-pick

- [ ] **Step 1: Visual + behaviour pass (both schemes)**

Open `index.html`. Confirm: (a) the arc of time + four year-nodes read on the light Honours band (gold-on-cream) and translate to dark mode; (b) the award cards are otherwise unchanged and fully readable; (c) the award links still work (the `::before` node and `padding-left` don't break the `<a class="award-card">` click target or the `<time>` semantics); (d) language toggle fine; (e) print preview — no constellation arc, no year-nodes, the award grid prints as before; (f) mobile (≤768px, 1-column awards) — the arc still spans, the year-nodes still read, nothing crowds.

- [ ] **Step 2: Cherry-pick to audreyt.org** (per AGENTS.md — never copy files)

After Phases 1–3 are on `audreyt.org`:
```bash
git log --oneline design/idea-pieces..design/honours-constellation   # the Phase-4a commits (oldest last)
cd ../audreyt.org
test -f src/styles/orrery.css && git grep -q -- '--orrery-line' src/styles/orrery.css \
  && echo "phases 1-3 present — safe to pick" || echo "BLOCKED: cherry-pick Phases 1-3 first"
git fetch /Users/au/w/cyberambassador.tw design/honours-constellation
git cherry-pick <those SHAs, oldest → newest>
bun weave.ts
```
An `add/add` conflict means the file already arrived — abort and re-pick only new commits.

---

## Self-Review (run by the planner)

**Spec coverage (Phase 4a row):** Honours as an orbital/constellation timeline → Tasks 1–3 ✓ (CSS-only skin + one inline SVG + a one-line renderer emit; all award text stays real content). The 4b interaction spike is deferred to Phase-4b planning (the user chose the constellation, not the spike-only path).

**Placeholder scan:** none — every file's content is shown in full.

**Type/name consistency:** `constellation`/`constellation-arc`/`c-arc`/`c-star` match across the SVG (Task 1), the CSS (Task 2), and the marker emitted by `renderRecognition` (Task 3). `award-year` matches the existing `<time class="award-year">`. `--orrery-line` is the Phase-1 alias.

**Open items (non-blocking):** node size (18px), arc opacity (.30/.60), star count/placement, and the `margin: 8px / 14px` spacing are a starting register — tune on the live band. Confirm the `<time>` → `inline-block` change doesn't shift the award-card layout adversely; confirm the arc reads at the 2-column 1024px breakpoint and the 1-column ≤768px layout.

---

## Execution Handoff

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review. **2. Inline Execution** — batch with checkpoints.
