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

  const absoluteMatch = text.match(/\bhttps?:\/\/(?:www\.)?civic\.[^\s<)\]]+/i);
  if (absoluteMatch) {
    return { label: text, href: absoluteMatch[0] };
  }

  const bareDomainMatch = text.match(
    /\b(civic\.[a-z0-9.-]+(?:\/[^\s<)\]]*)?)\b/i,
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

    return { name, quoteLines, subtitleLines };
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
    let trailingLink = "";
    let trailingHref = "";

    for (const p of paras) {
      const boldMatch = p.match(/^\*\*([^*]+)\*\*\s*\u2014\s*(.+)$/s);
      const trailing = parseCivicTrailingLink(p);
      if (boldMatch) {
        workItems.push({ name: boldMatch[1], desc: boldMatch[2] });
      } else if (trailing) {
        trailingLink = trailing.label;
        trailingHref = trailing.href;
      } else if (workItems.length === 0 && !trailingLink) {
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
          trailingLink = trailing.label;
          trailingHref = trailing.href;
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
      trailingLink,
      trailingHref,
    };
  }

  const enC = parseCivicBody(enP.body);
  const zhC = parseCivicBody(zhP.body);

  // Intro paragraphs
  for (const p of enC.introParagraphs)
    lines.push(`${I}<p lang="en-GB">${mdInline(p, entEn)}</p>`);
  for (const p of zhC.introParagraphs)
    lines.push(`${I}<p lang="zh-TW">${mdInline(p, entZh)}</p>`);

  // Work grid
  lines.push(`${I}<div class="work-grid">`);
  for (let i = 0; i < enC.workItems.length; i++) {
    const w = enC.workItems[i];
    const wz = zhC.workItems[i];
    lines.push(`${I}    <div class="work-item">`);
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

  // Trailing link
  if (enC.trailingLink || zhC.trailingLink) {
    const enHref = enC.trailingHref || zhC.trailingHref;
    const zhHref = zhC.trailingHref || enC.trailingHref;

    lines.push(`${I}<div class="work-item work-item--spaced">`);
    if (enC.trailingLink && enHref) {
      lines.push(
        `${I}    <a href="${escapeAttr(enHref)}" class="work-link" lang="en-GB">${entEn(enC.trailingLink)}</a>`,
      );
    }
    if (zhC.trailingLink && zhHref) {
      lines.push(
        `${I}    <a href="${escapeAttr(zhHref)}" class="work-link" lang="zh-TW">${entZh(zhC.trailingLink)}</a>`,
      );
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
    bsky: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>',
    sayit: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12.04 3.08H7.29C4.33 3.08 1.74 5.77 1.74 9.04v.03c0 2.73 1.8 5.12 4.6 5.72v2.47c0 .68.82.99 1.32.52l2.92-2.89h1.46c3.04 0 5.49-2.74 5.49-5.81v-.09c0-3.02-2.32-5.91-5.49-5.91zM6.58 11.11c.89-.41 1.37-1.05 1.41-1.97-.88.08-1.4-.55-1.4-1.2 0-.71.54-1.28 1.2-1.28.94 0 1.46.68 1.46 1.89v.14c0 1.46-.77 2.59-2.15 3.22l-.52-.8zM10.22 11.11c.89-.41 1.35-1.05 1.38-1.97-.85.08-1.35-.55-1.35-1.2 0-.71.5-1.28 1.2-1.28.94 0 1.41.71 1.41 1.89v.14c0 1.43-.77 2.59-2.12 3.22l-.52-.8z"/><path opacity=".6" d="M18.56 9.6c-.25 3.37-2.8 6.49-6.82 6.49h-.85l-.07.07c.79 1.38 1.94 2.25 3.82 2.25h.84l2.12 2.15c.47.48 1.16.07 1.01-.6v-1.58c1.94-.45 3.53-2.31 3.53-4.39 0-2.08-1.34-3.85-3.58-4.39z"/></svg>',
    email: '<svg class="connect-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  };

  function iconForUrl(url: string): string {
    if (url.includes("linkedin.com")) return CONNECT_ICONS.linkedin;
    if (url.includes("x.com")) return CONNECT_ICONS["x.com"];
    if (url.includes("bsky.app")) return CONNECT_ICONS.bsky;
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

// ─── Resolve inclusion markers (unchanged from original) ────────────

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
