// fight-regression-buffs.mjs — КОНТРОЛЬНАЯ СУММА БОЯ С БАФФАМИ (TZ_balance_fix_v2, этап 0.1).
// Каждый бафф по отдельности (TOWEL, BUCKET, DICE — все 6 граней) и весь набор по правилу бота × 4 ядра; бросок игрока в t = 10 с, враг — то же ядро
// голое, зёрна 1 / 7 / 12345, точки выхода как в игре, стороны меняются на зерне 7. Грань DICE зафиксирована, чтобы сумма не зависела от rollDie.
// Набор по правилу бота — как в services/buffs.js tickBot (бросок по условиям); кубик в нём — грань 4 (фикс).
// ЗАПУСК: node scripts/fight-regression-buffs.mjs > buffs.txt
import { createHash } from 'node:crypto';
import { openHarness } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';

const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const klich = await load('/src/data/klichBalance.js');
const buff = await load('/src/data/buffBalance.js');
const { makeBuffDriver } = makeActions(H, { klich, buff });
const lines = [];
const run = (seed, core, spec, label) => {
  const drv = makeBuffDriver({ side: 'player', ...spec });
  const r = duel({ seed, coreA: core, coreB: core, swap: seed === 7, onStep: (now, alive) => drv.step(now, alive) });
  const thrown = drv.log.map((x) => `${x.id}@${x.t}${x.face ? '#' + x.face : ''}`).join(',');
  lines.push(`seed=${seed} ${core}:${label} vs ${core} -> winner=${r.winner} sec=${r.sec.toFixed(4)} capped=${r.capped} winHp=${r.winHp01.toFixed(6)} thrown=[${thrown}] healed=${drv.healed.toFixed(4)}`);
};
for (const seed of [1, 7, 12345]) for (const core of CORE_IDS) {
  run(seed, core, { kit: ['towel'], rule: 'fixed', fixedAt: 10 }, 'towel');
  run(seed, core, { kit: ['bucket'], rule: 'fixed', fixedAt: 10 }, 'bucket');
  for (let face = 1; face <= 6; face++) run(seed, core, { kit: ['dice'], rule: 'fixed', fixedAt: 10, face }, `dice${face}`);
  run(seed, core, { kit: ['towel', 'bucket', 'dice'], rule: 'bot', face: 4 }, 'kit-bot');
}
const body = lines.join('\n');
console.log(body);
console.log('---');
console.log('fights:', lines.length);
console.log('checksum:', createHash('sha256').update(body).digest('hex'));
await H.server.close();
