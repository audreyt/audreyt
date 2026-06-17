#!/usr/bin/env bun
/**
 *   bun tools/build-fonts.ts           # decode Latin woff2 (offline)
 *   bun tools/build-fonts.ts --regen   # render index (no font check) → fetch Iansui → meta
 */
import { mkdir, readdir } from "fs/promises";
import { join } from "path";
import { $ } from "bun";
import { buildIansuiFromHtml } from "./build-iansui";

const SRC = "src/fonts";
const OUT = "fonts";
const GLYPH_HTML = ".weave/glyph-source.html";

async function decodeLatin() {
  await mkdir(OUT, { recursive: true });
  for (const f of (await readdir(SRC)).filter((x) => x.endsWith(".woff2.b64"))) {
    const name = f.replace(/\.b64$/, "");
    const b64 = (await Bun.file(join(SRC, f)).text()).trim();
    await Bun.write(join(OUT, name), Buffer.from(b64, "base64"));
  }
  console.log("decode: Latin → fonts/");
}

await decodeLatin();

if (!process.argv.includes("--regen")) {
  console.log("build-fonts: skip Iansui (use --regen when zh copy changes)");
  process.exit(0);
}

await mkdir(".weave", { recursive: true });
await $`bun weave.ts --skip-font-check --glyph-out=${GLYPH_HTML}`.quiet();
const html = await Bun.file(GLYPH_HTML).text();
console.log(`build-fonts: harvest from ${GLYPH_HTML}`);
await buildIansuiFromHtml(html);
console.log("build-fonts: done — commit fonts/*.woff2 and iansui-index.meta.json");