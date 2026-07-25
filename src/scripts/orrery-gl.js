/* orrery-gl.js — the instrument, rendered.

   A dependency-free WebGL2 point-sprite orrery. Two mounts, one engine:

     [data-orrery="hero"]  light on ink    — additive blend, brass + steel
     [data-orrery="care"]  ink on paper    — premultiplied over, the care cycle

   Every particle is one orbit: (radius, phase, angular speed) plus the two
   basis vectors of its plane. The vertex shader integrates the orbit, so a
   whole frame is a single draw call and nothing is touched on the CPU but
   six uniforms. Colour is never hard-coded — it is read out of the CSS custom
   properties on the mount, so scheme flips and token edits carry through.

   The SVG under each mount is the no-JS / no-WebGL / print fallback. Only once
   a context is live do we add `.is-live` and let CSS retire the strata the GPU
   has taken over. `prefers-reduced-motion` draws exactly one still frame and
   never starts a rAF loop. */

(function () {
    'use strict';

    var mounts = document.querySelectorAll('[data-orrery]');
    if (!mounts.length) return;

    var TAU = Math.PI * 2;
    var D2R = Math.PI / 180;
    var FOV = 34 * D2R;
    var STRIDE = 18;                       // floats per particle

    var mqMotion = matchMedia('(prefers-reduced-motion: reduce)');
    var mqDark = matchMedia('(prefers-color-scheme: dark)');

    /* ── colour: resolve any CSS colour expression (var, color-mix) to sRGB ── */

    var probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
    var swatch = document.createElement('canvas');
    swatch.width = swatch.height = 1;
    var sctx = swatch.getContext('2d', { willReadFrequently: true });

    function hue(host, expr, fallback) {
        try {
            probe.style.color = '';
            probe.style.color = expr;
            host.appendChild(probe);
            var resolved = getComputedStyle(probe).color;
            probe.remove();
            sctx.fillStyle = '#000';
            sctx.fillStyle = resolved;
            sctx.fillRect(0, 0, 1, 1);
            var d = sctx.getImageData(0, 0, 1, 1).data;
            return [d[0] / 255, d[1] / 255, d[2] / 255];
        } catch (e) {
            probe.remove();
            return fallback || [1, 1, 1];
        }
    }

    /* ── maths ───────────────────────────────────────────────────────────── */

    function perspective(out, fovY, aspect, near, far) {
        var f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    }

    /* view = translate(0,0,-dist) · rotX(rx) · rotY(ry), column-major */
    function viewMatrix(out, dist, rx, ry) {
        var cx = Math.cos(rx), sx = Math.sin(rx);
        var cy = Math.cos(ry), sy = Math.sin(ry);
        out[0] = cy;       out[1] = sx * sy;  out[2] = -cx * sy; out[3] = 0;
        out[4] = 0;        out[5] = cx;       out[6] = sx;       out[7] = 0;
        out[8] = sy;       out[9] = -sx * cy; out[10] = cx * cy; out[11] = 0;
        out[12] = 0;       out[13] = 0;       out[14] = -dist;   out[15] = 1;
    }

    function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
    function rotZ(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; }

    /* A ring plane. Screen-space convention matches the SVGs: theta 0 points
       right and grows clockwise, so v is -Y. `tilt` leans the plane away from
       the camera, `swing` rotates that lean around the view axis. */
    function plane(tilt, swing, squash) {
        var u = rotX(rotZ([1, 0, 0], swing), tilt);
        var v = rotX(rotZ([0, -1, 0], swing), tilt);
        if (squash !== undefined) { u[2] *= squash; v[2] *= squash; }
        return { u: u, v: v };
    }

    var FLAT = plane(0, 0);

    /* mulberry32 — the instrument is identical on every load, like the SVGs */
    function rng(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* ── particle pen ────────────────────────────────────────────────────── */

    function Pen() { this.d = []; this.n = 0; }

    Pen.prototype.dot = function (radius, theta, o) {
        var pl = o.plane || FLAT;
        this.d.push(
            radius, theta, o.spin || 0, o.pulse || 0,
            pl.u[0], pl.u[1], pl.u[2],
            pl.v[0], pl.v[1], pl.v[2],
            o.color[0], o.color[1], o.color[2],
            o.size, o.alpha, o.seed || 0, o.flare || 0,
            o.group || 0
        );
        this.n++;
    };

    /* ── shaders ─────────────────────────────────────────────────────────── */

    var VERT = [
        '#version 300 es',
        'precision highp float;',
        'in vec4 a_orbit;',            // radius, theta0, spin, pulse-gain
        'in vec3 a_u;',
        'in vec3 a_v;',
        'in vec3 a_color;',
        'in vec4 a_style;',            // size, alpha, seed, flare
        'in float a_group;',
        'uniform mat4 u_mv;',
        'uniform mat4 u_proj;',
        'uniform vec2 u_offset;',
        'uniform vec2 u_dcue;',        // reference depth, gain
        'uniform vec3 u_spark;',       // colour the travelling light drives toward
        'uniform float u_time;',
        'uniform float u_flow;',       // head of the travelling light, radians
        'uniform float u_px;',
        'uniform float u_tail;',
        'uniform float u_master;',
        'uniform float u_maxpt;',
        'uniform float u_group[8];',
        'out vec3 v_color;',
        'out float v_alpha;',
        'out float v_flare;',
        'const float TAU = 6.283185307179586;',
        'void main() {',
        /* group 7 rides the travelling light instead of its own clock, so the
           head of the comet is a real bead on the ring, not a shader gradient */
        '  float th = a_orbit.y + (a_group > 6.5 ? u_flow : a_orbit.z * u_time);',
        '  vec3 p = a_orbit.x * (cos(th) * a_u + sin(th) * a_v);',
        '  vec4 mv = u_mv * vec4(p, 1.0);',
        '  vec4 clip = u_proj * mv;',
        '  clip.xy += u_offset * clip.w;',
        '  gl_Position = clip;',
        '  float depth = max(-mv.z, 0.001);',
        '  float g = u_group[int(a_group)];',
        '  float d = mod(u_flow - th, TAU);',
        '  float pulse = exp(-d * u_tail) * a_orbit.w;',
        '  float tw = 0.88 + 0.12 * sin(u_time * 0.8 + a_style.z * TAU);',
        '  float dc = clamp(1.0 + (u_dcue.x - depth) * u_dcue.y, 0.40, 1.75);',
        '  float want = a_style.x * u_px * (1.0 + pulse * 0.5) / depth;',
        '  float got = clamp(want, 1.0, u_maxpt);',
        '  gl_PointSize = got;',
        /* drivers cap point size (63px on some mobile GL ES). When a halo is
           clamped, put the lost area back as density so the glow keeps its
           weight instead of silently thinning out. */
        '  float comp = clamp((want / got) * (want / got), 1.0, 3.5);',
        '  v_alpha = clamp(a_style.y * g * tw * dc * u_master * comp * (1.0 + pulse * 1.15), 0.0, 1.0);',
        '  v_color = mix(a_color, u_spark, clamp(pulse * 0.9, 0.0, 0.72));',
        '  v_flare = a_style.w + pulse * 1.1;',
        '}'
    ].join('\n');

    var FRAG = [
        '#version 300 es',
        'precision mediump float;',
        'in vec3 v_color;',
        'in float v_alpha;',
        'in float v_flare;',
        'out vec4 frag;',
        'void main() {',
        '  vec2 q = gl_PointCoord * 2.0 - 1.0;',
        '  float r2 = dot(q, q);',
        '  if (r2 >= 1.0) discard;',
        '  float core = pow(1.0 - r2, 1.6);',
        '  float halo = (1.0 - sqrt(r2)) * 0.34;',
        '  float a = clamp((core * (1.0 + v_flare * 1.7) + halo) * v_alpha, 0.0, 1.0);',
        '  frag = vec4(v_color * a, a);',   // premultiplied; suits both blend modes
        '}'
    ].join('\n');

    function compile(gl, type, src) {
        var sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
        return sh;
    }

    /* ── the instruments ─────────────────────────────────────────────────── */

    /* An orrery of democracy: a flat cracked great circle (the brand mark, kept
       circular so the favicon still reads), two armillary bands leaning away
       from the viewer, a tilted AI orbit whose planet genuinely passes behind
       the plane, and a shell of cool dust for the space it hangs in.

       The footer runs the same instrument in its own, smaller viewBox at three
       quarters density — a closing bookend, not a second event. */
    function heroSpec(mount, footer) {
        var CRACK_MID = -45 * D2R, CRACK_HALF = 23 * D2R;
        var CIVIC = 0.01745;                                  // one turn / 360s
        var D = footer ? 0.75 : 1;                            // density
        var n = function (c) { return Math.max(1, Math.round(c * D)); };
        return {
            viewBox: footer ? [480, 480] : [1440, 913],
            centre: footer ? [240, 240] : [410, 456],
            /* 410 === centre[0]: the civic ring is inscribed to the left edge of
               the design frame so its arc can never reach the fixed 80px lockup
               gutter. Must stay in step with R in tools/build-orrery-hero.mjs. */
            unit: footer ? 185 : 410,
            preserve: footer ? 'meet' : 'slice',
            blend: 'add', dcue: 0.16, tail: 1.5, spin: 0.235, master: 1,
            parallax: footer ? [0.03, 0.02] : [0.085, 0.055],
            palette: function (m) {
                return {
                    ring:   hue(m, 'var(--orrery-bright)', [0.79, 0.66, 0.38]),
                    people: hue(m, 'color-mix(in srgb, var(--orrery-bright) 62%, #ffffff)', [0.9, 0.83, 0.68]),
                    dust:   hue(m, 'color-mix(in srgb, var(--orrery-bright) 30%, #7d93ab)', [0.55, 0.6, 0.66]),
                    ai:     hue(m, '#4bc3d4', [0.29, 0.76, 0.83]),
                    spark:  [1, 1, 1]
                };
            },
            build: function (pen, C) {
                var rnd = rng(7), i, th, a, r, k;
                /* two uniforms summed → a soft bell, so bands are dense at the
                   centre line and feather at the edges instead of ending flat */
                function bell() { return (rnd() + rnd() - 1); }

                /* crack: the ring is open upper-right — that's how the light gets in */
                function crackFade(t) {
                    var d = Math.abs(((t - CRACK_MID + Math.PI) % TAU + TAU) % TAU - Math.PI);
                    return Math.min(1, Math.max(0, (d - CRACK_HALF * 0.66) / (CRACK_HALF * 0.5)));
                }

                /* dust shell — cool, slow, the space the instrument hangs in */
                var N = n(1150);
                for (i = 0; i < N; i++) {
                    r = 0.24 + Math.pow(rnd(), 0.62) * 2.05;
                    pen.dot(r, rnd() * TAU, {
                        plane: plane((rnd() - 0.5) * Math.PI, rnd() * TAU, 0.42),
                        spin: (rnd() - 0.5) * 0.012,
                        color: rnd() < 0.24 ? C.ring : C.dust,
                        size: 0.0030 + rnd() * 0.0068,
                        alpha: 0.06 + rnd() * 0.20,
                        seed: rnd(), group: 0
                    });
                }
                /* the civic great circle — a filament of light, not a bead string */
                N = n(1700);
                for (i = 0; i < N; i++) {
                    th = (i / N) * TAU - Math.PI + (rnd() - 0.5) * 0.005;
                    a = crackFade(th); if (a < 0.02) continue;
                    pen.dot(1 + bell() * 0.0032, th, {
                        spin: CIVIC, pulse: 1, color: C.ring,
                        size: 0.0042 + rnd() * 0.0032, alpha: (0.15 + rnd() * 0.17) * a,
                        seed: rnd(), group: 1
                    });
                }
                /* graduated rim: 60 radial ticks, every fifth one long */
                for (i = 0; i < 60; i++) {
                    th = -Math.PI + (i / 60) * TAU;
                    a = crackFade(th); if (a < 0.02) continue;
                    var major = i % 5 === 0;
                    for (k = 0; k < (major ? 5 : 3); k++) {
                        pen.dot(0.951 + k * (major ? 0.0105 : 0.0088), th, {
                            spin: CIVIC, pulse: 1, color: C.ring,
                            size: major ? 0.0072 : 0.0052,
                            alpha: (major ? 0.46 : 0.24) * a,
                            seed: rnd(), group: 1
                        });
                    }
                }
                /* the forty, standing on the ring */
                for (i = 0; i < 40; i++) {
                    th = -Math.PI + ((i + 0.5) / 40) * TAU + (rnd() - 0.5) * 0.055;
                    a = crackFade(th); if (a < 0.04) continue;
                    pen.dot(1 + bell() * 0.016, th, {
                        spin: CIVIC, pulse: 1.25, color: C.people,
                        size: 0.0140 + rnd() * 0.0130, alpha: (0.58 + rnd() * 0.36) * a,
                        seed: rnd(), flare: 0.35, group: 2
                    });
                }
                /* the glint riding the crack */
                pen.dot(1, CRACK_MID, { spin: CIVIC, color: [1, 1, 1], size: 0.044, alpha: 1, flare: 1.6, group: 2 });
                pen.dot(1, CRACK_MID, { spin: CIVIC, color: C.people, size: 0.098, alpha: 0.26, group: 2 });
                pen.dot(1, CRACK_MID, { spin: CIVIC, color: C.ring, size: 0.195, alpha: 0.10, group: 2 });

                /* armillary bands — where the flat mark becomes an instrument */
                var bands = [
                    { r: 0.862, tilt: 74 * D2R, swing: 0, n: n(420), spin: -0.0255, a: 0.19 },
                    { r: 0.742, tilt: 67 * D2R, swing: 63 * D2R, n: n(360), spin: 0.0195, a: 0.15 }
                ];
                for (var b = 0; b < bands.length; b++) {
                    var B = bands[b], pl = plane(B.tilt, B.swing);
                    for (i = 0; i < B.n; i++) {
                        pen.dot(B.r + bell() * 0.010, (i / B.n) * TAU, {
                            plane: pl, spin: B.spin, color: rnd() < 0.3 ? C.dust : C.ring,
                            size: 0.0042 + rnd() * 0.0040, alpha: B.a * (0.5 + rnd() * 0.8),
                            seed: rnd(), group: 3
                        });
                    }
                }

                /* the bounded horizon — dashed, flat, patient */
                N = n(260);
                for (i = 0; i < N; i++) {
                    if (i % 5 > 2) continue;
                    pen.dot(0.569 + bell() * 0.004, (i / N) * TAU, {
                        spin: 0.0082, color: C.ring, size: 0.0046 + rnd() * 0.002,
                        alpha: 0.20 + rnd() * 0.1, seed: rnd(), group: 4
                    });
                }
                /* the AI orbit: tilted, so the planet swings in front of and
                   behind the civic plane once every 48 seconds */
                var aiPlane = plane(64 * D2R, 17 * D2R);
                N = n(300);
                for (i = 0; i < N; i++) {
                    pen.dot(0.331 + bell() * 0.005, (i / N) * TAU, {
                        plane: aiPlane, spin: 0.1309, color: C.ai,
                        size: 0.0042 + rnd() * 0.0030, alpha: 0.34 + rnd() * 0.24,
                        seed: rnd(), group: 5
                    });
                }
                pen.dot(0.331, -Math.PI / 2, { plane: aiPlane, spin: 0.1309, color: C.ai, size: 0.050, alpha: 1, flare: 1.5, group: 6 });
                pen.dot(0.331, -Math.PI / 2, { plane: aiPlane, spin: 0.1309, color: C.ai, size: 0.150, alpha: 0.26, group: 6 });

                pen.dot(0, 0, { color: C.people, size: 0.022, alpha: 1, flare: 0.9, group: 6 });
                pen.dot(0, 0, { color: C.ring, size: 0.105, alpha: 0.15, group: 6 });
            }
        };
    }

    /* The 6-Pack of Care, read as an instrument. The four arcs stay flat and
       registered with their chips — this is a diagram before it is a picture —
       but they are drawn as bands of light with the cycle running through them,
       so the loop visibly turns. Groups 0-3 are the arcs, 4 the solidarity
       field, 5 its rim, 6 the centre. */
    function careSpec(mount) {
        var ARCS = [[-128, -52], [-38, 38], [52, 128], [142, 218]];
        return {
            viewBox: [620, 620], centre: [310, 310], unit: 292, preserve: 'meet',
            blend: 'over', dcue: 0.1, tail: 2.0, spin: 0.52, master: 1,
            parallax: [0.05, 0.035], arcs: ARCS,
            palette: function (m) {
                return {
                    p1: hue(m, 'var(--care-p1)', [0.49, 0.39, 0.19]),
                    p2: hue(m, 'var(--care-p2)', [0.79, 0.66, 0.38]),
                    p3: hue(m, 'var(--care-p3)', [0.16, 0.5, 0.54]),
                    p4: hue(m, 'var(--care-p4)', [0.2, 0.4, 0.44]),
                    p5: hue(m, 'var(--care-p5)', [0.4, 0.55, 0.5]),
                    p6: hue(m, 'var(--care-p6)', [0.79, 0.66, 0.38]),
                    spark: hue(m, 'var(--care-spark)', [0.1, 0.15, 0.2])
                };
            },
            build: function (pen, C) {
                var rnd = rng(19), i, j, t, th;
                function bell() { return (rnd() + rnd() + rnd() - 1.5) * 0.667; }

                /* Four arcs of the cycle. The SVG draws them as 12px strokes;
                   here each is a bell-weighted band of motes of the same weight,
                   so the stroke has grain and the cycle can run through it. */
                for (j = 0; j < 4; j++) {
                    var a0 = ARCS[j][0] * D2R, a1 = ARCS[j][1] * D2R;
                    var col = C['p' + (j + 1)];
                    for (i = 0; i < 780; i++) {
                        t = i / 779;
                        var edge = Math.min(1, Math.min(t, 1 - t) / 0.045);   // rounded caps
                        th = a0 + (a1 - a0) * t + (rnd() - 0.5) * 0.010;
                        pen.dot(0.808 + bell() * 0.024, th, {
                            spin: 0, pulse: 1, color: col,
                            size: 0.012 + rnd() * 0.014,
                            alpha: (0.30 + rnd() * 0.30) * edge,
                            seed: rnd(), group: j
                        });
                    }
                }

                /* The solidarity field. Big soft motes at low alpha make a wash;
                   a scatter of small sharp grains keeps it from reading as noise.
                   Weighted toward the centre so it thins out before the rim. */
                for (i = 0; i < 420; i++) {
                    pen.dot(0.56 * Math.pow(rnd(), 0.62), rnd() * TAU, {
                        plane: plane((rnd() - 0.5) * 1.15, rnd() * TAU, 0.45),
                        spin: -0.030 - rnd() * 0.035, color: C.p5,
                        size: 0.017 + rnd() * 0.034, alpha: 0.07 + rnd() * 0.13,
                        seed: rnd(), group: 4
                    });
                }
                for (i = 0; i < 95; i++) {
                    pen.dot(0.55 * Math.pow(rnd(), 0.5), rnd() * TAU, {
                        plane: plane((rnd() - 0.5) * 1.15, rnd() * TAU, 0.45),
                        spin: -0.030 - rnd() * 0.04, color: C.p5,
                        size: 0.008 + rnd() * 0.009, alpha: 0.40 + rnd() * 0.38,
                        seed: rnd(), flare: 0.4, group: 4
                    });
                }
                for (i = 0; i < 224; i++) {
                    if (i % 4 > 1) continue;
                    pen.dot(0.589 + bell() * 0.004, (i / 224) * TAU, {
                        spin: -0.018, color: C.p5, size: 0.010 + rnd() * 0.005,
                        alpha: 0.55 + rnd() * 0.28, seed: rnd(), group: 5
                    });
                }

                /* the centre it all answers to */
                pen.dot(0, 0, { color: C.p6, size: 0.030, alpha: 1, flare: 0.9, group: 6 });
                pen.dot(0, 0, { color: C.p6, size: 0.100, alpha: 0.16, group: 6 });

                /* the head of the cycle — a bead that actually rides the loop
                   (group 7 takes its angle from u_flow), with a short comb of
                   sparks dragging behind it */
                pen.dot(0.808, 0, { color: C.spark, size: 0.019, alpha: 1, flare: 1.9, group: 7 });
                pen.dot(0.808, 0, { color: C.p6, size: 0.056, alpha: 0.30, group: 7 });
                pen.dot(0.808, 0, { color: C.p6, size: 0.140, alpha: 0.085, group: 7 });
                for (i = 1; i <= 5; i++) {
                    pen.dot(0.808 + bell() * 0.010, -i * 0.030, {
                        color: C.spark, size: 0.0135 - i * 0.0013,
                        alpha: 0.44 - i * 0.070, seed: rnd(), flare: 0.6, group: 7
                    });
                }
            }
        };
    }

    /* ── instrument runtime ──────────────────────────────────────────────── */

    function Instrument(mount, spec) {
        var canvas = document.createElement('canvas');
        canvas.className = 'orrery-gl';
        canvas.setAttribute('aria-hidden', 'true');

        var gl = canvas.getContext('webgl2', {
            alpha: true, antialias: false, depth: false, stencil: false,
            premultipliedAlpha: true, powerPreference: 'low-power', desynchronized: true
        });
        if (!gl) return null;

        var vs = compile(gl, gl.VERTEX_SHADER, VERT);
        var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return null;
        var prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
        gl.useProgram(prog);

        var U = {};
        ['u_mv', 'u_proj', 'u_offset', 'u_dcue', 'u_spark', 'u_time', 'u_flow',
         'u_px', 'u_tail', 'u_master', 'u_maxpt'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
        U.u_group = gl.getUniformLocation(prog, 'u_group[0]');
        var ptRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        var maxPt = Math.max(16, Math.min(ptRange && ptRange[1] ? ptRange[1] : 255, 255));

        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        var LAYOUT = [['a_orbit', 4, 0], ['a_u', 3, 4], ['a_v', 3, 7],
                      ['a_color', 3, 10], ['a_style', 4, 13], ['a_group', 1, 17]];
        LAYOUT.forEach(function (f) {
            var loc = gl.getAttribLocation(prog, f[0]);
            if (loc < 0) return;
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, f[1], gl.FLOAT, false, STRIDE * 4, f[2] * 4);
        });

        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        if (spec.blend === 'add') gl.blendFunc(gl.ONE, gl.ONE);
        else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        var count = 0, spark = [1, 1, 1];
        function upload() {
            var C = spec.palette(mount);
            spark = C.spark || [1, 1, 1];
            var pen = new Pen();
            spec.build(pen, C);
            count = pen.n;
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pen.d), gl.STATIC_DRAW);
        }
        upload();

        var proj = new Float32Array(16), mv = new Float32Array(16);
        var groups = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]);
        var target = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]);
        var dist = 4, pxScale = 1, off = [0, 0], dcue = [4, spec.dcue];
        var wantX = 0, wantY = 0, haveX = 0, haveY = 0;
        var flow = 0, park = null, master = 0;

        function layout() {
            var w = mount.clientWidth, h = mount.clientHeight;
            if (!w || !h) return false;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));
            if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
            gl.viewport(0, 0, bw, bh);
            var vb = spec.viewBox;
            var s = spec.preserve === 'slice'
                ? Math.max(w / vb[0], h / vb[1])
                : Math.min(w / vb[0], h / vb[1]);
            var cx = spec.centre[0] * s + (w - vb[0] * s) / 2;
            var cy = spec.centre[1] * s + (h - vb[1] * s) / 2;
            var R = spec.unit * s;
            var f = 1 / Math.tan(FOV / 2);
            dist = f * h / (2 * R);
            perspective(proj, FOV, w / h, 0.05, 60);
            off[0] = (2 * cx / w) - 1;
            off[1] = 1 - (2 * cy / h);
            pxScale = f * bh / 2;
            dcue[0] = dist;
            return true;
        }

        var arcNow = -2;

        function draw(t, dt) {
            if (!count) return;
            /* pointer parallax, critically damped */
            var k = 1 - Math.exp(-dt * 3.2);
            haveX += (wantX - haveX) * k;
            haveY += (wantY - haveY) * k;

            /* the travelling light */
            if (park === null) {
                flow += dt * spec.spin;
            } else {
                var delta = ((park - flow) % TAU + TAU) % TAU;
                if (delta > Math.PI * 1.5) delta -= TAU;          // nearest way round
                flow += delta * (1 - Math.exp(-dt * 3.4));
            }
            flow = ((flow % TAU) + TAU) % TAU;

            /* narrate the loop: tell the page which arc the head is on */
            if (spec.arcs && api.onArc) {
                var deg = flow * 180 / Math.PI;
                if (deg > 180) deg -= 360;
                var hit = -1;
                for (var q = 0; q < 4; q++) {
                    var lo = spec.arcs[q][0], hi = spec.arcs[q][1];
                    var v = deg; if (v < lo - 180) v += 360;
                    if (v >= lo && v <= hi) { hit = q; break; }
                }
                if (hit !== arcNow) { arcNow = hit; api.onArc(hit); }
            }

            for (var i = 0; i < 8; i++) groups[i] += (target[i] - groups[i]) * (1 - Math.exp(-dt * 5));
            master += (1 - master) * (1 - Math.exp(-dt * 1.1));

            viewMatrix(mv, dist, -haveY * spec.parallax[1], haveX * spec.parallax[0]);
            gl.useProgram(prog);
            gl.bindVertexArray(vao);
            gl.uniformMatrix4fv(U.u_proj, false, proj);
            gl.uniformMatrix4fv(U.u_mv, false, mv);
            gl.uniform2fv(U.u_offset, off);
            gl.uniform2fv(U.u_dcue, dcue);
            gl.uniform3fv(U.u_spark, spark);
            gl.uniform1f(U.u_time, t);
            gl.uniform1f(U.u_flow, flow);
            gl.uniform1f(U.u_px, pxScale);
            gl.uniform1f(U.u_tail, spec.tail);
            gl.uniform1f(U.u_master, spec.master * master);
            gl.uniform1f(U.u_maxpt, maxPt);
            gl.uniform1fv(U.u_group, groups);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, count);
        }

        var api = {
            mount: mount, canvas: canvas, gl: gl, spec: spec,
            layout: layout, draw: draw, upload: upload,
            still: function () { master = 1; for (var i = 0; i < 8; i++) groups[i] = target[i]; },
            point: function (x, y) { wantX = x; wantY = y; },
            park: function (a) { park = a; },
            group: function (i, v) { target[i] = v; },
            lost: false
        };
        return api;
    }

    /* ── boot ────────────────────────────────────────────────────────────── */

    var live = [];

    mounts.forEach(function (mount) {
        var kind = mount.getAttribute('data-orrery');
        var spec = kind === 'hero' ? heroSpec(mount, false)
                 : kind === 'footer' ? heroSpec(mount, true)
                 : kind === 'care' ? careSpec(mount) : null;
        if (!spec) return;

        var inst;
        try { inst = Instrument(mount, spec); } catch (e) { inst = null; }
        if (!inst) return;

        mount.appendChild(inst.canvas);
        if (!inst.layout()) { inst.canvas.remove(); return; }
        mount.classList.add('is-live');
        inst.kind = kind;
        live.push(inst);

        /* A lost context invalidates every GL object we hold. Rebuilding is not
           worth it for a decorative layer — retire this instrument for good and
           give the SVG engraving back, which is exactly the no-WebGL path. */
        inst.canvas.addEventListener('webglcontextlost', function (e) {
            e.preventDefault();
            inst.lost = true;
            mount.classList.remove('is-live');
            inst.canvas.remove();
        });

        /* Resizing reallocates (and so clears) the backing store. With motion
           reduced there is no loop to repaint it, so draw the still frame here
           or the canvas is left blank while `.is-live` hides the SVG. */
        var relayout = function () {
            if (!inst.layout()) return;
            inst.dirty = true;
            if (mqMotion.matches) redrawStill(inst);
        };
        if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(mount);
        else addEventListener('resize', relayout, { passive: true });

        if (typeof IntersectionObserver === 'function') {
            new IntersectionObserver(function (es) { inst.onscreen = es[0].isIntersecting; },
                { rootMargin: '120px' }).observe(mount);
        } else { inst.onscreen = true; }

        wire(inst, kind, mount);
    });

    if (!live.length) return;

    /* A pose, not a frame: enough time on the clock that the travelling light
       has already arrived somewhere interesting. */
    function redrawStill(inst) {
        inst.still();
        inst.draw(6.5, 0);
    }

    /* colour tokens can flip under the user (scheme switch) — rebuild in place */
    function repalette() {
        live.forEach(function (i) {
            i.upload();
            i.dirty = true;
            if (mqMotion.matches) redrawStill(i);
        });
    }
    if (mqDark.addEventListener) mqDark.addEventListener('change', repalette);

    /* ── interaction wiring ──────────────────────────────────────────────── */

    function wire(inst, kind, mount) {
        if (kind === 'hero' || kind === 'footer') {
            var host = mount.parentNode;
            addEventListener('pointermove', function (e) {
                if (!inst.onscreen || e.pointerType === 'touch') return;
                var r = host.getBoundingClientRect();
                inst.point(
                    Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
                    Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
                );
            }, { passive: true });
            addEventListener('pointerleave', function () { inst.point(0, 0); }, { passive: true });
            return;
        }

        /* care: the chips park the cycle and bloom their own arc */
        var root = mount.closest('.care-map') || mount.parentNode;
        var arcCentre = [-90, 0, 90, 180];
        var pinned = -1, hovered = -1;

        function apply() {
            var n = hovered >= 0 ? hovered : pinned;
            for (var i = 0; i < 7; i++) inst.group(i, 1);
            if (n < 0) { inst.park(null); return; }
            if (n < 4) {
                for (var j = 0; j < 4; j++) inst.group(j, j === n ? 1.85 : 0.42);
                inst.group(4, 0.55); inst.group(5, 0.6);
                inst.park(arcCentre[n] * D2R);
            } else if (n === 4) {
                for (var q = 0; q < 4; q++) inst.group(q, 0.45);
                inst.group(4, 2.1); inst.group(5, 1.8);
                inst.park(null);
            } else {
                for (var s = 0; s < 5; s++) inst.group(s, 0.5);
                inst.group(5, 1.0); inst.group(6, 1.6);
                inst.park(null);
            }
        }

        root.querySelectorAll('.care-map-chip').forEach(function (chip) {
            var m = /#care-pack-(\d)/.exec(chip.getAttribute('href') || '');
            if (!m) return;
            var idx = +m[1] - 1;
            var on = function () { hovered = idx; apply(); };
            var off = function () { hovered = -1; apply(); };
            chip.addEventListener('pointerenter', on);
            chip.addEventListener('pointerleave', off);
            chip.addEventListener('focus', on);
            chip.addEventListener('blur', off);
        });

        /* the cards below the map hold the same six identities */
        root.parentNode.querySelectorAll('.work-grid > .work-item').forEach(function (item, i) {
            item.addEventListener('pointerenter', function () { hovered = i; apply(); });
            item.addEventListener('pointerleave', function () { hovered = -1; apply(); });
        });

        /* the diagram narrates itself: as the head enters an arc, its chip and
           the matching card index quietly take the light for a beat */
        var packs = [];
        for (var p = 1; p <= 4; p++) {
            packs.push(root.querySelector('.care-map-dial > .care-map-chip[href="#care-pack-' + p + '"]'));
        }
        var litItems = root.parentNode.querySelectorAll('.work-grid > .work-item');
        inst.onArc = function (n) {
            if (mqMotion.matches) n = -1;
            for (var i = 0; i < 4; i++) {
                if (packs[i]) packs[i].classList.toggle('is-lit', i === n);
                if (litItems[i]) litItems[i].classList.toggle('is-lit', i === n);
            }
        };

        function fromHash() {
            var m = /^#care-pack-(\d)$/.exec(location.hash);
            pinned = m ? +m[1] - 1 : -1;
            apply();
        }
        addEventListener('hashchange', fromHash);
        fromHash();
    }

    /* ── the loop ────────────────────────────────────────────────────────── */

    function still() {
        live.forEach(function (i) { i.layout(); redrawStill(i); });
    }

    var raf = 0, last = 0, t = 0;

    function frame(now) {
        raf = requestAnimationFrame(frame);
        var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
        last = now;
        t += dt;
        for (var i = 0; i < live.length; i++) {
            var inst = live[i];
            if (inst.lost) continue;
            if (!inst.onscreen && !inst.dirty) continue;
            inst.dirty = false;
            inst.draw(t, dt);
        }
    }

    function start() {
        if (raf || mqMotion.matches) return;
        last = 0;
        raf = requestAnimationFrame(frame);
    }
    function stop() {
        if (!raf) return;
        cancelAnimationFrame(raf);
        raf = 0;
    }

    if (mqMotion.matches) still(); else start();

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else if (!mqMotion.matches) start();
    });
    if (mqMotion.addEventListener) {
        mqMotion.addEventListener('change', function () {
            if (mqMotion.matches) { stop(); still(); } else start();
        });
    }
})();
