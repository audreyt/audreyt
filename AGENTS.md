# Agent Notes

The design system **and** the operational guide for this repo live in **[DESIGN.md](DESIGN.md)**. Read it before editing pages, components, tokens, the weave pipeline, or sync workflow. The most-violated rules are kept here as a short reminder.

## Must-know rules

### Syncing to audreyt.org

**Never** copy files directly to `../audreyt.org/`. Always cherry-pick commits:

```bash
cd ../audreyt.org
git fetch /Users/au/w/cyberambassador.tw main   # if needed
git cherry-pick <commit-hash>
```

If a cherry-pick reports `add/add` conflict, the file is already present under a different hash on the other side (cleanly cherry-picked earlier) — abort and re-pick only the new commits.

### `--ink` is always-dark

The CSS token `--ink` is a *literal* always-dark surface, not a semantic foreground colour. Never swap it in the `prefers-color-scheme: dark` `:root` block. `.hero`, `.interlude--dark`, and `.closing` use `var(--ink)` as their background and hard-code `color: #fff`; flipping `--ink` to cream renders those sections as white-on-cream.

### `index.html` is generated

Do not edit `index.html` directly. It is woven from `README.md` + `README.zh-TW.md` + `src/` by `bun weave.ts` (auto-runs in the pre-commit hook). Editing the generated artefact will be overwritten on the next commit and will also stale the CSP SHA-256 hashes.

### Self-hosted index fonts (no Google Fonts on homepage)

Woven `index.html` loads Latin faces and **Iansui** from cacheable `/fonts/*.woff2` (or `.ttf` if GF returns `truetype`). Do **not** add `fonts.googleapis.com` to index CSP `style-src` or `font-src`. Commit `fonts/` and `src/fonts/iansui-index.meta.json`.

When zh/en copy on the index changes, regen Iansui subsets (network; not every commit):

```bash
bun weave.ts --skip-font-check --glyph-out=.weave/glyph-source.html
bun tools/build-fonts.ts --regen
bun weave.ts
```

`weave.ts` fails if glyph manifest mismatches unless `--skip-font-check`. Pre-commit only runs offline `bun tools/build-fonts.ts` (decode Latin from `src/fonts/*.b64`).

### Index language toggle (`#lang-zh`)

**cyberambassador.tw** index uses hidden `#lang-zh` only (unchecked = EN, checked = 中文). Screen/print CJK rules use `html:has(#lang-zh:checked)`; EN print tail uses `html:not(:has(#lang-zh:checked))` except `#publications` (zh print). **audreyt.org** uses `#lang-en` with zh default — do not copy lang selectors blindly across repos.


### Essays carry a `header.site` lockup

Every stand-alone essay (e.g. `transparent-horse.html`, `collaborative-immune-system.html`, `good-enough-ancestor.html`) carries an `<header class="site">` block at the top that links back to `/`. New essays must reproduce that pattern; see *DESIGN.md → Components → site-header*.

## Everything else

→ [DESIGN.md](DESIGN.md)
