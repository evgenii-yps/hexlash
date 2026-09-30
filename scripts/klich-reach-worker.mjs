// klich-reach-worker.mjs — ОДНА ЗАДАЧА ПРИЁМКИ «КЛИЧ ДОХОДИТ ДО РЕШЕНИЙ» (TZ_klich_v2 §6): вес наклона × ядро игрока.
//
// Заменяет scripts/reflex-sight-klich.mjs в части «враги»: здесь враги — ВСЕ ЧЕТЫРЕ ядра без кристаллов (там был один следующий по кругу).
// Парные бои на одном зерне: без клича и с кличем, брошенным на бойца игрока при t ≥ 5 с (как в замере 26.09). Окно решений 5–13 с.
// Кличем бросается так же, как в services/klich.js: applyKlich(оси, holdSec, fadeSec) и сразу setKlichId(id).
//
// ТРЕБУЕТ ПАТЧ `docs/klich-reach/probe/decisions-probe.patch` (журнал решений стороны 'player' через globalThis.__PROBE.log + поле `side` у бойца) —
// ТОЛЬКО в отдельной копии дерева, в src/ репозитория он не попадает. Запуск — scripts/klich-reach-run.mjs.
// Задача (json argv[2]): { weight, core, seedFrom, seedTo, out }.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
KLICH_BALANCE.lean = job.weight; // читается при каждом решении
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
globalThis.__PROBE = { on: true, log: null };
const P = globalThis.__PROBE;

function bout(core, foe, seed, klich) {
  P.log = [];
  let fired = false;
  const r = duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => {
    if (klich && !fired && now >= 5) {
      const me = alive.find((u) => u.sideId === 'player');
      if (me) { me.f.applyKlich(KLICH_BALANCE.axes[klich], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); me.f.setKlichId(klich); fired = true; }
    }
  } });
  return { w: r.winner === 'player' ? 1 : 0, sec: r.sec, hp: r.winHp01, capped: r.capped ? 1 : 0, log: P.log.filter((d) => d.t > 5 && d.t <= 13) };
}
const zero7 = () => INTENTS.map(() => 0);
const tally = (log, into) => { for (const d of log) { into.n++; if (d.need) { into.nN++; into.cN[INTENTS.indexOf(d.act)]++; } else { into.nS++; into.cS[INTENTS.indexOf(d.act)]++; } } };
const fresh = () => ({ n: 0, nS: 0, nN: 0, cS: zero7(), cN: zero7() });

const t0 = Date.now();
const out = { job, foes: {} };
for (const foe of CORE_IDS) {
  const rec = { base: { ...fresh(), w: [], sec: [], capped: 0 }, klich: {} };
  for (const id of KLICH_IDS) rec.klich[id] = { ...fresh(), w: [], sec: [], capped: 0, paired: 0, actDiff: 0 };
  for (let s = job.seedFrom; s <= job.seedTo; s++) {
    const b = bout(job.core, foe, s, null);
    tally(b.log, rec.base); rec.base.w.push(b.w); rec.base.sec.push(b.sec); rec.base.capped += b.capped;
    const byT = new Map(b.log.map((d) => [d.t.toFixed(4), d]));
    for (const id of KLICH_IDS) {
      const k = bout(job.core, foe, s, id);
      const R = rec.klich[id];
      tally(k.log, R); R.w.push(k.w); R.sec.push(k.sec); R.capped += k.capped;
      for (const d of k.log) { const bd = byT.get(d.t.toFixed(4)); if (!bd) continue; R.paired++; if (d.act !== bd.act) R.actDiff++; }
    }
  }
  out.foes[foe] = rec;
}
out.ms = Date.now() - t0;
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out) + '\n');
await H.server.close();
