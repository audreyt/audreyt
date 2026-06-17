#!/usr/bin/env bun
/**
 * Decode src/fonts/*.woff2.b64 → fonts/*.woff2 (cacheable binaries).
 */
import { readdir } from "fs/promises";
import { join } from "path";

const SRC = "src/fonts";
const OUT = "fonts";

const files = (await readdir(SRC)).filter((f) => f.endsWith(".woff2.b64"));
await Bun.write(join(OUT, ".gitkeep"), "");

for (const f of files) {
  const name = f.replace(/\.b64$/, "");
  const b64 = (await Bun.file(join(SRC, f)).text()).trim();
  const raw = Buffer.from(b64, "base64");
  const outPath = join(OUT, name);
  await Bun.write(outPath, raw);
  console.log(`decode: ${outPath}  ${raw.length} B`);
}