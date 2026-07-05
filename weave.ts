#!/usr/bin/env bun
/**
 * weave.ts — Assembles index.html from template skeleton, README content, and src/ parts.
 *
 * Data flow: README.md + README.zh-TW.md → parsed sections → rendered bilingual HTML
 * Template markers: {{style:}}, {{script:}}, {{font:}}, {{svg:}}, {{json-ld:}}, {{content:}}
 * CSP SHA-256 hashes recomputed for all inline <script> and <style> blocks.
 *
 * Run: bun weave.ts
 */

import { createHash } from "crypto";
import {
  assertIansuiManifestMatchesHtml,
  loadIansuiMeta,
} from "./tools/iansui-manifest";
import {
  substituteIansuiPlaceholders,
  type IansuiFontMeta,
} from "./tools/iansui-format";

const cliArgs = process.argv.slice(2);
const skipFontCheck = cliArgs.includes("--skip-font-check");
const checkFontsOnly = cliArgs.includes("--check-fonts");
const glyphOut = cliArgs.find((a) => a.startsWith("--glyph-out="))?.slice(12);

const TEMPLATE = "src/index.template.html";
const OUTPUT = "index.html";

// ─── Read inputs ────────────────────────────────────────────────────

let html = await Bun.file(TEMPLATE).text();
const readmeEn = await Bun.file("README.md").text();
const readmeZh = await Bun.file("README.zh-TW.md").text();

interface ThumbData {
  alt: string;
  srcset?: string;
  sizes?: string;
  width: number;
  height: number;
}
const thumbs: Record<string, ThumbData> = JSON.parse(
  await Bun.file("src/thumbs.json").text(),
);

// ─── Parse README sections ──────────────────────────────────────────

function parseSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const re = /<!-- section:(\w+) -->/g;
  const markers: { name: string; markerStart: number; contentStart: number }[] =
    [];
  let m;
  while ((m = re.exec(md))) {
    markers.push({
      name: m[1],
      markerStart: m.index,
      contentStart: m.index + m[0].length,
    });
  }
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].contentStart;
    const end =
      i + 1 < markers.length ? markers[i + 1].markerStart : md.length;
    let content = md.slice(start, end).trim();
    // Strip trailing ---
    content = content.replace(/\n---\s*$/, "").trim();
    sections[markers[i].name] = content;
  }
  return sections;
}

const en = parseSections(readmeEn);
const zh = parseSections(readmeZh);

// ─── Entity encoding ────────────────────────────────────────────────

/** Encode Unicode → HTML entities for English content */
function entEn(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/\u201C/g, "&ldquo;")
    .replace(/\u201D/g, "&rdquo;")
    .replace(/\u2018/g, "&lsquo;")
    .replace(/\u2019/g, "&rsquo;")
    .replace(/\u2014/g, "&mdash;")
    .replace(/\u2013/g, "&ndash;")
    .replace(/\u00B7/g, "&middot;")
    .replace(/\u2192/g, "&rarr;")
    .replace(/\u00E7/g, "&ccedil;")
    .replace(/\u00E9/g, "&eacute;")
    .replace(/\u00E8/g, "&egrave;");
}

/** Encode Unicode → HTML entities for Chinese content */
function entZh(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/\u30FB/g, "&#x30FB;")
    .replace(/\u2192/g, "&rarr;");
}

type EntFn = (s: string) => string;

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// ─── Inline Markdown → HTML ─────────────────────────────────────────

/**
 * Convert inline markdown to HTML with entity encoding.
 * Applies ent() first to encode special chars, then converts markdown syntax.
 */
