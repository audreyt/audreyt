#!/usr/bin/env bun
// Builds og-trust-by-design.jpg — the share card for trust-by-design.html.
// Run: bun tools/build-og-trust-by-design.mjs      (deterministic; no network)
//      OG_LANG=en-GB|zh-TW bun tools/build-og-trust-by-design.mjs
//
// Per-deployment title card from the page's own vocabulary:
//  * cyberambassador.tw (en-GB default) → English lockup
//  * audreyt.org (zh-TW default) → Chinese lockup
// Language auto-detects from local trust-by-design.html defaults, overridable
// via OG_LANG. Layout is shared; only the copy block switches.
// The JPG intentionally DIVERGES per deployment (en-GB vs zh-TW) — do NOT
// force the binary identical across trees; rebuild after cherry-picking the builder.
//
//  * washi ground + the page's own feTurbulence grain tile (body::before);
//  * a feed-legible single-language title lockup (full-size headline);
//  * the .art-frame tonal washes (kin upper-right, shu lower-left, ai mid);
//  * the favicon's rotated vermillion seal with the 信 mark;
//  * a single kin diamond kept clear of the seal (no cool-blue octagon).
//
// Colours are the page's light-mode literals; color-mix() results are
// precomputed so the card renders identically in any headless Chrome.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dir, "..");
const OUT = join(ROOT, "og-trust-by-design.jpg");
const ESSAY = join(ROOT, "trust-by-design.html");

function detectLang() {
  const forced = process.env.OG_LANG || process.argv[2] || "";
  if (forced === "zh-TW" || forced === "zh" || forced === "--zh") return "zh-TW";
  if (forced === "en-GB" || forced === "en" || forced === "--en") return "en-GB";
  try {
    const html = readFileSync(ESSAY, "utf8");
    if (/id="lang-zh"[^>]*checked/.test(html) || /<html lang="zh-TW">/.test(html)) return "zh-TW";
  } catch {}
  return "en-GB";
}
const LANG = detectLang();

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

const COPY = LANG === "zh-TW" ? `    <p class="eyebrow">FDC2026 · 東京國際論壇</p>
    <h1 class="title zh">信任<em>始於</em><br>設計</h1>
    <div class="copy-rule"></div>
    <p class="subtitle zh">回應疑問，<br>而非要求相信</p>
    <div class="foot">
      <p class="byline zh">唐鳳</p>
      <p class="tag zh">主題演講 + 問答</p>
    </div>` : `    <p class="eyebrow">FDC2026 · Tokyo International Forum</p>
    <h1 class="title">Trust <em>by</em><br>Design</h1>
    <div class="copy-rule"></div>
    <p class="subtitle">Answering Doubt,<br>Not Demanding Belief</p>
    <div class="foot">
      <p class="byline">Audrey Tang</p>
      <p class="tag">Keynote + Q&amp;A</p>
    </div>`;

const card = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { position: relative; background: #f3eee2; }

/* .art-frame tonal washes — kin upper-right, shu lower-left, ai mid-left */
.wash {
  position: absolute; inset: 0;
  background:
    radial-gradient(78% 110% at 86% 12%, rgba(181,138,47,.20), transparent 62%),
    radial-gradient(70% 100% at 12% 92%, rgba(194,64,47,.14), transparent 58%),
    radial-gradient(55% 90% at 22% 30%, rgba(43,74,111,.07), transparent 58%),
    #faf7f0;
}

/* matting hairline — higher-contrast so it survives at thumbnail size */
.mat {
  position: absolute; inset: 28px;
  border: 2.5px solid #b3a992; border-radius: 6px;
}

/* single kin diamond — one accent shape, no cool-blue octagon */
.dia {
  position: absolute; right: 300px; bottom: 72px; width: 132px; height: 132px;
  background: #c9a96a;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  transform: rotate(-8deg);
  filter: drop-shadow(0 14px 12px rgba(35,37,45,.14));
}

/* favicon seal frame + 信 mark (page identity) */
.seal {
  position: absolute; right: 96px; top: 96px; width: 292px; height: 292px;
  border: 20px solid #c2402f; border-radius: 48px;
  transform: rotate(-3deg);
  box-shadow: 0 42px 88px -46px rgba(160,47,33,.55);
  display: flex; align-items: center; justify-content: center;
}
.seal::before {
  content: ""; position: absolute; inset: 16px;
  border: 3px solid rgba(194,64,47,.34); border-radius: 30px;
}
.seal .mark {
  position: relative; z-index: 1;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Songti TC", "Noto Serif TC", serif;
  font-size: 168px; font-weight: 500; line-height: 1;
  color: #c2402f;
  transform: rotate(3deg);
  text-shadow: 0 1px 0 rgba(250,247,240,.55);
  user-select: none;
}

/* identity lockup — full vertical span of the mat */
.copy {
  position: absolute; left: 88px; top: 86px; bottom: 86px; width: 620px;
  color: #23252d;
  display: flex; flex-direction: column;
}
.eyebrow {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 18px; line-height: 1.35; letter-spacing: .22em;
  text-transform: uppercase; color: #5f594b;
}
.title {
  margin-top: 28px;
  font-family: "Iowan Old Style", "Palatino Nova", Palatino, "Book Antiqua", Georgia,
    "Hiragino Mincho ProN", "Songti TC", "Noto Serif TC", serif;
  font-size: 104px; font-weight: 400; line-height: .94; letter-spacing: -.03em;
}
.title.zh {
  font-size: 92px; line-height: 1.08; letter-spacing: .06em;
}
.title em { color: #c2402f; font-style: normal; }
.copy-rule {
  width: 148px; height: 4px; margin-top: 30px;
  background: #c2402f;
}
.subtitle {
  margin-top: 26px; max-width: 540px;
  font-family: "Iowan Old Style", "Palatino Nova", Palatino, "Book Antiqua", Georgia,
    "Hiragino Mincho ProN", "Songti TC", "Noto Serif TC", serif;
  font-size: 30px; font-style: italic; line-height: 1.32; color: #34322c;
}
.subtitle.zh {
  font-style: normal; font-size: 28px; letter-spacing: .04em; line-height: 1.45;
}
.foot {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #cfc5ad;
  display: flex; align-items: baseline; justify-content: space-between; gap: 18px;
}
.byline {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 18px; line-height: 1.35; letter-spacing: .16em;
  text-transform: uppercase; color: #23252d;
}
.byline.zh { letter-spacing: .2em; text-transform: none; font-size: 20px; }
.tag {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 15px; line-height: 1.35; letter-spacing: .18em;
  text-transform: uppercase; color: #5f594b;
  white-space: nowrap;
}
.tag.zh { letter-spacing: .14em; text-transform: none; font-size: 16px; }

/* the page's grain, on top of everything */
.grain {
  position: absolute; inset: 0; opacity: .055;
  background-image: url("${GRAIN}"); pointer-events: none;
}
</style></head>
<body>
  <div class="wash"></div>
  <div class="dia"></div>
  <div class="seal"><span class="mark">信</span></div>
  <div class="mat"></div>
  <div class="copy">
${COPY}
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
  console.log(`og-trust-by-design.jpg  ${LANG}  ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
