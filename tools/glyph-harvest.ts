/**
 * Harvest Iansui glyphs from woven index.html via DOM textContent walk.
 */
import { createHash } from "crypto";
import { parseHTML } from "linkedom";

export function harvestIndexGlyphs(html: string): {
  critical: string;
  all: string;
} {
  const { document } = parseHTML(html);

  for (const el of document.querySelectorAll("script, style")) {
    el.remove();
  }

  const all = new Set<string>();
  const critical = new Set<string>();

  const nav = document.querySelector("nav");
  const header = document.querySelector("header.hero, header");
  const criticalRoots: Element[] = [];
  if (nav) criticalRoots.push(nav);
  if (header && header !== nav) criticalRoots.push(header);

  addHeadIdentity(document, critical);

  walkText(document.body, (text, ctx) => {
    if (!shouldCollect(ctx)) return;
    addChars(text, all);
    if (criticalRoots.some((r) => r.contains(ctx.element))) {
      addChars(text, critical);
    }
  });

  return {
    critical: sortUnique(critical),
    all: sortUnique(all),
  };
}

type TextCtx = { element: Element; lang: string | null; inCjk: boolean };

function walkText(
  root: Element | Document,
  fn: (text: string, ctx: TextCtx) => void,
) {
  const TEXT = 3;
  const visit = (node: Node) => {
    if (node.nodeType === TEXT) {
      const text = node.textContent ?? "";
      if (!text.trim()) return;
      const el = (node as CharacterData).parentElement;
      if (!el) return;
      if (el.closest("script, style")) return;
      fn(text, contextForText(el));
      return;
    }
    for (const child of [...node.childNodes]) visit(child);
  };
  const start =
    "body" in root && (root as Document).body
      ? (root as Document).body!
      : (root as Element);
  if (start) visit(start);
}

function contextForText(el: Element): TextCtx {
  let lang: string | null = null;
  let inCjk = false;
  let n: Element | null = el;
  while (n) {
    if (!lang && n.getAttribute("lang")) lang = n.getAttribute("lang");
    if (n.classList?.contains("cjk")) inCjk = true;
    n = n.parentElement;
  }
  return { element: el, lang, inCjk };
}

function shouldCollect(ctx: TextCtx): boolean {
  if (ctx.lang === "zh-TW") return true;
  if (ctx.lang === "en-GB" && ctx.inCjk) return true;
  if (ctx.inCjk && ctx.lang !== "en-GB") return true;
  return false;
}

function addHeadIdentity(document: Document, into: Set<string>) {
  const title = document.querySelector("title")?.textContent ?? "";
  addChars(title, into);
  for (const sel of [
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
  ]) {
    const content = document.querySelector(sel)?.getAttribute("content") ?? "";
    addChars(content, into);
  }
}

function addChars(text: string, into: Set<string>) {
  for (const c of text) into.add(c);
}

export function glyphManifestDigest(critical: string, all: string): string {
  return createHash("sha256")
    .update(critical, "utf8")
    .update("\n", "utf8")
    .update(all, "utf8")
    .digest("hex");
}

export function digestFromIndexHtml(html: string): string {
  const { critical, all } = harvestIndexGlyphs(html);
  return glyphManifestDigest(critical, all);
}

function sortUnique(set: Set<string>): string {
  return [...set]
    .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
    .join("");
}

export function codepointsFromText(text: string): number[] {
  const cps: number[] = [];
  for (const c of text) {
    const cp = c.codePointAt(0)!;
    if (!cps.includes(cp)) cps.push(cp);
  }
  return cps.sort((a, b) => a - b);
}

export function unicodeRangeCss(codepoints: number[]): string {
  if (codepoints.length === 0) return "U+0000";
  return codepoints
    .map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`)
    .join(", ");
}