function mdInline(s: string, ent: EntFn): string {
  // Entity-encode the entire string first
  s = ent(s);
  // Links: [text](url) — URL already has & → &amp; from ent()
  s = s.replace(
    /\[([^\]]*)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  // Bold: **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  s = s.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, "<em>$1</em>");
  return s;
}

// ─── Nowrap helper ──────────────────────────────────────────────────

const NOWRAP: [string, string][] = [
  [
    "才是超級智慧",
    '<span class="nowrap">才是超級智慧</span>',
  ],
  ["仁工智慧", '<span class="nowrap">仁工智慧</span>'],
  ["關懷六力", '<span class="nowrap">關懷六力</span>'],
  [
    "From Open Source",
    '<span class="nowrap">From Open Source</span>',
  ],
  [
    "to Open Government",
    '<span class="nowrap">to Open Government</span>',
  ],
  [
    "從開源軟體",
    '<span class="nowrap">從開源軟體</span>',
  ],
  [
    "到開放政府",
    '<span class="nowrap">到開放政府</span>',
  ],
  [
    "no rights reserved.",
    '<span class="nowrap">no rights reserved.</span>',
  ],
  [
    "拋棄所有權利。",
    '<span class="nowrap">拋棄所有權利。</span>',
  ],
];

function applyNowrap(s: string): string {
  for (const [from, to] of NOWRAP) {
    s = s.replace(from, to);
  }
  return s;
}

// ─── Parsing helpers ────────────────────────────────────────────────

/** Split section content on ## heading, returning {label?, heading?, body} */
function parseHeading(content: string): {
  label?: string;
  heading?: string;
  body: string;
} {
  const m = content.match(/^##\s+(.+)$/m);
  if (!m) return { body: content };
  const full = m[1];
  const colonIdx = full.indexOf(": ");
  let label: string | undefined;
  let heading: string | undefined;
  if (colonIdx >= 0) {
    label = full.slice(0, colonIdx);
    heading = full.slice(colonIdx + 2);
  } else {
    heading = full;
  }
  const bodyStart = content.indexOf(m[0]) + m[0].length;
  return { label, heading, body: content.slice(bodyStart).trim() };
}

/** Parse paragraphs separated by blank lines */
function parseParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Extract video ID from YouTube URL */
function videoId(url: string): string {
  const m = url.match(/[?&]v=([^&]+)/);
  return m?.[1] ?? "";
}

const CIVIC_TRAILING_DOMAINS = /(?:civic\.[a-z0-9.-]+|pi\.audreyt\.org)/i;

function parseCivicTrailingLink(text: string): {
  label: string;
  href: string;
} | null {
  if (!text.includes("\u2192")) return null;

  const markdownMatch = text.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
  if (markdownMatch) {
    return {
      label: text.replace(markdownMatch[0], markdownMatch[1]),
      href: markdownMatch[2],
    };
  }

  const absoluteMatch = text.match(
    new RegExp(`\\bhttps?:\\/\\/(?:www\\.)?${CIVIC_TRAILING_DOMAINS.source}[^\\s<)\\]]*`, "i"),
  );
  if (absoluteMatch) {
    return { label: text, href: absoluteMatch[0] };
  }

  const bareDomainMatch = text.match(
    new RegExp(`\\b(${CIVIC_TRAILING_DOMAINS.source}(?:\\/[^\\s<)\\]]*)?)\\b`, "i"),
  );
  if (bareDomainMatch) {
    return { label: text, href: `https://${bareDomainMatch[1]}` };
  }

  return null;
}

// ─── Section renderers ──────────────────────────────────────────────

function renderHero(): string {
  const lines: string[] = [];
  const I = "        "; // 8 spaces

  // Parse hero sections
  function parseHero(content: string) {
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const name = nameMatch?.[1] ?? "";

    // Blockquote: lines starting with >
    const quoteLines: string[] = [];
    for (const line of content.split("\n")) {
      if (line.startsWith("> ") || line === ">") {
        quoteLines.push(line.replace(/^>\s?/, ""));
      }
    }

    // Subtitle: non-heading, non-quote, non-rule, non-empty lines after the quote
    const subtitleLines: string[] = [];
    let pastQuote = false;
    for (const line of content.split("\n")) {
      if (line.startsWith("> ")) pastQuote = true;
      else if (pastQuote && line.trim() && !line.startsWith("#") && line.trim() !== "****") {
        subtitleLines.push(line.trim());
      }
    }

    // Loop line: non-heading, non-rule, non-quote, non-empty lines BEFORE the quote.
    // (Currently the only such line is the new "AI in the loop of humanity" argument;
    // renderHero previously dropped this slot entirely.)
    const loopLines: string[] = [];
    let reachedQuote = false;
    for (const line of content.split("\n")) {
      if (line.startsWith("> ") || line === ">") reachedQuote = true;
      else if (!reachedQuote && line.trim() && !line.startsWith("#") && line.trim() !== "****") {
        loopLines.push(line.trim());
      }
    }

    return { name, quoteLines, subtitleLines, loopLines };
  }

  const enH = parseHero(en.HERO);
  const zhH = parseHero(zh.HERO);

  lines.push(`${I}<h1 lang="en-GB">${enH.name}</h1>`);
  lines.push(`${I}<h1 lang="zh-TW">${zhH.name}</h1>`);

  // Subtitle
  lines.push(`${I}<p class="hero-subtitle" lang="en-GB">`);
  for (let i = 0; i < enH.subtitleLines.length; i++) {
    const suffix = i < enH.subtitleLines.length - 1 ? "<br>" : "";
    lines.push(`${I}    ${enH.subtitleLines[i]}${suffix}`);
  }
  lines.push(`${I}</p>`);

  lines.push(`${I}<p class="hero-subtitle" lang="zh-TW">`);
  for (let i = 0; i < zhH.subtitleLines.length; i++) {
    const suffix = i < zhH.subtitleLines.length - 1 ? "<br>" : "";
    lines.push(`${I}    ${zhH.subtitleLines[i]}${suffix}`);
  }
  lines.push(`${I}</p>`);

  // Quote
  lines.push(`${I}<blockquote class="hero-quote" lang="en-GB">`);
  lines.push(`${I}    ${enH.quoteLines.join("<br>")}`);
  lines.push(`${I}</blockquote>`);

  lines.push(`${I}<blockquote class="hero-quote" lang="zh-TW">`);
  lines.push(`${I}    ${zhH.quoteLines.join("<br>")}`);
  lines.push(`${I}</blockquote>`);

  // Loop argument — the real-text equivalent of the decorative SVG caption (a11y).
  if (enH.loopLines.length)
    lines.push(`${I}<p class="hero-loop" lang="en-GB">${enH.loopLines.join(" ")}</p>`);
  if (zhH.loopLines.length)
    lines.push(`${I}<p class="hero-loop" lang="zh-TW">${zhH.loopLines.join(" ")}</p>`);

  return lines.join("\n");
}

function renderBio(): string {
  const lines: string[] = [];
  const I = "        "; // 8 spaces
  const I2 = "            "; // 12 spaces
  const I3 = "                "; // 16 spaces
  const I4 = "                    "; // 20 spaces

  function parseBio(content: string) {
    // Split into About and Roles sections
    const parts = content.split(/^##\s+/m).filter(Boolean);
    let aboutLabel = "About",
      aboutBody = "",
      rolesLabel = "Roles",
      rolesBody = "";

    for (const part of parts) {
      const nlIdx = part.indexOf("\n");
      const heading = nlIdx >= 0 ? part.slice(0, nlIdx).trim() : part.trim();
      const body = nlIdx >= 0 ? part.slice(nlIdx).trim() : "";
      if (
        heading.toLowerCase().startsWith("about") ||
        heading.startsWith("關於")
      ) {
        aboutLabel = heading;
        aboutBody = body;
      } else if (
        heading.toLowerCase().startsWith("role") ||
        heading.startsWith("職稱")
      ) {
        rolesLabel = heading;
        rolesBody = body;
      }
    }

    // Parse paragraphs
    const paragraphs = parseParagraphs(aboutBody);

    // Parse roles table
    const roles: [string, string][] = [];
    for (const line of rolesBody.split("\n")) {
      const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
      if (m && !m[1].startsWith("-") && !m[1].toLowerCase().includes("role") && !m[1].includes("職稱")) {
        roles.push([m[1].trim(), m[2].trim()]);
      }
    }

    return { aboutLabel, paragraphs, rolesLabel, roles };
  }

  const enB = parseBio(en.BIO);
  const zhB = parseBio(zh.BIO);

  // Bio text (About)
  lines.push(`${I}<div class="bio-text">`);
  lines.push(`${I2}<div class="section-label" lang="en-GB">${enB.aboutLabel}</div>`);
  lines.push(`${I2}<div class="section-label" lang="zh-TW">${zhB.aboutLabel}</div>`);
  for (const p of enB.paragraphs) {
    lines.push(`${I2}<p lang="en-GB">${mdInline(p, entEn)}</p>`);
  }
  for (const p of zhB.paragraphs) {
    lines.push(`${I2}<p lang="zh-TW">${mdInline(p, entZh)}</p>`);
  }
  lines.push(`${I}</div>`);

  // Roles
  lines.push(`${I}<div>`);
  lines.push(`${I2}<div class="section-label" lang="en-GB">${enB.rolesLabel}</div>`);
  lines.push(`${I2}<div class="section-label" lang="zh-TW">${zhB.rolesLabel}</div>`);

  // English roles (title first, org second)
  lines.push(`${I2}<ul class="bio-roles" lang="en-GB">`);
  for (const [title, org] of enB.roles) {
    lines.push(`${I3}<li>`);
    lines.push(`${I4}<span class="role-title">${entEn(title)}</span>`);
    lines.push(`${I4}<span class="role-org">${entEn(org)}</span>`);
    lines.push(`${I3}</li>`);
  }
  lines.push(`${I2}</ul>`);

  // Chinese roles (org first, title second — reversed order)
  lines.push(`${I2}<ul class="bio-roles" lang="zh-TW">`);
  for (const [title, org] of zhB.roles) {
    lines.push(`${I3}<li>`);
    lines.push(`${I4}<span class="role-org">${entZh(org)}</span>`);
    lines.push(`${I4}<span class="role-title">${entZh(title)}</span>`);
    lines.push(`${I3}</li>`);
  }
  lines.push(`${I2}</ul>`);
  lines.push(`${I}</div>`);

  return lines.join("\n");
}

interface Talk {
  title: string;
  url: string;
  meta: string;
  desc: string;
}

function renderDialogue(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  function parseTalks(content: string): Talk[] {
    const talks: Talk[] = [];
    const { body } = parseHeading(content);
    // Each talk starts with [Title](URL) — Meta
    const talkBlocks = body.split(/\n\n+/).filter(Boolean);
    let currentTalk: Partial<Talk> | null = null;
    for (const block of talkBlocks) {
      const linkMatch = block.match(
        /^\[([^\]]+)\]\(([^)]+)\)\s*\u2014\s*(.+)$/m,
      );
      if (linkMatch) {
        if (currentTalk?.title) talks.push(currentTalk as Talk);
        const descLines = block.split("\n").slice(1).join(" ").trim();
        currentTalk = {
          title: linkMatch[1],
          url: linkMatch[2],
          meta: linkMatch[3],
          desc: descLines || "",
        };
      } else if (currentTalk && !currentTalk.desc) {
        currentTalk.desc = block.trim();
      }
    }
    if (currentTalk?.title) talks.push(currentTalk as Talk);
    return talks;
  }

  const enP = parseHeading(en.DIALOGUE);
  const zhP = parseHeading(zh.DIALOGUE);
  const enTalks = parseTalks(en.DIALOGUE);
  const zhTalks = parseTalks(zh.DIALOGUE);

  // Section labels
  lines.push(
    `${I}<div class="section-label" lang="en-GB">${enP.label ?? "Spotlight Addresses"}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${zhP.label ?? "精選演講"}</div>`,
  );

  // H2 headings with nowrap
  lines.push(
    `${I}<h2 lang="en-GB">${applyNowrap(entEn(enP.heading ?? ""))}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${applyNowrap(entZh(zhP.heading ?? ""))}</h2>`,
  );

  // Build URL → talk maps
  const enByUrl = new Map(enTalks.map((t) => [t.url, t]));
  const zhByUrl = new Map(zhTalks.map((t) => [t.url, t]));

  // Merge: en-GB order first, then zh-TW-only
  const allUrls: string[] = [];
  const seen = new Set<string>();
  for (const t of enTalks) {
    if (!seen.has(t.url)) {
      allUrls.push(t.url);
      seen.add(t.url);
    }
  }
  for (const t of zhTalks) {
    if (!seen.has(t.url)) {
      allUrls.push(t.url);
      seen.add(t.url);
    }
  }

  lines.push(`${I}<div class="dialogue-grid">`);

  for (const url of allUrls) {
    const enT = enByUrl.get(url);
    const zhT = zhByUrl.get(url);
    const vid = videoId(url);
    const thumb = thumbs[vid];
    const isBilingual = enT && zhT;
    const isEnOnly = enT && !zhT;
    const isZhOnly = !enT && zhT;

    // Card opening tag
    if (isBilingual) {
      lines.push(
        `${I}    <a href="${url}" target="_blank" rel="noopener noreferrer" class="dialogue-card">`,
      );
    } else if (isEnOnly) {
      lines.push(
        `${I}    <a href="${url}" target="_blank" rel="noopener noreferrer" class="dialogue-card" lang="en-GB">`,
      );
    } else {
      lines.push(
        `${I}    <a href="${url}" target="_blank" rel="noopener noreferrer" class="dialogue-card" lang="zh-TW">`,
      );
    }

    // Thumbnail
    if (thumb) {
      let imgAttrs = `src="thumbs/${vid}.jpg"`;
      if (thumb.srcset) imgAttrs += ` srcset="${thumb.srcset}"`;
      if (thumb.sizes) imgAttrs += ` sizes="${thumb.sizes}"`;
      imgAttrs += ` alt="${thumb.alt}" aria-hidden="true" width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async"`;
      lines.push(
        `${I}        <div class="thumb"><noscript><img ${imgAttrs}></noscript></div>`,
      );
    }

    // Body
    lines.push(`${I}        <div class="dialogue-body">`);

    if (isBilingual) {
      lines.push(
        `${I}            <div class="meta" lang="en-GB">${entEn(enT!.meta)}</div>`,
      );
      lines.push(
        `${I}            <div class="meta" lang="zh-TW">${entZh(zhT!.meta)}</div>`,
      );
      lines.push(
        `${I}            <h3 lang="en-GB">${entEn(enT!.title)}</h3>`,
      );
      lines.push(
        `${I}            <h3 lang="zh-TW">${entZh(zhT!.title)}</h3>`,
      );
      lines.push(
        `${I}            <p lang="en-GB">${mdInline(enT!.desc, entEn)}</p>`,
      );
      lines.push(
        `${I}            <p lang="zh-TW">${mdInline(zhT!.desc, entZh)}</p>`,
      );
    } else {
      const t = enT ?? zhT!;
      const ent = enT ? entEn : entZh;
      lines.push(`${I}            <div class="meta">${ent(t.meta)}</div>`);
      lines.push(`${I}            <h3>${ent(t.title)}</h3>`);
      lines.push(`${I}            <p>${mdInline(t.desc, ent)}</p>`);
    }

    lines.push(`${I}        </div>`);
    lines.push(`${I}    </a>`);
  }

  lines.push(`${I}</div>`);
  return lines.join("\n");
}

function renderRecognition(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  const enP = parseHeading(en.RECOGNITION);
  const zhP = parseHeading(zh.RECOGNITION);

  // Section labels
  lines.push(
    `${I}<div class="section-label" lang="en-GB">${enP.label ?? "Honours"}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${zhP.label ?? "獲獎肯定"}</div>`,
  );
  lines.push(
    `${I}<h2 lang="en-GB">${applyNowrap(entEn(enP.heading ?? ""))}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${applyNowrap(entZh(zhP.heading ?? ""))}</h2>`,
  );

  // Parse award entries from ### YEAR — [Name](URL)
  interface Award {
    year: string;
    name: string;
    url: string;
    desc: string;
  }
  function parseAwards(body: string, ent: EntFn): Award[] {
    const awards: Award[] = [];
    const blocks = body.split(/^###\s+/m).filter(Boolean);
    for (const block of blocks) {
      const headerMatch = block.match(
        /^(\d{4})\s*\u2014\s*\[([^\]]+)\]\(([^)]+)\)/,
      );
      if (!headerMatch) continue;
      const desc = block
        .split("\n")
        .slice(1)
        .join(" ")
        .replace(/\n/g, " ")
        .trim();
      awards.push({
        year: headerMatch[1],
        name: headerMatch[2],
        url: headerMatch[3],
        desc,
      });
    }
    return awards;
  }

  const enAwards = parseAwards(enP.body, entEn);
  const zhAwards = parseAwards(zhP.body, entZh);

  // Constellation of Honours: a faint arc of time above the awards (Phase 4a)
  lines.push(`${I}<div class="constellation" aria-hidden="true">{{svg:constellation-arc}}</div>`);
  lines.push(`${I}<div class="awards-grid">`);

  for (let i = 0; i < enAwards.length; i++) {
    const a = enAwards[i];
    const az = zhAwards[i];
    lines.push(
      `${I}    <a href="${a.url}" class="award-card" target="_blank" rel="noopener noreferrer">`,
    );
    lines.push(
      `${I}        <time class="award-year" datetime="${a.year}">${a.year}</time>`,
    );
    lines.push(
      `${I}        <div class="award-name" lang="en-GB">${entEn(a.name)}</div>`,
    );
    if (az) {
      lines.push(
        `${I}        <div class="award-name" lang="zh-TW">${entZh(az.name)}</div>`,
      );
    }
    lines.push(
      `${I}        <div class="award-desc" lang="en-GB">${mdInline(a.desc, entEn)}</div>`,
    );
    if (az) {
      lines.push(
        `${I}        <div class="award-desc" lang="zh-TW">${mdInline(az.desc, entZh)}</div>`,
      );
    }
    lines.push(`${I}    </a>`);
  }

  lines.push(`${I}</div>`);
  return lines.join("\n");
}

