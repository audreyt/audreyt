#!/usr/bin/env bun
/**
 * Pre-commit hook: recompute LQIP for changed images, then update CSP hashes.
 *
 * Run manually (./pre-commit) to force-rehash CSP without staging.
 * Auto-detected: if invoked outside .git/hooks/, force mode activates.
 * Also accepts --force / -f explicitly.
 */

import { $ } from "bun";
import { createHash } from "crypto";
import { resolve } from "path";

const FILE = "index.html";
const FORCE =
  process.argv.includes("--force") ||
  process.argv.includes("-f") ||
  !resolve(process.argv[1]).includes(".git/");

let staged = (await $`git diff --cached --name-only`.text())
  .trim()
  .split("\n")
  .filter(Boolean);

// ─── Phase 1: LQIP for changed images ───────────────────────────────

// image path → unique fragment on the --lqip CSS line
const IMAGE_LQIP: Record<string, string> = {
  "assets/at-fallback.jpg": ".hero-portrait",
  "assets/at-480.jpg":      ".hero-portrait",
  "assets/at-800.jpg":      ".hero-portrait",
  "assets/at-1200.jpg":     ".hero-portrait",
  "assets/at-1920.jpg":     ".hero-portrait",
  "thumbs/iZWtNLFaC-U.jpg": "nth-child(1) .thumb",
  "thumbs/OcpF2yXj3b0.jpg": "nth-child(2) .thumb",
  "thumbs/q3PuX1JztKI.jpg": "nth-child(3) .thumb",
  "assets/au-ey.jpg":       "figure:nth-child(1)",
  "assets/kaii-chiang.jpg":  "figure:nth-child(2)",
  "assets/au.jpg":           "figure:nth-child(3)",
};

const lqipUpdates = new Map<string, string>(); // selector-fragment → image path (first match wins)
for (const p of staged) {
  if (p in IMAGE_LQIP) {
    const frag = IMAGE_LQIP[p];
    if (!lqipUpdates.has(frag)) lqipUpdates.set(frag, p);
  }
}

