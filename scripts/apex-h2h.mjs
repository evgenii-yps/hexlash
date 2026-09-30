// TZ_apex_gate_v1 п.3 — ПРЯМАЯ ВСТРЕЧА: вершина (5+2) против второго резонанса (3+3+1, 4+3), одно и то же ядро.
// Обе стороны — допустимые наборы по 7 кристаллов; стороны меняются по чётности зерна. 200 зёрен на пару.
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness, mean } from './lib/bout-harness.mjs';
const SEEDS = Number(process.env.SEEDS || 200);
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const B3 = ['a', 'b', 'c'];
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, c) => { const fs = []; for (const b of B3) for (let j = 1; j <= (c[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const perm = (xs) => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
const P3 = perm(B3);
const SETS = {
  '5+2': P3.map(([x, y]) => ({ [x]: 5, [y]: 2 })),
  '3+3+1': B3.map((z) => Object.fromEntries(B3.map((b) => [b, b === z ? 1 : 3]))),
  '4+3': P3.map(([x, y]) => ({ [x]: 4, [y]: 3 })),
};
const rows = [];
for (const core of CORE_IDS) {
  const beh = {}; for (const [k, list] of Object.entries(SETS)) beh[k] = list.map((c) => resolveBehavior(core, build(core, c)));
  for (const other of ['3+3+1', '4+3']) {
    const w = [];
    for (const A of beh['5+2']) for (const B of beh[other]) {
      for (let s = 1; s <= SEEDS; s++) { const r = duel({ seed: s, coreA: core, coreB: core, behA: A, behB: B, swap: s % 2 === 0 }); w.push(r.winner === 'player' ? 1 : r.winner === 'foe' ? 0 : 0.5); }
    }
    rows.push({ core, other, wr52: mean(w) * 100, n: w.length });
    process.stderr.write(`${core} 5+2 vs ${other}: ${(mean(w) * 100).toFixed(1)}\n`);
  }
}
const OUT = new URL('../docs/grani-tags/out/apex/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
writeFileSync(OUT + 'h2h.json', JSON.stringify(rows, null, 1));
await H.server.close();
