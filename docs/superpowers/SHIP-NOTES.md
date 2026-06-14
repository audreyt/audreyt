# In the Loop of Humanity — ship notes

What `design/finale` contains, how it was reviewed, and what is left for you to decide. Branch is **not merged, not pushed, not synced to `audreyt.org`** — those are yours.

## What shipped

A single new design grammar — **the loop** — threaded through the site, distilled from the hero. The conceptual payload is *containment*: humanity is the larger ring that holds a small, bounded AI orbit inside it ("AI in the loop of humanity"), and the People are the nodes on the civic ring (the superintelligence). Gold-on-ink, **zero JavaScript**, strict CSP, `--ink` always-dark, reduced-motion / print / light-dark all honoured.

| Phase | What it adds |
|:------|:-------------|
| **1 — hero orrery** | An animated inline-SVG orrery behind the index hero (civic ring + bounded AI orbit + curved `AI · IN · THE · LOOP · OF · HUMANITY` caption + ink halo); a real-text `.hero-loop` argument woven from a new README line. |
| **2 — loop grammar** | Pure-CSS section orbit-glyph on every eyebrow; three arc-segment dividers at the major band transitions (draw-on via CSS scroll-timeline). |
| **3 — idea pieces** | The 6-Pack of Care as six bounded orbits (pure CSS, staggered "kami"); a 42-node people-arc behind the geothermal pullquote. |
| **4a — constellation** | Honours as an "arc of time" with each award-year an orbit-node (the grid stays). |
| **4b — finale** | Care-orbit hover polish; the three prose essays' chapter-divider diamond becomes an orbit-ring. Essays **keep** their bespoke crystal/emblem heroes (plurality of registers). |
| **favicon** | The orrery distilled, with a crack in the civic ring — *"that's how the light gets in."* SVG + multi-size `.ico` + 180px apple-touch-icon. |

The original intent lives in `specs/2026-06-14-in-the-loop-of-humanity-design.md` (with a §0 reconciliation note); each phase's exact build + deliberate divergences are in the five `plans/2026-06-14-*.md`.

## How it was reviewed

Built phase-by-phase (each plan adversarially verified before implementation, each implementation spec- and quality-reviewed), then **five rounds of multi-lens adversarial review** over the complete integrated system. Everything found was fixed and re-verified:

- **R1** (2 majors): mobile orrery lost its containment (inner orbit off-screen) → re-centre+scale; favicon crack vanished at 16px → butt-cap + wider gap. Plus `.o-ai` rotation-wobble pin and a `.hero-loop` contrast bump.
- **R2** (1 blocker + 2 majors): a stray `git stash`-pop conflict got swept into a commit by an over-broad `git add -A` and shipped raw `<<<<<<<` markers into `good-enough-ancestor.html` → clean-restored from the published content (your `stash@{0}` left untouched — see below); the caption ran onto the portrait → tighter tracking so it ends on the ink; a 769–1024px containment band → scale-based re-centre; apple-touch-icon added.
- **R3** (2 pre-existing essay blockers): `collaborative-immune-system.html` hero was invisible under reduced-motion (its reset was mis-nested in `@media print`) → added the screen reset; all three essays' `.closing` chapter + colophon printed white-on-cream → dark-ink print resets.
- **R4** (self-review, after that round's council workflow was lost to a session pause): extreme viewports (320/2560), semantic-HTML/SEO, build idempotency, and a people-arc mobile thinning.
- **R5** (lean judgment council — design-coherence + fresh-eyes + ship-verdict): verdict **ship / ship-with-tweaks**, no blockers. Two minor polish findings applied: the densest stretch (Honours→Work→Film→Published) carried the only semantically-empty mark, so the **fourth divider-arc was cut at the Work→Film seam** (4→3 — the care-orbit grid closes Current Work and the film band opens on its own bold eyebrow + dark block, so that seam earns no horizon); and the **"Featured in" press logos were brightened 0.5→0.72** so they read as confident credentials rather than faded placeholders (hover still lifts to full).

Final state: **26 commits, working tree clean, CSP 5 style / 3 script, zero conflict markers, generators byte-reproducible, weave idempotent.**

## One thing that needs your eye

The R2 conflict resolution kept `main`'s **published** Taiwan-agriculture paragraphs (Ministry of Digital Affairs / TCloud / 80% SaaS subsidy). Your **`stash@{0}`** ("WIP on main … 對齊大會") holds an alternate **condensed** rewrite of that passage ("≈90 smallholder farms" / 補助 vs 資助). It is preserved, unapplied — apply it deliberately if that condensed version is the one you want.

## Left to you

- **Merge / push** — `design/finale` is ready; merging to `main` and pushing are yours.
- **Sync to `audreyt.org`** — cherry-pick the commits (never copy files), after Phases 1–4b land there.
- **Optional polish** (none blocking) — a live-tuning pass on intensities/opacities; the OG social card could carry a faint orrery to match the favicon; a no-JS `:has()`-toggled motion pause (the spec pre-authorises it) if you want belt-and-braces WCAG 2.2.2 beyond `prefers-reduced-motion`.

## Verdict

Coherent and restrained — one loop-grammar, not accreted decoration; each element is faint and spread across a long page, with the hero orrery as the single bold anchor. Build-clean, accessible, reversible. **Ship-ready** on `design/finale`; the merge, push, and `audreyt.org` sync are yours to make.
