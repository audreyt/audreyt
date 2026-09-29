/* motes.js — the air of the room.

   Glow-sprite particles for the always-dark islands, in the idiom of the
   screening room at audreyt.box: the same light ramp — sea teal, steel, cream, gold,
   ember, rose — and the same soft sprites with a bright core.

     [data-motes="air"]   dust drifting in the dark (hero, press band, footer)
     [data-motes="beam"]  the same dust, caught in a projector's light (film band)
     [data-motes="geo"]   the geothermal interlude: two plates of light creeping
                          together, and at the seam the pressure rising as embers
                          — "the crashing plates turned into positive energy"

   Canvas 2D, no dependencies. A canvas is added only once it has a context,
   and the mount gets `.is-live` so CSS may retire any fallback it covers. Each
   mount draws only while on screen and the tab is visible; under reduced
   motion it draws one still frame (and redraws it on resize). */

(function () {
    'use strict';

    var mounts = document.querySelectorAll('[data-motes]');
    if (!mounts.length || !window.requestAnimationFrame) return;

    var TAU = Math.PI * 2;
    var mqMotion = matchMedia('(prefers-reduced-motion: reduce)');
    var SMALL = matchMedia('(max-width: 768px)');

    /* ── sprites: one ramp, 24 steps, each a soft disc with a white-hot core ── */
    var RAMP = [[0, 88, 196, 212], [0.2, 150, 180, 196], [0.45, 250, 240, 222], [0.7, 214, 178, 104], [0.86, 238, 150, 92], [1, 232, 116, 112]];
    var SPR = [];
    (function () {
        for (var q = 0; q < 24; q++) {
            var u = q / 23, c = RAMP[RAMP.length - 1];
            for (var m = 1; m < RAMP.length; m++) if (u <= RAMP[m][0]) {
                var A = RAMP[m - 1], B = RAMP[m], f = (u - A[0]) / (B[0] - A[0]);
                c = [0, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f, A[3] + (B[3] - A[3]) * f];
                break;
            }
            var rgb = Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + Math.round(c[3]);
            var s = document.createElement('canvas');
            s.width = s.height = 32;
            var g = s.getContext('2d');
            if (!g) return;
            var gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
            gr.addColorStop(0, 'rgba(255,252,245,1)');
            gr.addColorStop(0.16, 'rgba(' + rgb + ',0.9)');
            gr.addColorStop(0.42, 'rgba(' + rgb + ',0.2)');
            gr.addColorStop(1, 'rgba(' + rgb + ',0)');
            g.fillStyle = gr;
            g.fillRect(0, 0, 32, 32);
            SPR.push(s);
        }
    })();
    if (SPR.length < 24) return;
    function spr(u) { return SPR[Math.max(0, Math.min(23, Math.round(u * 23)))]; }

    /* deterministic, so every visit sees the same sky */
    function rng(seed) {
        return function () {
            seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function smooth(a, b, x) { var t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }

    /* ── air and beam: dust in the dark room ──
       Each mote has a depth: nearer motes are larger, brighter and faster, and
       slide a little more against the scroll. In a beam, motes inside the cone
       of light from the top centre catch it and glow; outside it they almost vanish. */
    function dust(kind, W, H, seed) {
        var r = rng(seed), beam = kind === 'beam';
        var n = Math.round(Math.min(beam ? 190 : 120, W * H / (beam ? 5200 : 9000)) * (SMALL.matches ? 0.6 : 1));
        var X = new Float32Array(n), Y = new Float32Array(n), D = new Float32Array(n), PH = new Float32Array(n), U = new Float32Array(n);
        for (var i = 0; i < n; i++) {
            X[i] = r(); Y[i] = r(); D[i] = 0.2 + 0.8 * r(); PH[i] = r() * TAU;
            var c = r();
            U[i] = c < 0.72 ? 0.3 + 0.12 * r() : c < 0.9 ? 0.62 + 0.1 * r() : 0.05 + 0.1 * r();
        }
        return function draw(ctx, t, scroll) {
            for (var i = 0; i < n; i++) {
                var d = D[i];
                var x = (((X[i] + t * 0.0045 * d + 0.012 * Math.sin(t * 0.21 + PH[i])) % 1) + 1) % 1 * W;
                var y = (((Y[i] - scroll * 0.06 * d - t * (beam ? 0.0016 : 0.001) * d + 0.01 * Math.cos(t * 0.17 + PH[i])) % 1) + 1) % 1 * H;
                var tw = 0.62 + 0.38 * Math.sin(t * (0.5 + d) + PH[i] * 3);
                var a = (0.05 + 0.26 * d) * tw, s = 1.3 + 3.8 * d;
                if (beam) {
                    /* the cone: apex above the band, spreading ±26° */
                    var dx = x - W / 2, dy = y + H * 0.18, ang = Math.abs(Math.atan2(dx, dy));
                    var lit = 1 - smooth(0.26, 0.46, ang);
                    a *= 0.4 + 3.4 * lit * (0.55 + 0.45 * smooth(0, H * 0.7, dy));
                    s *= 1 + 0.5 * lit;
                }
                if (a < 0.008) continue;
                ctx.globalAlpha = a > 1 ? 1 : a;
                ctx.drawImage(spr(U[i]), x - s / 2, y - s / 2, s, s);
            }
        };
    }

    /* ── geo: the geothermal interlude ──
       Two plates of light, each a slab of luminous strata, creep towards a
       seam. Squeezed there, their layers fold upward into a ridge (the way
       the Central Range was raised where two plates meet under Taiwan) and
       warm from steel to gold. At the crest the pressure leaves as embers,
       hot at first and cooling to cream as they rise towards the words. A
       particle that reaches the seam is reborn at the outer edge: nothing is
       lost; it changes state. */
    function geo(W, H, seed) {
        var r = rng(seed), small = SMALL.matches;
        var seam = W * 0.5, half = W * 0.5 + 16;
        var depth = Math.min(H * (small ? 0.22 : 0.27), 180), floor = H + 6, top = floor - depth;
        var lift = depth * (small ? 0.8 : 0.95), spread = W * (small ? 0.2 : 0.13);
        var LAYERS = small ? 5 : 7, per = Math.round(Math.min(small ? 90 : 210, W / (small ? 4.4 : 6.8)));
        var NP = LAYERS * per * 2, NE = small ? 120 : 240;
        var PX = new Float32Array(NP), PL = new Float32Array(NP), PS = new Float32Array(NP), PJ = new Float32Array(NP), PH = new Float32Array(NP);
        var EX = new Float32Array(NE), EV = new Float32Array(NE), EA = new Float32Array(NE), EP = new Float32Array(NE), EL = new Float32Array(NE);
        var i, k = 0;
        for (var side = 0; side < 2; side++) {
            for (var l = 0; l < LAYERS; l++) {
                for (var j = 0; j < per; j++, k++) {
                    PX[k] = (j + r()) / per;           /* 0 at the outer edge, 1 at the seam */
                    PL[k] = (l + 0.5 + (r() - 0.5) * 0.5) / LAYERS;
                    PS[k] = side ? 1 : -1;
                    PJ[k] = r();
                    PH[k] = r() * TAU;
                }
            }
        }
        /* where a particle a share p of the way in stands: squeezed towards the seam */
        function across(p) { return half * Math.pow(1 - p, 1.35); }
        function uplift(dx) { var q = dx / spread; return Math.exp(-q * q); }
        var crest = top - lift;
        function spawn(i, age) {
            var g = (r() + r() + r() - 1.5) / 1.5;
            EX[i] = seam + g * spread * 0.45;
            EV[i] = 0.6 + 0.8 * r();
            EP[i] = r() * TAU;
            EL[i] = 0.5 + 0.5 * r();
            EA[i] = age;
        }
        for (i = 0; i < NE; i++) spawn(i, r());
        var last = 0;
        return function draw(ctx, t, scroll, energy) {
            var dt = last ? Math.min(0.05, t - last) : 0;
            last = t;
            var creep = 0.0065 * (0.6 + 0.8 * energy);
            /* the heat, tight at the crest */
            var hr = spread * 1.3;
            var g = ctx.createRadialGradient(seam, crest + lift * 0.5, 0, seam, crest + lift * 0.5, hr);
            g.addColorStop(0, 'rgba(238,150,92,' + (0.16 + 0.1 * energy).toFixed(3) + ')');
            g.addColorStop(0.5, 'rgba(214,178,104,0.05)');
            g.addColorStop(1, 'rgba(214,178,104,0)');
            ctx.globalAlpha = 1;
            ctx.fillStyle = g;
            ctx.fillRect(seam - hr, crest + lift * 0.5 - hr, hr * 2, hr * 2);
            for (var k = 0; k < NP; k++) {
                var p = (PX[k] + t * creep * (0.85 + 0.3 * PJ[k])) % 1;
                var dx = PS[k] * across(p), x = seam + dx, L = PL[k], up = uplift(dx);
                /* each stratum folds upward at the seam, the upper ones most */
                var y = top + L * depth - up * lift * (1 - 0.55 * L) + Math.sin(PH[k] + t * 0.35 + p * 9) * 1.4;
                var heat = up * (1 - 0.6 * L);
                var edge = smooth(0, 0.05, p) * (1 - smooth(0.965, 1, p));
                var a = (0.34 + 0.5 * (1 - L)) * (0.72 + 0.28 * Math.sin(t * (0.7 + PJ[k]) + PH[k])) * edge * (0.8 + 0.7 * heat);
                if (a < 0.012) continue;
                var s = (small ? 2.1 : 2.4) + 2.6 * (1 - L) * PJ[k] + 2.4 * heat;
                ctx.globalAlpha = a > 1 ? 1 : a;
                ctx.drawImage(spr(0.16 + 0.1 * L + 0.66 * heat), x - s / 2, y - s / 2, s, s);
            }
            /* embers: hot at the crest, cooling to cream as they climb */
            var rate = 0.5 + 0.9 * energy, reach = crest * 0.7;
            for (var i = 0; i < NE; i++) {
                EA[i] += dt * 0.13 * EV[i] * rate;
                if (EA[i] >= 1) { spawn(i, EA[i] - 1); continue; }
                var h = EA[i], y0 = crest + lift * 0.18 * (1 - uplift(EX[i] - seam));
                var ex = EX[i] + Math.sin(EP[i] + t * 0.9 + h * 6) * (3 + 26 * h) + (EX[i] - seam) * h * 1.8;
                var ey = y0 - h * EL[i] * reach;
                var ea = smooth(0, 0.06, h) * (1 - smooth(0.3, 1, h)) * (0.6 + 0.4 * Math.sin(t * 4 + EP[i] * 7));
                if (ea < 0.012) continue;
                var es = (1.8 + 3.8 * (1 - h)) * (0.7 + 0.4 * EV[i]);
                ctx.globalAlpha = ea > 1 ? 1 : ea;
                ctx.drawImage(spr(1 - 0.58 * h), ex - es / 2, ey - es / 2, es, es);
            }
        };
    }

    /* ── mounts ── */
    [].forEach.call(mounts, function (host, idx) {
        var kind = host.getAttribute('data-motes') || 'air';
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;
        canvas.className = 'motes';
        canvas.setAttribute('aria-hidden', 'true');
        host.insertBefore(canvas, host.firstChild);
        host.classList.add('is-live');

        var W = 0, H = 0, dpr = 1, paint = null, raf = 0, visible = false, t0 = performance.now(), last = 0, energy = 0.5;
        function size() {
            var w = host.clientWidth, h = host.clientHeight;
            if (!w || !h || (w === W && h === H)) return false;
            W = w; H = h;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            paint = kind === 'geo' ? geo(W, H, 20251204 + idx) : dust(kind, W, H, 20240521 + idx * 7919);
            return true;
        }
        /* where the band sits in the window: 0 entering at the bottom, 1 leaving at the top */
        function progress() {
            var b = host.getBoundingClientRect(), vh = window.innerHeight || 1;
            return clamp((vh - b.top) / (vh + b.height));
        }
        function draw(now) {
            var p = progress();
            /* the geothermal energy peaks as the quote crosses the middle of the window */
            energy = 1 - Math.min(1, Math.abs(p - 0.5) * 2.2);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';
            paint(ctx, mqMotion.matches ? 24 : (now - t0) / 1000 + 24, p, energy);
            ctx.globalAlpha = 1;
        }
        function frame(now) {
            raf = 0;
            if (!visible || document.hidden || mqMotion.matches) return;
            /* everything here drifts slowly: ~30 fps is plenty, and halves the cost */
            if (now - last > 30) { last = now; draw(now); }
            raf = requestAnimationFrame(frame);
        }
        function start() {
            if (!paint) return;
            if (mqMotion.matches) { draw(performance.now()); return; }
            if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
        }
        size();
        if ('ResizeObserver' in window) new ResizeObserver(function () { if (size()) { last = 0; if (mqMotion.matches || !raf) draw(performance.now()); } }).observe(host);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                visible = es[0].isIntersecting;
                if (visible) start();
            }, { rootMargin: '60px 0px' }).observe(host);
        } else { visible = true; start(); }
        document.addEventListener('visibilitychange', start);
        if (mqMotion.addEventListener) mqMotion.addEventListener('change', start);
        if (paint) draw(performance.now());
    });
})();
