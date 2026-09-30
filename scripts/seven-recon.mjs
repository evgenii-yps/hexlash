// seven-recon.mjs — ЗАМЕР РЕЗОНАНСОВ ПРИ ПОТОЛКЕ 7 (TZ_resonance_seven_v1).
//
// СЛОВАРЬ: ГРАНЬ = ветка (в коде `crystal`, a/b/c), КРИСТАЛЛ = шаг ветки (в коде `face`, 1…5).
// Набор «X:n» = шаги 1…n ветки X. Узоры по 7 кристаллов: 3+3+1 · 4+3 (два резонанса) · 5+2 · 5+1+1 · 3+2+2 · 4+2+1 (p421, TZ_apex_gate_v1: остальные допустимые).
// Россыпи без резонанса из 7 НЕ БЫВАЕТ: 7 кристаллов по трём веткам ≥ трёх в одной (принцип Дирихле),
// поэтому «россыпь из 7» = 3+2+2 (один резонанс минимальной глубины); чистая россыпь без резонанса — 2+2+2 (6).
//
// ЗАПУСК: FACTOR=0.5 PATTERNS=p331,p43 ONLY=natisk,nalet node scripts/seven-recon.mjs <метка>
//   FACTOR — доля второго резонанса (1 = как до правила половины); SEEDS=200 по умолчанию.
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness, mean, quantile } from './lib/bout-harness.mjs';

