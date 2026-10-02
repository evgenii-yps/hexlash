// bout-random-pooled-c1.mjs — РЕШАЮЩИЕ НАБОРЫ Ц1: доля побед ядер «было / стало» по независимым блокам зёрен и в сумме, с интервалом.
//   node scripts/bout-random-pooled-c1.mjs <корень было> <корень стало> <суффикс тега> [...]
//   пример: node scripts/bout-random-pooled-c1.mjs docs/bout-random/measure/was/rngbase docs/bout-random/measure/now/rngnew -d1 -d3 -d4
// Блок = два набора по 800 зёрен × 4 врага = 6400 боёв на строку-ядро. σ одной доли = √(0.25/N); σ разности двух независимых прогонов = √2·σ.
import { readFileSync } from 'node:fs';
const [A, B, ...sfx] = process.argv.slice(2);
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const N = 6400, sdBlock = Math.SQRT2 * Math.sqrt(0.25 / N) * 100, sd = sdBlock / Math.sqrt(sfx.length);
const tot = Object.fromEntries(Object.keys(NAME).map((c) => [c, [0, 0]]));
console.log(`блок = 6400 боёв на ядро; σ(Δ) блока ${sdBlock.toFixed(2)}, 95% ±${(1.96 * sdBlock).toFixed(2)} п.п.`);
for (const s of sfx) {
  const b = JSON.parse(readFileSync(`${A}${s}/naked.json`, 'utf8')), n = JSON.parse(readFileSync(`${B}${s}/naked.json`, 'utf8'));
  console.log(`блок ${s}: ` + Object.keys(NAME).map((c) => { const x = b[`оба набора|${c}`].win, y = n[`оба набора|${c}`].win; tot[c][0] += x; tot[c][1] += y; return `${NAME[c]} ${x.toFixed(2)}→${y.toFixed(2)} (${(y - x >= 0 ? '+' : '') + (y - x).toFixed(2)})`; }).join(' | '));
}
console.log(`\nИТОГО ${sfx.length} блока(ов): ${sfx.length * 19200 / 3} боёв на ядро; σ(Δ) ${sd.toFixed(2)}, 95% ±${(1.96 * sd).toFixed(2)} п.п.`);
for (const c of Object.keys(NAME)) { const w = tot[c][0] / sfx.length, t = tot[c][1] / sfx.length; console.log(`${NAME[c].padEnd(10)} было ${w.toFixed(2)}  стало ${t.toFixed(2)}  Δ ${(t - w >= 0 ? '+' : '') + (t - w).toFixed(2)}  (${((t - w) / sd >= 0 ? '+' : '') + ((t - w) / sd).toFixed(1)}σ)${Math.abs(t - w) > 1.96 * sd ? '  ⚠️ ЗА ИНТЕРВАЛОМ' : ''}`); }