if (lqipUpdates.size > 0) {
  let sharp: typeof import("sharp").default;
  let ColorThief: typeof import("colorthief");
  try {
    sharp = (await import("sharp")).default;
    ColorThief = await import("colorthief");
  } catch {
    console.error(
      "pre-commit: sharp + colorthief required for LQIP.\n" +
        "  bun add sharp colorthief",
    );
    process.exit(1);
  }

  // ── colour helpers ──

  function srgbToLinear(c: number): number {
    c /= 255.0;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }

  function rgbToOklab(
    r: number,
    g: number,
    b: number,
  ): [number, number, number] {
    const rl = srgbToLinear(r),
      gl = srgbToLinear(g),
      bl = srgbToLinear(b);
    const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
    const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
    const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
    const l_ = l ? Math.sign(l) * Math.abs(l) ** (1 / 3) : 0.0;
    const m_ = m ? Math.sign(m) * Math.abs(m) ** (1 / 3) : 0.0;
    const s_ = s ? Math.sign(s) * Math.abs(s) ** (1 / 3) : 0.0;
    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
    return [L, a, bv];
  }

  function bitsToLab(
    ll: number,
    aaa: number,
    bbb: number,
  ): [number, number, number] {
    const L = (ll / 3) * 0.6 + 0.2;
    const a = (aaa / 8) * 0.7 - 0.35;
    const b = ((bbb + 1) / 8) * 0.7 - 0.35;
    return [L, a, b];
  }

  function findOklabBits(
    tL: number,
    ta: number,
    tb: number,
  ): [number, number, number] {
    /** Brute-force best 8-bit OKLab quantisation (matches leanrada encoder). */
    const tc = Math.hypot(ta, tb);
    const sta = ta / (1e-6 + tc ** 0.5);
    const stb = tb / (1e-6 + tc ** 0.5);
    let best: [number, number, number] = [0, 0, 0];
    let bestD = Infinity;
    for (let ll = 0; ll < 4; ll++) {
      for (let aaa = 0; aaa < 8; aaa++) {
        for (let bbb = 0; bbb < 8; bbb++) {
          const [L, a, b] = bitsToLab(ll, aaa, bbb);
          const c = Math.hypot(a, b);
          const d = Math.hypot(
            L - tL,
            a / (1e-6 + c ** 0.5) - sta,
            b / (1e-6 + c ** 0.5) - stb,
          );
          if (d < bestD) {
            bestD = d;
            best = [ll, aaa, bbb];
          }
        }
      }
    }
    return best;
  }

  // ── encoder ──

  async function computeLqip(imagePath: string): Promise<number> {
    // dominant colour → OKLab base
    const palette = await ColorThief.getPalette(imagePath, 4, 10);
    if (!palette) throw new Error(`Could not extract palette from ${imagePath}`);
    const [r, g, b] = palette[0];
    const [rawL, rawA, rawB] = rgbToOklab(r, g, b);
    const [ll, aaa, bbb] = findOklabBits(rawL, rawA, rawB);
    const [baseL] = bitsToLab(ll, aaa, bbb);

    // 3×2 preview → relative grayscale
    const { data } = await sharp(imagePath)
      .resize(3, 2, { kernel: "lanczos3" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const grays: number[] = [];
    for (let i = 0; i < 6; i++) {
      const [pL] = rgbToOklab(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
      const v = Math.max(0.0, Math.min(1.0, 0.5 + pL - baseL));
      grays.push(Math.max(0, Math.min(3, Math.round(v * 3))));
    }

    const [ca, cb, cc, cd, ce, cf] = grays;
    const unsigned =
      (ca << 18) |
      (cb << 16) |
      (cc << 14) |
      (cd << 12) |
      (ce << 10) |
      (cf << 8) |
      (ll << 6) |
      (aaa << 3) |
      bbb;
    return unsigned - (1 << 19);
  }

  // ── patch index.html ──

  let content = await Bun.file(FILE).text();
  let lqipChanged = false;

  for (const [frag, imagePath] of lqipUpdates) {
    const newVal = await computeLqip(imagePath);
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(frag) && /--lqip:\s*-?\d+/.test(lines[i])) {
        lines[i] = lines[i].replace(
          /(--lqip:)\s*-?\d+/,
          (_, p1) => p1 + String(newVal).padStart(8),
        );
        lqipChanged = true;
        console.log(`pre-commit: LQIP ${imagePath} → ${newVal}`);
        break;
      }
    }
    content = lines.join("\n");
  }

  if (lqipChanged) {
    await Bun.write(FILE, content);
    await $`git add ${FILE}`;
  }
}

// ─── Phase 2: CSP hashes ────────────────────────────────────────────

// Re-check staged (index.html may have been added by phase 1)
staged = (await $`git diff --cached --name-only`.text())
  .trim()
  .split("\n")
  .filter(Boolean);

if (!staged.includes(FILE) && !FORCE) process.exit(0);

const content = await Bun.file(FILE).text();

function hashes(tag: string): string[] {
  const re = new RegExp(`<${tag}>(.*?)</${tag}>`, "gs");
  const blocks: string[] = [];
  let match;
  while ((match = re.exec(content)) !== null) blocks.push(match[1]);
  return blocks.map(
    (b) => `'sha256-${createHash("sha256").update(b).digest("base64")}'`,
  );
}

const scriptHashes = hashes("script").join(" ");
const styleHashes = hashes("style").join(" ");

function replaceDirective(
  csp: string,
  directive: string,
  newHashes: string,
): string {
  return csp.replace(
    new RegExp(`${directive} [^;]+`),
    `${directive} ${newHashes}`,
  );
}

function updateCsp(text: string): [string, boolean] {
  const m = text.match(/(content=")(default-src[^"]+)(")/);
  if (!m) {
    console.error(`pre-commit: CSP meta tag not found in ${FILE}`);
    process.exit(1);
  }
  let newCsp = replaceDirective(m[2], "script-src", scriptHashes);
  newCsp = replaceDirective(newCsp, "style-src", styleHashes);
  if (m[2] === newCsp) return [text, false];
  return [text.replace(m[0], m[1] + newCsp + m[3]), true];
}

const [updated, changed] = updateCsp(content);

if (changed) {
  await Bun.write(FILE, updated);
  if (!FORCE) await $`git add ${FILE}`;
  console.log(`pre-commit: updated CSP hashes in ${FILE}`);
  console.log(`  script-src ${scriptHashes}`);
  console.log(`  style-src  ${styleHashes}`);
} else if (FORCE) {
  console.log("pre-commit: CSP hashes already up to date");
}

process.exit(0);
