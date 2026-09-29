/**
 * `vp dev` for audreyt.org — the dev server only; the site has no build step.
 *
 * index.html carries a strict hash-only CSP (woven by weave.ts). Vite's dev
 * client injects <style> elements of its own (HMR, the error overlay), and
 * that policy rightly refuses them (Firefox: "style-src-elem"). Rather than
 * weaken it, dev gets a nonce: Vite stamps it on the tags it injects
 * (`html.cspNonce`, which its client also reads back from
 * <meta property="csp-nonce">), and the plugin below adds the same nonce to
 * the page's script-src and style-src, in serve mode only. The files on disk
 * and in production are untouched. (`bun dev.ts` does the same job by adding
 * its reload script's hash instead.)
 */
const DEV_NONCE = "audreyt-dev";

export default {
    html: { cspNonce: DEV_NONCE },
    /* nothing to pre-bundle: the pages are hand-written and import no packages,
       and crawling ~180 static HTML files (decks included) only fails noisily */
    optimizeDeps: { noDiscovery: true },
    plugins: [
        {
            name: "audreyt:csp-dev-nonce",
            apply: "serve",
            transformIndexHtml(html: string) {
                return html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*"/, (meta) =>
                    meta.replace(/\b(script-src|style-src)\b/g, `$1 'nonce-${DEV_NONCE}'`),
                );
            },
        },
    ],
};