function renderPullquote(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  function parsePullquote(content: string) {
    // All lines start with >
    const rawLines = content
      .split("\n")
      .filter((l) => l.startsWith(">"))
      .map((l) => l.replace(/^>\s?/, ""));

    // Find cite line (starts with —)
    const citeIdx = rawLines.findIndex((l) => l.startsWith("\u2014") || l.startsWith("—"));
    const quoteLines = citeIdx >= 0 ? rawLines.slice(0, citeIdx) : rawLines;
    const citeLine = citeIdx >= 0 ? rawLines[citeIdx].replace(/^\u2014\s*/, "").replace(/^—\s*/, "") : "";
    return { quoteLines, citeLine };
  }

  const enPQ = parsePullquote(en.PULLQUOTE);
  const zhPQ = parsePullquote(zh.PULLQUOTE);

  // English blockquote
  lines.push(`${I}<blockquote lang="en-GB">`);
  lines.push(`${I}    ${entEn(enPQ.quoteLines.join("<br>"))}`);
  lines.push(`${I}</blockquote>`);

  // Chinese blockquote
  lines.push(`${I}<blockquote lang="zh-TW">`);
  lines.push(`${I}    ${entZh(zhPQ.quoteLines.join("<br>"))}`);
  lines.push(`${I}</blockquote>`);

  // English cite
  lines.push(`${I}<cite lang="en-GB">${mdInline(enPQ.citeLine, entEn)}</cite>`);

  // Chinese cite
  lines.push(`${I}<cite lang="zh-TW">${mdInline(zhPQ.citeLine, entZh)}</cite>`);

  return lines.join("\n");
}

