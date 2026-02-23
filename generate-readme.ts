#!/usr/bin/env bun
/**
 * generate-readme.ts — Generates README.md and README.zh-TW.md from index.html
 * Zero dependencies. Run: bun generate-readme.ts
 */

const html = await Bun.file("index.html").text();

// ─── Helpers ─────────────────────────────────────────────────────────

/** Decode HTML entities to Unicode */
function ent(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&mdash;/g, "\u2014").replace(/&ndash;/g, "\u2013")
    .replace(/&ldquo;/g, "\u201C").replace(/&rdquo;/g, "\u201D")
    .replace(/&lsquo;/g, "\u2018").replace(/&rsquo;/g, "\u2019")
    .replace(/&middot;/g, "\u00B7").replace(/&rarr;/g, "\u2192")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&ccedil;/g, "\u00E7").replace(/&eacute;/g, "\u00E9")
    .replace(/&egrave;/g, "\u00E8").replace(/&nbsp;/g, " ");
}

/** Convert an inner-HTML fragment to Markdown */
function md(s: string): string {
  s = s
    .replace(/<span[^>]*>/g, "").replace(/<\/span>/g, "")
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)")
    .replace(/<em>([\s\S]*?)<\/em>/g, "*$1*")
    .replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "");
  return ent(s).replace(/\s+/g, " ").trim();
}

/** Extract inner HTML of all `<tag ... lang="L">...</tag>` in a section */
function byLang(sec: string, L: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?=[^>]*\\blang="${L}")[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  for (let m; (m = re.exec(sec));) out.push(m[1]);
  return out;
}

function first(sec: string, L: string, tag: string): string {
  return byLang(sec, L, tag)[0] ?? "";
}

// ─── Split HTML by section comment markers ───────────────────────────

const S: Record<string, string> = {};
{
  const re = /<!-- ═+ (\w[\w\s]*?) ═+ -->/g;
  const marks: [string, number][] = [];
  for (let m; (m = re.exec(html));) marks.push([m[1], m.index]);
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1][1] : html.length;
    S[marks[i][0]] = html.slice(marks[i][1], end);
  }
}

// ─── Section formatters ──────────────────────────────────────────────

function fmtHero(L: string): string {
  const s = S["HERO"];
  const name = md(first(s, L, "h1"));
  const label = md(first(s, L, "div"));
  const quote = md(first(s, L, "blockquote"));
  const subtitle = md(first(s, L, "p"));
  return `# ${name}\n\n**${label}**\n\n> ${quote}\n\n${subtitle}\n`;
}

function fmtBio(L: string): string {
  const s = S["BIO"];
  const isEn = L === "en-GB";
  const out: string[] = [];

  // Section labels (About, Roles)
  const labels = byLang(s, L, "div")
    .map(d => d.trim())
    .filter(d => d.length < 50 && !d.includes("<"));

  // About paragraphs
  out.push(`## ${labels[0] ?? "About"}`, "");
  for (const p of byLang(s, L, "p")) out.push(md(p), "");

  // Roles table
  out.push(`## ${labels[1] ?? "Roles"}`, "");
  const rolesHtml = first(s, L, "ul");
  const roles: [string, string][] = [];
  for (const m of rolesHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
    const title = m[1].match(/class="role-title">(.*?)<\/span>/)?.[1] ?? "";
    const org = m[1].match(/class="role-org">(.*?)<\/span>/)?.[1] ?? "";
    roles.push([ent(title.trim()), ent(org.trim())]);
  }
  out.push(`| ${isEn ? "Role" : "職稱"} | ${isEn ? "Organisation" : "機構"} |`);
  out.push("|------|-------------|");
  for (const [t, o] of roles) out.push(`| ${t} | ${o} |`);
  out.push("");

  return out.join("\n");
}

function fmtDialogue(L: string): string {
  const s = S["IN DIALOGUE"];
  const isEn = L === "en-GB";
  const out: string[] = [];

  // Section heading
  const label = md(first(s, L, "div"));
  const h2 = md(first(s, L, "h2"));
  out.push(`## ${label}: ${h2}`, "");

  // Extract each dialogue-card <a> block
  const cardRe = /<a\s[^>]*class="dialogue-card"[^>]*>([\s\S]*?)<\/a>/g;
  const hrefRe = /href="([^"]*)"/;
  const langRe = /\blang="([^"]*)"/;

  for (const cm of s.matchAll(cardRe)) {
    const card = cm[0];
    const href = card.match(hrefRe)?.[1] ?? "";

    // Determine card language: explicit lang on <a>, or from children
    const cardLang = card.match(/^<a[^>]*\blang="([^"]*)"/)
      ?.[1];

    // If card has explicit lang that doesn't match, skip it
    if (cardLang && cardLang !== L) continue;

    // Extract content — children may or may not have lang attrs
    const body = card.match(/class="dialogue-body">([\s\S]*?)<\/div>\s*<\/a>/)?.[1] ?? card;

    let meta: string, title: string, desc: string;

    if (cardLang) {
      // Mono-lingual card: children don't have lang attrs
      meta = md(body.match(/class="meta">([\s\S]*?)<\/div>/)?.[1] ?? "");
      title = md(body.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? "");
      desc = md(body.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? "");
    } else {
      // Bilingual card: children have lang attrs
      meta = md(first(body, L, "div"));
      title = md(first(body, L, "h3"));
      desc = md(first(body, L, "p"));
    }

    if (!title) continue;
    out.push(`[${title}](${ent(href)}) \u2014 ${meta}`);
    out.push(`${desc}`, "");
  }

  return out.join("\n");
}

