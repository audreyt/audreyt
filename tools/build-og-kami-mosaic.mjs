#!/usr/bin/env bun
// Builds og-kami-mosaic.jpg — the share card for kami-mosaic.html.
// Run: bun tools/build-og-kami-mosaic.mjs        (deterministic; no network)
//
// The card is the page's own masthead printed onto the page's own hero plate,
// so the link preview and the landing hero are the same object. Nothing here
// is invented: colours, the grain tile, the wordmark's terracotta a/i and the
// tracked KAMI expansion are lifted from kami-mosaic.html.
//
// Geometry notes — all of it is load-bearing, none of it is taste:
//
//  * assets/kami-mosaic-plate.webp is the full-resolution s01-title artwork
//    (1920x1080) that the page embeds downscaled. It is matted on linen: the
//    torn sheet itself measures x 58..1858, y 63..1024. PLATE crops past its
//    irregular left deckle (where a pale seam otherwise survives), at 1781x935
//    — within 0.003% of the 1.905:1 OG ratio — so consumers receive no matte
//    strip or meaningful letterbox/crop.
//  * The artwork was generated with "calm negative space through the centre
//    and upper-middle for large title typography", with arched shelf shadows
//    hard against both edges and the lantern parked bottom-left. In CSS px
//    (1200x630) that leaves a clear proscenium at x 247..984 and a type well
//    above y 311, where the lantern's glow starts. The lockup lives there;
//    the caption column is placed opposite the lantern, right margin 950.
//  * Wordmark and expansion line are width-locked to the same optical measure
//    (~515px, verified 1.5px apart). If KAMI_PX changes, retune EXP_TRACK_EM.
//
// Grain .035 + a light unsharp pass is the paper/noise sweet spot: without
// grain the cream field goes plasticky, at .05 the speckle stops reading as
// fibre and starts reading as noise (and costs ~50KB).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dir, "..");
const PLATE = join(ROOT, "assets/kami-mosaic-plate.webp");
const OUT = join(ROOT, "og-kami-mosaic.jpg");

const CROP = { left: 72, top: 74, width: 1781, height: 935 }; // sheet-only, ≈ 1.905:1
const W = 1200, H = 630, DSF = 2;                             // → 2400x1260
const JPEG = { quality: 88, chromaSubsampling: "4:4:4", progressive: true, mozjpeg: true };

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  const hit = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!hit) throw new Error(`no Chrome found; set CHROME=/path/to/chrome. Tried:\n  ${CHROME_CANDIDATES.join("\n  ")}`);
  return hit;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function screenshot(chrome, args, shot) {
  const child = spawn(chrome, args, { stdio: "ignore" });
  let launchError;
  child.once("error", (error) => { launchError = error; });

  // Chrome can retain its background updater after writing --screenshot. Wait
  // for a stable file, then stop it instead of blocking the build on teardown.
  const deadline = Date.now() + 60_000;
  let previousSize = 0;
  let stableChecks = 0;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (existsSync(shot)) {
      const size = statSync(shot).size;
      if (size > 0 && size === previousSize) {
        stableChecks += 1;
        if (stableChecks === 2) break;
      } else {
        previousSize = size;
        stableChecks = 0;
      }
    }
    await sleep(100);
  }
  if (!existsSync(shot)) {
    child.kill("SIGKILL");
    throw new Error("chrome produced no screenshot within 60 seconds");
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("close", resolve)),
    sleep(2_000),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

// The masthead, transcribed from kami-mosaic.html. `--grain` is the same
// feTurbulence tile the page lays over its own body.
const card = (bedUrl) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
    --ink: #1f2b3e;
    --navy: #24344d;
    --terra: #c06a45;
    --terra-deep: #a4512e;
    --taupe: #574f41;
    --muted: #776d5b;
    --rule: #cfc3a7;
    --serif: 'Iowan Old Style', 'Palatino Nova', Palatino, 'Book Antiqua', Georgia, serif;
    --mono: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace;
}

html, body { width: ${W}px; height: ${H}px; overflow: hidden; }

body {
    position: relative;
    font-family: var(--serif);
    background: #efe7d3 url("${bedUrl}") center / ${W}px ${H}px no-repeat;
    -webkit-font-smoothing: antialiased;
    font-variant-numeric: oldstyle-nums;
}

.grain {
    position: absolute; inset: 0;
    opacity: .035;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
}