function renderCivicAI(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  const enP = parseHeading(en.CIVIC_AI);
  const zhP = parseHeading(zh.CIVIC_AI);

  // Section labels
  lines.push(
    `${I}<div class="section-label" lang="en-GB">${entEn(enP.label ?? "")}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${entZh(zhP.label ?? "")}</div>`,
  );
  lines.push(
    `${I}<h2 lang="en-GB">${applyNowrap(entEn(enP.heading ?? ""))}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${applyNowrap(entZh(zhP.heading ?? ""))}</h2>`,
  );

  // Split body into: intro paragraphs, work items, case study, trailing link
  function parseCivicBody(body: string) {
    // Split on #### for case study
    const caseStudySplit = body.split(/^####\s+/m);
    const mainPart = caseStudySplit[0];
    const caseStudyRaw = caseStudySplit[1] ?? "";

    // Split mainPart into intro paragraphs and work items
    const paras = parseParagraphs(mainPart);
    const introParagraphs: string[] = [];
    const workItems: { name: string; desc: string }[] = [];
    const trailingLinks: { label: string; href: string }[] = [];

    for (const p of paras) {
      const boldMatch = p.match(/^\*\*([^*]+)\*\*\s*\u2014\s*(.+)$/s);
      const trailing = parseCivicTrailingLink(p);
      if (boldMatch) {
        workItems.push({ name: boldMatch[1], desc: boldMatch[2] });
      } else if (trailing) {
        trailingLinks.push(trailing);
      } else if (workItems.length === 0 && trailingLinks.length === 0) {
        introParagraphs.push(p);
      }
    }

    // Parse case study
    let csLabel = "";
    let csHeading = "";
    let csParagraphs: string[] = [];
    if (caseStudyRaw) {
      const csFirstLine = caseStudyRaw.split("\n")[0];
      const csColonIdx = csFirstLine.indexOf(": ");
      if (csColonIdx >= 0) {
        csLabel = csFirstLine.slice(0, csColonIdx);
        csHeading = csFirstLine.slice(csColonIdx + 2);
      } else {
        csHeading = csFirstLine;
      }
      const csBody = caseStudyRaw.slice(csFirstLine.length).trim();
      csParagraphs = parseParagraphs(csBody).filter((p) => {
        const trailing = parseCivicTrailingLink(p);
        if (trailing) {
          trailingLinks.push(trailing);
          return false;
        }
        return true;
      });
    }

    return {
      introParagraphs,
      workItems,
      csLabel,
      csHeading,
      csParagraphs,
      trailingLinks,
    };
  }

  const enC = parseCivicBody(enP.body);
  const zhC = parseCivicBody(zhP.body);

  function pushCareMap(
    enItems: { name: string; desc: string }[],
    zhItems: { name: string; desc: string }[],
  ) {
    if (enItems.length < 6 || zhItems.length < 6) return;

    lines.push(`${I}<div class="care-map" role="group" aria-labelledby="care-map-title-en care-map-title-zh">`);
    lines.push(`${I}    <div class="care-map-frame">`);
    lines.push(`${I}        <div class="care-map-title">`);
    lines.push(`${I}            <a class="care-map-chip" href="#care-pack-6">`);
    lines.push(`${I}                <span id="care-map-title-en" lang="en-GB">Pack 6 &middot; ${entEn(enItems[5].name)} &mdash; the boundary in time</span>`);
    lines.push(`${I}                <span id="care-map-title-zh" lang="zh-TW">第六力&#x30FB;${entZh(zhItems[5].name)}&mdash;&mdash;時間中的邊界</span>`);
    lines.push(`${I}            </a>`);
    lines.push(`${I}        </div>`);
    lines.push(`${I}        <div class="care-map-body">`);
    lines.push(`${I}            <div class="care-map-dial" aria-label="6-Pack of Care map">`);
    lines.push(`${I}                <svg class="care-map-svg" viewBox="0 0 620 620" aria-hidden="true" focusable="false">`);
    lines.push(`${I}                    <circle class="care-map-rim" cx="310" cy="310" r="292"/>`);
    lines.push(`${I}                    <line class="care-map-horizon" x1="82" y1="310" x2="538" y2="310"/>`);
    lines.push(`${I}                    <path class="care-map-arc care-map-arc--1" pathLength="100" d="M 164.7 124 A 236 236 0 0 1 455.3 124"/>`);
    lines.push(`${I}                    <path class="care-map-arc care-map-arc--2" pathLength="100" d="M 496 164.7 A 236 236 0 0 1 496 455.3"/>`);
    lines.push(`${I}                    <path class="care-map-arc care-map-arc--3" pathLength="100" d="M 455.3 496 A 236 236 0 0 1 164.7 496"/>`);
    lines.push(`${I}                    <path class="care-map-arc care-map-arc--4" pathLength="100" d="M 124 455.3 A 236 236 0 0 1 124 164.7"/>`);
    lines.push(`${I}                    <line class="care-map-chord care-map-chord--13" x1="310" y1="90" x2="310" y2="530"/>`);
    lines.push(`${I}                    <line class="care-map-chord care-map-chord--24" x1="530" y1="310" x2="90" y2="310"/>`);
    lines.push(`${I}                    <circle class="care-map-field" cx="310" cy="310" r="172"/>`);
    lines.push(`${I}                    <circle class="care-map-centre" cx="310" cy="310" r="5"/>`);
    lines.push(`${I}                </svg>`);
    for (let i = 0; i < 5; i++) {
      lines.push(`${I}                <a class="care-map-chip" href="#care-pack-${i + 1}">`);
      lines.push(`${I}                    <span class="care-map-chip-num" aria-hidden="true">${i + 1}</span>`);
      lines.push(`${I}                    <span lang="en-GB">${entEn(enItems[i].name)}</span>`);
      lines.push(`${I}                    <span lang="zh-TW">${entZh(zhItems[i].name)}</span>`);
      lines.push(`${I}                </a>`);
    }
    lines.push(`${I}            </div>`);
    lines.push(`${I}            <div class="care-map-copy">`);
    lines.push(`${I}                <p lang="en-GB">Packs 1&ndash;4 turn as the care cycle; Pack 5 is the field between deployments; Pack 6 keeps every deployment local, plural, and ready to step back.</p>`);
    lines.push(`${I}                <p lang="zh-TW">第一至第四力構成關懷循環；第五力連結部署之間的場域；第六力守住邊界，讓每個部署維持在地、多元，並能功遂身退。</p>`);
    lines.push(`${I}                <ul class="care-map-legend">`);
    lines.push(`${I}                    <li><span class="care-map-legend-mark"></span><span lang="en-GB">Care cycle</span><span lang="zh-TW">關懷循環</span></li>`);
    lines.push(`${I}                    <li><span class="care-map-legend-mark"></span><span lang="en-GB">Solidarity field</span><span lang="zh-TW">團結場域</span></li>`);
    lines.push(`${I}                    <li><span class="care-map-legend-mark"></span><span lang="en-GB">Symbiosis boundary</span><span lang="zh-TW">共生邊界</span></li>`);
    lines.push(`${I}                </ul>`);
    lines.push(`${I}            </div>`);
    lines.push(`${I}        </div>`);
    lines.push(`${I}    </div>`);
    lines.push(`${I}</div>`);
  }


  // Intro paragraphs
  for (const p of enC.introParagraphs)
    lines.push(`${I}<p lang="en-GB">${mdInline(p, entEn)}</p>`);
  for (const p of zhC.introParagraphs)
    lines.push(`${I}<p lang="zh-TW">${mdInline(p, entZh)}</p>`);

  pushCareMap(enC.workItems, zhC.workItems);

  // Work grid
  lines.push(`${I}<div class="work-grid">`);
  for (let i = 0; i < enC.workItems.length; i++) {
    const w = enC.workItems[i];
    const wz = zhC.workItems[i];
    lines.push(`${I}    <div class="work-item" id="care-pack-${i + 1}">`);
    lines.push(
      `${I}        <h3 lang="en-GB">${entEn(w.name)}</h3>`,
    );
    if (wz)
      lines.push(
        `${I}        <h3 lang="zh-TW">${entZh(wz.name)}</h3>`,
      );
    lines.push(
      `${I}        <p lang="en-GB">${mdInline(w.desc, entEn)}</p>`,
    );
    if (wz)
      lines.push(
        `${I}        <p lang="zh-TW">${mdInline(wz.desc, entZh)}</p>`,
      );
    lines.push(`${I}    </div>`);
  }
  lines.push(`${I}</div>`);

  // Case study
  if (enC.csHeading) {
    lines.push(`${I}<div class="case-study">`);
    lines.push(
      `${I}    <div class="section-label" lang="en-GB">${entEn(enC.csLabel)}</div>`,
    );
    lines.push(
      `${I}    <div class="section-label" lang="zh-TW">${entZh(zhC.csLabel)}</div>`,
    );
    lines.push(
      `${I}    <h3 lang="en-GB">${entEn(enC.csHeading)}</h3>`,
    );
    lines.push(
      `${I}    <h3 lang="zh-TW">${entZh(zhC.csHeading)}</h3>`,
    );
    for (const p of enC.csParagraphs)
      lines.push(`${I}    <p lang="en-GB">${mdInline(p, entEn)}</p>`);
    for (const p of zhC.csParagraphs)
      lines.push(`${I}    <p lang="zh-TW">${mdInline(p, entZh)}</p>`);
    lines.push(`${I}</div>`);
  }

  // Trailing links — pair en/zh pairs side by side when there are 2+
  const trailingPairs = Math.max(
    enC.trailingLinks.length,
    zhC.trailingLinks.length,
  );
  if (trailingPairs > 0) {
    const pairedClass =
      trailingPairs > 1 ? "work-item--spaced work-item--paired" : "work-item--spaced";
    lines.push(`${I}<div class="work-item ${pairedClass}">`);
    for (let i = 0; i < trailingPairs; i++) {
      const enLink = enC.trailingLinks[i] ?? zhC.trailingLinks[i];
      const zhLink = zhC.trailingLinks[i] ?? enC.trailingLinks[i];
      if (enLink && enC.trailingLinks[i]) {
        lines.push(
          `${I}    <a href="${escapeAttr(enLink.href)}" class="work-link" lang="en-GB">${entEn(enC.trailingLinks[i].label)}</a>`,
        );
      }
      if (zhLink && zhC.trailingLinks[i]) {
        lines.push(
          `${I}    <a href="${escapeAttr(zhLink.href)}" class="work-link" lang="zh-TW">${entZh(zhC.trailingLinks[i].label)}</a>`,
        );
      }
    }
    lines.push(`${I}</div>`);
  }

  return lines.join("\n");
}

function renderFilmHeader(): string {
  const lines: string[] = [];
  const I = "        "; // 8 spaces

  const enP = parseHeading(en.FILM);
  const zhP = parseHeading(zh.FILM);

  // Section labels
  lines.push(
    `${I}<div class="section-label" lang="en-GB">${entEn(enP.label ?? "")}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${entZh(zhP.label ?? "")}</div>`,
  );
  lines.push(
    `${I}<h2 lang="en-GB">${entEn(enP.heading ?? "")}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${entZh(zhP.heading ?? "")}</h2>`,
  );

  // Subtitle: first paragraph of body (before blockquote)
  const enParas = parseParagraphs(enP.body);
  const zhParas = parseParagraphs(zhP.body);
  const enSubtitle = enParas[0] ?? "";
  const zhSubtitle = zhParas[0] ?? "";

  lines.push(
    `${I}<p class="film-subtitle" id="film-desc-en" lang="en-GB">${mdInline(enSubtitle, entEn)}</p>`,
  );
  lines.push(
    `${I}<p class="film-subtitle" id="film-desc-zh" lang="zh-TW">${mdInline(zhSubtitle, entZh)}</p>`,
  );

  return lines.join("\n");
}

function renderFilmQuotes(): string {
  const lines: string[] = [];
  const I = "        "; // 8 spaces

  function parseFilmQuote(body: string) {
    // Find blockquote (lines starting with >)
    const bodyLines = body.split("\n");
    const quoteLines: string[] = [];
    let citeText = "";
    let inQuote = false;

    for (const line of bodyLines) {
      if (line.startsWith("> ") || line === ">") {
        inQuote = true;
        quoteLines.push(line.replace(/^>\s?/, ""));
      } else if (inQuote && line.trim() === "") {
        inQuote = false;
      } else if (!inQuote && line.trim() && !line.startsWith("#") && !line.startsWith("|") && !line.startsWith("- ") && quoteLines.length > 0) {
        // Cite line — starts with — or ——
        citeText = line.trim();
      }
    }

    return { quoteLines, citeText };
  }

  const enBody = parseHeading(en.FILM).body;
  const zhBody = parseHeading(zh.FILM).body;

  // Skip the subtitle paragraph (first para), parse rest
  const enFilm = parseFilmQuote(enBody);
  const zhFilm = parseFilmQuote(zhBody);

  // English quote
  lines.push(`${I}<blockquote class="film-quote" lang="en-GB">`);
  lines.push(`${I}    ${entEn(enFilm.quoteLines.join("\n"))}`);
  // Cite
  lines.push(
    `${I}    <cite>${mdInline(enFilm.citeText, entEn)}</cite>`,
  );
  lines.push(`${I}</blockquote>`);

  // Chinese quote
  lines.push(`${I}<blockquote class="film-quote" lang="zh-TW">`);
  lines.push(`${I}    ${entZh(zhFilm.quoteLines.join("\n"))}`);
  lines.push(
    `${I}    <cite>${mdInline(zhFilm.citeText, entZh)}</cite>`,
  );
  lines.push(`${I}</blockquote>`);

  return lines.join("\n");
}

interface Essay {
  title: string;
  url: string;
  meta: string;
  desc: string;
}

function renderEssays(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  function parseEssays(content: string): Essay[] {
    const essays: Essay[] = [];
    const { body } = parseHeading(content);
    const blocks = body.split(/\n\n+/).filter(Boolean);
    let current: Partial<Essay> | null = null;
    for (const block of blocks) {
      const m = block.match(/^\[([^\]]+)\]\(([^)]+)\)\s*—\s*(.+)$/m);
      if (m) {
        if (current?.title) essays.push(current as Essay);
        const descLines = block.split("\n").slice(1).join(" ").trim();
        current = { title: m[1], url: m[2], meta: m[3], desc: descLines || "" };
      } else if (current && !current.desc) {
        current.desc = block.trim();
      }
    }
    if (current?.title) essays.push(current as Essay);
    return essays;
  }

  const enP = parseHeading(en.ESSAYS);
  const zhP = parseHeading(zh.ESSAYS);
  const enEssays = parseEssays(en.ESSAYS);
  const zhEssays = parseEssays(zh.ESSAYS);

  lines.push(
    `${I}<div class="section-label" lang="en-GB">${entEn(enP.label ?? "Essays & Testimonies")}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${entZh(zhP.label ?? "文集與證詞")}</div>`,
  );
  lines.push(
    `${I}<h2 lang="en-GB">${applyNowrap(entEn(enP.heading ?? ""))}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${applyNowrap(entZh(zhP.heading ?? ""))}</h2>`,
  );

  lines.push(`${I}<div class="essay-grid">`);
  for (let i = 0; i < enEssays.length; i++) {
    const enE = enEssays[i];
    const zhE = zhEssays[i];
    lines.push(`${I}    <a href="${enE.url}" class="essay-card">`);
    lines.push(`${I}        <div class="essay-body">`);
    lines.push(
      `${I}            <div class="meta" lang="en-GB">${entEn(enE.meta)}</div>`,
    );
    if (zhE) {
      lines.push(
        `${I}            <div class="meta" lang="zh-TW">${entZh(zhE.meta)}</div>`,
      );
    }
    lines.push(
      `${I}            <h3 lang="en-GB">${entEn(enE.title)}</h3>`,
    );
    if (zhE) {
      lines.push(
        `${I}            <h3 lang="zh-TW">${entZh(zhE.title)}</h3>`,
      );
    }
    lines.push(
      `${I}            <p lang="en-GB">${mdInline(enE.desc, entEn)}</p>`,
    );
    if (zhE) {
      lines.push(
        `${I}            <p lang="zh-TW">${mdInline(zhE.desc, entZh)}</p>`,
      );
    }
    lines.push(`${I}        </div>`);
    lines.push(`${I}    </a>`);
  }
  lines.push(`${I}</div>`);

  return lines.join("\n");
}

