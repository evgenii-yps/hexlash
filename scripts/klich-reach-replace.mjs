// klich-reach-replace.mjs — ПРИЁМКА Г5 (TZ_klich_v2): второй клич, брошенный через 6 с после первого (откат), ЗАМЕНЯЕТ первый целиком.
// ТРЕБУЕТ патч зонда (docs/klich-reach/probe/decisions-probe.patch) в отдельной копии дерева. ЗАПУСК: node scripts/klich-reach-replace.mjs (из копии).
//   А. 20 боёв: клич A при t ≥ 5, клич B при t ≥ 11. В журнале решений после замены должен стоять только B (id и сила 1 на первом решении), A — никогда.
//   Б. 20 боёв: A и B в один и тот же момент (t ≥ 11) против одного B в тот же момент. Если оси и наклон A после замены не действуют, состояние бойца
//      идентично, значит бои совпадают бит в бит (исход, длина, журнал решений вместе с range, куда входит сдвиг дистанции от клича).
import { writeFileSync, mkdirSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';

const OUT = process.env.OUT_DIR || new URL('../docs/klich-reach/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const { KLICH_BALANCE } = await load('/src/data/klichBalance.js');
globalThis.__PROBE = { on: true, log: null };
const P = globalThis.__PROBE;
const cast = (f, id) => { f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); f.setKlichId(id); };

function run(core, foe, seed, plan) { // plan: [{at, id}]
  P.log = [];
  const left = plan.map((p) => ({ ...p, done: false }));
  const r = duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => {
    const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
    for (const p of left) if (!p.done && now >= p.at) { cast(me.f, p.id); p.done = true; }
  } });
  return { res: `${r.winner}|${r.sec}|${r.winHp01}`, log: P.log.map((d) => ({ ...d })) };
}

const rows = [];
let okA = 0, okB = 0;
for (let i = 0; i < 20; i++) {
  const core = CORE_IDS[i % 4], foe = CORE_IDS[(i + 1) % 4], seed = 11 + i;
  const A = i % 2 ? 'fallback' : 'push', B = i % 3 === 0 ? 'hold' : (A === 'push' ? 'fallback' : 'push');
  // А: через 6 с
  const a = run(core, foe, seed, [{ at: 5, id: A }, { at: 11, id: B }]);
  const before = a.log.filter((d) => d.t > 5 && d.t <= 11), after = a.log.filter((d) => d.t > 11.0 && d.t <= 11 + KLICH_BALANCE.holdSec + 1);
  const cleanA = before.length > 0 && before.every((d) => d.kid === A)
    && after.length > 0 && after.every((d) => d.kid === B) && Math.abs(after[0].kk - 1) < 1e-9;
  // Б: один момент
  const both = run(core, foe, seed, [{ at: 11, id: A }, { at: 11, id: B }]);
  const only = run(core, foe, seed, [{ at: 11, id: B }]);
  const same = both.res === only.res && JSON.stringify(both.log) === JSON.stringify(only.log);
  if (cleanA) okA++; if (same) okB++;
  rows.push({ i, core, foe, seed, A, B, decisionsBefore: before.length, decisionsAfter: after.length, firstAfter: after[0] || null, cleanA, sameAsOnlyB: same });
}
writeFileSync(OUT + 'replace.json', JSON.stringify({ okA, okB, n: 20, rows }, null, 1) + '\n');
console.log(`Г5: А (через 6 с, в журнале после замены только B) ${okA}/20; Б (A→B в один момент = только B бит в бит) ${okB}/20`);
await H.server.close();
