#!/usr/bin/env bun
/**
 * Network: fetch Iansui subsets from Google Fonts &text= (explicit --regen only).
 */
import { mkdir } from "fs/promises";
import { join } from "path";
import {
  codepointsFromText,
  glyphManifestDigest,
  harvestIndexGlyphs,
  unicodeRangeCss,
} from "./glyph-harvest";
import { detectFontContainer } from "./iansui-format";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const OUT = "fonts";
const META = "src/fonts/iansui-index.meta.json";

export async function buildIansuiFromHtml(html: string): Promise<void> {
  const { critical, all } = harvestIndexGlyphs(html);
  const critSet = new Set(critical);
  const rest = [...all].filter((c) => !critSet.has(c)).join("");

  if (!all) {
    console.warn("build-iansui: no CJK glyphs harvested, skipping");
    return;
  }

  await mkdir(OUT, { recursive: true });

  const { path: critPath, container } = await fetchGFSubset(critical, "iansui-critical");
  let restPath: string;
  if (rest) {
    const restFetch = await fetchGFSubset(rest, "iansui-index", container);
    restPath = restFetch.path;
  } else {
    restPath = join(OUT, `iansui-index.${container.ext}`);
    await Bun.write(restPath, await Bun.file(critPath).arrayBuffer());
  }

  const meta = {
    glyphManifest: glyphManifestDigest(critical, all),
    criticalRange: unicodeRangeCss(codepointsFromText(critical)),
    restRange: unicodeRangeCss(codepointsFromText(rest)),
    fontExt: container.ext,
    fontFormat: container.cssFormat,
    fontMime: container.mime,
    criticalFile: `iansui-critical.${container.ext}`,
    restFile: `iansui-index.${container.ext}`,
    criticalChars: critical.length,
    restChars: rest.length,
    allChars: all.length,
    criticalBytes: (await Bun.file(critPath).arrayBuffer()).byteLength,
    restBytes: (await Bun.file(restPath).arrayBuffer()).byteLength,
    generatedAt: new Date().toISOString(),
  };

  await Bun.write(META, JSON.stringify(meta, null, 2) + "\n");
  console.log(
    `build-iansui: ${container.ext} critical ${meta.criticalBytes} B (${meta.criticalChars} chars), rest ${meta.restBytes} B (${meta.restChars} chars)`,
  );
}

type Container = { ext: string; cssFormat: string; mime: string };

async function fetchGFSubset(
  text: string,
  basename: string,
  expect?: Container,
): Promise<{ path: string; container: Container }> {
  const enc = encodeURIComponent(text);
  const cssUrl = `https://fonts.googleapis.com/css2?family=Iansui&text=${enc}&display=swap`;
  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": UA } });
  if (!cssRes.ok) throw new Error(`GF css ${cssRes.status}`);
  const css = await cssRes.text();
  const block = css.match(/@font-face\s*\{[^}]+\}/s)?.[0] ?? css;
  const urlMatch = block.match(/url\((https:\/\/[^)]+)\)/);
  if (!urlMatch) throw new Error("GF css: no font url");
  const formatMatch = block.match(/format\(['"]?([^'")]+)['"]?\)/i);
  const fontRes = await fetch(urlMatch[1]);
  if (!fontRes.ok) throw new Error(`GF font ${fontRes.status}`);
  const buf = await fontRes.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const container = detectFontContainer(bytes, formatMatch?.[1]);
  if (expect && container.ext !== expect.ext) {
    console.warn(
      `build-iansui: ${basename} format ${container.ext} differs from critical ${expect.ext}; using ${container.ext}`,
    );
  }
  const path = join(OUT, `${basename}.${container.ext}`);
  await Bun.write(path, buf);
  return { path, container };
}

if (import.meta.main) {
  const indexPath = process.argv[2] ?? "index.html";
  const html = await Bun.file(indexPath).text();
  await buildIansuiFromHtml(html);
}