function renderPublications(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces
  const I2 = "        "; // 8 spaces
  const I3 = "            "; // 12 spaces

  const enP = parseHeading(en.PUBLICATIONS);
  const zhP = parseHeading(zh.PUBLICATIONS);

  // Section labels
  lines.push(
    `${I}<div class="section-label" lang="en-GB">${enP.label ?? "Published"}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${zhP.label ?? "選輯"}</div>`,
  );
  lines.push(
    `${I}<h2 lang="en-GB">${entEn(enP.heading ?? "")}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${entZh(zhP.heading ?? "")}</h2>`,
  );

  // Parse table rows
  interface PubRow {
    title: string;
    coauthors: string;
    venue: string;
    year: string;
  }
  function parsePubTable(body: string): PubRow[] {
    const rows: PubRow[] = [];
    for (const line of body.split("\n")) {
      const m = line.match(
        /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d{4})\s*\|$/,
      );
      if (m) {
        rows.push({
          title: m[1].trim(),
          coauthors: m[2].trim(),
          venue: m[3].trim(),
          year: m[4].trim(),
        });
      }
    }
    return rows;
  }

  const enRows = parsePubTable(enP.body);
  const zhRows = parsePubTable(zhP.body);

  lines.push(`${I}<ul class="pub-list">`);

  for (let i = 0; i < enRows.length; i++) {
    const r = enRows[i];
    const rz = zhRows[i];
    const isBilingual = rz && (r.title !== rz.title || r.coauthors !== rz.coauthors);

    lines.push(`${I2}<li>`);
    lines.push(
      `${I3}<span class="pub-venue">${entEn(r.venue)}</span>`,
    );

    if (isBilingual) {
      // English div
      lines.push(`${I3}<div lang="en-GB">`);
      lines.push(
        `${I3}    <div class="pub-title">${mdInline(r.title, entEn)}</div>`,
      );
      lines.push(
        `${I3}    <div class="pub-coauthors">${mdInline(r.coauthors, entEn)}</div>`,
      );
      lines.push(`${I3}</div>`);
      // Chinese div
      lines.push(`${I3}<div lang="zh-TW">`);
      lines.push(
        `${I3}    <div class="pub-title">${mdInline(rz.title, entZh)}</div>`,
      );
      lines.push(
        `${I3}    <div class="pub-coauthors">${mdInline(rz.coauthors, entZh)}</div>`,
      );
      lines.push(`${I3}</div>`);
    } else {
      lines.push(`${I3}<div>`);
      lines.push(
        `${I3}    <div class="pub-title">${mdInline(r.title, entEn)}</div>`,
      );
      lines.push(
        `${I3}    <div class="pub-coauthors">${mdInline(r.coauthors, entEn)}</div>`,
      );
      lines.push(`${I3}</div>`);
    }

    lines.push(
      `${I3}<time class="pub-year" datetime="${r.year}">${r.year}</time>`,
    );
    lines.push(`${I2}</li>`);
  }

  lines.push(`${I}</ul>`);
  return lines.join("\n");
}