/* ── masthead, centred inside the collage's arch proscenium ── */
.lockup {
    position: absolute;
    top: 36px; left: 50%; transform: translateX(-50%);
    width: 700px;
    text-align: center;
}
.kicker {
    font-family: var(--mono);
    font-size: 12.5px; line-height: 1.1;
    letter-spacing: .30em; text-transform: uppercase;
    color: var(--taupe);
    padding-left: .30em;                 /* cancel the trailing letter-space */
}
.kicker .dot { color: var(--terra); margin: 0 .5em; }

h1 {
    margin-top: 30px;
    font-size: 214px; font-weight: 400; line-height: .78;
    letter-spacing: .045em;
    color: var(--ink);
    padding-left: .045em;
}
h1 .ai { color: var(--terra); }

.expansion {
    margin-top: 26px;
    display: flex; align-items: center; justify-content: center; gap: 20px;
    font-family: var(--mono);
    font-size: 12.5px; line-height: 1.1;
    letter-spacing: .394em; text-transform: uppercase;   /* width-locks to the wordmark */
    color: var(--muted);
}
.expansion::before, .expansion::after {
    content: ""; height: 1px; width: 52px; background: var(--rule); flex: none;
}
.expansion span { padding-left: .394em; }
.expansion b { color: var(--terra-deep); font-weight: 700; }

/* ── caption column: a placed block opposite the lantern.
      Rule + credit row state the width; the quote rags inside it. ── */
.caption {
    position: absolute;
    right: 250px; top: 311px;
    width: 306px;
}
.caption blockquote {
    text-align: right;
    font-size: 25px; font-style: italic; line-height: 1.5;
    letter-spacing: .004em;
    color: var(--navy);
}
.caption blockquote .em { color: var(--terra-deep); font-style: normal; margin-right: -.5em; } /* hung dash */
.caption hr {
    border: 0; height: 1px; background: var(--rule);
    width: 100%; margin-top: 22px;
}
.caption .by {
    margin-top: 16px;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: var(--mono);
    font-size: 11.5px; line-height: 1.1;
    letter-spacing: .22em; text-transform: uppercase;
    color: var(--taupe);
    white-space: nowrap;
}
.caption .by > * { padding-left: .22em; }
.caption .by .cjk { font-size: .95em; letter-spacing: .08em; }
</style>
</head>
<body>
<div class="lockup">
    <p class="kicker">MOSAIC<span class="dot">&middot;</span>Knowledge Commons AI Consortium<span class="dot">&middot;</span>BnF, Paris</p>
    <h1>K<span class="ai">a</span>m<span class="ai">i</span></h1>
    <p class="expansion"><span><b>K</b>nowledge&ensp;<b>A</b>rtefact&ensp;<b>M</b>anagement&ensp;<b>I</b>ntelligence</span></p>
</div>

<div class="caption">
    <blockquote>The singularity may be near&thinsp;<span class="em">&mdash;</span><br>but the plurality is here.</blockquote>
    <hr>
    <p class="by"><span>Audrey Tang <span class="cjk">唐鳳</span></span><span>21 July 2026</span></p>
</div>

<div class="grain"></div>
</body>
</html>
`;

const work = mkdtempSync(join(tmpdir(), "og-kami-"));
try {
  const bed = join(work, "bed.png");
  await sharp(PLATE)
    .extract(CROP)
    .resize(W * DSF, H * DSF, { kernel: "lanczos3" })
    .sharpen({ sigma: 1, m1: 0.35, m2: 1.1 })
    .png()
    .toFile(bed);

  const page = join(work, "card.html");
  writeFileSync(page, card(`file://${bed}`));

  const shot = join(work, "card.png");
  const chrome = findChrome();
  await screenshot(chrome, [
    "--headless=new",
    "--no-sandbox",                      // this repo builds inside sandboxed shells
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-component-update",
    "--disable-background-networking",
    "--virtual-time-budget=2000",
    `--user-data-dir=${join(work, "profile")}`,
    `--window-size=${W},${H}`,
    `--force-device-scale-factor=${DSF}`,
    `--screenshot=${shot}`,
    `file://${page}`,
  ], shot);

  const meta = await sharp(shot).metadata();
  if (meta.width !== W * DSF || meta.height !== H * DSF) {
    throw new Error(`expected ${W * DSF}x${H * DSF}, got ${meta.width}x${meta.height}`);
  }

  await sharp(shot).jpeg(JPEG).toFile(OUT);
  const { size } = statSync(OUT);
  console.log(`og-kami-mosaic.jpg  ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
