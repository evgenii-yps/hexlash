// fight-regression-klich.mjs — КОНТРОЛЬНАЯ СУММА БОЯ С КЛИЧЕМ (TZ_balance_fix_v2, этап 0.1).
// Две старые суммы (fight-regression.mjs — голые ядра, fight-regression-builds.mjs — сборки) клич НЕ видят: правка любого числа клича их не двигает.
// Здесь: все 3 клича × 4 ядра, клич брошен на бойца-игрока в t = 5 с (как в замерах клича), враг — то же ядро голое, зёрна 1 / 7 / 12345,
// точки выхода как в игре, стороны меняются на зерне 7. Плюс замена клича (push в 5 с, потом fallback в 11 с).
// ЗАПУСК: node scripts/fight-regression-klich.mjs > klich.txt
import { createHash } from 'node:crypto';
import { openHarness } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';

const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const klich = await load('/src/data/klichBalance.js');
const buff = await load('/src/data/buffBalance.js');
const { castKlich } = makeActions(H, { klich, buff });
const lines = [];
const run = (seed, core, plan, label) => {
  const left = plan.map((p) => ({ ...p, done: false }));
  const r = duel({ seed, coreA: core, coreB: core, swap: seed === 7, onStep: (now, alive) => {
    const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
    for (const p of left) if (!p.done && now >= p.at) { castKlich(me.f, p.id); p.done = true; }
  } });
  lines.push(`seed=${seed} ${core}:${label} vs ${core} -> winner=${r.winner} sec=${r.sec.toFixed(4)} capped=${r.capped} winHp=${r.winHp01.toFixed(6)}`);
};
for (const seed of [1, 7, 12345]) for (const core of CORE_IDS) {
  for (const id of klich.KLICH_IDS) run(seed, core, [{ id, at: 5 }], id);
  run(seed, core, [{ id: 'push', at: 5 }, { id: 'fallback', at: 11 }], 'push>fallback');
}
const body = lines.join('\n');
console.log(body);
console.log('---');
console.log('fights:', lines.length);
console.log('checksum:', createHash('sha256').update(body).digest('hex'));
await H.server.close();