function renderBackground(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  const enP = parseHeading(en.BACKGROUND);
  const zhP = parseHeading(zh.BACKGROUND);

  // Section labels
  lines.push(
    `${I}<div class="section-label" lang="en-GB">${enP.label ?? "Background"}</div>`,
  );
  lines.push(
    `${I}<div class="section-label" lang="zh-TW">${zhP.label ?? "背景"}</div>`,
  );
  lines.push(
    `${I}<h2 lang="en-GB">${applyNowrap(entEn(enP.heading ?? ""))}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${applyNowrap(entZh(zhP.heading ?? ""))}</h2>`,
  );

  // Paragraphs
  for (const p of parseParagraphs(enP.body))
    lines.push(`${I}<p lang="en-GB">${mdInline(p, entEn)}</p>`);
  for (const p of parseParagraphs(zhP.body))
    lines.push(`${I}<p lang="zh-TW">${mdInline(p, entZh)}</p>`);

  return lines.join("\n");
}

function renderConnect(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  // Connect has no section-label, just h2
  const enP = parseHeading(en.CONNECT);
  const zhP = parseHeading(zh.CONNECT);

  lines.push(
    `${I}<h2 lang="en-GB">${entEn(enP.heading ?? "Connect")}</h2>`,
  );
  lines.push(
    `${I}<h2 lang="zh-TW">${entZh(zhP.heading ?? "聯絡方式")}</h2>`,
  );

  // SVG icons for connect links
  const CONNECT_ICONS: Record<string, string> = {
    linkedin: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>',
    "x.com": '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    bsky: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><polygon opacity=".5" points="11.57 12.88 14.95 12.57 17.57 3.71 22.00 3.71 14.95 20.66 11.57 12.88"/><polygon points="6.28 5.69 2.00 5.69 8.37 20.62 10.68 16.71 6.28 5.69"/><path opacity=".5" d="M 12.39,12.80 l 2.15,-0.20 c 0.24,-0.02 0.45,-0.19 0.52,-0.42 l 2.56,-8.45 c 0.08,-0.25 0.31,-0.43 0.57,-0.43 h 3.09 c 0.42,0.00 0.71,0.43 0.55,0.83 l -6.73,16.16 c -0.17,0.41 -0.47,0.37 -0.92,0.37 l -2.28,-7.03 c -0.16,-0.37 0.09,-0.79 0.49,-0.83Z "/><path d="M 9.42,9.49 l 1.32,-2.08 c 0.51,-0.80 1.73,-0.64 2.01,0.27 l 1.44,4.70 1.94,-6.68 h 4.14 l -6.08,14.98 -4.76,-11.17Z "/><path opacity=".8" d="M 10.80,12.69 l 1.04,-1.65 c 0.51,-0.81 1.74,-0.64 2.02,0.27 l 0.32,1.06 2.62,-9.07 h 4.43 l -7.05,17.36 -3.38,-7.98Z "/></svg>',
    sayit: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12.04 3.08H7.29C4.33 3.08 1.74 5.77 1.74 9.04v.03c0 2.73 1.8 5.12 4.6 5.72v2.47c0 .68.82.99 1.32.52l2.92-2.89h1.46c3.04 0 5.49-2.74 5.49-5.81v-.09c0-3.02-2.32-5.91-5.49-5.91zM6.58 11.11c.89-.41 1.37-1.05 1.41-1.97-.88.08-1.4-.55-1.4-1.2 0-.71.54-1.28 1.2-1.28.94 0 1.46.68 1.46 1.89v.14c0 1.46-.77 2.59-2.15 3.22l-.52-.8zM10.22 11.11c.89-.41 1.35-1.05 1.38-1.97-.85.08-1.35-.55-1.35-1.2 0-.71.5-1.28 1.2-1.28.94 0 1.41.71 1.41 1.89v.14c0 1.43-.77 2.59-2.12 3.22l-.52-.8z"/><path opacity=".6" d="M18.56 9.6c-.25 3.37-2.8 6.49-6.82 6.49h-.85l-.07.07c.79 1.38 1.94 2.25 3.82 2.25h.84l2.12 2.15c.47.48 1.16.07 1.01-.6v-1.58c1.94-.45 3.53-2.31 3.53-4.39 0-2.08-1.34-3.85-3.58-4.39z"/></svg>',
    email: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    mu: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 1000 713" fill="currentColor"><path opacity=".5" d="M883.3639,69.5967l-2.9286-3.7416-3.0894.1628-117.5959,20.8196c-1.3829.1628-2.4391,1.6261-2.4391,3.0904v228.2775c0,11.3042-6.1807,20.9824-15.9393,25.943v-181.7601l-43.021-64.734-120.6049,21.2246c-1.7075.3256-2.8462,1.6271-2.8462,3.416v143.7822l-37.2463-55.4639c-1.2201-1.7889-2.5215-3.4964-3.9848-5.2039-57.497-74.4945-168.3423-79.9426-232.9135-11.1424-66.7681-34.4815-148.7429-15.5323-193.6342,44.4029-17.8096,23.9099-28.2194,52.1303-30.4967,82.3828l-.0804,262.0274,42.4512,63.8395c2.4391.1628,4.3908.1628,6.831-.3246l114.7488-20.1693c1.1387-.2432,2.2773-1.5457,2.2773-2.7648v-229.6604c0-11.5484,5.8551-21.4698,15.9393-26.5933v183.4686l43.1024,64.6526,121.0913-21.307c1.4643-.2442,2.2773-2.1959,2.2773-3.6602l.0814-229.7418c0-10.653,6.5878-19.7613,15.7765-24.6416l.0814,177.8577v4.7979l43.1024,64.5722,120.8491-21.308c1.4633-.2442,2.5205-1.7075,2.5205-3.2522v-144.2696l36.9207,54.8126c32.1238,45.7033,86.2048,70.0193,141.9933,64.1642,52.1293-5.5295,99.3783-38.3849,122.23-87.0168,8.2953-16.8347,12.6871-35.0513,14.6388-54.3242V129.6957l-40.0924-60.0989ZM560.0175,494.1917l-112.5538,19.8437v-212.8266c.814-19.5995-14.3132-35.6202-33.2615-36.5146-19.1111-.8945-35.7016,13.7444-36.6774,33.3429v228.3599l-112.4715,19.7613v-217.5431c-1.3015-19.5171-17.8096-33.5057-36.4332-32.6926-18.705.814-33.7499,16.3463-33.5067,35.783v226.8956l-112.3086,19.7613v-251.8618c1.1387-37.2463,16.3463-72.378,42.0451-98.7271,45.6229-46.5998,116.6191-57.904,174.2779-27.0817,1.7889.9759,3.822.5698,4.8803-.6512,60.0979-65.4656,163.2179-63.3511,220.7139,4.1476,1.3829,1.6271,2.7657,3.2542,4.0662,4.9617,19.5995,25.129,30.7409,56.1131,31.2293,88.8871v196.1547ZM831.8034,423.683c-56.3573,55.3825-146.3841,56.6025-204.0429,2.2773-5.2863-4.9607-10.1656-10.3284-14.7192-16.0207-19.5995-24.5602-31.5549-55.1383-31.6363-87.3425l-.3246-197.8632,112.5529-19.8427.1628,215.3472c0,19.1121,17.2408,33.5067,35.0513,33.3438,18.8669-.2442,34.0745-15.0458,34.7257-34.1569V92.5298l112.3086-19.7613.0814,250.1543c-1.1387,38.3849-17.3222,74.3297-44.1597,100.7602Z"/><path d="M875.8816,72.7683l.0813,250.1542c-1.1385,38.3852-17.3221,74.3306-44.1592,100.7611-56.3579,55.382-146.3841,56.6019-204.0432,2.2771-5.2861-4.9608-10.1656-10.3282-14.7197-16.0209-19.5992-24.56-31.5539-55.138-31.6352-87.3425l-.3253-197.8626,112.5531-19.8432.1626,215.3473c0,19.1113,17.2408,33.5057,35.0509,33.3431,18.8673-.244,34.075-15.045,34.7256-34.1563V92.5301l112.3092-19.7619Z M560.0171,298.0372v196.1547l-112.5531,19.8432v-212.8263c.8132-19.5992-14.3131-35.6201-33.2617-36.5147-19.1113-.8946-35.7015,13.7438-36.6774,33.3431v228.3592l-112.4718,19.7619v-217.5431c-1.3012-19.5179-17.8101-33.5057-36.4334-32.6925-18.7046.8132-33.7497,16.3462-33.5057,35.7828v226.8954l-112.3092,19.7619v-251.862c1.1385-37.2466,16.3462-72.3788,42.0448-98.728,45.6231-46.5989,116.6194-57.9031,174.2784-27.0811,1.7891.9759,3.8223.5693,4.8795-.6506,60.0988-65.4662,163.2183-63.3518,220.7147,4.1476,1.3825,1.6265,2.765,3.253,4.0662,4.9608,19.5992,25.1293,30.7407,56.1139,31.2286,88.8877Z"/></svg>',
  };

  function iconForUrl(url: string): string {
    if (url.includes("linkedin.com")) return CONNECT_ICONS.linkedin;
    if (url.includes("x.com")) return CONNECT_ICONS["x.com"];
    if (url.includes("bsky.app") || url.includes("wsocial.eu")) return CONNECT_ICONS.bsky;
    if (url.includes("mu.social")) return CONNECT_ICONS.mu;
    if (url.includes("sayit.archive") || url.includes("archive.tw")) {
      return CONNECT_ICONS.sayit;
    }
    if (url.startsWith("mailto:")) return CONNECT_ICONS.email;
    return "";
  }

  // Parse connect links from both en and zh
  function parseConnectLinks(body: string): { text: string; url: string }[] {
    const links: { text: string; url: string }[] = [];
    for (const line of body.split("\n")) {
      const linkMatch = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        links.push({ text: linkMatch[1], url: linkMatch[2] });
      } else {
        const emailMatch = line.match(/^-\s*(?:Email|電子郵件):\s*(.+)/);
        if (emailMatch) {
          links.push({
            text: line.match(/^-\s*(.+?):/)?.[1] ?? "Email",
            url: `mailto:${emailMatch[1].trim()}`,
          });
        }
      }
    }
    return links;
  }

  // Parse connect note (paragraph after list)
  function parseConnectNote(body: string): string {
    const paras = body.split("\n\n");
    for (const p of paras) {
      if (!p.trim().startsWith("-") && p.trim() && !p.trim().startsWith("#")) {
        return p.trim();
      }
    }
    return "";
  }

  const enLinks = parseConnectLinks(enP.body);
  const zhLinks = parseConnectLinks(zhP.body);

  lines.push(`${I}<div class="connect-grid">`);

  for (let i = 0; i < enLinks.length; i++) {
    const link = enLinks[i];
    const zhLink = zhLinks[i];
    const icon = iconForUrl(link.url);
    const href = link.url.replace(/&/g, "&amp;");
    const rel = link.url.startsWith("mailto:") ? "" : ' rel="me noopener noreferrer"';
    const target = link.url.startsWith("mailto:") ? "" : ' target="_blank"';

    // Check if en and zh texts differ
    const enText = link.text;
    const zhText = zhLink?.text ?? link.text;
    const isBilingual = enText !== zhText;

    lines.push(
      `${I}    <a href="${href}" class="connect-link"${target}${rel}>`,
    );
    lines.push(`${I}        ${icon}`);
    if (isBilingual) {
      lines.push(
        `${I}        <span lang="en-GB">${entEn(enText)}</span><span lang="zh-TW">${entZh(zhText)}</span>`,
      );
    } else {
      lines.push(`${I}        ${entEn(enText)}`);
    }
    lines.push(`${I}    </a>`);
  }

  lines.push(`${I}</div>`);

  // Connect note
  const enNote = parseConnectNote(enP.body);
  const zhNote = parseConnectNote(zhP.body);
  if (enNote) {
    lines.push(
      `${I}<p class="connect-note" lang="en-GB">${mdInline(enNote, entEn)}</p>`,
    );
  }
  if (zhNote) {
    lines.push(
      `${I}<p class="connect-note" lang="zh-TW">${mdInline(zhNote, entZh)}</p>`,
    );
  }

  return lines.join("\n");
}

