#!/usr/bin/env bun
/**
 * dev.ts — local preview server with rebuild-on-change + browser live reload.
 *
 * Not part of the shipped build. Never touches CSP hashes, never writes
 * anything git doesn't already track (index.html, same as `bun weave.ts`).
 *
 * Usage:
 *   bun dev.ts                  # watch + serve on :4321, full weave (incl. font-manifest check)
 *   bun dev.ts --port=8080
 *   bun dev.ts --skip-font-check   # faster loop while actively editing zh/en copy;
 *                                  # NOTE: pre-commit runs the full check — a page that
 *                                  # only previews clean with this flag will still fail commit.
 *
 * Why not `bun --watch weave.ts`: weave.ts reads README*.md and every src/**
 * file via Bun.file(), not `import` — Bun's --watch only tracks the static
 * module graph, so it would silently miss edits to the one directory you
 * edit most. This watches the real input set explicitly instead.
 *
 * Why not just Bun.serve() alone: static serving doesn't rebuild index.html
 * or refresh the browser. Reload is a tiny SSE channel; the pushed script's
 * own SHA-256 is added to the CSP `script-src` on every response so the
 * strict CSP this site depends on is never weakened, dev or prod.
 */
import { watch } from "fs";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

const args = process.argv.slice(2);
const port = Number(args.find((a) => a.startsWith("--port="))?.slice(7)) || 4321;
const skipFontCheck = args.includes("--skip-font-check");

// ─── Rebuild ─────────────────────────────────────────────────────────

let building = false;
let rebuildQueued = false;

async function weave() {
  if (building) {
    rebuildQueued = true;
    return;
  }
  building = true;
  const start = performance.now();
  const proc = Bun.spawn(
    ["bun", "weave.ts", ...(skipFontCheck ? ["--skip-font-check"] : [])],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  const ms = (performance.now() - start).toFixed(0);
  if (code === 0) {
    console.log(`dev: ${out.trim()} (${ms}ms)`);
  } else {
    console.error(`dev: weave failed (${ms}ms)\n${err || out}`);
  }
  building = false;
  broadcastReload();
  if (rebuildQueued) {
    rebuildQueued = false;
    await weave();
  }
}

// ─── Watch real inputs (not the module graph) ───────────────────────

const WATCH_PATHS = ["src", "README.md", "README.zh-TW.md", "weave.ts", "tools"];
// Essays are hand-edited directly; they don't feed weave.ts, but a preview
// session editing one still wants the browser to refresh on save.
const RELOAD_ONLY_GLOBS = [
  "collaborative-immune-system.html",
  "good-enough-ancestor.html",
  "transparent-horse.html",
];

let debounceTimer: Timer | undefined;
function onSourceChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(weave, 100);
}

/** Best-effort recursive watch: native recursive mode where supported,
 *  else — for directories — enumerate subdirectories once at startup and
 *  watch each (new directories created after boot need a restart); for a
 *  bare file (README.md, weave.ts), just watch it directly. */
async function watchTree(root: string, cb: () => void) {
  const isDir = (await stat(root)).isDirectory();
  if (!isDir) {
    watch(root, cb);
    return;
  }
  try {
    watch(root, { recursive: true }, cb);
    return;
  } catch {
    // fall through to manual enumeration below
  }
  const dirs = [root];
  for (let i = 0; i < dirs.length; i++) {
    watch(dirs[i], cb);
    for (const entry of await readdir(dirs[i], { withFileTypes: true })) {
      if (entry.isDirectory()) dirs.push(join(dirs[i], entry.name));
    }
  }
}

for (const p of WATCH_PATHS) {
  await watchTree(p, onSourceChange);
}
for (const f of RELOAD_ONLY_GLOBS) {
  watch(f, () => {
    console.log(`dev: ${f} changed`);
    broadcastReload();
  });
}

// ─── Live reload channel (SSE) ───────────────────────────────────────

const RELOAD_SCRIPT = `new EventSource('/__dev-reload').onmessage=()=>location.reload();`;
const RELOAD_SCRIPT_HASH = createHash("sha256")
  .update(RELOAD_SCRIPT)
  .digest("base64");

let clientSeq = 0;
const reloadClients = new Map<number, ReadableStreamDefaultController>();

function broadcastReload() {
  const msg = new TextEncoder().encode(`data: reload\n\n`);
  for (const [id, c] of reloadClients) {
    try {
      c.enqueue(msg);
    } catch {
      reloadClients.delete(id);
    }
  }
}

// Bun.serve() idle-connection detection would otherwise close a silent SSE
// stream (no bytes sent between rebuilds); a periodic comment line keeps
// every connection visibly alive independent of the idleTimeout setting.
const HEARTBEAT = new TextEncoder().encode(`:\n\n`);
setInterval(() => {
  for (const [id, c] of reloadClients) {
    try {
      c.enqueue(HEARTBEAT);
    } catch {
      reloadClients.delete(id);
    }
  }
}, 8000);

function injectReloadIntoHtml(html: string): string {
  // Extend the existing CSP script-src with this dev-only script's hash,
  // rather than weakening it — the strict-CSP invariant holds in dev too.
  html = html.replace(
    /(script-src[^;]*)/,
    `$1 'sha256-${RELOAD_SCRIPT_HASH}'`,
  );
  html = html.replace(
    /<\/body>/,
    `<script>${RELOAD_SCRIPT}</script></body>`,
  );
  return html;
}

// ─── Static file server ──────────────────────────────────────────────

await weave(); // build once before first request

Bun.serve({
  port,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/__dev-reload") {
      // Disable Bun's default 10s idle-close for this one long-lived route
      // only — ordinary static requests keep the default timeout.
      server.timeout(req, 0);
      const id = clientSeq++;
      const stream = new ReadableStream({
        start(controller) {
          reloadClients.set(id, controller);
          // Enqueue immediately: Bun withholds response headers until the
          // first chunk is available, so an empty start() leaves fetch()
          // callers hanging until the first periodic heartbeat.
          controller.enqueue(HEARTBEAT);
        },
        cancel() {
          reloadClients.delete(id);
        },
      });
      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        },
      });
    }

    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    let file = Bun.file(`.${path}`);
    if (!(await file.exists()) && !path.includes(".")) {
      file = Bun.file(`.${path}.html`);
    }
    if (!(await file.exists())) {
      return new Response("404", { status: 404 });
    }

    if (path.endsWith(".html")) {
      const html = injectReloadIntoHtml(await file.text());
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response(file);
  },
});

console.log(`dev: serving http://localhost:${port}  (watching ${WATCH_PATHS.join(", ")})`);
