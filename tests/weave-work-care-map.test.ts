import { beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..");
const INDEX_HTML = join(REPO_ROOT, "index.html");

function extractWorkSection(html: string): string {
  const open = html.indexOf('<section class="section reveal" id="work">');
  if (open < 0) throw new Error("Work section #work not found in homepage HTML");
  const close = html.indexOf("</section>", open);
  if (close < 0) throw new Error("Work section #work is not closed");
  return html.slice(open, close);
}

describe("homepage weave — Work section care-map contract", () => {
  beforeAll(async () => {
    const proc = Bun.spawn(["bun", "weave.ts", "--skip-font-check"], {
      cwd: REPO_ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    const exit = await proc.exited;
    const stderr = await new Response(proc.stderr).text();
    if (exit !== 0) {
      throw new Error(`weave.ts failed (exit ${exit}): ${stderr}`);
    }
  });

  test("places .care-map before .work-grid inside #work", async () => {
    const html = await Bun.file(INDEX_HTML).text();
    const work = extractWorkSection(html);

    const careMapIdx = work.indexOf('class="care-map"');
    const gridIdx = work.indexOf('class="work-grid"');

    expect(careMapIdx).toBeGreaterThanOrEqual(0);
    expect(gridIdx).toBeGreaterThanOrEqual(0);
    expect(careMapIdx).toBeLessThan(gridIdx);
  });

  test("care-map exposes Pack 6 boundary title in English and zh-TW", async () => {
    const html = await Bun.file(INDEX_HTML).text();
    const work = extractWorkSection(html);

    const careMapMatch = work.match(
      /<div class="care-map"[^>]*>([\s\S]*?)<\/div>\s*<div class="work-grid">/,
    );
    expect(careMapMatch).not.toBeNull();
    const careMapInner = careMapMatch![1];

    expect(careMapInner).toMatch(/6-Pack of Care|Pack\s*6/i);
    expect(careMapInner).toMatch(/關懷六力|六力/);
  });

  test("care-map has six .care-map-chip anchors for #care-pack-1 … #care-pack-6", async () => {
    const html = await Bun.file(INDEX_HTML).text();
    const work = extractWorkSection(html);

    const chipRe =
      /class="care-map-chip"[^>]*href="#care-pack-(\d)"/g;
    const packs = new Set<number>();
    for (const m of work.matchAll(chipRe)) {
      packs.add(Number(m[1]));
    }
    expect(packs.size).toBe(6);
    for (let n = 1; n <= 6; n++) {
      expect(packs.has(n)).toBe(true);
    }
  });

  test('work grid cards expose matching id="care-pack-N"', async () => {
    const html = await Bun.file(INDEX_HTML).text();
    const work = extractWorkSection(html);

    const gridMatch = work.match(
      /<div class="work-grid">([\s\S]*?)<\/div>\s*<div class="case-study">/,
    );
    expect(gridMatch).not.toBeNull();
    const gridInner = gridMatch![1];

    const idRe = /\bid="care-pack-(\d)"/g;
    const ids = new Set<number>();
    for (const m of gridInner.matchAll(idRe)) {
      ids.add(Number(m[1]));
    }
    expect(ids.size).toBe(6);
    for (let n = 1; n <= 6; n++) {
      expect(ids.has(n)).toBe(true);
    }
  });
});