function renderFooter(): string {
  const lines: string[] = [];
  const I = "    "; // 4 spaces

  const enText = en.FOOTER.trim();
  const zhText = zh.FOOTER.trim();

  lines.push(
    `${I}<p lang="en-GB">${applyNowrap(mdInline(enText, entEn))}</p>`,
  );
  lines.push(
    `${I}<p lang="zh-TW">${applyNowrap(mdInline(zhText, entZh))}</p>`,
  );

  return lines.join("\n");
}

// ─── Resolve content markers ────────────────────────────────────────

const contentMap: Record<string, () => string> = {
  HERO: renderHero,
  BIO: renderBio,
  DIALOGUE: renderDialogue,
  RECOGNITION: renderRecognition,
  PULLQUOTE: renderPullquote,
  CIVIC_AI: renderCivicAI,
  FILM_HEADER: renderFilmHeader,
  FILM_QUOTES: renderFilmQuotes,
  ESSAYS: renderEssays,
  PUBLICATIONS: renderPublications,
  BACKGROUND: renderBackground,
  CONNECT: renderConnect,
  FOOTER: renderFooter,
};

html = html.replace(/\{\{content:([^}]+)\}\}/g, (_, name) => {
  const renderer = contentMap[name];
  if (!renderer) {
    console.error(`weave: unknown content marker {{content:${name}}}`);
    process.exit(1);
  }
  return renderer();
});

