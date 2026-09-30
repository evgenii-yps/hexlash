// reflex-sight-controls.mjs — ТРИ КОНТРОЛЬНЫЕ МЕТРИКИ БОЯ (TZ_reflex_sees_character_v2) и винрейты, одним кодом до/после.
//   вне радиуса удара (≥1.45 ед. до врага), свободное время (нет клипа/блока/сбива/выдоха), длина боя (медиана / максимум / >100 с).
// Метрики считаются по тикам БОЙЦА-ИГРОКА (sideId 'player'), как в scripts/grani-recon.mjs.
//   MODE=mirror — каждое ядро против такого же голого ядра, SEEDS зёрен (стороны чередуются)
//   MODE=pairs  — 16 упорядоченных пар голых ядер
//   MODE=seven  — 21 набор из 7 кристаллов × 4 ядра против голого ядра (узоры 3+3+1, 4+3, 5+2, 5+1+1, 3+2+2)
//   MODE=wins   — круг 16 пар голых ядер: винрейт каждого ядра (по всем врагам, включая зеркало)
//   NOSWAP=1 — без чередования сторон (точки выхода как в игре; так снято «вне радиуса 25.07%»)
// ЗАПУСК: MODE=pairs SEEDS=200 LABEL=x node scripts/reflex-sight-controls.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness, quantile } from './lib/bout-harness.mjs';

const LABEL = process.env.LABEL || 'run';
const MODE = process.env.MODE || 'pairs';
const SEEDS = Number(process.env.SEEDS || 200);
const OUT = new URL('../docs/reflex-sight/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load, INSTANT_DT } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
if (process.env.BEND != null) { const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js'); if (COMBAT_BALANCE.hardNeed) COMBAT_BALANCE.hardNeed.bend = Number(process.env.BEND); }
const B3 = ['a', 'b', 'c'];
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, counts) => { const fs = []; for (const b of B3) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const perm = (xs) => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
const P3 = perm(B3);
const SEVEN = [
  ...B3.map((z) => Object.fromEntries(B3.map((b) => [b, b === z ? 1 : 3]))),
  ...P3.map(([x, y]) => ({ [x]: 4, [y]: 3 })), ...P3.map(([x, y]) => ({ [x]: 5, [y]: 2 })),
  ...B3.map((x) => Object.fromEntries(B3.map((b) => [b, b === x ? 5 : 1]))), ...B3.map((x) => Object.fromEntries(B3.map((b) => [b, b === x ? 3 : 2]))),
];
const mk = () => ({ n: 0, far: 0, free: 0, sp: 0, secs: [], capped: 0, wins: 0, bouts: 0 });
function fight(core, foe, behT, ctl, tag = '') {
  for (let s = 1; s <= SEEDS; s++) {
    let prev = null;
    const r = duel({ seed: s, coreA: core, coreB: foe, behA: behT, behB: null, swap: process.env.NOSWAP ? false : s % 2 === 0, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      const fo = alive.find((u) => u !== me); const pm = me.f.group.position;
      if (prev) ctl.sp += Math.hypot(pm.x - prev.x, pm.z - prev.z) / INSTANT_DT; prev = { x: pm.x, z: pm.z };
      ctl.n++;
      if (fo && Math.hypot(pm.x - fo.f.group.position.x, pm.z - fo.f.group.position.z) >= 1.45) ctl.far++;
      const f = me.f; if (!f.getClipInfo() && !f.isBlocking() && !f.isStaggered() && !f.isExhaling()) ctl.free++;
    } });
    if (process.env.LONG && r.sec > Number(process.env.LONG)) console.error(`долгий бой ${r.sec.toFixed(2)} с: ${core} ${tag} зерно ${s}`);
    ctl.secs.push(r.sec); if (r.capped) ctl.capped++; ctl.bouts++; if (r.winner === 'player') ctl.wins++;
  }
}
const total = mk(); const per = {};
if (MODE === 'mirror') for (const c of CORE_IDS) { per[c] = mk(); fight(c, c, null, per[c]); }
if (MODE === 'pairs' || MODE === 'wins') for (const a of CORE_IDS) { per[a] = mk(); for (const b of CORE_IDS) fight(a, b, null, per[a]); }
if (MODE === 'seven') for (const c of CORE_IDS) { per[c] = mk(); for (const counts of SEVEN) fight(c, c, resolveBehavior(c, build(c, counts)), per[c], B3.filter((b) => counts[b]).map((b) => b + counts[b]).join('+')); }
for (const c of Object.keys(per)) { const p = per[c]; total.n += p.n; total.far += p.far; total.free += p.free; total.sp += p.sp; total.secs.push(...p.secs); total.capped += p.capped; total.wins += p.wins; total.bouts += p.bouts; }
const sum = (a) => ({ far: a.far / a.n, free: a.free / a.n, speed: a.sp / a.n, median: quantile(a.secs, 0.5), max: Math.max(...a.secs), over100: a.secs.filter((x) => x > 100).length, capped: a.capped, bouts: a.bouts, winRate: a.wins / a.bouts });
const res = { mode: MODE, seeds: SEEDS, bend: process.env.BEND ?? null, total: sum(total), perCore: Object.fromEntries(Object.entries(per).map(([c, p]) => [c, sum(p)])) };
if (process.env.DUMP) res.secs = total.secs; // все длины боёв — для хвоста (перцентили, число боёв дольше N с)
writeFileSync(OUT + `${LABEL}-controls-${MODE}.json`, JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify(res.total));
await H.server.close();
