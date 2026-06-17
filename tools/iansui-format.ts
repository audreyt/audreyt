/** Detect container from GF CSS format() and/or magic bytes. */
export function detectFontContainer(
  bytes: Uint8Array,
  cssFormat: string | undefined,
): { ext: string; cssFormat: string; mime: string } {
  const fmt = (cssFormat ?? "").toLowerCase();

  const woff2 =
    fmt.includes("woff2") ||
    (bytes.length >= 4 &&
      bytes[0] === 0x77 &&
      bytes[1] === 0x4f &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x32);
  if (woff2) {
    return { ext: "woff2", cssFormat: "woff2", mime: "font/woff2" };
  }

  const otf =
    fmt.includes("opentype") ||
    (bytes.length >= 4 &&
      bytes[0] === 0x4f &&
      bytes[1] === 0x54 &&
      bytes[2] === 0x54 &&
      bytes[3] === 0x4f);
  if (otf) {
    return { ext: "otf", cssFormat: "opentype", mime: "font/otf" };
  }

  const ttf =
    fmt.includes("truetype") ||
    fmt.includes("ttf") ||
    (bytes.length >= 4 &&
      bytes[0] === 0x00 &&
      bytes[1] === 0x01 &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x00);
  if (ttf) {
    return { ext: "ttf", cssFormat: "truetype", mime: "font/ttf" };
  }

  throw new Error(
    `iansui-format: unknown container (css format=${cssFormat ?? "none"}, sig=${[...bytes.slice(0, 4)].map((b) => b.toString(16)).join(" ")})`,
  );
}

export type IansuiFontMeta = {
  glyphManifest?: string;
  criticalRange: string;
  restRange: string;
  fontExt: string;
  fontFormat: string;
  fontMime: string;
  criticalFile: string;
  restFile: string;
};

export const IANSUI_PLACEHOLDER_META: IansuiFontMeta = {
  criticalRange: "U+4E00-9FFF",
  restRange: "U+4E00-9FFF",
  fontExt: "ttf",
  fontFormat: "truetype",
  fontMime: "font/ttf",
  criticalFile: "iansui-critical.ttf",
  restFile: "iansui-index.ttf",
};

export function substituteIansuiPlaceholders(
  html: string,
  meta: IansuiFontMeta,
): string {
  const map: Record<string, string> = {
    "{{iansui-critical-range}}": meta.criticalRange,
    "{{iansui-rest-range}}": meta.restRange,
    "{{iansui-font-format}}": meta.fontFormat,
    "{{iansui-font-mime}}": meta.fontMime,
    "{{iansui-critical-file}}": meta.criticalFile,
    "{{iansui-rest-file}}": meta.restFile,
  };
  let out = html;
  for (const [key, val] of Object.entries(map)) {
    out = out.split(key).join(val);
  }
  return out;
}