// Section eyebrow glyph: inject the shared favicon mark before every label.
// One <symbol id="o-mark"> (defined in the template) is reused via <use>; it carries
// the favicon's cracked-ring arc distilled to crack + glint — the full mark (inner
// orbit + planet) muds to a blob at ~15px, so we keep only the signature opening.
html = html.replace(
  /(<div class="section-label"[^>]*>)/g,
  '$1<svg class="o-glyph" viewBox="0 0 32 32" aria-hidden="true"><use href="#o-mark"/></svg>',
);

// ─── Resolve inclusion markers (unchanged from original) ────────────

let iansuiMeta: IansuiFontMeta | null = null;
async function getIansuiMeta(): Promise<IansuiFontMeta> {
  if (!iansuiMeta) iansuiMeta = await loadIansuiMeta();
  return iansuiMeta;
}

// {{style:NAME}} → content of src/styles/NAME.css
html = await replaceAsync(html, /\{\{style:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`styles/${name}.css`);
  return content.trimEnd();
});

// {{script:NAME}} → content of src/scripts/NAME.js
html = await replaceAsync(
  html,
  /\{\{script:([^}]+)\}\}/g,
  async (_, name) => {
    const content = await readSrc(`scripts/${name}.js`);
    return content.trimEnd();
  },
);

// {{json-ld:NAME}} → content of src/scripts/NAME.json
html = await replaceAsync(
  html,
  /\{\{json-ld:([^}]+)\}\}/g,
  async (_, name) => {
    const content = await readSrc(`scripts/${name}.json`);
    return content.trimEnd();
  },
);

// {{font:NAME}} → raw base64 from src/fonts/NAME.woff2.b64
html = await replaceAsync(html, /\{\{font:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`fonts/${name}.woff2.b64`);
  return content.trim();
});

// {{svg:NAME}} → content of src/svg/NAME.svg
html = await replaceAsync(html, /\{\{svg:([^}]+)\}\}/g, async (_, name) => {
  const content = await readSrc(`svg/${name}.svg`);
  return content.trimEnd();
});

html = substituteIansuiPlaceholders(html, await getIansuiMeta());

// ─── CSP hash update ─────────────────────────────────────────────────

function computeHashes(tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(
      `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`,
    );
  }
  return out;
}

const scriptHashes = computeHashes("script").join(" ");
const styleHashes = computeHashes("style").join(" ");

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

const cspMatch = html.match(/(content=")(default-src[^"]+)(")/);
if (!cspMatch) {
  console.error("weave: CSP meta tag not found in template");
  process.exit(1);
}
let newCsp = replaceDirective(cspMatch[2], "script-src", scriptHashes);
newCsp = replaceDirective(newCsp, "style-src", styleHashes);
html = html.replace(cspMatch[0], cspMatch[1] + newCsp + cspMatch[3]);
html = html.replace(/font-src[^;]*/i, "font-src 'self'");

if (glyphOut) {
  await Bun.write(glyphOut, html);
  console.log(`weave: glyph source → ${glyphOut}`);
}

if (!skipFontCheck) {
  await assertIansuiManifestMatchesHtml(html);
}

if (checkFontsOnly) {
  console.log("weave: --check-fonts ok");
  process.exit(0);
}

// ─── Write output ────────────────────────────────────────────────────

await Bun.write(OUTPUT, html);

const lineCount = html.split("\n").length;
const byteCount = new TextEncoder().encode(html).length;
console.log(
  `weave: ${OUTPUT}  ${lineCount} lines  ${(byteCount / 1024).toFixed(0)} KB`,
);

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