function fmtRecognition(L: string): string {
  const s = S["RECOGNITION"];
  const out: string[] = [];

  out.push(`## ${md(first(s, L, "div"))}`, "");

  // Award cards
  const cardRe = /<a\s[^>]*class="award-card"[^>]*>([\s\S]*?)<\/a>/g;
  for (const cm of s.matchAll(cardRe)) {
    const card = cm[0];
    const href = card.match(/href="([^"]*)"/)?.[1] ?? "";
    const year = card.match(/<time[^>]*>(\d+)<\/time>/)?.[1] ?? "";
    const name = md(card.match(new RegExp(`class="award-name"[^>]*lang="${L}"[^>]*>([\\s\\S]*?)</div>`))?.[1] ?? "");
    const desc = md(card.match(new RegExp(`class="award-desc"[^>]*lang="${L}"[^>]*>([\\s\\S]*?)</div>`))?.[1] ?? "");
    if (!name) continue;
    out.push(`### ${year} \u2014 [${name}](${href})`, "");
    out.push(desc, "");
  }

  return out.join("\n");
}

function fmtPullquote(L: string): string {
  const s = S["PULLQUOTE"];
  const quote = md(first(s, L, "blockquote"));
  const cite = md(first(s, L, "cite"));
  return `> ${quote}\n> \u2014 ${cite}\n`;
}

function fmtCivicAI(L: string): string {
  const s = S["CIVIC AI"];
  const out: string[] = [];

  // Section label → h2 heading, h2 → h3
  const label = md(first(s, L, "div"));
  const h2 = md(first(s, L, "h2"));
  out.push(`## ${label}`, "");
  out.push(`### ${h2}`, "");

  // Intro paragraphs (before the work-grid)
  const introEnd = s.indexOf('class="work-grid"');
  const intro = introEnd > 0 ? s.slice(0, introEnd) : s;
  for (const p of byLang(intro, L, "p")) out.push(md(p), "");

  // 6-pack items — work-items contain only h3/p (no nested divs)
  for (const m of s.matchAll(/<div class="work-item">([\s\S]*?)<\/div>/g)) {
    const item = m[1];
    const h3 = md(first(item, L, "h3"));
    const p = md(first(item, L, "p"));
    if (!h3) continue;
    out.push(`**${h3}** \u2014 ${p}`, "");
  }

  // Case study — use index-based slicing to handle nested divs
  const csStart = s.indexOf('class="case-study"');
  const csEnd = s.indexOf('class="work-item work-item--spaced"');
  const csBlock = csStart >= 0 ? s.slice(csStart, csEnd > csStart ? csEnd : undefined) : "";
  if (csBlock) {
    const csLabels = byLang(csBlock, L, "div").map(d => d.trim()).filter(d => d.length < 100 && !d.includes("<"));
    const csH3 = md(first(csBlock, L, "h3"));
    out.push(`#### ${csLabels[0] ? md(csLabels[0]) + ": " : ""}${csH3}`, "");
    for (const p of byLang(csBlock, L, "p")) out.push(md(p), "");
  }

  // Link to 6pack.care — extract from the work-item--spaced div
  const linkArea = s.slice(s.indexOf("work-item--spaced"));
  const linkMatch = linkArea.match(new RegExp(`<a[^>]*lang="${L}"[^>]*>([\\s\\S]*?)</a>`));
  if (linkMatch) {
    const linkText = md(linkMatch[1]);
    if (linkText) out.push(linkText, "");
  }

  return out.join("\n");
}

