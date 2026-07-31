#!/usr/bin/env bun
// Builds og-trust-by-design.jpg — the share card for trust-by-design.html.
// Run: bun tools/build-og-trust-by-design.mjs      (deterministic; no network)
//
// Bilingual title card from the page's own vocabulary — same asset for both
// deployments (cyberambassador.tw / audreyt.org):
//
//  * washi ground + the page's own feTurbulence grain tile (body::before);
//  * a feed-legible English / zh-TW title lockup and bilingual attribution;
//  * the .art-frame tonal washes (kin upper-right, shu lower-left, ai mid);
//  * the favicon's rotated vermillion seal frame with a solid geometric mark;
//  * the qna-frame's octagon (ai into cream) and diamond (kin into cream),
//    kept well inside the mat so the hairline frame stays intact.
//
// Colours are the page's light-mode literals; color-mix() results are
// precomputed so the card renders identically in any headless Chrome.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dir, "..");
const OUT = join(ROOT, "og-trust-by-design.jpg");

const W = 1200, H = 630, DSF = 2; // → 2400x1260
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

// The page's grain tile, verbatim from trust-by-design.html body::before.
const GRAIN = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E";

const card = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { position: relative; background: #faf7f0; }

/* .art-frame tonal washes — kin upper-right, shu lower-left, ai mid-left */
.wash {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 100% at 78% 18%, rgba(181,138,47,.16), transparent 60%),
    radial-gradient(65% 95% at 18% 88%, rgba(194,64,47,.11), transparent 58%),
    radial-gradient(55% 90% at 28% 28%, rgba(43,74,111,.08), transparent 58%);
}

/* matting hairline — higher-contrast so it survives at thumbnail size */
.mat {
  position: absolute; inset: 32px;
  border: 2.5px solid #cfc5ad; border-radius: 6px;
}

/* qna-frame octagon: ai into cream — fully inside the mat */
.oct {
  position: absolute; right: 88px; bottom: 68px; width: 236px; height: 236px;
  background: #a8b0b8;
  clip-path: polygon(50% 0, 82% 18%, 100% 50%, 82% 82%, 50% 100%, 18% 82%, 0 50%, 18% 18%);
  transform: rotate(12deg);
  filter: drop-shadow(0 14px 11px rgba(35,37,45,.14));
}

/* qna-frame diamond: deeper sand for contrast against cream */
.dia {
  position: absolute; right: 278px; bottom: 108px; width: 150px; height: 150px;
  background: #c9a96a;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  transform: rotate(-7deg);
  filter: drop-shadow(0 11px 9px rgba(35,37,45,.12));
}

/* favicon seal frame + solid geometric mark */
.seal {
  position: absolute; right: 92px; top: 110px; width: 300px; height: 300px;
  border: 22px solid #c2402f; border-radius: 50px;
  transform: rotate(-3deg);
  box-shadow: 0 42px 88px -50px rgba(160,47,33,.5);
}
.seal::before {
  content: ""; position: absolute; inset: 18px;
  border: 3px solid rgba(194,64,47,.32); border-radius: 32px;
}
.seal::after {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: 106px; height: 106px; margin: -53px 0 0 -53px;
  background: #c2402f; border-radius: 18px; transform: rotate(3deg);
  box-shadow: inset 0 0 0 10px #faf7f0;
}

/* Shared EN / zh-TW identity for the language-mirrored deployments. */
.copy {
  position: absolute; left: 92px; top: 88px; width: 650px;
  color: #23252d;
}
.eyebrow {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 15px; line-height: 1.4; letter-spacing: .24em;
  text-transform: uppercase; color: #7e7563;
}
.title {
  margin-top: 24px;
  font-family: "Iowan Old Style", "Palatino Nova", Palatino, "Book Antiqua", Georgia, serif;
  font-size: 76px; font-weight: 400; line-height: .98; letter-spacing: -.025em;
  white-space: nowrap;
}
.title em { color: #c2402f; font-style: normal; }
.zh {
  margin-top: 17px;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Songti TC", serif;
  font-size: 38px; font-weight: 500; line-height: 1.25; letter-spacing: .07em;
  color: #34322c;
}
.zh em { color: #c2402f; font-style: normal; }
.copy-rule {
  width: 520px; height: 4px; margin-top: 27px;
  background: linear-gradient(90deg, #c2402f 0 104px, #e2d9c5 104px);
}
.subtitle {
  margin-top: 22px; max-width: 520px;
  font-family: "Iowan Old Style", "Palatino Nova", Palatino, "Book Antiqua", Georgia, serif;
  font-size: 22px; font-style: italic; line-height: 1.35; color: #5f594b;
}
.byline {
  margin-top: 23px;
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 17px; line-height: 1.4; letter-spacing: .12em;
  text-transform: uppercase; color: #7e7563;
}

/* the page's grain, on top of everything */
.grain {
  position: absolute; inset: 0; opacity: .05;
  background-image: url("${GRAIN}"); pointer-events: none;
}
</style></head>
<body>
  <div class="wash"></div>
  <div class="oct"></div>
  <div class="dia"></div>
  <div class="seal"></div>
  <div class="mat"></div>
  <div class="copy">
    <p class="eyebrow">FDC2026 · Tokyo International Forum</p>
    <h1 class="title">Trust <em>by</em> Design</h1>
    <p class="zh">信任<em>始於</em>設計</p>
    <div class="copy-rule"></div>
    <p class="subtitle">Answering Doubt, Not Demanding Belief</p>
    <p class="byline">Audrey Tang 唐鳳</p>
  </div>
  <div class="grain"></div>
</body></html>
`;

const work = mkdtempSync(join(tmpdir(), "og-trust-"));
try {
  const page = join(work, "card.html");
  writeFileSync(page, card);

  const shot = join(work, "card.png");
  const chrome = findChrome();
  await screenshot(chrome, [
    "--headless=new",
    "--no-sandbox",
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
  console.log(`og-trust-by-design.jpg  ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
