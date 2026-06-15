// Generates src/svg/orrery-footer.svg — a faint "hint" orrery that closes the
// page as a bookend to the hero instrument. Reuses the hero's o-* classes, so
// colour + the civic/graticule/AI spin are inherited from orrery.css. Concentric
// mechanism: dashed boundary, graticule spokes, a broken civic ring (glint at the
// crack) studded with people-nodes, and an inner AI ring with one planet.
// Centre (240,240) in a 480×480 viewBox. Geometry + classes only.
// Run: bun tools/build-footer-orrery.mjs
import { writeFileSync } from "node:fs";

const cx = 240, cy = 240, TAU = Math.PI * 2;
const f = (n) => Number(n.toFixed(1));
const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

const boundaryR = 140;

// 12 graticule spokes (inner hub → boundary)
let grat = "";
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * TAU;
  const [x1, y1] = pt(64, a), [x2, y2] = pt(boundaryR, a);
  grat += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
}

// Civic ring: broken at upper-right (echoes the favicon's cracked ring), r=185
const civicR = 185;
const gapC = -Math.PI / 4, gapHalf = (16 * Math.PI) / 180;
const [sx, sy] = pt(civicR, gapC + gapHalf);
const [ex, ey] = pt(civicR, gapC - gapHalf + TAU);
const civicArc = `<path class="o-civic-ring" d="M ${f(sx)} ${f(sy)} A ${civicR} ${civicR} 0 1 1 ${f(ex)} ${f(ey)}"/>`;

// People-nodes around the civic ring (skip the gap), gently varied radii
let people = "";
const N = 40;
for (let i = 0; i < N; i++) {
  const a = (i / N) * TAU - Math.PI / 2;
  const da = Math.atan2(Math.sin(a - gapC), Math.cos(a - gapC));
  if (Math.abs(da) < gapHalf * 1.25) continue; // leave the crack open
  const [x, y] = pt(civicR, a);
  const r = (1.3 + (((i * 37) % 11) / 11) * 1.7).toFixed(2);
  people += `<circle cx="${f(x)}" cy="${f(y)}" r="${r}"/>`;
}

// Glint riding the crack
const [gx, gy] = pt(civicR, gapC);

// Inner AI ring + one planet (rides the top)
const aiR = 82;
const [px, py] = pt(aiR, -Math.PI / 2);

const svg =
`<svg class="orrery-svg" viewBox="0 0 480 480" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true" focusable="false">
  <circle class="o-boundary" cx="${cx}" cy="${cy}" r="${boundaryR}"/>
  <g class="o-graticule">${grat}</g>
  <g class="o-civic">
    ${civicArc}
    <g class="o-people">${people}</g>
    <circle class="o-civic-glint-halo" cx="${f(gx)}" cy="${f(gy)}" r="11"/>
    <circle class="o-civic-glint" cx="${f(gx)}" cy="${f(gy)}" r="4.2"/>
  </g>
  <g class="o-ai">
    <circle class="o-ai-ring" cx="${cx}" cy="${cy}" r="${aiR}"/>
    <circle class="o-ai-disc" cx="${cx}" cy="${cy}" r="${aiR}"/>
    <circle class="o-ai-planet" cx="${f(px)}" cy="${f(py)}" r="4.6"/>
    <circle class="o-ai-halo" cx="${f(px)}" cy="${f(py)}" r="10"/>
  </g>
  <circle class="o-centre" cx="${cx}" cy="${cy}" r="2.6"/>
</svg>
`;

writeFileSync(new URL("../src/svg/orrery-footer.svg", import.meta.url), svg);
console.log("wrote src/svg/orrery-footer.svg", svg.length, "bytes");
