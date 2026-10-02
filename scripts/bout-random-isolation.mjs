// bout-random-isolation.mjs — ДОКАЗАТЕЛЬСТВО «КАРТИНКА НЕ ДВИГАЕТ БОЙ».
//
// ЗАЧЕМ. Регрессии боя (fight-regression*.mjs) считают бой БЕЗ сцены: дыма легенды,
// тумана и прочей отрисовки в них нет. Пока боец и картинка брали числа из одного
// общего Math.random, любая правка вида арены (лишняя частица, другой кадр) молча
// сдвигала ход боя в игре — а регрессии этого не видели.
//
// КАК ПРОВЕРЯЕТ. Один и тот же бой с одним и тем же зерном считается дважды:
//   · чисто;
//   · с «картинкой»: после каждого шага боя кто-то посторонний берёт из общего
//     Math.random случайное число число раз (как это делают частицы и текстуры).
// Исход обязан совпасть до последнего знака. Если картинка двигает бой — тест
// падает и показывает, на каком бою.
//
//   node scripts/bout-random-isolation.mjs        (код выхода 0 — бой изолирован)
import { openHarness } from './lib/bout-harness.mjs';

const { server, duel, CORE_IDS } = await openHarness();

const SEEDS = [1, 7, 12345];
// Сколько чисел «картинка» берёт за шаг боя — и мало, и много, и разное по шагам.
const NOISE = [1, 3, 17];

let bad = 0;
let total = 0;
const fmt = (r) => `winner=${r.winner} sec=${r.sec.toFixed(4)} winHp=${r.winHp01.toFixed(6)}`;

for (const seed of SEEDS) {
  for (const a of CORE_IDS) {
    for (const b of CORE_IDS) {
      const clean = duel({ seed, coreA: a, coreB: b });
      for (const burn of NOISE) {
        let k = 0;
        const noisy = duel({
          seed, coreA: a, coreB: b,
          onStep: () => { k += 1; for (let i = 0; i < burn + (k % 3); i++) Math.random(); },
        });
        total += 1;
        if (fmt(clean) !== fmt(noisy)) {
          bad += 1;
          if (bad <= 8) console.log(`РАСХОЖДЕНИЕ seed=${seed} ${a} vs ${b} шум=${burn}\n   чисто: ${fmt(clean)}\n   с шумом: ${fmt(noisy)}`);
        }
      }
    }
  }
}

console.log(`\nбоёв с шумом: ${total}, разошлись: ${bad}`);
console.log(bad === 0 ? 'ИТОГ: картинка бой не двигает ✅' : 'ИТОГ: картинка ДВИГАЕТ бой ❌');
await server.close();
process.exit(bad === 0 ? 0 : 1);
