// balance-fix-klich-lowhp.mjs — ПРИКАЗ КЛИЧА ПРИ НИЗКОМ ЗДОРОВЬЕ (TZ_balance_fix_v2, этап Д): клич брошен, когда здоровье бойца игрока ≤ 30%;
// считаем долю решений внутри группы клича за holdSec. Жёсткие нужды (выдох при пустых силах, ответ на замах, удар полным зарядом) стоят выше приказа и законно
// выводят из группы — поэтому отдельно показываем долю решений, где группа соблюдена, и долю по видам нужд.
// ЗАПУСК: node scripts/balance-fix-klich-lowhp.mjs [--seeds=1-200]
import { openHarness } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';
const arg = process.argv.find((a) => a.startsWith('--seeds=')); const [from, to] = (arg ? arg.split('=')[1] : '1-200').split('-').map(Number);
const H = await openHarness(); const { duel, CORE_IDS, load } = H;
const klich = await load('/src/data/klichBalance.js'); const buff = await load('/src/data/buffBalance.js');
const { castKlich } = makeActions(H, { klich, buff });
const KB = klich.KLICH_BALANCE;
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
console.log('| ядро | клич | боёв с броском при HP ≤ 30% | решений в окне | внутри группы клича, % |');
console.log('| --- | --- | --- | --- | --- |');
for (const core of CORE_IDS) for (const id of klich.KLICH_IDS) {
  let bouts = 0, dec = 0, inG = 0;
  for (let s = from; s <= to; s++) for (const foe of CORE_IDS) {
    const seed = s * 8 + CORE_IDS.indexOf(foe); let castAt = null, lastInt = null, counted = false;
    duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return; const f = me.f;
      if (castAt == null && now > 3 && f.getHp() / f.maxHp <= 0.3) { castKlich(f, id); castAt = now; counted = true; }
      if (castAt != null && now >= castAt + 0.2 && now < castAt + KB.holdSec) { const it = f.getIntention(); if (it !== lastInt) { dec++; if (KB.groups[id].includes(it)) inG++; lastInt = it; } }
    } });
    if (counted) bouts++;
  }
  console.log(`| ${NAME[core]} | ${id} | ${bouts} | ${dec} | ${dec ? (100 * inG / dec).toFixed(0) : '—'} |`);
}
await H.server.close();