function fmtFilm(L: string): string {
  const s = S["FILM"];
  const out: string[] = [];

  const label = md(first(s, L, "div"));  // "Short Film · Directed by Cynthia Wade"
  const h2 = md(first(s, L, "h2"));      // "Good Enough Ancestor"
  out.push(`## ${h2}`, "");

  // Subtitle (description) — get the film-subtitle paragraph
  const subtitle = md(first(s, L, "p"));
  out.push(`${label}. ${subtitle}`, "");

  // Quote — match full <blockquote> elements with film-quote class
  for (const q of s.matchAll(/<blockquote\s[^>]*class="film-quote"[^>]*lang="([^"]*)"[^>]*>([\s\S]*?)<\/blockquote>/g)) {
    if (q[1] !== L) continue;
    const inner = q[2];
    // Text before <cite>
    const text = md(inner.match(/([\s\S]*?)<cite>/)?.[1] ?? inner);
    const cite = md(inner.match(/<cite>([\s\S]*?)<\/cite>/)?.[1] ?? "");
    if (text) out.push(`> ${text}`, "");
    if (cite) out.push(cite, "");
  }

  return out.join("\n");
}

function fmtPublications(L: string): string {
  const s = S["PUBLICATIONS"];
  const isEn = L === "en-GB";
  const out: string[] = [];

  out.push(`## ${md(first(s, L, "div"))}`, "");
  out.push(`| ${isEn ? "Title" : "標題"} | ${isEn ? "Co-authors" : "共同作者"} | ${isEn ? "Venue" : "刊物"} | ${isEn ? "Year" : "年份"} |`);
  out.push("|-------|------------|-------|------|");

  for (const li of s.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
    const item = li[1];
    const venue = md(item.match(/class="pub-venue">([\s\S]*?)<\/span>/)?.[1] ?? "");
    const year = item.match(/<time[^>]*>(\d+)<\/time>/)?.[1] ?? "";
    // Title is an <a> inside pub-title
    const titleHtml = item.match(/class="pub-title">([\s\S]*?)<\/div>/)?.[1] ?? "";
    const title = md(titleHtml);
    const coauthors = md(item.match(/class="pub-coauthors">([\s\S]*?)<\/div>/)?.[1] ?? "");
    out.push(`| ${title} | ${coauthors} | ${venue} | ${year} |`);
  }
  out.push("");

  return out.join("\n");
}

function fmtBackground(L: string): string {
  const s = S["BACKGROUND"];
  const out: string[] = [];

  const label = md(first(s, L, "div"));
  const h2 = md(first(s, L, "h2"));
  out.push(`## ${label}: ${h2}`, "");

  for (const p of byLang(s, L, "p")) out.push(md(p), "");

  return out.join("\n");
}

function fmtConnect(L: string): string {
  const s = S["CONNECT"];
  const isEn = L === "en-GB";
  const out: string[] = [];

  out.push(`## ${md(first(s, L, "h2"))}`, "");

  // Extract connect links
  for (const a of s.matchAll(/<a\s[^>]*class="connect-link"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = a[0].match(/href="([^"]*)"/)?.[1] ?? "";
    const inner = a[1];
    // Get text, preferring lang-specific span if present
    let text: string;
    const langSpan = inner.match(new RegExp(`<span[^>]*lang="${L}"[^>]*>(.*?)</span>`));
    if (langSpan) {
      text = md(langSpan[1]);
    } else {
      // Plain text (strip SVGs and tags)
      text = md(inner.replace(/<svg[\s\S]*?<\/svg>/g, ""));
    }
    if (!text) continue;
    if (href.startsWith("mailto:")) {
      out.push(`- ${text}: ${href.replace("mailto:", "")}`);
    } else {
      out.push(`- [${text}](${href})`);
    }
  }
  out.push("");

  // Speaking note
  const note = md(first(s, L, "p"));
  if (note) out.push(`${note}`, "");

  return out.join("\n");
}

function fmtFooter(L: string): string {
  const s = S["FOOTER"];
  const p = md(first(s, L, "p"));
  return `---\n\n${p}\n`;
}

// ─── Assemble ────────────────────────────────────────────────────────

function buildReadme(L: string): string {
  const parts = [
    fmtHero(L),
    "---",
    fmtBio(L),
    "---",
    fmtDialogue(L),
    "---",
    fmtRecognition(L),
    fmtPullquote(L),
    "---",
    fmtCivicAI(L),
    "---",
    fmtFilm(L),
    "---",
    fmtPublications(L),
    "---",
    fmtBackground(L),
    "---",
    fmtConnect(L),
    fmtFooter(L),
  ];

  return parts.join("\n\n")
    .replace(/\n{3,}/g, "\n\n")  // collapse triple+ newlines
    .trimEnd() + "\n";
}

const readmeEn = buildReadme("en-GB");
const readmeZh = buildReadme("zh-TW");

await Bun.write("README.md", readmeEn);
await Bun.write("README.zh-TW.md", readmeZh);

console.log(`README.md        ${readmeEn.split("\n").length} lines`);
console.log(`README.zh-TW.md  ${readmeZh.split("\n").length} lines`);
