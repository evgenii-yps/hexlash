// fight-regression-builds.mjs — КОНТРОЛЬНАЯ СУММА БОЯ СО СБОРКАМИ (TZ_reflex_sees_character_v2).
// scripts/fight-regression.mjs считает только ГОЛЫЕ ядра — а правка «рефлекс видит характер» меняет именно бои со сборками
// (у голых ядер наклонов нет). Здесь: 4 ядра × 3 сборки («вразброс 7» 3+2+2, «ветка 5», «5+2») против голого ядра, зёрна 1 / 7 / 12345,
// точки выхода как в игре. Прогнал до правки и после — суммы различаются ровно там, где бой изменился.
// ЗАПУСК: node scripts/fight-regression-builds.mjs > builds.txt
import { createHash } from 'node:crypto';
import { openHarness } from './lib/bout-harness.mjs';

const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const B3 = ['a', 'b', 'c'];
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, counts) => { const fs = []; for (const b of B3) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const BUILDS = { s1: { a: 3, b: 2, c: 2 }, ba: { a: 5 }, xab: { a: 5, b: 2 } };
const lines = [];
for (const seed of [1, 7, 12345]) for (const core of CORE_IDS) for (const [id, counts] of Object.entries(BUILDS)) {
  const r = duel({ seed, coreA: core, coreB: core, behA: resolveBehavior(core, build(core, counts)), swap: seed === 7 });
  lines.push(`seed=${seed} ${core}:${id} vs ${core} -> winner=${r.winner} sec=${r.sec.toFixed(4)} capped=${r.capped} winHp=${r.winHp01.toFixed(6)}`);
}
const body = lines.join('\n');
console.log(body);
console.log('---');
console.log('fights:', lines.length);
console.log('checksum:', createHash('sha256').update(body).digest('hex'));
await H.server.close();
