import { digestFromIndexHtml } from "./glyph-harvest";
import {
  IANSUI_PLACEHOLDER_META,
  type IansuiFontMeta,
} from "./iansui-format";

const META = "src/fonts/iansui-index.meta.json";

export async function assertIansuiManifestMatchesHtml(
  html: string,
): Promise<void> {
  const metaFile = Bun.file(META);
  if (!(await metaFile.exists())) {
    console.error(
      `weave: missing ${META} — run: bun tools/build-fonts.ts --regen`,
    );
    process.exit(1);
  }
  const meta = JSON.parse(await metaFile.text()) as IansuiFontMeta;
  if (!meta.glyphManifest) {
    console.error(
      `weave: ${META} missing glyphManifest — run: bun tools/build-fonts.ts --regen`,
    );
    process.exit(1);
  }
  const current = digestFromIndexHtml(html);
  if (current !== meta.glyphManifest) {
    console.error(`weave: Iansui glyph manifest mismatch`);
    console.error(`  meta:   ${meta.glyphManifest}`);
    console.error(`  woven:  ${current}`);
    console.error(`  fix: bun tools/build-fonts.ts --regen`);
    process.exit(1);
  }
  for (const f of [
    `fonts/${meta.criticalFile}`,
    `fonts/${meta.restFile}`,
  ]) {
    if (!(await Bun.file(f).exists())) {
      console.error(`weave: missing ${f}`);
      process.exit(1);
    }
  }
}

export async function loadIansuiMeta(): Promise<IansuiFontMeta> {
  const metaFile = Bun.file(META);
  if (!(await metaFile.exists())) {
    return { ...IANSUI_PLACEHOLDER_META };
  }
  const raw = JSON.parse(await metaFile.text()) as IansuiFontMeta;
  if (!raw.criticalFile || !raw.restFile || !raw.fontFormat || !raw.fontMime) {
    const ext = raw.fontExt ?? "ttf";
    return {
      ...IANSUI_PLACEHOLDER_META,
      ...raw,
      fontExt: ext,
      fontFormat: raw.fontFormat ?? "truetype",
      fontMime: raw.fontMime ?? "font/ttf",
      criticalFile: raw.criticalFile ?? `iansui-critical.${ext}`,
      restFile: raw.restFile ?? `iansui-index.${ext}`,
    };
  }
  return raw;
}