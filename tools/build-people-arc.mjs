// Generates src/svg/people-arc.svg — a wide shallow arc studded with ~42
// people-nodes (the human ring, unrolled). Geometry + classes only.
// Run: bun tools/build-people-arc.mjs   (deterministic; seeded RNG)
import { writeFileSync } from "node:fs";

const P0 = [70, 178], PC = [600, -86], P2 = [1130, 178];      // quad bezier control points
const bez = (t) => {
  const mt = 1 - t;
  return [
    mt * mt * P0[0] + 2 * mt * t * PC[0] + t * t * P2[0],
    mt * mt * P0[1] + 2 * mt * t * PC[1] + t * t * P2[1],
  ];
};
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(11);
const N = 42;
let nodes = "";
for (let i = 0; i < N; i++) {
  const [x, y] = bez(i / (N - 1));
  const yy = y + (rand() - 0.5) * 6;
  const r = (1.3 + rand() * 1.7).toFixed(2);
  nodes += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${r}"/>`;
}
const arc = `M ${P0[0]} ${P0[1]} Q ${PC[0]} ${PC[1]} ${P2[0]} ${P2[1]}`;
const svg = `<svg class="people-arc-svg" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none"><path class="pa-arc" d="${arc}"/><g class="pa-nodes">${nodes}</g></svg>
`;
writeFileSync(new URL("../src/svg/people-arc.svg", import.meta.url), svg);
console.log("wrote src/svg/people-arc.svg", svg.length, "bytes,", N, "nodes");
