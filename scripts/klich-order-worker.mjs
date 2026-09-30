// klich-order-worker.mjs — ОДНА ЗАДАЧА ПРИЁМКИ «ПРИКАЗ ВНУТРИ ГРУППЫ» (TZ_klich_v2, раунд 3): ядро игрока × 5 составов × 4 голых врага.
// Составы: bare — голое ядро; a / b / c — полная ветвь 5 из 5; s — россыпь 2+2+1 (a1,a2,b1,b2,c1): ни одна ветвь не доходит до порога
// резонанса (3), значит теги работают, а резонанса нет. Парные бои на одном зерне: без клича и с кличем (push/fallback/hold) при t ≥ 5 с.
// Окно решений 5–13 с; «полная сила» — решения с kk ≥ 1 (весь holdSec).
// ТРЕБУЕТ патч docs/klich-reach/probe/order-probe.patch в отдельной копии дерева. Задача (json argv[2]): { core, seedFrom, seedTo, out }.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
globalThis.__PROBE = { on: true, log: null };
const P = globalThis.__PROBE;
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, counts) => { const fs = []; for (const b of ['a', 'b', 'c']) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const COMPS = { bare: null, a: { a: 5 }, b: { b: 5 }, c: { c: 5 }, s: { a: 2, b: 2, c: 1 } };

function bout(core, beh, foe, seed, klich) {
  P.log = []; let fired = false;
  const r = duel({ seed, coreA: core, coreB: foe, behA: beh, swap: seed % 2 === 0, onStep: (now, alive) => {
    if (klich && !fired && now >= 5) {
      const me = alive.find((u) => u.sideId === 'player');
      if (me) { me.f.applyKlich(KLICH_BALANCE.axes[klich], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); me.f.setKlichId(klich); fired = true; }
    }
  } });
  return { w: r.winner === 'player' ? 1 : 0, sec: r.sec, capped: r.capped ? 1 : 0, log: P.log.filter((d) => d.t > 5 && d.t <= 13) };
}
const z7 = () => INTENTS.map(() => 0);
const fresh = () => ({ n: 0, nS: 0, nN: 0, cS: z7(), cN: z7(), cNK: z7(), over: 0, overTag: 0, tagDec: 0, w: [], sec: [], capped: 0 });
const grp = KLICH_BALANCE.groups;
function tally(R, log, kid) {
  for (const d of log) {
    if (!(d.kk >= 1)) continue;          // только полная сила
    R.n++;
    const ai = INTENTS.indexOf(d.act);
    if (d.need) { R.nN++; R.cN[ai]++; continue; }
    R.nS++; R.cS[ai]++; R.cNK[INTENTS.indexOf(d.nk)]++;
    if (d.nk !== d.nl) R.tagDec++;
    if (d.act !== d.nk) { R.over++; if (d.nk !== d.nl) R.overTag++; }
  }
}
const t0 = Date.now();
const out = { job, comps: {} };
for (const [cid, counts] of Object.entries(COMPS)) {
  const beh = counts ? resolveBehavior(job.core, build(job.core, counts)) : null;
  const rec = out.comps[cid] = { foes: {} };
  for (const foe of CORE_IDS) {
    const F = rec.foes[foe] = { base: { w: [], sec: [], capped: 0 }, klich: {} };
    for (const id of KLICH_IDS) F.klich[id] = fresh();
    for (let s = job.seedFrom; s <= job.seedTo; s++) {
      const b = bout(job.core, beh, foe, s, null);
      F.base.w.push(b.w); F.base.sec.push(b.sec); F.base.capped += b.capped;
      for (const id of KLICH_IDS) {
        const k = bout(job.core, beh, foe, s, id);
        const R = F.klich[id]; tally(R, k.log, id); R.w.push(k.w); R.sec.push(k.sec); R.capped += k.capped;
      }
    }
  }
}
out.ms = Date.now() - t0; out.groups = grp;
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out) + '\n');
await H.server.close();
