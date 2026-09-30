// klich-reach-tags-worker.mjs — «клич против наклонов кристаллов» (TZ_klich_v2 п.7): насколько клич на время действия перекрывает наклоны граней.
// Боец игрока — ядро + сборка (три полные ветви a/b/c и «вразброс 7» 3+2+2), враги — четыре голых ядра, клич при t ≥ 5 с, окно решений 5–13 с.
// ТРЕБУЕТ патч docs/klich-reach/probe/tags-probe.patch (в каждом решении стороны 'player' считаются четыре выбора: настоящий act, nk — без клича,
// nl — без клича и без наклонов граней, rl — с кличем, без наклонов граней). Только в отдельной копии дерева.
// Задача (json argv[2]): { core, weights:{push,fallback,hold}, seedFrom, seedTo, out }.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
const { CRYSTALS } = await load('/src/data/upgradeData.js');
KLICH_BALANCE.lean = { ...KLICH_BALANCE.lean, ...job.weights };
globalThis.__PROBE = { on: true, log: null };
const P = globalThis.__PROBE;
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, counts) => { const fs = []; for (const b of ['a', 'b', 'c']) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const BUILDS = { a: { a: 5 }, b: { b: 5 }, c: { c: 5 }, s1: { a: 3, b: 2, c: 2 } };

const out = { job, builds: {} };
for (const [bid, counts] of Object.entries(BUILDS)) {
  const beh = resolveBehavior(job.core, build(job.core, counts));
  out.builds[bid] = {};
  for (const id of KLICH_IDS) {
    const T = { n: 0, A: 0, B: 0, C: 0, D: 0 };
    for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
      P.log = []; let fired = false;
      duel({ seed: s, coreA: job.core, coreB: foe, behA: beh, swap: s % 2 === 0, onStep: (now, alive) => {
        if (!fired && now >= 5) { const me = alive.find((u) => u.sideId === 'player'); if (me) { me.f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); me.f.setKlichId(id); fired = true; } }
      } });
      for (const d of P.log) {
        if (!(d.t > 5 && d.t <= 13)) continue;
        T.n++;
        const tagFlip = d.nk !== d.nl;           // наклоны граней меняют выбор, пока клича нет
        if (tagFlip) { T.A++; if (d.act !== d.nk) T.B++; } // …и клич этот выбор перевернул
        if (d.act !== d.rl) T.C++;               // наклоны граней меняют выбор при действующем кличе
        if (d.act !== d.nk) T.D++;               // клич изменил решение вообще
      }
    }
    out.builds[bid][id] = T;
  }
}
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out) + '\n');
await H.server.close();
