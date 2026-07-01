#!/usr/bin/env bun
/**
 * build-image-variants.ts — AVIF + WebP siblings for a source raster, via
 * Bun's built-in Bun.Image (no avifenc/cwebp binaries required).
 *
 * Replaces the two CLI calls in DESIGN.md → "Adding a new image":
 *   avifenc -q 50 -s 4 assets/foo.jpg assets/foo.avif
 *   cwebp -q 75 assets/foo.jpg -o assets/foo.webp
 *
 * Usage:
 *   bun tools/build-image-variants.ts assets/foo.jpg [assets/bar.png ...]
 *   bun tools/build-image-variants.ts assets/foo.jpg --force   # overwrite existing siblings
 *   bun tools/build-image-variants.ts --scan                   # fill every missing
 *                                                               # sibling under assets/ + thumbs/
 *
 * Quality matches the documented CLI defaults (avifenc -q 50, cwebp -q 75).
 * AVIF/HEIC encode is platform-dependent per Bun's docs (verified working on
 * macOS arm64 here; not verified on Linux) — if a variant silently fails on
 * another machine, fall back to avifenc/cwebp for that one file.
 *
 * NOTE: `speed`/`effort` options exist on Bun.Image().avif() but were found
 * to produce byte-identical output regardless of value in testing on this
 * host — not relied on here, unlike avifenc's `-s 4`.
 */
import { readdir } from "fs/promises";
import { extname, join } from "path";

const AVIF_QUALITY = 50;
const WEBP_QUALITY = 75;
const SCAN_DIRS = ["assets", "thumbs"];
const SOURCE_EXTS = [".jpg", ".jpeg", ".png"];
const SKIP_BASENAMES = new Set(["probe.jpg", "probe.jpeg", "probe.png"]); // synthetic 1x1 decode-probe images, not real content

async function buildVariants(srcPath: string, force: boolean): Promise<void> {
  const ext = extname(srcPath);
  const base = srcPath.slice(0, -ext.length);
  const avifPath = `${base}.avif`;
  const webpPath = `${base}.webp`;

  const srcFile = Bun.file(srcPath);
  if (!(await srcFile.exists())) {
    console.error(`build-image-variants: missing source ${srcPath}`);
    process.exitCode = 1;
    return;
  }

  const needsAvif = force || !(await Bun.file(avifPath).exists());
  const needsWebp = force || !(await Bun.file(webpPath).exists());
  if (!needsAvif && !needsWebp) {
    console.log(`build-image-variants: ${srcPath} — up to date, skipping`);
    return;
  }

  let img: Bun.Image;
  try {
    img = await srcFile.image();
  } catch (e) {
    console.error(`build-image-variants: could not decode ${srcPath} — ${(e as Error).message}`);
    process.exitCode = 1;
    return;
  }
  if (needsAvif) {
    try {
      const buf = await img.avif({ quality: AVIF_QUALITY }).toBuffer();
      await Bun.write(avifPath, buf);
      console.log(`build-image-variants: ${avifPath}  (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`build-image-variants: AVIF failed for ${srcPath} (platform/hardware limitation? see tool header) — ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  if (needsWebp) {
    try {
      const buf = await img.webp({ quality: WEBP_QUALITY }).toBuffer();
      await Bun.write(webpPath, buf);
      console.log(`build-image-variants: ${webpPath}  (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`build-image-variants: WebP failed for ${srcPath} — ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
}

async function scanForMissing(): Promise<string[]> {
  const found: string[] = [];
  for (const dir of SCAN_DIRS) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue; // scan dir doesn't exist in this checkout — nothing to do
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (SKIP_BASENAMES.has(entry.name)) continue;
      if (!SOURCE_EXTS.includes(extname(entry.name).toLowerCase())) continue;
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const scan = args.includes("--scan");
const explicitFiles = args.filter((a) => !a.startsWith("--"));

if (!scan && explicitFiles.length === 0) {
  console.error(
    "usage: bun tools/build-image-variants.ts <file.jpg|file.png> [...] [--force]\n" +
      "       bun tools/build-image-variants.ts --scan [--force]",
  );
  process.exit(1);
}

const targets = scan ? await scanForMissing() : explicitFiles;
for (const t of targets) {
  try {
    await buildVariants(t, force);
  } catch (e) {
    console.error(`build-image-variants: unexpected failure on ${t} — ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
console.log(`build-image-variants: done — ${targets.length} source(s) checked`);
