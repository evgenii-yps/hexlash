// reflex-sight-tail.mjs — хвост длины боя до / после по дампам reflex-sight-controls.mjs (DUMP=1 MODE=seven).
// ЗАПУСК: node scripts/reflex-sight-tail.mjs
import { readFileSync } from 'node:fs';
const D = new URL('../docs/reflex-sight/out/', import.meta.url).pathname;
const L = (f) => JSON.parse(readFileSync(D + f, 'utf8')).secs;
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); const pos = (s.length - 1) * p; const lo = Math.floor(pos), hi = Math.ceil(pos); return s[lo] + (s[hi] - s[lo]) * (pos - lo); };
const cnt = (xs, t) => xs.filter((x) => x > t).length;
const A = L('tail-seven-before.json'), B = L('tail-seven-after.json');
const row = (n, f) => `| ${n} | ${f(A)} | ${f(B)} |`;
console.log(`боёв: ${A.length} → ${B.length}`);
console.log('| метрика | до | после |\n| --- | --- | --- |');
for (const p of [0.5, 0.9, 0.99, 0.999, 0.9999]) console.log(row(`процентиль ${(p * 100).toFixed(2)}`, (x) => q(x, p).toFixed(2)));
for (const t of [80, 85, 90, 95, 97, 100]) console.log(row(`боёв дольше ${t} с`, (x) => `${cnt(x, t)} (${(100 * cnt(x, t) / x.length).toFixed(3)}%)`));
console.log(row('максимум', (x) => Math.max(...x).toFixed(2)));
console.log(row('среднее', (x) => (x.reduce((a, b) => a + b, 0) / x.length).toFixed(2)));
console.log('топ-10 самых долгих, с:');
console.log('до   :', [...A].sort((a, b) => b - a).slice(0, 10).map((x) => x.toFixed(1)).join(' '));
console.log('после:', [...B].sort((a, b) => b - a).slice(0, 10).map((x) => x.toFixed(1)).join(' '));
