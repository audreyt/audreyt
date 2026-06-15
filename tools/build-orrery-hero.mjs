// Generates src/svg/orrery-hero.svg — an "orrery of democracy".
// Geometry + class names ONLY; every colour comes from src/styles/orrery.css.
// Run: bun tools/build-orrery-hero.mjs   (deterministic; seeded RNG)
import { writeFileSync } from "node:fs";

const cx = 410, cy = 456, R = 362;
const pol = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

// The civic ring is cracked open upper-right — the same opening as favicon.svg
// ("that's how the light gets in"): a gap centred at -45° (1:30 o'clock), and a
// bright glint riding the outer ring inside the crack. crackMid/crackHalf match
// the favicon's -68°..-22° span. The whole .o-civic group rotates, so the crack
// + glint sweep the outer ring; at rotation 0 the frame matches the favicon.
const crackMid = -45, crackHalf = 23;            // degrees (favicon: -68°..-22°)
const d2r = (d) => (d * Math.PI) / 180;
const inCrack = (aRad) => {
  const d = (((aRad * 180) / Math.PI) % 360 + 540) % 360 - 180; // → (-180, 180]
  return d > crackMid - crackHalf && d < crackMid + crackHalf;
};

// seeded RNG (mulberry32) so node jitter is identical every run
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let ticks = "";
for (let i = 0; i < 60; i++) {
  const a = (2 * Math.PI * i) / 60;
  if (inCrack(a)) continue;                        // clean break across the crack
  const [x1, y1] = pol(R, a);
  const [x2, y2] = pol(R - (i % 5 === 0 ? 11 : 6), a);
  ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
}

const rand = rng(7);
let nodes = "";
for (let i = 0; i < 40; i++) {
  const a = (2 * Math.PI * i) / 40 + (rand() - 0.5) * 0.024;
  const [x, y] = pol(R, a);
  const r = (1.6 + rand() * 1.5).toFixed(2);       // advance RNG before the skip → survivors unchanged
  if (inCrack(a)) continue;                         // people part at the opening
  nodes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`;
}

let rad = "";
for (let i = 0; i < 12; i++) {
  const a = (2 * Math.PI * i) / 12;
  const [x1, y1] = pol(132, a);
  const [x2, y2] = pol(R - 2, a);
  rad += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
}

const capR = R + 18;
const [ax1, ay1] = pol(capR, Math.PI * 0.74);
const [ax2, ay2] = pol(capR, Math.PI * 0.26);
const capPath = `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} A ${capR} ${capR} 0 0 1 ${ax2.toFixed(1)} ${ay2.toFixed(1)}`;

// cracked civic ring: the drawn arc runs the long way (large-arc, sweep 1) from the
// crack's +edge round to its -edge, leaving the gap upper-right — exactly as favicon.svg.
const [rsx, rsy] = pol(R, d2r(crackMid + crackHalf));   // -22° edge → arc start
const [rex, rey] = pol(R, d2r(crackMid - crackHalf));   // -68° edge → arc end
const ringPath = `M ${rsx.toFixed(1)} ${rsy.toFixed(1)} A ${R} ${R} 0 1 1 ${rex.toFixed(1)} ${rey.toFixed(1)}`;
const [glx, gly] = pol(R, d2r(crackMid));               // the glint: on the outer ring, in the crack

const svg = `<svg class="orrery-svg" viewBox="0 0 1440 913" preserveAspectRatio="xMidYMid slice"
     fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="orrery-halo" cx="${cx}" cy="${cy}" r="360" gradientUnits="userSpaceOnUse">
      <stop class="o-halo-0" offset="0"/><stop class="o-halo-1" offset="0.55"/><stop class="o-halo-2" offset="1"/>
    </radialGradient>
    <path id="orrery-cap" d="${capPath}"/>
  </defs>
  <circle class="o-boundary" cx="${cx}" cy="${cy}" r="206"/>
  <g class="o-graticule">${rad}</g>
  <g class="o-civic">
    <path class="o-civic-ring" d="${ringPath}"/>
    <g class="o-ticks">${ticks}</g>
    <g class="o-people">${nodes}</g>
    <circle class="o-civic-glint-halo" cx="${glx.toFixed(1)}" cy="${gly.toFixed(1)}" r="14"/>
    <circle class="o-civic-glint" cx="${glx.toFixed(1)}" cy="${gly.toFixed(1)}" r="5.5"/>
  </g>
  <rect class="o-halo" x="0" y="0" width="1440" height="913" fill="url(#orrery-halo)"/>
  <g class="o-ai">
    <circle class="o-ai-ring" cx="${cx}" cy="${cy}" r="120"/>
    <circle class="o-ai-disc" cx="${cx}" cy="${cy}" r="120"/>
    <circle class="o-ai-planet" cx="${cx}" cy="${cy - 120}" r="6"/>
    <circle class="o-ai-halo" cx="${cx}" cy="${cy - 120}" r="13"/>
  </g>
  <circle class="o-centre" cx="${cx}" cy="${cy}" r="2.6"/>
  <text class="o-caption" aria-hidden="true"><textPath href="#orrery-cap" startOffset="50%" text-anchor="middle" aria-hidden="true">AI · IN · THE · LOOP · OF · HUMANITY</textPath></text>
</svg>
`;
writeFileSync(new URL("../src/svg/orrery-hero.svg", import.meta.url), svg);
console.log("wrote src/svg/orrery-hero.svg", svg.length, "bytes");