const LABEL = process.argv[2] || 'run';
const SEEDS = Number(process.env.SEEDS || 200);
const FACTOR = Number(process.env.FACTOR || 0.5);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const LIGHT = !!process.env.LIGHT; // LIGHT=1: только собственные бои набора против ядра без кристаллов (контрольные), без встреч с эталонами
const PATS = process.env.PATTERNS ? new Set(process.env.PATTERNS.split(',')) : null;
const OUT = new URL(`../docs/grani-tags/out/seven/${LABEL}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load, INSTANT_DT } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
COMBAT_BALANCE.grani.secondResonance = FACTOR; // читается при каждом resolveBehavior
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const progress = (s) => process.stderr.write(s + '\n');
const sigOf = (r) => `${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`;
const B3 = ['a', 'b', 'c'];
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, counts) => { const fs = []; for (const b of B3) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const l1 = (a, b) => INTENTS.reduce((s, k) => s + Math.abs((a[k] || 0) - (b[k] || 0)), 0) * 50;
const mk = () => ({ n: 0, sp: 0, far: 0, free: 0, secs: [], capped: 0 });

function run(core, behT, behU = null, ctl = null) {
  const wins = [], sigs = [], intent = {}; let ticks = 0;
  for (let s = 1; s <= SEEDS; s++) {
    let prev = null;
    const r = duel({ seed: s, coreA: core, coreB: core, behA: behT, behB: behU, swap: s % 2 === 0, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      const it = me.f.getIntention(); intent[it] = (intent[it] || 0) + 1; ticks++;
      if (!ctl) return;
      const foe = alive.find((u) => u !== me); const pm = me.f.group.position;
      if (prev) ctl.sp += Math.hypot(pm.x - prev.x, pm.z - prev.z) / INSTANT_DT; prev = { x: pm.x, z: pm.z };
      ctl.n++;
      if (foe) { const pf = foe.f.group.position; if (Math.hypot(pm.x - pf.x, pm.z - pf.z) >= 1.45) ctl.far++; }
      const f = me.f; if (!f.getClipInfo() && !f.isBlocking() && !f.isStaggered() && !f.isExhaling()) ctl.free++;
    } });
    wins.push(r.winner === 'player' ? 1 : 0); sigs.push(sigOf(r));
    if (ctl) { ctl.secs.push(r.sec); if (r.capped) ctl.capped++; }
  }
  return { wr: mean(wins) * 100, sigs, share: Object.fromEntries(INTENTS.map((k) => [k, (intent[k] || 0) / Math.max(1, ticks)])) };
}
const perm = (xs) => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
const P3 = perm(B3);
// Узоры: список наборов { counts }.
const PATTERNS = {
  p331: () => B3.map((z) => ({ counts: Object.fromEntries(B3.map((b) => [b, b === z ? 1 : 3])) })),
  p43: () => P3.map(([x, y]) => ({ counts: { [x]: 4, [y]: 3 } })),
  p52: () => P3.map(([x, y]) => ({ counts: { [x]: 5, [y]: 2 } })),
  p421: () => perm(B3).map(([x, y, z]) => ({ counts: { [x]: 4, [y]: 2, [z]: 1 } })),
  p511: () => B3.map((x) => ({ counts: Object.fromEntries(B3.map((b) => [b, b === x ? 5 : 1])) })),
  p322: () => B3.map((x) => ({ counts: Object.fromEntries(B3.map((b) => [b, b === x ? 3 : 2])) })),
  p222: () => [{ counts: { a: 2, b: 2, c: 2 } }],
};
const primary = (counts) => B3.slice().sort((x, y) => ((counts[y] || 0) - (counts[x] || 0)) || (B3.indexOf(x) - B3.indexOf(y)))[0];
const name = (c) => B3.filter((b) => c[b]).map((b) => `${b}${c[b]}`).join('+');

const out = { factor: FACTOR, rows: [], a5: [], ctl: {}, seeds: SEEDS };
const ctlZero = mk(), ctlAll = mk(); const ctlP = {}; // ctlP[узор] — встречи набора с эталонами, по узорам
for (const core of CORE_IDS) {
  if (ONLY && !ONLY.has(core)) continue;
  // Комparators: чистая ветка из 5 и россыпь из 7 (3+2+2, три раскладки) — по одному разу на ядро.
  const A5 = {}; if (!LIGHT) for (const b of B3) { const beh = resolveBehavior(core, build(core, { [b]: 5 })); A5[b] = { beh, r: run(core, beh) }; out.a5.push({ core, branch: b, wr: A5[b].r.wr, share: A5[b].r.share }); }
  const S7 = LIGHT ? [] : PATTERNS.p322().map((p) => { const beh = resolveBehavior(core, build(core, p.counts)); return { beh, r: run(core, beh) }; });
  const S7wr = LIGHT ? NaN : mean(S7.map((x) => x.r.wr)); const S7share = LIGHT ? {} : Object.fromEntries(INTENTS.map((k) => [k, mean(S7.map((x) => x.r.share[k]))]));
  for (const [pn, gen] of Object.entries(PATTERNS)) {
    if (PATS && !PATS.has(pn)) continue;
    for (const p of gen()) {
      const beh = resolveBehavior(core, build(core, p.counts));
      const z = mk();
      const R = run(core, beh, null, z);
      const prim = primary(p.counts);
      const cp = (ctlP[pn] ||= mk());
      const hA5 = LIGHT ? { wr: NaN } : run(core, beh, A5[prim].beh, cp);
      const hS7 = LIGHT ? NaN : mean(S7.map((x) => run(core, beh, x.beh, cp).wr));
      for (const k of ['n', 'sp', 'far', 'free', 'capped']) { ctlZero[k] += z[k]; }
      ctlZero.secs.push(...z.secs);
      out.rows.push({ core, pattern: pn, set: name(p.counts), primary: prim, resonance: Object.keys(beh.resonance), wr: R.wr, wrA5: LIGHT ? NaN : A5[prim].r.wr, wrS7: S7wr, h2hA5: hA5.wr, h2hS7: hS7, divA5: LIGHT ? NaN : l1(R.share, A5[prim].r.share), divS7: LIGHT ? NaN : l1(R.share, S7share), share: R.share, far: z.far / z.n, free: z.free / z.n, speed: z.sp / z.n, med: quantile(z.secs, 0.5), max: Math.max(...z.secs), capped: z.capped, over100: z.secs.filter((x) => x > 100).length, sigs: R.sigs });
    }
    progress(`${core} ${pn}`);
  }
}
const line = (a) => ({ far: a.far / a.n, free: a.free / a.n, speed: a.sp / a.n, med: quantile(a.secs, 0.5), max: Math.max(...a.secs), capped: a.capped, over100: a.secs.filter((x) => x > 100).length, n: a.secs.length });
out.ctl = { zero: ctlZero.n ? line(ctlZero) : null, zeroRaw: { n: ctlZero.n, sp: ctlZero.sp, far: ctlZero.far, free: ctlZero.free, secs: ctlZero.secs, capped: ctlZero.capped }, allRaw: null, byPattern: Object.fromEntries(Object.entries(ctlP).map(([k, v]) => [k, { n: v.n, sp: v.sp, far: v.far, free: v.free, secs: v.secs, capped: v.capped }])) };
writeFileSync(OUT + `${process.env.ONLY || 'all'}.json`, JSON.stringify(out));
await H.server.close();
