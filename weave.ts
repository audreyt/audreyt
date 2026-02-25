#!/usr/bin/env bun
/**
 * weave.ts — Assembles index.html from src/index.template.html and src/ parts.
 *
 * Inclusion markers in the template:
 *   {{style:NAME}}              → reads src/styles/NAME.css
 *   {{script:NAME}}             → reads src/scripts/NAME.js
 *   {{json-ld:NAME}}            → reads src/scripts/NAME.json
 *   {{font:NAME}}               → reads src/fonts/NAME.woff2.b64 (raw base64 string)
 *
 * After assembly, recomputes CSP SHA-256 hashes for all inline <script> and <style> blocks.
 * Run: bun weave.ts
 */

import { createHash } from "crypto";

const TEMPLATE = "src/index.template.html";
const OUTPUT = "index.html";

// ─── Read template ───────────────────────────────────────────────────

let html = await Bun.file(TEMPLATE).text();

// ─── Resolve inclusion markers ───────────────────────────────────────

// {{style:NAME}} → content of src/styles/NAME.css
html = await replaceAsync(html, /\{\{style:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`styles/${name}.css`);
  return content.trimEnd();
});

// {{script:NAME}} → content of src/scripts/NAME.js
html = await replaceAsync(html, /\{\{script:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`scripts/${name}.js`);
  return content.trimEnd();
});

// {{json-ld:NAME}} → content of src/scripts/NAME.json
html = await replaceAsync(html, /\{\{json-ld:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`scripts/${name}.json`);
  return content.trimEnd();
});

// {{font:NAME}} → raw base64 from src/fonts/NAME.woff2.b64
html = await replaceAsync(html, /\{\{font:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`fonts/${name}.woff2.b64`);
  return content.trim();
});

// ─── CSP hash update ─────────────────────────────────────────────────

function computeHashes(tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(`'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
  }
  return out;
}

const scriptHashes = computeHashes("script").join(" ");
const styleHashes = computeHashes("style").join(" ");

function replaceDirective(csp: string, directive: string, newHashes: string): string {
  return csp.replace(new RegExp(`${directive} [^;]+`), `${directive} ${newHashes}`);
}

const cspMatch = html.match(/(content=")(default-src[^"]+)(")/);
if (!cspMatch) {
  console.error("weave: CSP meta tag not found in template");
  process.exit(1);
}
let newCsp = replaceDirective(cspMatch[2], "script-src", scriptHashes);
newCsp = replaceDirective(newCsp, "style-src", styleHashes);
html = html.replace(cspMatch[0], cspMatch[1] + newCsp + cspMatch[3]);

// ─── Write output ────────────────────────────────────────────────────

await Bun.write(OUTPUT, html);

const lineCount = html.split("\n").length;
const byteCount = new TextEncoder().encode(html).length;
console.log(`weave: ${OUTPUT}  ${lineCount} lines  ${(byteCount / 1024).toFixed(0)} KB`);

// ─── Helpers ─────────────────────────────────────────────────────────

async function readSrc(path: string): Promise<string> {
  const file = Bun.file(`src/${path}`);
  if (!(await file.exists())) {
    console.error(`weave: missing src/${path}`);
    process.exit(1);
  }
  return file.text();
}

async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (match: string, ...args: string[]) => Promise<string>,
): Promise<string> {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match, ...args) => {
    promises.push(asyncFn(match, ...args));
    return match;
  });
  const results = await Promise.all(promises);
  let i = 0;
  return str.replace(regex, () => results[i++]);
}
